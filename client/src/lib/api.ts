import { apiRequest } from './queryClient';
import { 
  ClientDwarf, 
  ClientBuilding, 
  ClientResource,
  GameState,
  TaskAssignment,
  Point2D,
  AIMessage
} from '../types/game';
import { TaskType, BuildingType, ResourceType } from '@shared/schema';

// Dwarves API
export async function fetchDwarves(): Promise<ClientDwarf[]> {
  const response = await apiRequest('GET', '/api/dwarves');
  return response.json();
}

export async function updateDwarf(dwarf: Partial<ClientDwarf> & { id: number }): Promise<ClientDwarf> {
  const response = await apiRequest('PATCH', `/api/dwarves/${dwarf.id}`, dwarf);
  return response.json();
}

export async function createDwarf(dwarf: Omit<ClientDwarf, 'id'>): Promise<ClientDwarf> {
  const response = await apiRequest('POST', '/api/dwarves', dwarf);
  return response.json();
}

// Buildings API
export async function fetchBuildings(): Promise<ClientBuilding[]> {
  const response = await apiRequest('GET', '/api/buildings');
  return response.json();
}

export async function updateBuilding(building: Partial<ClientBuilding> & { id: number }): Promise<ClientBuilding> {
  const response = await apiRequest('PATCH', `/api/buildings/${building.id}`, building);
  return response.json();
}

export async function createBuilding(building: Omit<ClientBuilding, 'id'>): Promise<ClientBuilding> {
  const response = await apiRequest('POST', '/api/buildings', building);
  return response.json();
}

// Resources API
export async function fetchResources(): Promise<ClientResource[]> {
  const response = await apiRequest('GET', '/api/resources');
  return response.json();
}

export async function updateResource(resource: Partial<ClientResource> & { id: number }): Promise<ClientResource> {
  const response = await apiRequest('PATCH', `/api/resources/${resource.id}`, resource);
  return response.json();
}

// Game State API
export async function fetchGameState(): Promise<GameState> {
  const response = await apiRequest('GET', '/api/game-state');
  return response.json();
}

export async function updateGameState(gameState: Partial<GameState>): Promise<GameState> {
  const response = await apiRequest('PATCH', '/api/game-state', gameState);
  return response.json();
}

// Tasks API
export async function fetchTasks(): Promise<TaskAssignment[]> {
  const response = await apiRequest('GET', '/api/tasks');
  return response.json();
}

export async function createTask(task: Omit<TaskAssignment, 'id'>): Promise<TaskAssignment> {
  const response = await apiRequest('POST', '/api/tasks', task);
  return response.json();
}

export async function updateTask(task: Partial<TaskAssignment> & { id: number }): Promise<TaskAssignment> {
  const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, task);
  return response.json();
}

export async function assignTask(taskId: number, dwarfId: number): Promise<TaskAssignment> {
  const response = await apiRequest('POST', `/api/tasks/${taskId}/assign`, { dwarfId });
  return response.json();
}

// AI Conversations API
export async function sendAIMessage(messages: AIMessage[]): Promise<{ response: string }> {
  const response = await apiRequest('POST', '/api/ai/message', { messages });
  return response.json();
}

// World Generation
export async function generateWorld(width: number, height: number, seed?: number): Promise<{ success: boolean }> {
  const response = await apiRequest('POST', '/api/world/generate', { width, height, seed });
  return response.json();
}

// Path Finding
export async function findPath(start: Point2D, end: Point2D): Promise<Point2D[]> {
  console.log(`API: Finding path from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
  const response = await apiRequest('POST', '/api/pathfinding', { start, end });
  const path = await response.json();
  console.log(`API: Path found with ${path.length} steps`);
  return path;
}
