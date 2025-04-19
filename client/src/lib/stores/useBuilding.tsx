import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ClientBuilding, BuildJob, Point2D, ClientResource, GridCell, GameWorld } from '../../types/game';
import { BuildingType, ResourceType } from '@shared/schema';

// Default building costs
const BUILDING_COSTS: Record<BuildingType, Record<string, number>> = {
  [BuildingType.Wall]: { [ResourceType.Stone]: 2 },
  [BuildingType.Floor]: { [ResourceType.Stone]: 1 },
  [BuildingType.Door]: { [ResourceType.Wood]: 2 },
  [BuildingType.Bed]: { [ResourceType.Wood]: 3 },
  [BuildingType.Table]: { [ResourceType.Wood]: 4 },
  [BuildingType.Chair]: { [ResourceType.Wood]: 2 },
  [BuildingType.Workshop]: { [ResourceType.Wood]: 5, [ResourceType.Stone]: 3 },
  [BuildingType.Storage]: { [ResourceType.Wood]: 4 },
  [BuildingType.Farm]: { [ResourceType.Wood]: 2 },
};

// Determine which buildings block movement
const BLOCKS_MOVEMENT: Record<BuildingType, boolean> = {
  [BuildingType.Wall]: true,
  [BuildingType.Floor]: false,
  [BuildingType.Door]: false, // Doors can be walked through
  [BuildingType.Bed]: false,
  [BuildingType.Table]: true,
  [BuildingType.Chair]: false,
  [BuildingType.Workshop]: true,
  [BuildingType.Storage]: true,
  [BuildingType.Farm]: false,
};

// Building dimensions (width, height)
const BUILDING_DIMENSIONS: Record<BuildingType, { width: number, height: number }> = {
  [BuildingType.Wall]: { width: 1, height: 1 },
  [BuildingType.Floor]: { width: 1, height: 1 },
  [BuildingType.Door]: { width: 1, height: 1 },
  [BuildingType.Bed]: { width: 2, height: 1 },
  [BuildingType.Table]: { width: 2, height: 1 },
  [BuildingType.Chair]: { width: 1, height: 1 },
  [BuildingType.Workshop]: { width: 3, height: 2 },
  [BuildingType.Storage]: { width: 2, height: 2 },
  [BuildingType.Farm]: { width: 3, height: 3 },
};

interface BuildingState {
  buildings: ClientBuilding[];
  resources: ClientResource[];
  buildJobs: BuildJob[];
  selectedBuildingType: BuildingType | null;
  world: GameWorld | null;
  
  // Actions
  setBuildings: (buildings: ClientBuilding[]) => void;
  addBuilding: (building: ClientBuilding) => void;
  updateBuilding: (id: number, data: Partial<ClientBuilding>) => void;
  removeBuilding: (id: number) => void;
  
  setResources: (resources: ClientResource[]) => void;
  addResource: (resource: ClientResource) => void;
  updateResource: (id: number, data: Partial<ClientResource>) => void;
  harvestResource: (id: number, amount: number, dwarfId?: number) => void;
  
  // Build jobs
  addBuildJob: (buildingId: number, materials: Record<string, number>) => void;
  assignBuildJob: (buildingId: number, dwarfId: number) => void;
  completeBuildJob: (buildingId: number) => void;
  
  // Build mode
  selectBuildingType: (type: BuildingType | null) => void;
  canBuildAt: (position: Point2D, type: BuildingType) => boolean;
  buildAt: (position: Point2D) => ClientBuilding | null;
  
  // World map
  setWorld: (world: GameWorld) => void;
  updateGridCell: (x: number, y: number, updates: Partial<GridCell>) => void;
  
  // Utilities
  getBuildingAt: (x: number, y: number) => ClientBuilding | undefined;
  getResourceAt: (x: number, y: number) => ClientResource | undefined;
  getBuildingById: (id: number) => ClientBuilding | undefined;
  getResourceById: (id: number) => ClientResource | undefined;
  getBuildJobByBuildingId: (buildingId: number) => BuildJob | undefined;
  
  // Materials and costs
  getBuildingCost: (type: BuildingType) => Record<string, number>;
  getBuildingDimensions: (type: BuildingType) => { width: number, height: number };
}

