import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { TaskType, BuildingType, ResourceType } from "../shared/schema";
import { logger } from "./logger";

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Message schema for OpenAI API
const aiMessageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string()
  }))
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Prefix all API routes with /api
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // DWARVES ENDPOINTS
  
  // Get all dwarves
  app.get("/api/dwarves", async (_req, res, next) => {
    try {
      const dwarves = await storage.getAllDwarves();
      res.json(dwarves);
    } catch (error) {
      next(error);
    }
  });
  
  // Get dwarf by ID
  app.get("/api/dwarves/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dwarf ID" });
      }
      
      const dwarf = await storage.getDwarf(id);
      if (!dwarf) {
        return res.status(404).json({ message: "Dwarf not found" });
      }
      
      res.json(dwarf);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new dwarf
  app.post("/api/dwarves", async (req, res, next) => {
    try {
      const dwarf = req.body;
      const newDwarf = await storage.createDwarf(dwarf);
      res.status(201).json(newDwarf);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a dwarf
  app.patch("/api/dwarves/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dwarf ID" });
      }
      
      const updates = req.body;
      
      // Get the original dwarf state to compare changes
      const originalDwarf = await storage.getDwarf(id);
      if (!originalDwarf) {
        return res.status(404).json({ message: "Dwarf not found" });
      }
      
      const updatedDwarf = await storage.updateDwarf(id, updates);
      if (!updatedDwarf) {
        return res.status(404).json({ message: "Dwarf not found after update" });
      }
      
      // Log task changes
      if (originalDwarf.currentTask !== updatedDwarf.currentTask) {
        logger.logDwarfEvent(
          id, 
          updatedDwarf.name, 
          "TASK_CHANGE",
          `Changed task from ${originalDwarf.currentTask || 'none'} to ${updatedDwarf.currentTask || 'none'}`,
          { x: updatedDwarf.x, y: updatedDwarf.y }
        );
      }
      
      // Log position changes
      if (originalDwarf.x !== updatedDwarf.x || originalDwarf.y !== updatedDwarf.y) {
        logger.logDwarfEvent(
          id, 
          updatedDwarf.name, 
          "POSITION_CHANGE",
          `Moved from (${originalDwarf.x}, ${originalDwarf.y}) to (${updatedDwarf.x}, ${updatedDwarf.y})`,
          { x: updatedDwarf.x, y: updatedDwarf.y }
        );
      }
      
      // Log state changes
      if (originalDwarf.state !== updatedDwarf.state) {
        logger.logDwarfEvent(
          id, 
          updatedDwarf.name, 
          "STATE_CHANGE",
          `Changed state from ${originalDwarf.state} to ${updatedDwarf.state}`,
          { x: updatedDwarf.x, y: updatedDwarf.y }
        );
      }
      
      // If the dwarf said something (currentDialogue was updated)
      if (updates.currentDialogue) {
        logger.logDwarfDialogue(
          id,
          updatedDwarf.name,
          updates.currentDialogue,
          updatedDwarf.currentTask || undefined
        );
      }
      
      res.json(updatedDwarf);
    } catch (error) {
      next(error);
    }
  });
  
  // BUILDINGS ENDPOINTS
  
  // Get all buildings
  app.get("/api/buildings", async (_req, res, next) => {
    try {
      const buildings = await storage.getAllBuildings();
      res.json(buildings);
    } catch (error) {
      next(error);
    }
  });
  
  // Get building by ID
  app.get("/api/buildings/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid building ID" });
      }
      
      const building = await storage.getBuilding(id);
      if (!building) {
        return res.status(404).json({ message: "Building not found" });
      }
      
      res.json(building);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new building
  app.post("/api/buildings", async (req, res, next) => {
    try {
      const building = req.body;
      const newBuilding = await storage.createBuilding(building);
      res.status(201).json(newBuilding);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a building
  app.patch("/api/buildings/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid building ID" });
      }
      
      const updates = req.body;
      const updatedBuilding = await storage.updateBuilding(id, updates);
      if (!updatedBuilding) {
        return res.status(404).json({ message: "Building not found" });
      }
      
      res.json(updatedBuilding);
    } catch (error) {
      next(error);
    }
  });
  
  // RESOURCES ENDPOINTS
  
  // Get all resources
  app.get("/api/resources", async (_req, res, next) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a resource
  app.patch("/api/resources/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }
      
      const updates = req.body;
      const updatedResource = await storage.updateResource(id, updates);
      if (!updatedResource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      res.json(updatedResource);
    } catch (error) {
      next(error);
    }
  });
  
  // GAME STATE ENDPOINTS
  
  // Get game state
  app.get("/api/game-state", async (_req, res, next) => {
    try {
      const gameState = await storage.getGameState();
      res.json(gameState);
    } catch (error) {
      next(error);
    }
  });
  
  // Update game state
  app.patch("/api/game-state", async (req, res, next) => {
    try {
      const updates = req.body;
      const updatedGameState = await storage.updateGameState(updates);
      res.json(updatedGameState);
    } catch (error) {
      next(error);
    }
  });
  
  // TASKS ENDPOINTS
  
  // Get all tasks
  app.get("/api/tasks", async (_req, res, next) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new task
  app.post("/api/tasks", async (req, res, next) => {
    try {
      const task = req.body;
      const newTask = await storage.createTask(task);
      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a task
  app.patch("/api/tasks/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const updates = req.body;
      const updatedTask = await storage.updateTask(id, updates);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // Assign task to dwarf
  app.post("/api/tasks/:id/assign", async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const { dwarfId } = req.body;
      
      if (isNaN(taskId) || isNaN(dwarfId)) {
        return res.status(400).json({ message: "Invalid task or dwarf ID" });
      }
      
      // Get the dwarf and task information before the update
      const dwarf = await storage.getDwarf(dwarfId);
      const task = await storage.getTask(taskId);
      
      if (!dwarf) {
        return res.status(404).json({ message: "Dwarf not found" });
      }
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedTask = await storage.assignTask(taskId, dwarfId);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found after update" });
      }
      
      // Log the task assignment
      logger.logDwarfEvent(
        dwarfId,
        dwarf.name,
        "TASK_ASSIGNED",
        `Assigned task #${taskId} of type ${updatedTask.type}` + 
        (updatedTask.target ? ` at location (${updatedTask.target.x}, ${updatedTask.target.y})` : ''),
        { x: dwarf.x, y: dwarf.y }
      );
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });
  
  // LOGGING ENDPOINTS
  
  // Log dwarf event
  app.post("/api/log/event", async (req, res, next) => {
    try {
      const { dwarfId, dwarfName, eventType, details, location } = req.body;
      
      // Validate required fields
      if (!dwarfId || !dwarfName || !eventType || !details) {
        return res.status(400).json({ message: "Missing required logging fields" });
      }
      
      // Log the event
      logger.logDwarfEvent(
        dwarfId,
        dwarfName,
        eventType,
        details,
        location
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
  
  // Log dwarf dialogue
  app.post("/api/log/dialogue", async (req, res, next) => {
    try {
      const { dwarfId, dwarfName, dialogue, context } = req.body;
      
      // Validate required fields
      if (!dwarfId || !dwarfName || !dialogue) {
        return res.status(400).json({ message: "Missing required logging fields" });
      }
      
      // Log the dialogue
      logger.logDwarfDialogue(
        dwarfId,
        dwarfName,
        dialogue,
        context
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // WORLD GENERATION ENDPOINT
  
  // Generate world
  app.post("/api/world/generate", async (req, res, next) => {
    try {
      const { width, height, seed } = req.body;
      
      if (!width || !height || width < 10 || height < 10 || width > 100 || height > 100) {
        return res.status(400).json({ 
          message: "Invalid dimensions. Width and height must be between 10 and 100." 
        });
      }
      
      // Generate world
      const worldSeed = seed || Math.floor(Math.random() * 1000000);
      const world = await storage.generateWorld(width, height, worldSeed);
      
      res.json({ success: true, world });
    } catch (error) {
      next(error);
    }
  });
  
  // PATHFINDING ENDPOINT
  
  // Find path between two points
  app.post("/api/pathfinding", async (req, res, next) => {
    try {
      const { start, end } = req.body;
      
      if (!start || !end || !start.x || !start.y || !end.x || !end.y) {
        return res.status(400).json({ message: "Invalid start or end points" });
      }
      
      const path = await storage.findPath(start, end);
      res.json(path);
    } catch (error) {
      next(error);
    }
  });
  
  // AI ENDPOINT
  
  // Send message to OpenAI API
  app.post("/api/ai/message", async (req, res, next) => {
    try {
      // Validate request body
      const parseResult = aiMessageSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid message format", errors: parseResult.error });
      }
      
      const { messages } = parseResult.data;
      
      // Check if API key is available
      if (!process.env.OPENAI_API_KEY) {
        // Return mock response when no API key is available
        const mockResponse = generateMockAIResponse(messages);
        logger.logApiRequest("mock", messages, mockResponse);
        return res.json({ response: mockResponse });
      }
      
      // Log OpenAI API request to console
      console.log("OpenAI API Request:");
      console.log("Model: gpt-4o-mini");
      console.log("Messages:", JSON.stringify(messages.map(m => ({ role: m.role, content: m.content })), null, 2));
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 100,
        temperature: 0.7,
      });
      
      const aiResponse = completion.choices[0]?.message?.content || "No response from AI";
      
      // Log OpenAI API response to console
      console.log("OpenAI API Response:", aiResponse);
      
      // Log API request and response to file
      logger.logApiRequest("gpt-4o-mini", messages, aiResponse);
      
      // Extract dwarf information from system message if available
      const systemMessage = messages.find(m => m.role === "system")?.content || "";
      const dwarfNameMatch = systemMessage.match(/You are a dwarf named (\w+)/);
      
      if (dwarfNameMatch && dwarfNameMatch[1]) {
        const dwarfName = dwarfNameMatch[1];
        // Extract ID from system message or use 0 if not found
        const dwarfIdMatch = systemMessage.match(/Dwarf #(\d+)/);
        const dwarfId = dwarfIdMatch ? parseInt(dwarfIdMatch[1]) : 0;
        
        // Log the dwarf's dialogue
        logger.logDwarfDialogue(dwarfId, dwarfName, aiResponse, "AI Response");
      }
      
      res.json({ response: aiResponse });
    } catch (error: any) {
      console.error("OpenAI API error:", error.response?.data || error.message);
      
      // Handle OpenAI API errors gracefully
      if (error.response?.status === 429) {
        return res.status(429).json({ message: "OpenAI API rate limit exceeded, please try again later" });
      }
      
      // Fall back to mock responses if API fails
      const mockResponse = generateMockAIResponse(req.body.messages);
      res.json({ response: mockResponse });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Function to generate mock AI responses when API is unavailable
function generateMockAIResponse(messages: any[]): string {
  const userMessage = messages.find(m => m.role === "user")?.content || "";
  
  // Check message content for determining response type
  if (userMessage.includes("hungry") || userMessage.includes("hunger")) {
    return "By me beard, I need some grub! The stomach's growlin' like an angry badger.";
  } else if (userMessage.includes("tired") || userMessage.includes("energy")) {
    return "Me eyelids are heavy as stone. Need to find a bed soon.";
  } else if (userMessage.includes("build")) {
    return "Aye, I'll put these hands to work! Stone and timber wait for no dwarf!";
  } else if (userMessage.includes("mine")) {
    return "The rocks be callin' me name! Time to swing the pickaxe.";
  } else if (userMessage.includes("completed")) {
    return "Job's done! And a fine piece o' work it is!";
  } else if (userMessage.includes("meet") || userMessage.includes("talk")) {
    return "Well met, fellow stonefriend! How goes the digging?";
  } else {
    const responses = [
      "Rock and stone, to the bone!",
      "Aye, what do ye need?",
      "By the beard, another fine day for mining!",
      "These tunnels won't dig themselves.",
      "I smell gold... or maybe it's just me lunch.",
      "The mountain sings to those who listen.",
      "Where there's stone, there's a way!",
      "I could use an ale 'bout now.",
      "Don't suppose ye have any mead?",
      "Keep yer feet on the ground!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
