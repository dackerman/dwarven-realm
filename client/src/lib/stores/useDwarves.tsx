import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ClientDwarf, Point2D, TaskAssignment, AIConversation, Direction } from '../../types/game';
import { TaskType } from '@shared/schema';
import { getDirection } from '../isometricUtils';
import { sendAIMessage } from '../api';
import { 
  createSystemPrompt, 
  createConversationMessage, 
  createBuildingTaskMessage, 
  createTaskCompletionMessage,
  createNeedMessage,
  formatConversationForMemory,
  formatTaskForMemory,
  generateAIMessages
} from '../aiHelpers';
import { logDwarfEvent, logDwarfDialogue } from '../loggerClient';

interface DwarvesState {
  dwarves: ClientDwarf[];
  selectedDwarfId: number | null;
  conversations: AIConversation[];
  
  // Actions
  setDwarves: (dwarves: ClientDwarf[]) => void;
  addDwarf: (dwarf: ClientDwarf) => void;
  updateDwarf: (id: number, data: Partial<ClientDwarf>) => void;
  selectDwarf: (id: number | null) => void;
  
  // Movement
  moveDwarf: (id: number, path: Point2D[]) => void;
  setTarget: (id: number, target: Point2D | undefined) => void;
  
  // Tasks
  assignTask: (id: number, task: TaskType, target?: Point2D) => void;
  completeTask: (id: number) => void;
  
  // Needs
  updateNeeds: (id: number, hunger: number, energy: number, happiness: number) => void;
  satisfyNeed: (id: number, needType: "hunger" | "energy" | "happiness", amount: number) => void;
  
  // Conversation
  startConversation: (dwarfId: number, targetDwarfId: number) => Promise<void>;
  updateDialogue: (id: number, dialogue: string, visible?: boolean) => void;
  hideAllDialogues: () => void;
  
  // AI helpers
  getDwarfThoughts: (id: number, prompt: string) => Promise<string>;
  
  // Utilities
  getDwarfById: (id: number) => ClientDwarf | undefined;
  getDwarfByPosition: (x: number, y: number) => ClientDwarf | undefined;
  getDwarvesInRange: (position: Point2D, range: number) => ClientDwarf[];
  
  // Social interactions
  initiateRandomConversations: () => void;
}

