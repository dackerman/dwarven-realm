import { ClientDwarf, AIMessage } from '../types/game';
import { TaskType, BuildingType, ResourceType } from '@shared/schema';

// Prepare system prompt for the AI dwarf
export function createSystemPrompt(dwarf: ClientDwarf): string {
  // Generate a distinctive personality based on dwarf's ID or name
  const personality = getDwarfPersonality(dwarf);
  
  return `You are a dwarf named ${dwarf.name} in a fortress simulation game. Act like a dwarf with the following personality traits:
${personality}

You have the following stats:
- Health: ${dwarf.health}/100
- Hunger: ${dwarf.hunger}/100 (higher is hungrier)
- Energy: ${dwarf.energy}/100
- Happiness: ${dwarf.happiness}/100

Your current task is: ${dwarf.currentTask || "none"}.
Your current state is: ${dwarf.state}.

Always respond as if speaking to other dwarves. Keep responses under 20 words when possible.
Always stay in character and incorporate your unique personality traits.
Use your signature phrases and speech patterns consistently.
Dwarves love mining, crafting, drinking ale, and telling stories.`;
}

// Generate a unique personality profile for each dwarf
function getDwarfPersonality(dwarf: ClientDwarf): string {
  // Use dwarf ID or hash of name to determine personality type
  const personalityType = dwarf.id % 6; // 6 different personality types
  
  switch (personalityType) {
    case 0:
      return `- You are gruff, serious, and no-nonsense
- You have a deep respect for tradition and craftsmanship
- You speak in short, direct sentences and rarely joke
- You value hard work above all else
- Your signature phrases include "By the ancestors!" and "Stone and steel!"
- You tend to grumble about modern ways`;
      
    case 1:
      return `- You are cheerful, optimistic, and love telling exaggerated stories
- You find joy in mining and discovering new gems
- You speak with enthusiasm and use colorful expressions
- You often break into song while working
- Your signature phrases include "Strike the earth!" and "Gold in them hills!"
- You add "aye" and "laddie/lassie" to your sentences`;
      
    case 2:
      return `- You are intellectual, philosophical, and curious
- You ponder the meaning of dwarven existence
- You speak formally and precisely, using bigger words than necessary
- You believe there's deeper meaning in mining and stone
- Your signature phrases include "Fascinating mineral composition" and "The stone speaks to those who listen"
- You sometimes get lost in your thoughts mid-conversation`;
      
    case 3:
      return `- You are suspicious, paranoid, and always expecting disaster
- You worry about cave-ins, goblin attacks, and food shortages
- You speak in nervous, worried tones and ask lots of questions
- You're constantly preparing for the worst
- Your signature phrases include "I've got a bad feeling..." and "Something's not right..."
- You frequently point out potential dangers others missed`;
      
    case 4:
      return `- You are boastful, competitive, and always seeking glory
- You keep count of everything you mine and build
- You speak loudly and frequently compare yourself to others
- You believe you're the greatest dwarf in the fortress
- Your signature phrases include "Beat that record!" and "The strongest dwarf in the mountain!"
- You challenge others to competitions regularly`;
      
    case 5:
      return `- You are poetic, artistic, and sensitive for a dwarf
- You see beauty in gems, crafts, and well-built structures
- You speak with flowery language and many metaphors
- You often stop to admire beautiful stonework
- Your signature phrases include "Beauty in the deep dark" and "The mountain sings to me"
- You quote ancient dwarven poetry`;
      
    default:
      return `- You are stubborn, traditional, and hardworking
- You value honesty and straightforwardness
- You speak in a gruff but friendly manner
- You have strong opinions about proper mining techniques
- Your signature phrases include "Rock and stone!" and "Dig deep, mine rich!"`;
  }
}

// Create a conversation message for AI
export function createConversationMessage(
  dwarf: ClientDwarf,
  otherDwarf: ClientDwarf
): string {
  // Generate a topic or reason for conversation based on random chance
  const otherDwarfPersonality = getDwarfPersonality(otherDwarf);
  const conversationTopic = getRandomConversationTopic(dwarf, otherDwarf);
  
  // Prepare situation awareness for the conversation
  return `You meet ${otherDwarf.name}, another dwarf. They appear to be ${otherDwarf.state}.
${otherDwarf.name} is currently ${getStateDescription(otherDwarf)}.

${otherDwarf.name} has the following personality:
${otherDwarfPersonality}

Context for this conversation:
${conversationTopic}

What do you say to ${otherDwarf.name}? Keep your response in character with your personality.
Remember your unique speech patterns and use your signature phrases when appropriate.
Keep the response under 25 words.`;
}