export const useBuilding = create<BuildingState>()(
  subscribeWithSelector((set, get) => ({
    buildings: [],
    resources: [],
    buildJobs: [],
    selectedBuildingType: null,
    world: null,
    
    setBuildings: (buildings) => set({ buildings }),
    
    addBuilding: (building) => set((state) => {
      // Add building to the list
      const newBuildings = [...state.buildings, building];
      
      // If world is set, update grid cells
      if (state.world) {
        const { width, height } = BUILDING_DIMENSIONS[building.type as BuildingType];
        
        // Mark grid cells as occupied by this building
        for (let y = building.y; y < building.y + height; y++) {
          for (let x = building.x; x < building.x + width; x++) {
            if (x >= 0 && x < state.world.width && y >= 0 && y < state.world.height) {
              state.world.grid[y][x] = {
                ...state.world.grid[y][x],
                type: "building",
                walkable: !BLOCKS_MOVEMENT[building.type as BuildingType],
                buildingId: building.id
              };
            }
          }
        }
      }
      
      return { buildings: newBuildings };
    }),
    
    updateBuilding: (id, data) => set((state) => ({
      buildings: state.buildings.map(building => 
        building.id === id ? { ...building, ...data } : building
      )
    })),
    
    removeBuilding: (id) => set((state) => {
      // Find the building to remove
      const buildingToRemove = state.buildings.find(b => b.id === id);
      if (!buildingToRemove) return state;
      
      // Remove from buildings list
      const newBuildings = state.buildings.filter(b => b.id !== id);
      
      // Update grid if world exists
      if (state.world && buildingToRemove) {
        const { width, height } = BUILDING_DIMENSIONS[buildingToRemove.type as BuildingType];
        
        // Clear grid cells
        for (let y = buildingToRemove.y; y < buildingToRemove.y + height; y++) {
          for (let x = buildingToRemove.x; x < buildingToRemove.x + width; x++) {
            if (x >= 0 && x < state.world.width && y >= 0 && y < state.world.height) {
              state.world.grid[y][x] = {
                ...state.world.grid[y][x],
                type: "terrain",
                walkable: true,
                buildingId: undefined
              };
            }
          }
        }
      }
      
      // Remove any associated build jobs
      const newBuildJobs = state.buildJobs.filter(job => job.buildingId !== id);
      
      return { 
        buildings: newBuildings,
        buildJobs: newBuildJobs
      };
    }),
    
    setResources: (resources) => set({ resources }),
    
    addResource: (resource) => set((state) => {
      // Add resource to the list
      const newResources = [...state.resources, resource];
      
      // If world is set, update grid cell
      if (state.world) {
        if (resource.x >= 0 && resource.x < state.world.width && 
            resource.y >= 0 && resource.y < state.world.height) {
          state.world.grid[resource.y][resource.x] = {
            ...state.world.grid[resource.y][resource.x],
            type: "resource",
            resourceId: resource.id
          };
        }
      }
      
      return { resources: newResources };
    }),
    
    updateResource: (id, data) => set((state) => ({
      resources: state.resources.map(resource => 
        resource.id === id ? { ...resource, ...data } : resource
      )
    })),
    
    harvestResource: (id, amount, dwarfId) => set((state) => {
      const resource = state.resources.find(r => r.id === id);
      if (!resource) return state;
      
      const newQuantity = Math.max(0, resource.quantity - amount);
      const updatedResource = { 
        ...resource, 
        quantity: newQuantity,
        isBeingHarvested: !!dwarfId,
        harvestedBy: dwarfId
      };
      
      // If quantity is 0 and doesn't regenerate, mark grid cell as empty
      if (newQuantity === 0 && !resource.regenerate && state.world) {
        if (resource.x >= 0 && resource.x < state.world.width && 
            resource.y >= 0 && resource.y < state.world.height) {
          state.world.grid[resource.y][resource.x] = {
            ...state.world.grid[resource.y][resource.x],
            type: "terrain",
            resourceId: undefined
          };
        }
      }
      
      return { 
        resources: state.resources.map(r => r.id === id ? updatedResource : r)
      };
    }),
    
    addBuildJob: (buildingId, materials) => set((state) => {
      // Check if job already exists
      if (state.buildJobs.some(job => job.buildingId === buildingId)) {
        return state;
      }
      
      const newJob: BuildJob = {
        buildingId,
        assigned: false,
        materialsGathered: false,
        requiresMaterials: materials
      };
      
      return { buildJobs: [...state.buildJobs, newJob] };
    }),
    
    assignBuildJob: (buildingId, dwarfId) => set((state) => ({
      buildJobs: state.buildJobs.map(job => 
        job.buildingId === buildingId ? { ...job, assigned: true, assignedTo: dwarfId } : job
      )
    })),
    
    completeBuildJob: (buildingId) => set((state) => {
      // Remove the build job
      const newBuildJobs = state.buildJobs.filter(job => job.buildingId !== buildingId);
      
      // Mark the building as complete
      const updatedBuildings = state.buildings.map(building => 
        building.id === buildingId ? { ...building, complete: true, progress: 100 } : building
      );
      
      return { 
        buildJobs: newBuildJobs,
        buildings: updatedBuildings
      };
    }),
    
    selectBuildingType: (type) => set({ selectedBuildingType: type }),
    
    canBuildAt: (position, type) => {
      const { world } = get();
      if (!world) return false;
      
      const { width, height } = BUILDING_DIMENSIONS[type];
      
      // Check if all required cells are within world bounds and walkable
      for (let y = position.y; y < position.y + height; y++) {
        for (let x = position.x; x < position.x + width; x++) {
          // Check bounds
          if (x < 0 || x >= world.width || y < 0 || y >= world.height) {
            return false;
          }
          
          // Check if cell is free (no buildings or resources)
          const cell = world.grid[y][x];
          if (cell.type !== "terrain" || !cell.walkable || cell.occupied) {
            return false;
          }
        }
      }
      
      return true;
    },
    
    buildAt: (position) => {
      const { selectedBuildingType, world } = get();
      if (!selectedBuildingType || !world) return null;
      
      // Check if we can build here
      if (!get().canBuildAt(position, selectedBuildingType)) {
        return null;
      }
      
      // Create the building (in real app would call server API)
      const newBuilding: ClientBuilding = {
        id: Date.now(), // This would normally come from the server
        type: selectedBuildingType,
        x: position.x,
        y: position.y,
        width: BUILDING_DIMENSIONS[selectedBuildingType].width,
        height: BUILDING_DIMENSIONS[selectedBuildingType].height,
        complete: false,
        progress: 0,
        materials: {},
        occupants: [],
        blocksMovement: BLOCKS_MOVEMENT[selectedBuildingType]
      };
      
      // Add the building
      get().addBuilding(newBuilding);
      
      // Create a build job for it
      get().addBuildJob(newBuilding.id, BUILDING_COSTS[selectedBuildingType]);
      
      return newBuilding;
    },
    
    setWorld: (world) => set({ world }),
    
    updateGridCell: (x, y, updates) => set((state) => {
      if (!state.world) return state;
      
      const newGrid = [...state.world.grid];
      if (x >= 0 && x < state.world.width && y >= 0 && y < state.world.height) {
        newGrid[y] = [...newGrid[y]];
        newGrid[y][x] = { ...newGrid[y][x], ...updates };
      }
      
      return { 
        world: {
          ...state.world,
          grid: newGrid
        }
      };
    }),
    
    getBuildingAt: (x, y) => {
      return get().buildings.find(building => {
        const { width, height } = BUILDING_DIMENSIONS[building.type as BuildingType];
        
        return x >= building.x && x < building.x + width && 
               y >= building.y && y < building.y + height;
      });
    },
    
    getResourceAt: (x, y) => {
      return get().resources.find(resource => resource.x === x && resource.y === y);
    },
    
    getBuildingById: (id) => get().buildings.find(building => building.id === id),
    
    getResourceById: (id) => get().resources.find(resource => resource.id === id),
    
    getBuildJobByBuildingId: (buildingId) => {
      return get().buildJobs.find(job => job.buildingId === buildingId);
    },
    
    getBuildingCost: (type) => BUILDING_COSTS[type],
    
    getBuildingDimensions: (type) => BUILDING_DIMENSIONS[type]
  }))
);
