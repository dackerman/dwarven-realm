import React, { useEffect, useState, useCallback } from 'react';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useGame } from '../../lib/stores/useGame';
import { useBuilding } from '../../lib/stores/useBuilding';
import { createDecisionMessage, formatDecisionForMemory } from '../../lib/aiHelpers';
import { ClientDwarf, ClientResource, ClientBuilding, Point2D } from '../../types/game';
import { BuildingType, ResourceType, TaskType } from '@shared/schema';

// Helper to pick a random item from an array
function pickRandom<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

const AI_DECISION_INTERVAL_MS = 10000; // 10 seconds
const DIALOGUE_VISIBLE_DURATION_MS = 7000; // 7 seconds
const CRITICAL_HUNGER_THRESHOLD = 70;
const CRITICAL_ENERGY_THRESHOLD = 30;
const CRITICAL_HAPPINESS_THRESHOLD = 30;

const AIControls: React.FC = () => {
  const dwarves = useDwarves(state => state.dwarves);
  const buildings = useBuilding(state => state.buildings);
  const resources = useBuilding(state => state.resources);
  const phase = useGame(state => state.phase);
  const speed = useGame(state => state.speed);
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<number, number>>({});
  
  // Get decision for dwarf
  const getAIDecision = useCallback(async (dwarf: ClientDwarf) => {
    // Skip if dwarf is already engaged in a task
    if (dwarf.currentTask && dwarf.currentTask !== TaskType.Idle) return;
    
    // Create a simple world state representation for the AI
    const worldState = {
      resources: resources.map(r => ({
        type: r.type as ResourceType,
        quantity: r.quantity,
        position: { x: r.x, y: r.y }
      })),
      buildings: buildings.map(b => ({
        type: b.type as BuildingType,
        completed: b.complete,
        position: { x: b.x, y: b.y }
      })),
      otherDwarves: dwarves
        .filter(d => d.id !== dwarf.id)
        .map(d => ({
          id: d.id,
          name: d.name,
          task: d.currentTask || 'idle',
          position: { x: d.x, y: d.y }
        }))
    };
    
    // Generate decision message and get response
    const decisionMessage = createDecisionMessage(dwarf, worldState);
    const aiResponse = await useDwarves.getState().getDwarfThoughts(dwarf.id, decisionMessage);
    
    // Parse the AI response to extract the task
    let chosenTask = TaskType.Idle;
    let reason = "";
    
    // Try to detect the task type from response
    const taskMatches = aiResponse.toLowerCase().match(/(mining|woodcutting|building|eating|sleeping|socializing|crafting|hauling|idle)/);
    
    if (taskMatches && taskMatches[0]) {
      const task = taskMatches[0] as string;
      chosenTask = task as TaskType;
      
      // Extract reason if possible
      const reasonMatches = aiResponse.match(/[:.] (.*)/i);
      if (reasonMatches && reasonMatches[1]) {
        reason = reasonMatches[1].trim();
      }
    }
    
    // Update the dwarf's memory with this decision
    const newMemory = [...dwarf.memory];
    newMemory.push(formatDecisionForMemory(dwarf, chosenTask, reason));
    
    // Make the dwarf say their decision out loud
    useDwarves.getState().updateDialogue(
      dwarf.id, 
      `I'll ${chosenTask}${reason ? `: ${reason}` : '.'}`
    );
    
    // Set a timer to hide the dialogue
    setTimeout(() => {
      useDwarves.getState().updateDialogue(dwarf.id, '', false);
    }, DIALOGUE_VISIBLE_DURATION_MS);
    
    // Implement decision by finding a target and assigning task
    let target: Point2D | undefined;
    
    switch (chosenTask) {
      case TaskType.Mining:
        // Find a stone resource to mine
        const stoneResource = resources.find(r => r.type === 'stone' && !r.isBeingHarvested);
        if (stoneResource) {
          target = { x: stoneResource.x, y: stoneResource.y };
        }
        break;
        
      case TaskType.Woodcutting:
        // Find a wood resource to cut
        const woodResource = resources.find(r => r.type === 'wood' && !r.isBeingHarvested);
        if (woodResource) {
          target = { x: woodResource.x, y: woodResource.y };
        }
        break;
        
      case TaskType.Building:
        // Find an incomplete building
        const incompleteBuilding = buildings.find(b => !b.complete);
        if (incompleteBuilding) {
          target = { x: incompleteBuilding.x, y: incompleteBuilding.y };
        }
        break;
        
      case TaskType.Eating:
        // Find a food source or kitchen
        const foodSource = resources.find(r => r.type === 'food');
        if (foodSource) {
          target = { x: foodSource.x, y: foodSource.y };
        } else {
          // Look for a table to eat at
          const table = buildings.find(b => b.type === 'table' && b.complete);
          if (table) {
            target = { x: table.x, y: table.y };
          }
        }
        break;
        
      case TaskType.Sleeping:
        // Find a bed
        const bed = buildings.find(b => b.type === 'bed' && b.complete);
        if (bed) {
          target = { x: bed.x, y: bed.y };
        }
        break;
        
      case TaskType.Socializing:
        // Find another dwarf to talk to
        const nearbyDwarf = dwarves.find(d => 
          d.id !== dwarf.id && 
          Math.abs(d.x - dwarf.x) + Math.abs(d.y - dwarf.y) < 5
        );
        if (nearbyDwarf) {
          target = { x: nearbyDwarf.x, y: nearbyDwarf.y };
          
          // Start a conversation
          useDwarves.getState().startConversation(dwarf.id, nearbyDwarf.id);
        }
        break;
        
      case TaskType.Crafting:
        // Find a workshop
        const workshop = buildings.find(b => b.type === 'workshop' && b.complete);
        if (workshop) {
          target = { x: workshop.x, y: workshop.y };
        }
        break;
        
      case TaskType.Hauling:
        // Find resources or buildings to haul materials to
        const resourceToHaul = pickRandom(resources);
        if (resourceToHaul) {
          target = { x: resourceToHaul.x, y: resourceToHaul.y };
        }
        break;
    }
    
    // Assign the task with target
    useDwarves.getState().assignTask(dwarf.id, chosenTask, target);
    
    // Update memory
    useDwarves.getState().updateDwarf(dwarf.id, { memory: newMemory });
    
    // Update last decision time
    setLastUpdateTime(prev => ({
      ...prev,
      [dwarf.id]: Date.now()
    }));
    
  }, [dwarves, buildings, resources]);
  
  // Check for critical needs and respond to them
  const checkCriticalNeeds = useCallback(async (dwarf: ClientDwarf) => {
    // Check if dwarf has critical needs
    const hasCriticalHunger = dwarf.hunger >= CRITICAL_HUNGER_THRESHOLD;
    const hasCriticalEnergy = dwarf.energy <= CRITICAL_ENERGY_THRESHOLD;
    const hasCriticalHappiness = dwarf.happiness <= CRITICAL_HAPPINESS_THRESHOLD;
    
    // Skip if no critical needs or already handling a critical need
    if (!hasCriticalHunger && !hasCriticalEnergy && !hasCriticalHappiness) return false;
    
    // Handle each need based on priority (hunger > energy > happiness)
    if (hasCriticalHunger) {
      // Express hunger
      useDwarves.getState().updateDialogue(
        dwarf.id, 
        `I'm starving! Need food!`
      );
      
      // Search for food
      const foodSource = resources.find(r => r.type === 'food');
      if (foodSource) {
        useDwarves.getState().assignTask(dwarf.id, TaskType.Eating, { x: foodSource.x, y: foodSource.y });
      } else {
        // Look for a table
        const table = buildings.find(b => b.type === 'table' && b.complete);
        if (table) {
          useDwarves.getState().assignTask(dwarf.id, TaskType.Eating, { x: table.x, y: table.y });
        }
      }
      
      // Set a timer to hide the dialogue
      setTimeout(() => {
        useDwarves.getState().updateDialogue(dwarf.id, '', false);
      }, DIALOGUE_VISIBLE_DURATION_MS);
      
      return true;
    }
    
    if (hasCriticalEnergy) {
      // Express tiredness
      useDwarves.getState().updateDialogue(
        dwarf.id, 
        `I'm exhausted... Need rest...`
      );
      
      // Search for a bed
      const bed = buildings.find(b => b.type === 'bed' && b.complete);
      if (bed) {
        useDwarves.getState().assignTask(dwarf.id, TaskType.Sleeping, { x: bed.x, y: bed.y });
      } else {
        // Just rest in place if no bed
        useDwarves.getState().assignTask(dwarf.id, TaskType.Sleeping);
      }
      
      // Set a timer to hide the dialogue
      setTimeout(() => {
        useDwarves.getState().updateDialogue(dwarf.id, '', false);
      }, DIALOGUE_VISIBLE_DURATION_MS);
      
      return true;
    }
    
    if (hasCriticalHappiness) {
      // Express unhappiness
      useDwarves.getState().updateDialogue(
        dwarf.id, 
        `I'm feeling miserable. Need to talk to someone.`
      );
      
      // Search for another dwarf
      const nearbyDwarf = dwarves.find(d => 
        d.id !== dwarf.id && 
        Math.abs(d.x - dwarf.x) + Math.abs(d.y - dwarf.y) < 5
      );
      
      if (nearbyDwarf) {
        useDwarves.getState().assignTask(dwarf.id, TaskType.Socializing, { x: nearbyDwarf.x, y: nearbyDwarf.y });
        // Start a conversation
        useDwarves.getState().startConversation(dwarf.id, nearbyDwarf.id);
      }
      
      // Set a timer to hide the dialogue
      setTimeout(() => {
        useDwarves.getState().updateDialogue(dwarf.id, '', false);
      }, DIALOGUE_VISIBLE_DURATION_MS);
      
      return true;
    }
    
    return false;
  }, [dwarves, buildings, resources]);
  
  // Process AI decisions
  useEffect(() => {
    if (phase !== 'playing') return;
    
    // Scale interval by game speed
    const interval = AI_DECISION_INTERVAL_MS / speed;
    
    const timer = setInterval(() => {
      const currentTime = Date.now();
      
      // Process each dwarf
      dwarves.forEach(async (dwarf) => {
        const lastUpdate = lastUpdateTime[dwarf.id] || 0;
        
        // Skip if updated recently
        if (currentTime - lastUpdate < interval) return;
        
        // First check critical needs
        const hasCriticalNeeds = await checkCriticalNeeds(dwarf);
        
        // If no critical needs, make a normal decision
        if (!hasCriticalNeeds) {
          getAIDecision(dwarf).catch(console.error);
        }
      });
    }, 1000); // Check every second if any dwarf needs an update
    
    return () => clearInterval(timer);
  }, [dwarves, phase, speed, lastUpdateTime, getAIDecision, checkCriticalNeeds]);
  
  // This component doesn't render anything
  return null;
};

export default AIControls;