// Generate a random conversation topic between dwarves
function getRandomConversationTopic(dwarf: ClientDwarf, otherDwarf: ClientDwarf): string {
  const topics = [
    `You both are working near each other and taking a brief break.`,
    `You want to share your thoughts about your mining progress.`,
    `You have some opinions about the quality of stone in this area.`,
    `You notice ${otherDwarf.name} seems ${otherDwarf.energy < 50 ? 'tired' : 'energetic'}.`,
    `You want to ask ${otherDwarf.name} about their current task.`,
    `You want to share a brief story or legend about famous dwarven miners.`,
    `You've been thinking about improvements to the fortress.`,
    `You want to comment on ${otherDwarf.name}'s craftsmanship.`,
    `You're considering challenging ${otherDwarf.name} to a friendly competition.`,
    `You've discovered something interesting while mining and want to share it.`,
    `You want to complain about the food or ale quality.`,
    `You're thinking about organizing a feast or celebration.`,
    `You have concerns about fortress defenses and want to discuss them.`,
    `You admire ${otherDwarf.name}'s work and want to express it.`,
    `You're telling ${otherDwarf.name} about a dream you had.`,
    `You're sharing a dwarven proverb or saying that fits the current situation.`,
    `You're discussing plans for expanding the fortress.`,
    `You've been reminiscing about your home mountain and want to share.`,
    `You want to propose a joint project with ${otherDwarf.name}.`,
    `You overheard something interesting and want to share the gossip.`
  ];
  
  // Choose a random topic
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}

// Create building task message for AI
export function createBuildingTaskMessage(
  dwarf: ClientDwarf,
  buildingType: BuildingType
): string {
  const craftDetails = {
    wall: "sturdy stone wall that will protect the fortress",
    floor: "solid floor that will support dwarves and furniture",
    door: "strong door that can be opened and closed for security",
    bed: "comfortable resting place for tired dwarves",
    table: "place for eating and socializing with fellow dwarves",
    chair: "seat for resting while at the table or workshop",
    workshop: "specialized area for crafting and creating items",
    storage: "organized area for keeping materials and items",
    farm: "plot for growing food underground"
  };
  
  const buildingDetail = craftDetails[buildingType] || `${buildingType} for the fortress`;
  
  return `You are planning to build a ${buildingType} (a ${buildingDetail}).
What are your thoughts about building this ${buildingType}?
Keep your response brief (under 20 words) and in character with your unique personality.
Use one of your signature phrases if appropriate.`;
}

// Create task completion message
export function createTaskCompletionMessage(
  dwarf: ClientDwarf,
  taskType: TaskType
): string {
  const taskDetails = {
    mining: "extracted valuable stone and minerals from the earth",
    woodcutting: "chopped down trees for timber",
    building: "constructed part of the fortress",
    eating: "satisfied your hunger with some hearty food",
    sleeping: "rested and recovered your energy",
    socializing: "spent time talking with fellow dwarves",
    crafting: "created useful items with your skilled hands",
    hauling: "moved materials to where they are needed",
    idle: "taken a short break from work"
  };
  
  const taskDetail = taskDetails[taskType] || `completed your ${taskType} task`;
  
  return `You just ${taskDetail}. How do you feel about it?
Keep your response very brief (under 15 words) and in character with your unique personality.
Use your signature phrases when appropriate.`;
}

