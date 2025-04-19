import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useBuilding } from '../../lib/stores/useBuilding';
import { useGame } from '../../lib/stores/useGame';
import { ClientDwarf, Point2D } from '../../types/game';
import { usePathfinding } from '../../hooks/usePathfinding';
import { getManhattanDistance, getDirection } from '../../lib/isometricUtils';
import { TaskType } from '@shared/schema';
import { 
  createNeedMessage,
  createTaskCompletionMessage,
  generateAIMessages, 
  createSystemPrompt 
} from '../../lib/aiHelpers';
import { sendAIMessage } from '../../lib/api';

// Time between AI decision making for each dwarf (in seconds)
const AI_DECISION_INTERVAL = 2;
// Time between need updates
const NEED_UPDATE_INTERVAL = 5;
// Time to hide dialogues after showing
const DIALOGUE_HIDE_TIME = 5000;

// Helper function to pick a random element from an array
function pickRandom<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

const AIControls: React.FC = () => {
  const dwarves = useDwarves(state => state.dwarves);
  const updateDwarf = useDwarves(state => state.updateDwarf);
  const assignTask = useDwarves(state => state.assignTask);
  const satisfyNeed = useDwarves(state => state.satisfyNeed);
  const updateNeeds = useDwarves(state => state.updateNeeds);
  const getDwarfThoughts = useDwarves(state => state.getDwarfThoughts);
  const updateDialogue = useDwarves(state => state.updateDialogue);
  const startConversation = useDwarves(state => state.startConversation);
  
  const buildings = useBuilding(state => state.buildings);
  const resources = useBuilding(state => state.resources);
  const world = useBuilding(state => state.world);
  const harvestResource = useBuilding(state => state.harvestResource);
  
  const { phase, speed, time } = useGame();
  
  // Refs to track update times
  const lastDecisionTime = useRef<Record<number, number>>({});
  const lastNeedUpdateTime = useRef<number>(0);
  
  // Process AI behavior for dwarves
  useFrame((state, delta) => {
    if (phase !== 'playing' || !world) return;
    
    // Scale delta by game speed
    const scaledDelta = delta * speed;
    
    // Update needs periodically
    const currentTime = state.clock.getElapsedTime();
    if (currentTime - lastNeedUpdateTime.current > NEED_UPDATE_INTERVAL) {
      lastNeedUpdateTime.current = currentTime;
      updateAllNeeds();
    }
    
    // Process AI for each dwarf
    dwarves.forEach(dwarf => {
      // Skip if this dwarf has been updated recently
      if (lastDecisionTime.current[dwarf.id] !== undefined && 
          currentTime - lastDecisionTime.current[dwarf.id] < AI_DECISION_INTERVAL) {
        return;
      }
      
      // Mark this dwarf as updated
      lastDecisionTime.current[dwarf.id] = currentTime;
      
      // Process AI decision
      processAI(dwarf, currentTime);
    });
  });
  
  // Function to update all dwarf needs
  const updateAllNeeds = () => {
    dwarves.forEach(dwarf => {
      // Increase hunger over time
      const hungerIncrease = Math.random() * 2 + 1;
      
      // Decrease energy based on activity
      let energyDecrease = 0;
      switch (dwarf.state) {
        case 'idle':
          energyDecrease = Math.random() * 0.5;
          break;
        case 'mining':
        case 'woodcutting':
        case 'building':
          energyDecrease = Math.random() * 2 + 1;
          break;
        case 'sleeping':
          // Regenerate energy when sleeping
          satisfyNeed(dwarf.id, 'energy', Math.random() * 5 + 5);
          break;
        default:
          energyDecrease = Math.random() * 1;
      }
      
      // Happiness changes based on conditions
      let happinessChange = 0;
      
      // Lower happiness if hungry or tired
      if (dwarf.hunger > 70) happinessChange -= 2;
      if (dwarf.energy < 30) happinessChange -= 2;
      
      // Increase happiness if socializing
      if (dwarf.state === 'socializing') happinessChange += 3;
      
      // Apply the changes
      updateNeeds(dwarf.id, hungerIncrease, -energyDecrease, happinessChange);
      
      // Check if needs are at critical levels and generate dialogue
      checkCriticalNeeds(dwarf);
    });
  };
  
  // Check for critical needs and respond
  const checkCriticalNeeds = async (dwarf: ClientDwarf) => {
    // Hunger check
    if (dwarf.hunger > 80 && dwarf.state !== 'eating') {
      // Find food or complain
      const foodMessage = await getDwarfThoughts(dwarf.id, createNeedMessage(dwarf, 'hunger'));
      updateDialogue(dwarf.id, foodMessage, true);
      
      // Auto-assign eating task to very hungry dwarves
      assignTask(dwarf.id, TaskType.Eating);
      
      // Hide dialogue after a delay
      setTimeout(() => updateDialogue(dwarf.id, '', false), DIALOGUE_HIDE_TIME);
    }
    
    // Energy check
    if (dwarf.energy < 20 && dwarf.state !== 'sleeping') {
      // Need to rest
      const sleepMessage = await getDwarfThoughts(dwarf.id, createNeedMessage(dwarf, 'energy'));
      updateDialogue(dwarf.id, sleepMessage, true);
      
      // Auto-assign sleeping task to very tired dwarves
      assignTask(dwarf.id, TaskType.Sleeping);
      
      // Hide dialogue after a delay
      setTimeout(() => updateDialogue(dwarf.id, '', false), DIALOGUE_HIDE_TIME);
    }
    
    // Happiness check
    if (dwarf.happiness < 30) {
      const unhappyMessage = await getDwarfThoughts(dwarf.id, createNeedMessage(dwarf, 'happiness'));
      updateDialogue(dwarf.id, unhappyMessage, true);
      
      // Possible actions for unhappy dwarves (maybe socialize)
      if (Math.random() > 0.7) {
        // Find another dwarf to talk to
        const otherDwarves = dwarves.filter(d => 
          d.id !== dwarf.id && 
          getManhattanDistance({x: dwarf.x, y: dwarf.y}, {x: d.x, y: d.y}) < 5
        );
        
        if (otherDwarves.length > 0) {
          const targetDwarf = pickRandom(otherDwarves);
          if (targetDwarf) {
            assignTask(dwarf.id, TaskType.Socializing);
            startConversation(dwarf.id, targetDwarf.id);
          }
        }
      }
      
      // Hide dialogue after a delay
      setTimeout(() => updateDialogue(dwarf.id, '', false), DIALOGUE_HIDE_TIME);
    }
  };
  
  // Process AI decision making
  const processAI = async (dwarf: ClientDwarf, currentTime: number) => {
    // Skip if dwarf is already engaged in an activity
    if (dwarf.state !== 'idle') {
      // Process ongoing tasks
      processDwarfTask(dwarf);
      return;
    }
    
    // Dwarf is idle, decide what to do next
    decideNextTask(dwarf);
  };
  
  // Process an ongoing task
  const processDwarfTask = (dwarf: ClientDwarf) => {
    switch (dwarf.state) {
      case 'mining':
      case 'woodcutting':
        processHarvestingTask(dwarf);
        break;
      case 'building':
        processBuildingTask(dwarf);
        break;
      case 'hauling':
        // Process hauling logic
        break;
      case 'eating':
        // Process eating (reduce hunger)
        if (dwarf.hunger <= 10) {
          // Finished eating
          updateDwarf(dwarf.id, { state: 'idle', currentTask: null });
        } else {
          // Continue eating (satisfy hunger)
          satisfyNeed(dwarf.id, 'hunger', 10);
        }
        break;
      case 'sleeping':
        // Process sleeping (increase energy)
        if (dwarf.energy >= 90) {
          // Finished sleeping
          updateDwarf(dwarf.id, { state: 'idle', currentTask: null });
        }
        // Energy recovery is handled in updateAllNeeds
        break;
      case 'socializing':
        // Let the socialization continue for a while
        break;
    }
  };
  
  // Process harvesting resources
  const processHarvestingTask = (dwarf: ClientDwarf) => {
    // Check if dwarf has a target
    if (!dwarf.target) return;
    
    // Find resource at target
    const resource = resources.find(r => r.x === dwarf.target?.x && r.y === dwarf.target?.y);
    if (!resource) {
      // Resource is gone or invalid, go idle
      updateDwarf(dwarf.id, { state: 'idle', currentTask: null, target: undefined });
      return;
    }
    
    // Check if dwarf is at the resource
    const isAtResource = dwarf.x === resource.x && dwarf.y === resource.y;
    
    if (isAtResource) {
      // Harvest the resource
      harvestResource(resource.id, 1, dwarf.id);
      
      // If resource is depleted, go idle
      if (resource.quantity <= 1) {
        updateDwarf(dwarf.id, { state: 'idle', currentTask: null, target: undefined });
      }
    } else {
      // Not at resource yet, need to move there
      // Path finding would be handled by game loop
    }
  };
  
  // Process building task
  const processBuildingTask = (dwarf: ClientDwarf) => {
    // Check if dwarf has a target
    if (!dwarf.target) return;
    
    // Find building at target
    const building = buildings.find(b => {
      return (dwarf.target?.x >= b.x && 
              dwarf.target?.x < b.x + b.width && 
              dwarf.target?.y >= b.y && 
              dwarf.target?.y < b.y + b.height);
    });
    
    if (!building) {
      // Building is gone or invalid, go idle
      updateDwarf(dwarf.id, { state: 'idle', currentTask: null, target: undefined });
      return;
    }
    
    // Check if dwarf is adjacent to the building
    const isAdjacent = getManhattanDistance(
      {x: dwarf.x, y: dwarf.y}, 
      {x: building.x, y: building.y}
    ) <= 1;
    
    if (isAdjacent) {
      // Work on the building
      const newProgress = Math.min(100, building.progress + 5);
      useBuilding.getState().updateBuilding(building.id, { progress: newProgress });
      
      // If building is complete, finish the task
      if (newProgress >= 100) {
        useBuilding.getState().completeBuildJob(building.id);
        updateDwarf(dwarf.id, { state: 'idle', currentTask: null, target: undefined });
      }
    } else {
      // Not at building yet, need to move there
      // Path finding would be handled by game loop
    }
  };
  
  // Decide the next task for a dwarf
  const decideNextTask = (dwarf: ClientDwarf) => {
    // Check needs first
    if (dwarf.hunger > 70) {
      assignTask(dwarf.id, TaskType.Eating);
      return;
    }
    
    if (dwarf.energy < 30) {
      assignTask(dwarf.id, TaskType.Sleeping);
      return;
    }
    
    // Random decision making for demo
    const taskProbabilities = [
      { task: TaskType.Mining, weight: 0.3 },
      { task: TaskType.Woodcutting, weight: 0.3 },
      { task: TaskType.Building, weight: 0.2 },
      { task: TaskType.Socializing, weight: 0.1 },
      { task: TaskType.Hauling, weight: 0.1 },
    ];
    
    // Random selection weighted by probabilities
    const totalWeight = taskProbabilities.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { task, weight } of taskProbabilities) {
      random -= weight;
      if (random <= 0) {
        // Task selected, now find a suitable target
        assignTaskWithTarget(dwarf, task);
        break;
      }
    }
  };
  
  // Assign a task with appropriate target
  const assignTaskWithTarget = (dwarf: ClientDwarf, task: TaskType) => {
    let target: Point2D | undefined;
    
    switch (task) {
      case TaskType.Mining:
        // Find stone resource
        const stone = resources.filter(r => r.type === 'stone' && r.quantity > 0);
        if (stone.length > 0) {
          const randomStone = pickRandom(stone);
          if (randomStone) {
            target = { x: randomStone.x, y: randomStone.y };
          }
        }
        break;
        
      case TaskType.Woodcutting:
        // Find wood resource
        const wood = resources.filter(r => r.type === 'wood' && r.quantity > 0);
        if (wood.length > 0) {
          const randomWood = pickRandom(wood);
          if (randomWood) {
            target = { x: randomWood.x, y: randomWood.y };
          }
        }
        break;
        
      case TaskType.Building:
        // Find incomplete building
        const incompleteBuildings = buildings.filter(b => !b.complete);
        if (incompleteBuildings.length > 0) {
          const randomBuilding = pickRandom(incompleteBuildings);
          if (randomBuilding) {
            target = { x: randomBuilding.x, y: randomBuilding.y };
          }
        }
        break;
        
      case TaskType.Socializing:
        // Find another dwarf to talk to
        const otherDwarves = dwarves.filter(d => d.id !== dwarf.id);
        if (otherDwarves.length > 0) {
          const randomDwarf = pickRandom(otherDwarves);
          if (randomDwarf) {
            target = { x: randomDwarf.x, y: randomDwarf.y };
            
            // Start conversation after a short delay
            setTimeout(() => {
              if (getManhattanDistance({x: dwarf.x, y: dwarf.y}, target!) <= 2) {
                startConversation(dwarf.id, randomDwarf.id);
              }
            }, 2000);
          }
        }
        break;
    }
    
    // Only assign the task if we found a valid target
    if (target || task === TaskType.Eating || task === TaskType.Sleeping) {
      assignTask(dwarf.id, task, target);
    }
  };
  
  return null; // This component doesn't render anything
};

export default AIControls;
