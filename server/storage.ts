import {
  users, type User, type InsertUser,
  dwarves, type Dwarf,
  buildings, type Building,
  resources, type Resource,
  gameState, type GameState,
  TaskType, BuildingType, ResourceType
} from "@shared/schema";
import { getManhattanDistance } from "../client/src/lib/isometricUtils";
import { Point2D, TaskAssignment, GameWorld, GridCell } from "../client/src/types/game";

// Task interface for storage
interface Task {
  id: number;
  type: TaskType;
  target?: { x: number; y: number };
  priority: number;
  assignedTo?: number;
  completed: boolean;
  progress: number;
  requiresItems?: Record<string, number>;
}

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dwarf methods
  getDwarf(id: number): Promise<Dwarf | undefined>;
  getAllDwarves(): Promise<Dwarf[]>;
  createDwarf(dwarf: Partial<Dwarf>): Promise<Dwarf>;
  updateDwarf(id: number, updates: Partial<Dwarf>): Promise<Dwarf | undefined>;
  
  // Building methods
  getBuilding(id: number): Promise<Building | undefined>;
  getAllBuildings(): Promise<Building[]>;
  createBuilding(building: Partial<Building>): Promise<Building>;
  updateBuilding(id: number, updates: Partial<Building>): Promise<Building | undefined>;
  
  // Resource methods
  getResource(id: number): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  createResource(resource: Partial<Resource>): Promise<Resource>;
  updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined>;
  
  // Game state methods
  getGameState(): Promise<GameState>;
  updateGameState(updates: Partial<GameState>): Promise<GameState>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  createTask(task: Partial<Task>): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  assignTask(taskId: number, dwarfId: number): Promise<Task | undefined>;
  
  // World generation methods
  generateWorld(width: number, height: number, seed: number): Promise<GameWorld>;
  
  // Pathfinding
  findPath(start: Point2D, end: Point2D): Promise<Point2D[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private dwarfStore: Map<number, Dwarf>;
  private buildingStore: Map<number, Building>;
  private resourceStore: Map<number, Resource>;
  private taskStore: Map<number, Task>;
  private gameStateData: GameState;
  private worldGrid: GameWorld | null;
  
  private userCounter: number;
  private dwarfCounter: number;
  private buildingCounter: number;
  private resourceCounter: number;
  private taskCounter: number;

  constructor() {
    this.users = new Map();
    this.dwarfStore = new Map();
    this.buildingStore = new Map();
    this.resourceStore = new Map();
    this.taskStore = new Map();
    this.worldGrid = null;
    
    this.userCounter = 1;
    this.dwarfCounter = 1;
    this.buildingCounter = 1;
    this.resourceCounter = 1;
    this.taskCounter = 1;
    
    // Initialize game state
    this.gameStateData = {
      id: 1,
      day: 1,
      time: 360, // 6:00 AM
      weather: "clear",
      gameSpeed: 1,
      worldSeed: Math.floor(Math.random() * 1000000)
    };
    
    // Initialize with some starter data
    this.initializeStarterData();
  }
  
  private initializeStarterData() {
    // Create some initial dwarves
    const dwarfNames = ["Urist", "Gimli", "Durin", "Thrain", "Balin", "Dwalin", "Nori", "Dori"];
    const shuffledNames = [...dwarfNames].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 3; i++) {
      const name = shuffledNames[i] || `Dwarf ${i+1}`;
      this.createDwarf({
        name,
        health: 100,
        hunger: Math.floor(Math.random() * 30),
        energy: 80 + Math.floor(Math.random() * 20),
        happiness: 70 + Math.floor(Math.random() * 30),
        x: 5 + i*2,
        y: 5 + i,
        state: "idle",
        conversation: [],
        memory: [],
        inventory: {}
      });
    }
    
    // Create some initial resources
    // Stone resources
    for (let i = 0; i < 5; i++) {
      this.createResource({
        type: ResourceType.Stone,
        x: 3 + Math.floor(Math.random() * 10),
        y: 3 + Math.floor(Math.random() * 10),
        quantity: 50 + Math.floor(Math.random() * 50),
        regenerate: false
      });
    }
    
    // Wood resources
    for (let i = 0; i < 3; i++) {
      this.createResource({
        type: ResourceType.Wood,
        x: 8 + Math.floor(Math.random() * 10),
        y: 8 + Math.floor(Math.random() * 10),
        quantity: 30 + Math.floor(Math.random() * 30),
        regenerate: true
      });
    }
    
    // Food resources
    for (let i = 0; i < 2; i++) {
      this.createResource({
        type: ResourceType.Food,
        x: 12 + Math.floor(Math.random() * 5),
        y: 5 + Math.floor(Math.random() * 5),
        quantity: 20 + Math.floor(Math.random() * 30),
        regenerate: true
      });
    }
    
    // Create initial buildings
    this.createBuilding({
      type: BuildingType.Floor,
      x: 7,
      y: 7,
      width: 5,
      height: 5,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Stone]: 10 },
      occupants: []
    });
    
    this.createBuilding({
      type: BuildingType.Wall,
      x: 7,
      y: 7,
      width: 1,
      height: 5,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Stone]: 10 },
      occupants: []
    });
    
    this.createBuilding({
      type: BuildingType.Wall,
      x: 11,
      y: 7,
      width: 1,
      height: 5,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Stone]: 10 },
      occupants: []
    });
    
    this.createBuilding({
      type: BuildingType.Wall,
      x: 8,
      y: 7,
      width: 3,
      height: 1,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Stone]: 6 },
      occupants: []
    });
    
    this.createBuilding({
      type: BuildingType.Wall,
      x: 8,
      y: 11,
      width: 3,
      height: 1,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Stone]: 6 },
      occupants: []
    });
    
    // Create a bed
    this.createBuilding({
      type: BuildingType.Bed,
      x: 8,
      y: 9,
      width: 2,
      height: 1,
      complete: true,
      progress: 100,
      materials: { [ResourceType.Wood]: 3 },
      occupants: []
    });
  }
  
  // USER METHODS
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // DWARF METHODS
  
  async getDwarf(id: number): Promise<Dwarf | undefined> {
    return this.dwarfStore.get(id);
  }

  async getAllDwarves(): Promise<Dwarf[]> {
    return Array.from(this.dwarfStore.values());
  }

  async createDwarf(dwarf: Partial<Dwarf>): Promise<Dwarf> {
    const id = this.dwarfCounter++;
    const newDwarf: Dwarf = {
      id,
      name: dwarf.name || `Dwarf ${id}`,
      health: dwarf.health || 100,
      hunger: dwarf.hunger || 0,
      energy: dwarf.energy || 100,
      happiness: dwarf.happiness || 75,
      x: dwarf.x || 0,
      y: dwarf.y || 0,
      currentTask: dwarf.currentTask || null,
      inventory: dwarf.inventory || {},
      conversation: dwarf.conversation || [],
      memory: dwarf.memory || [],
      state: dwarf.state || "idle",
      lastUpdated: new Date()
    };
    
    this.dwarfStore.set(id, newDwarf);
    return newDwarf;
  }

  async updateDwarf(id: number, updates: Partial<Dwarf>): Promise<Dwarf | undefined> {
    const dwarf = this.dwarfStore.get(id);
    if (!dwarf) return undefined;
    
    const updatedDwarf = { ...dwarf, ...updates, lastUpdated: new Date() };
    this.dwarfStore.set(id, updatedDwarf);
    return updatedDwarf;
  }
  
  // BUILDING METHODS
  
  async getBuilding(id: number): Promise<Building | undefined> {
    return this.buildingStore.get(id);
  }

  async getAllBuildings(): Promise<Building[]> {
    return Array.from(this.buildingStore.values());
  }

  async createBuilding(building: Partial<Building>): Promise<Building> {
    const id = this.buildingCounter++;
    const newBuilding: Building = {
      id,
      type: building.type || BuildingType.Wall,
      x: building.x || 0,
      y: building.y || 0,
      width: building.width || 1,
      height: building.height || 1,
      complete: building.complete || false,
      progress: building.progress || 0,
      materials: building.materials || {},
      occupants: building.occupants || [],
      function: building.function
    };
    
    this.buildingStore.set(id, newBuilding);
    
    // Update world grid if it exists
    if (this.worldGrid) {
      this.updateWorldGridForBuilding(newBuilding);
    }
    
    return newBuilding;
  }

  async updateBuilding(id: number, updates: Partial<Building>): Promise<Building | undefined> {
    const building = this.buildingStore.get(id);
    if (!building) return undefined;
    
    const updatedBuilding = { ...building, ...updates };
    this.buildingStore.set(id, updatedBuilding);
    
    // Update world grid if it exists
    if (this.worldGrid) {
      this.updateWorldGridForBuilding(updatedBuilding);
    }
    
    return updatedBuilding;
  }
  
  private updateWorldGridForBuilding(building: Building) {
    if (!this.worldGrid) return;
    
    // Mark each cell covered by the building
    for (let y = building.y; y < building.y + building.height; y++) {
      for (let x = building.x; x < building.x + building.width; x++) {
        if (x >= 0 && x < this.worldGrid.width && y >= 0 && y < this.worldGrid.height) {
          this.worldGrid.grid[y][x] = {
            ...this.worldGrid.grid[y][x],
            type: "building",
            buildingId: building.id,
            // Floor allows walking, walls prevent it
            walkable: building.type !== BuildingType.Wall
          };
        }
      }
    }
  }
  
  // RESOURCE METHODS
  
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resourceStore.get(id);
  }

  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resourceStore.values());
  }

  async createResource(resource: Partial<Resource>): Promise<Resource> {
    const id = this.resourceCounter++;
    const newResource: Resource = {
      id,
      type: resource.type || ResourceType.Stone,
      x: resource.x || 0,
      y: resource.y || 0,
      quantity: resource.quantity || 10,
      regenerate: resource.regenerate || false
    };
    
    this.resourceStore.set(id, newResource);
    
    // Update world grid if it exists
    if (this.worldGrid) {
      this.updateWorldGridForResource(newResource);
    }
    
    return newResource;
  }

  async updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined> {
    const resource = this.resourceStore.get(id);
    if (!resource) return undefined;
    
    const updatedResource = { ...resource, ...updates };
    this.resourceStore.set(id, updatedResource);
    
    // If resource is depleted, update the world grid
    if (updatedResource.quantity <= 0 && this.worldGrid) {
      // Clear resource from grid
      if (updatedResource.x >= 0 && updatedResource.x < this.worldGrid.width && 
          updatedResource.y >= 0 && updatedResource.y < this.worldGrid.height) {
        this.worldGrid.grid[updatedResource.y][updatedResource.x] = {
          ...this.worldGrid.grid[updatedResource.y][updatedResource.x],
          type: "terrain",
          resourceId: undefined,
          walkable: true
        };
      }
    }
    
    return updatedResource;
  }
  
  private updateWorldGridForResource(resource: Resource) {
    if (!this.worldGrid) return;
    
    // Only update if the resource has quantity
    if (resource.quantity <= 0) return;
    
    // Mark the cell containing the resource
    if (resource.x >= 0 && resource.x < this.worldGrid.width && 
        resource.y >= 0 && resource.y < this.worldGrid.height) {
      this.worldGrid.grid[resource.y][resource.x] = {
        ...this.worldGrid.grid[resource.y][resource.x],
        type: "resource",
        resourceId: resource.id,
        // Resources allow walking over them
        walkable: true
      };
    }
  }
  
  // GAME STATE METHODS
  
  async getGameState(): Promise<GameState> {
    return this.gameStateData;
  }

  async updateGameState(updates: Partial<GameState>): Promise<GameState> {
    this.gameStateData = { ...this.gameStateData, ...updates };
    return this.gameStateData;
  }
  
  // TASK METHODS
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.taskStore.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.taskStore.values());
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const id = this.taskCounter++;
    const newTask: Task = {
      id,
      type: task.type || TaskType.Idle,
      target: task.target,
      priority: task.priority || 1,
      assignedTo: task.assignedTo,
      completed: task.completed || false,
      progress: task.progress || 0,
      requiresItems: task.requiresItems || {}
    };
    
    this.taskStore.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.taskStore.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.taskStore.set(id, updatedTask);
    return updatedTask;
  }

  async assignTask(taskId: number, dwarfId: number): Promise<Task | undefined> {
    const task = this.taskStore.get(taskId);
    if (!task) return undefined;
    
    // Check if dwarf exists
    const dwarf = this.dwarfStore.get(dwarfId);
    if (!dwarf) return undefined;
    
    // Assign task to dwarf
    const updatedTask = { ...task, assignedTo: dwarfId };
    this.taskStore.set(taskId, updatedTask);
    
    // Update dwarf's current task
    const updatedDwarf = { ...dwarf, currentTask: task.type, state: task.type };
    this.dwarfStore.set(dwarfId, updatedDwarf);
    
    return updatedTask;
  }
  
  // WORLD GENERATION METHODS
  
  async generateWorld(width: number, height: number, seed: number): Promise<GameWorld> {
    // Use seed for deterministic generation
    const random = this.seededRandom(seed);
    
    // Initialize empty grid
    const grid: GridCell[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        // Default cell is walkable terrain
        grid[y][x] = {
          x, y,
          type: "terrain",
          walkable: true,
          elevation: 0
        };
      }
    }
    
    // Generate terrain heights and features
    this.generateTerrain(grid, random, width, height);
    
    // Add existing buildings to the grid
    for (const building of this.buildingStore.values()) {
      this.updateWorldGridForBuilding(building);
    }
    
    // Add resources to the grid
    for (const resource of this.resourceStore.values()) {
      this.updateWorldGridForResource(resource);
    }
    
    // Store the world
    this.worldGrid = {
      grid,
      width,
      height
    };
    
    // Update game state with world seed
    this.gameStateData.worldSeed = seed;
    
    return this.worldGrid;
  }
  
  private seededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  private generateTerrain(grid: GridCell[][], random: () => number, width: number, height: number) {
    // Generate some hills and valleys
    const hillCenters = [];
    const numHills = Math.floor(width * height / 100);
    
    // Create hill centers
    for (let i = 0; i < numHills; i++) {
      hillCenters.push({
        x: Math.floor(random() * width),
        y: Math.floor(random() * height),
        radius: 3 + Math.floor(random() * 5),
        height: 1 + Math.floor(random() * 3)
      });
    }
    
    // Apply hills to terrain
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let elevation = 0;
        
        // Calculate influence of each hill
        for (const hill of hillCenters) {
          const dx = x - hill.x;
          const dy = y - hill.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < hill.radius) {
            // Apply elevation based on distance from hill center
            const factor = 1 - (distance / hill.radius);
            elevation += hill.height * factor;
          }
        }
        
        // Round to whole number
        grid[y][x].elevation = Math.round(elevation);
      }
    }
    
    // Add water to low areas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x].elevation < -1) {
          // Create water
          this.createResource({
            type: ResourceType.Water,
            x,
            y,
            quantity: 100,
            regenerate: true
          });
        }
      }
    }
  }
  
  // PATHFINDING METHODS
  
  async findPath(start: Point2D, end: Point2D): Promise<Point2D[]> {
    if (!this.worldGrid) {
      // If no world grid, return direct path
      return [start, end];
    }
    
    // Check bounds
    if (start.x < 0 || start.x >= this.worldGrid.width || 
        start.y < 0 || start.y >= this.worldGrid.height ||
        end.x < 0 || end.x >= this.worldGrid.width || 
        end.y < 0 || end.y >= this.worldGrid.height) {
      return [];
    }
    
    // If start and end are the same, return empty path
    if (start.x === end.x && start.y === end.y) {
      return [];
    }
    
    // A* pathfinding algorithm
    const openSet: { pos: Point2D, f: number, g: number, parent: Point2D | null }[] = [];
    const closedSet = new Set<string>();
    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};
    
    // Initialize start position
    const startKey = `${start.x},${start.y}`;
    gScore[startKey] = 0;
    fScore[startKey] = getManhattanDistance(start, end);
    openSet.push({ pos: start, f: fScore[startKey], g: 0, parent: null });
    
    while (openSet.length > 0) {
      // Get position with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.pos.x},${current.pos.y}`;
      
      // Check if we reached the end
      if (current.pos.x === end.x && current.pos.y === end.y) {
        // Reconstruct path
        const path: Point2D[] = [];
        let curr = current;
        while (curr.parent) {
          path.unshift(curr.pos);
          const parentKey = `${curr.parent.x},${curr.parent.y}`;
          const parentEntry = openSet.find(item => 
            item.pos.x === curr.parent!.x && item.pos.y === curr.parent!.y
          ) || { pos: curr.parent, f: 0, g: gScore[parentKey] || 0, parent: null };
          curr = parentEntry;
        }
        return path;
      }
      
      closedSet.add(currentKey);
      
      // Check neighbors
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ];
      
      for (const dir of directions) {
        const neighbor = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // Skip if out of bounds
        if (neighbor.x < 0 || neighbor.x >= this.worldGrid.width || 
            neighbor.y < 0 || neighbor.y >= this.worldGrid.height) {
          continue;
        }
        
        // Skip if already evaluated
        if (closedSet.has(neighborKey)) {
          continue;
        }
        
        // Skip if not walkable
        const cell = this.worldGrid.grid[neighbor.y][neighbor.x];
        if (!cell.walkable) {
          continue;
        }
        
        // Calculate g score
        const tentativeG = current.g + 1;
        
        // Check if this path is better
        if (neighborKey in gScore && tentativeG >= gScore[neighborKey]) {
          continue;
        }
        
        // This is the best path so far
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + getManhattanDistance(neighbor, end);
        
        // Add to open set if not already there
        if (!openSet.some(item => item.pos.x === neighbor.x && item.pos.y === neighbor.y)) {
          openSet.push({
            pos: neighbor,
            f: fScore[neighborKey],
            g: tentativeG,
            parent: current.pos
          });
        }
      }
    }
    
    // No path found
    return [];
  }
}

export const storage = new MemStorage();
