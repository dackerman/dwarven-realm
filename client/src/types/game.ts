import { Dwarf, Building, Resource, GameState, TaskType, BuildingType, ResourceType } from "@shared/schema";

// Extend the server types with client-specific properties

export interface ClientDwarf extends Omit<Dwarf, 'conversation' | 'memory' | 'inventory'> {
  conversation: string[];
  memory: string[];
  inventory: Record<string, number>;
  target?: { x: number, y: number };
  path?: { x: number, y: number }[];
  dialogueVisible: boolean;
  currentDialogue?: string;
  animation: "idle" | "walking" | "working" | "talking" | "eating" | "sleeping";
  direction: Direction;
}

export interface ClientBuilding extends Omit<Building, 'materials' | 'occupants'> {
  materials: Record<string, number>;
  occupants: number[];
  blocksMovement: boolean;
}

export interface ClientResource extends Resource {
  harvestTime: number;
  isBeingHarvested: boolean;
  harvestedBy?: number;
}

export interface IsometricPosition {
  x: number;
  y: number;
  z?: number; // Optional height for multi-level fortress
}

export interface GridCell {
  x: number;
  y: number;
  type: "terrain" | "building" | "resource";
  walkable: boolean;
  occupied?: boolean;
  occupiedBy?: number;
  buildingId?: number;
  resourceId?: number;
  elevation: number;
}

export interface GameWorld {
  grid: GridCell[][];
  width: number;
  height: number;
}

export interface BuildJob {
  buildingId: number;
  assigned: boolean;
  assignedTo?: number;
  materialsGathered: boolean;
  requiresMaterials: Record<string, number>;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIConversation {
  dwarfId: number;
  messages: AIMessage[];
  thinking: boolean;
}

export interface GameSettings {
  renderDistance: number;
  soundVolume: number;
  musicVolume: number;
  showDialogues: boolean;
  gamePaused: boolean;
  timeScale: number;
  debugMode: boolean;
}

export type OverlayType = "none" | "buildings" | "needs" | "tasks" | "happiness";

export interface Point2D {
  x: number;
  y: number;
}

export type Direction = "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest";

export interface TaskAssignment {
  id: number;
  type: TaskType;
  target?: Point2D;
  priority: number;
  assignedTo?: number;
  completed: boolean;
  progress: number;
  requiresItems?: Record<string, number>;
}