export const useDwarves = create<DwarvesState>()(
  subscribeWithSelector((set, get) => ({
    dwarves: [],
    selectedDwarfId: null,
    conversations: [],

    setDwarves: (dwarves) => set({ dwarves }),
    
    addDwarf: (dwarf) => set((state) => ({
      dwarves: [...state.dwarves, dwarf]
    })),
    
    updateDwarf: (id, data) => set((state) => ({
      dwarves: state.dwarves.map(dwarf => 
        dwarf.id === id ? { ...dwarf, ...data } : dwarf
      )
    })),
    
    selectDwarf: (id) => set({ selectedDwarfId: id }),
    
    moveDwarf: (id, path) => set((state) => {
      const dwarf = state.dwarves.find(d => d.id === id);
      if (!dwarf || path.length === 0) return state;
      
      const nextPosition = path[0];
      
      // Calculate the direction of movement
      const direction = getDirection(dwarf.x, dwarf.y, nextPosition.x, nextPosition.y) as Direction;
      
      console.log(`Dwarf store: Moving ${dwarf.name} (id:${id}) from (${dwarf.x}, ${dwarf.y}) to (${nextPosition.x}, ${nextPosition.y}), direction: ${direction}, remaining path: ${path.length - 1} steps`);
      
      // Update the dwarf with the new position, remaining path, and direction
      return {
        dwarves: state.dwarves.map(d => 
          d.id === id ? { 
            ...d, 
            x: nextPosition.x, 
            y: nextPosition.y, 
            // Only remove the first step from the path
            path: path.length > 1 ? path.slice(1) : undefined,
            direction,
            animation: "walking"
          } : d
        )
      };
    }),
    
    setTarget: (id, target) => set((state) => ({
      dwarves: state.dwarves.map(dwarf => 
        dwarf.id === id ? { ...dwarf, target } : dwarf
      )
    })),
    
    assignTask: (id, task, target) => set((state) => {
      // Find the dwarf
      const dwarf = state.dwarves.find(d => d.id === id);
      if (!dwarf) return state;
      
      console.log(`Dwarf store: Assigning task ${task} to ${dwarf.name} (id:${id})${target ? ` with target (${target.x}, ${target.y})` : ''}`);
      
      // Log the task assignment
      logDwarfEvent(
        id,
        dwarf.name,
        "TASK_ASSIGNED",
        `Assigned task ${task}${target ? ` at location (${target.x}, ${target.y})` : ''}`,
        { x: dwarf.x, y: dwarf.y }
      );
      
      return {
        dwarves: state.dwarves.map(d => 
          d.id === id ? { 
            ...d, 
            currentTask: task,
            state: task,
            target: target,
            animation: task === TaskType.Sleeping ? "sleeping" : 
                      task === TaskType.Eating ? "eating" : 
                      task === TaskType.Socializing ? "talking" : "working"
          } : d
        )
      };
    }),
    
    completeTask: (id) => set((state) => {
      const dwarf = state.dwarves.find(d => d.id === id);
      if (!dwarf) return state;
      
      // Add task completion to memory
      const memory = [...dwarf.memory];
      if (dwarf.currentTask) {
        memory.push(formatTaskForMemory(dwarf, dwarf.currentTask as TaskType));
        
        // Log the task completion
        logDwarfEvent(
          id,
          dwarf.name,
          "TASK_COMPLETED",
          `Completed task ${dwarf.currentTask}`,
          { x: dwarf.x, y: dwarf.y }
        );
      }
      
      return {
        dwarves: state.dwarves.map(d => 
          d.id === id ? { 
            ...d, 
            currentTask: null,
            state: "idle",
            target: undefined,
            animation: "idle",
            memory
          } : d
        )
      };
    }),
    
    updateNeeds: (id, hunger, energy, happiness) => set((state) => ({
      dwarves: state.dwarves.map(dwarf => 
        dwarf.id === id ? { 
          ...dwarf, 
          hunger: Math.max(0, Math.min(100, dwarf.hunger + hunger)),
          energy: Math.max(0, Math.min(100, dwarf.energy + energy)),
          happiness: Math.max(0, Math.min(100, dwarf.happiness + happiness))
        } : dwarf
      )
    })),
    
    satisfyNeed: (id, needType, amount) => set((state) => {
      const dwarf = state.dwarves.find(d => d.id === id);
      if (!dwarf) return state;
      
      // Create updated dwarf with adjusted need
      const updatedDwarf = { ...dwarf };
      
      switch (needType) {
        case "hunger":
          updatedDwarf.hunger = Math.max(0, Math.min(100, dwarf.hunger - amount));
          break;
        case "energy":
          updatedDwarf.energy = Math.max(0, Math.min(100, dwarf.energy + amount));
          break;
        case "happiness":
          updatedDwarf.happiness = Math.max(0, Math.min(100, dwarf.happiness + amount));
          break;
      }
      
      return {
        dwarves: state.dwarves.map(d => d.id === id ? updatedDwarf : d)
      };
    }),
    
    startConversation: async (dwarfId, targetDwarfId) => {
      const dwarf = get().getDwarfById(dwarfId);
      const targetDwarf = get().getDwarfById(targetDwarfId);
      
      if (!dwarf || !targetDwarf) return;
      
      // Create appropriate prompts
      const systemPrompt = createSystemPrompt(dwarf);
      const conversationPrompt = createConversationMessage(dwarf, targetDwarf);
      
      // Generate AI messages
      const messages = generateAIMessages(systemPrompt, conversationPrompt, dwarf.memory);
      
      try {
        // Add to conversations with "thinking" state
        set((state) => ({
          conversations: [
            ...state.conversations,
            { dwarfId, messages, thinking: true }
          ]
        }));
        
        // Get response from AI API
        const response = await sendAIMessage(messages);
        
        // Update dwarf with conversation
        const dialogueText = response.response;
        
        // Log the conversation
        logDwarfDialogue(
          dwarfId,
          dwarf.name,
          dialogueText,
          `Conversation with ${targetDwarf.name}`
        );
        
        // Add to dwarf memory
        const updatedMemory = [...dwarf.memory];
        updatedMemory.push(formatConversationForMemory(dwarf, targetDwarf, dialogueText));
        
        // Update the dwarf
        get().updateDwarf(dwarfId, { 
          dialogueVisible: true,
          currentDialogue: dialogueText,
          animation: "talking",
          memory: updatedMemory
        });
        
        // Update conversations state
        set((state) => ({
          conversations: state.conversations.map(c => 
            c.dwarfId === dwarfId ? { ...c, thinking: false } : c
          )
        }));
        
      } catch (error) {
        console.error("Error in AI conversation:", error);
        
        // Mark conversation as not thinking anymore
        set((state) => ({
          conversations: state.conversations.map(c => 
            c.dwarfId === dwarfId ? { ...c, thinking: false } : c
          )
        }));
      }
    },
    
    updateDialogue: (id, dialogue, visible = true) => set((state) => ({
      dwarves: state.dwarves.map(dwarf => 
        dwarf.id === id ? { 
          ...dwarf, 
          dialogueVisible: visible,
          currentDialogue: dialogue,
          animation: visible ? "talking" : dwarf.animation 
        } : dwarf
      )
    })),
    
    hideAllDialogues: () => set((state) => ({
      dwarves: state.dwarves.map(dwarf => ({ 
        ...dwarf, 
        dialogueVisible: false 
      }))
    })),
    
    getDwarfThoughts: async (id, prompt) => {
      const dwarf = get().getDwarfById(id);
      if (!dwarf) return "No thoughts available.";
      
      const systemPrompt = createSystemPrompt(dwarf);
      const messages = generateAIMessages(systemPrompt, prompt, dwarf.memory);
      
      try {
        const response = await sendAIMessage(messages);
        return response.response;
      } catch (error) {
        console.error("Error getting dwarf thoughts:", error);
        return "I'm not sure what to think right now.";
      }
    },
    
    getDwarfById: (id) => get().dwarves.find(dwarf => dwarf.id === id),
    
    getDwarfByPosition: (x, y) => get().dwarves.find(dwarf => dwarf.x === x && dwarf.y === y),
    
    getDwarvesInRange: (position, range) => {
      return get().dwarves.filter(dwarf => {
        const distance = Math.abs(dwarf.x - position.x) + Math.abs(dwarf.y - position.y);
        return distance <= range;
      });
    },
    
    // Initiate random conversations between nearby dwarves
    initiateRandomConversations: () => {
      const allDwarves = get().dwarves;
      
      // Don't do anything if we have fewer than 2 dwarves
      if (allDwarves.length < 2) return;
      
      // Choose a random initiator dwarf
      const initiatorIndex = Math.floor(Math.random() * allDwarves.length);
      const initiator = allDwarves[initiatorIndex];
      
      // Don't start a conversation if the dwarf is busy with certain tasks
      if ([TaskType.Sleeping, TaskType.Mining, TaskType.Woodcutting].includes(initiator.state as TaskType)) return;
      
      // Find nearby dwarves (Manhattan distance <= 3)
      const nearbyDwarves = get().getDwarvesInRange({ x: initiator.x, y: initiator.y }, 3)
        .filter(d => d.id !== initiator.id && d.state !== TaskType.Sleeping);
      
      // If we found at least one nearby dwarf, start a conversation
      if (nearbyDwarves.length > 0) {
        // Choose a random dwarf to talk to
        const targetIndex = Math.floor(Math.random() * nearbyDwarves.length);
        const targetDwarf = nearbyDwarves[targetIndex];
        
        // Start the conversation
        get().assignTask(initiator.id, TaskType.Socializing);
        get().startConversation(initiator.id, targetDwarf.id);
        
        // Log the conversation initiation
        logDwarfEvent(
          initiator.id,
          initiator.name,
          "CONVERSATION_STARTED",
          `Started conversation with ${targetDwarf.name}`,
          { x: initiator.x, y: initiator.y }
        );
      }
    }
  }))
);