// Create need satisfaction message
export function createNeedMessage(
  dwarf: ClientDwarf,
  needType: "hunger" | "energy" | "happiness"
): string {
  const needLevel = dwarf[needType];
  let description = "";
  let context = "";
  
  switch (needType) {
    case "hunger":
      description = needLevel > 80 ? "extremely hungry" : 
                    needLevel > 60 ? "very hungry" : 
                    needLevel > 40 ? "quite hungry" : 
                    needLevel > 20 ? "a bit hungry" : "satisfied";
      
      context = needLevel > 60 ? "Your stomach growls loudly, demanding food. You think of roasted meats and hearty stews." : 
                needLevel > 40 ? "Your stomach makes rumbling sounds, reminding you it's been a while since you ate." :
                needLevel > 20 ? "You could use a snack, though it's not urgent yet." :
                "You've eaten well recently and feel nourished.";
      break;
      
    case "energy":
      description = needLevel < 20 ? "exhausted" : 
                    needLevel < 40 ? "very tired" : 
                    needLevel < 60 ? "somewhat tired" : 
                    needLevel < 80 ? "a bit tired" : "energetic";
      
      context = needLevel < 20 ? "Your limbs feel heavy as stone, and you can barely keep your eyes open." :
                needLevel < 40 ? "The day's work has taken its toll. You long for your bed and rest." :
                needLevel < 60 ? "You've been working steadily and are beginning to feel the fatigue." :
                needLevel < 80 ? "A short break would be nice, but you still have plenty of energy left." :
                "You feel strong and ready for any task. Your pickaxe feels light in your hands.";
      break;
      
    case "happiness":
      description = needLevel < 20 ? "miserable" : 
                    needLevel < 40 ? "unhappy" : 
                    needLevel < 60 ? "neutral" : 
                    needLevel < 80 ? "content" : "very happy";
      
      context = needLevel < 20 ? "Nothing seems to go right. The stone is stubborn, the ale is flat, and the fortress feels oppressive." :
                needLevel < 40 ? "You find yourself sighing more than usual. Something feels missing in your work." :
                needLevel < 60 ? "Life goes on as usual in the fortress. Nothing particularly exciting or disappointing." :
                needLevel < 80 ? "You find satisfaction in your work and camaraderie with your fellow dwarves." :
                "The fortress feels like home, the stone sings to your touch, and the company of your fellow dwarves brings joy.";
      break;
  }
  
  return `You are feeling ${description} (${needType}: ${needLevel}/100).
${context}

What do you say about how you're feeling?
Keep your response brief (under 15 words) and in character with your unique personality.
Use your signature phrases when appropriate.`;
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

// Generate autonomous decision message for AI
export function createDecisionMessage(
  dwarf: ClientDwarf,
  worldState: {
    resources: { type: ResourceType, quantity: number, position: { x: number, y: number } }[],
    buildings: { type: BuildingType, completed: boolean, position: { x: number, y: number } }[],
    otherDwarves: { id: number, name: string, task: string, position: { x: number, y: number } }[]
  }
): string {
  // Create a detailed world state description
  const resourceDesc = worldState.resources.length > 0 
    ? `Available resources: ${worldState.resources.map(r => `${r.type} at (${r.position.x}, ${r.position.y}) (${r.quantity} units)`).join(', ')}.` 
    : 'No resources available.';
  
  const buildingDesc = worldState.buildings.length > 0
    ? `Buildings: ${worldState.buildings.map(b => `${b.type} at (${b.position.x}, ${b.position.y}) (${b.completed ? 'completed' : 'in progress'})`).join(', ')}.`
    : 'No buildings constructed yet.';
  
  const otherDwarvesDesc = worldState.otherDwarves.length > 0
    ? `Other dwarves: ${worldState.otherDwarves.map(d => `${d.name} (${d.task}) at (${d.position.x}, ${d.position.y})`).join(', ')}.`
    : 'No other dwarves nearby.';
  
  // Create urgency based on needs
  const urgentNeeds = [];
  const needsContexts = [];
  
  if (dwarf.hunger > 75) {
    urgentNeeds.push('very hungry');
    needsContexts.push('Your stomach growls loudly, demanding food. You need to eat soon.');
  } else if (dwarf.hunger > 50) {
    urgentNeeds.push('hungry');
    needsContexts.push('Your stomach is rumbling. Food would be welcome.');
  }
  
  if (dwarf.energy < 25) {
    urgentNeeds.push('exhausted');
    needsContexts.push('Your limbs feel heavy as stone. Rest is essential soon.');
  } else if (dwarf.energy < 50) {
    urgentNeeds.push('tired');
    needsContexts.push('The day\'s work has taken its toll. Sleep would be beneficial.');
  }
  
  if (dwarf.happiness < 25) {
    urgentNeeds.push('very unhappy');
    needsContexts.push('Your spirits are as low as the deepest mine. Something must lift your mood.');
  } else if (dwarf.happiness < 50) {
    urgentNeeds.push('unhappy');
    needsContexts.push('You\'ve been sighing more than usual. Some pleasant company might help.');
  }
  
  const needsDesc = urgentNeeds.length > 0
    ? `You are feeling ${urgentNeeds.join(' and ')}.`
    : 'You are feeling fine and in good spirits.';
  
  const needsContext = needsContexts.length > 0
    ? needsContexts.join(' ')
    : 'All your basic needs are well satisfied at the moment.';
  
  // Task preferences based on personality
  const personalityType = dwarf.id % 6; // Same as in getDwarfPersonality
  
  let taskPreferences = '';
  
  switch (personalityType) {
    case 0: // Gruff, serious
      taskPreferences = 'You prefer practical tasks like mining and building. Social activities are less important to you.';
      break;
    case 1: // Cheerful, optimistic
      taskPreferences = 'You enjoy mining for new discoveries and socializing with other dwarves. Work is always more fun with company!';
      break;
    case 2: // Intellectual, philosophical
      taskPreferences = 'You find meaning in careful crafting and mining for rare minerals. The patterns in stone fascinate you.';
      break;
    case 3: // Suspicious, paranoid
      taskPreferences = 'You prefer tasks that increase fortress security. Mining provides safe rooms, while woodcutting clears sight lines.';
      break;
    case 4: // Boastful, competitive
      taskPreferences = 'You seek tasks where you can prove your superior skill and strength. Mining the most stone would impress others.';
      break;
    case 5: // Poetic, artistic
      taskPreferences = "You are drawn to tasks with aesthetic value. Creating beautiful spaces through mining and building brings you joy.";
      break;
    default:
      taskPreferences = 'You value all types of work that contribute to the fortress.';
  }
  
  return `You need to decide what to do next based on your needs, the world state, and your personality.

${needsDesc}
${needsContext}

${taskPreferences}

**World Information:**
${resourceDesc}
${buildingDesc}
${otherDwarvesDesc}

What will you decide to do next? Respond with the task you choose and a very brief reason why.
Only choose from these tasks: mining, woodcutting, building, eating, sleeping, socializing, crafting, hauling, or idle.
Keep your response brief (under 20 words) and in character with your personality.
Use your signature phrases when appropriate.`;
}

// Format AI decision for memory
export function formatDecisionForMemory(
  dwarf: ClientDwarf,
  decision: string,
  reason: string
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  
  return `[${timeStr}] Decided to ${decision}${reason ? `: ${reason}` : ''}`;
}
