import { ClientDwarf, AIMessage, TaskType, BuildingType, ResourceType } from '../types/game';

// Prepare system prompt for the AI dwarf
export function createSystemPrompt(dwarf: ClientDwarf): string {
  return `You are a dwarf named ${dwarf.name} in a fortress simulation game. Act like a dwarf with a personality.
You have the following stats:
- Health: ${dwarf.health}/100
- Hunger: ${dwarf.hunger}/100 (higher is hungrier)
- Energy: ${dwarf.energy}/100
- Happiness: ${dwarf.happiness}/100

Your current task is: ${dwarf.currentTask || "none"}.
Your current state is: ${dwarf.state}.

Respond with very short, direct responses as if you were speaking with other dwarves. Keep responses under 15 words when possible.
Dwarves love mining, crafting, drinking ale, and telling stories.
Dwarves have their own culture and sayings. They often refer to rocks and stones.`;
}

// Create a conversation message for AI
export function createConversationMessage(
  dwarf: ClientDwarf,
  otherDwarf: ClientDwarf
): string {
  // Prepare situation awareness for the conversation
  return `You meet ${otherDwarf.name}, another dwarf. They appear to be ${otherDwarf.state}.
${otherDwarf.name} is currently ${getStateDescription(otherDwarf)}.

What do you say to ${otherDwarf.name}? Keep your response brief and in character as a dwarf.`;
}

// Create building task message for AI
export function createBuildingTaskMessage(
  dwarf: ClientDwarf,
  buildingType: BuildingType
): string {
  return `You are planning to build a ${buildingType}. What are your thoughts on this task?
Keep your response brief and in character as a dwarf.`;
}

// Create task completion message
export function createTaskCompletionMessage(
  dwarf: ClientDwarf,
  taskType: TaskType
): string {
  return `You just completed a ${taskType} task. How do you feel about it?
Keep your response very brief (under 10 words) and in character as a dwarf.`;
}

// Create need satisfaction message
export function createNeedMessage(
  dwarf: ClientDwarf,
  needType: "hunger" | "energy" | "happiness"
): string {
  const needLevel = dwarf[needType];
  let description = "";
  
  switch (needType) {
    case "hunger":
      description = needLevel > 80 ? "extremely hungry" : 
                    needLevel > 60 ? "very hungry" : 
                    needLevel > 40 ? "quite hungry" : 
                    needLevel > 20 ? "a bit hungry" : "satisfied";
      break;
    case "energy":
      description = needLevel < 20 ? "exhausted" : 
                    needLevel < 40 ? "very tired" : 
                    needLevel < 60 ? "somewhat tired" : 
                    needLevel < 80 ? "a bit tired" : "energetic";
      break;
    case "happiness":
      description = needLevel < 20 ? "miserable" : 
                    needLevel < 40 ? "unhappy" : 
                    needLevel < 60 ? "neutral" : 
                    needLevel < 80 ? "content" : "very happy";
      break;
  }
  
  return `You are feeling ${description} (${needType}: ${needLevel}/100). What do you say?
Keep your response very brief (under 10 words) and in character as a dwarf.`;
}

// Helper function to get state description
function getStateDescription(dwarf: ClientDwarf): string {
  switch (dwarf.state) {
    case "idle":
      return "standing around, looking for something to do";
    case "mining":
      return "mining rocks, swinging a pickaxe";
    case "woodcutting":
      return "chopping trees with an axe";
    case "building":
      return "constructing a building";
    case "eating":
      return "eating food";
    case "sleeping":
      return "sleeping or resting";
    case "socializing":
      return "talking to other dwarves";
    case "crafting":
      return "crafting items at a workshop";
    case "hauling":
      return "carrying materials or items";
    default:
      return dwarf.state;
  }
}

// Format a conversation for memory storage
export function formatConversationForMemory(
  dwarf: ClientDwarf,
  otherDwarf: ClientDwarf,
  dialogue: string
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  return `[${timeStr}] Talked to ${otherDwarf.name}: "${dialogue}"`;
}

// Format a task completion for memory storage
export function formatTaskForMemory(
  dwarf: ClientDwarf,
  taskType: TaskType
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  return `[${timeStr}] Completed task: ${taskType}`;
}

// Generate AI messages array from conversation
export function generateAIMessages(
  systemPrompt: string,
  userMessage: string,
  memory: string[] = []
): AIMessage[] {
  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt }
  ];
  
  // Add recent memories as context
  if (memory.length > 0) {
    const recentMemories = memory.slice(-5).join("\n");
    messages.push({
      role: "system",
      content: `Recent events:\n${recentMemories}`
    });
  }
  
  // Add the current situation/query
  messages.push({ role: "user", content: userMessage });
  
  return messages;
}
