import { useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import { useDwarves } from "./lib/stores/useDwarves";
import { useBuilding } from "./lib/stores/useBuilding";
import IsometricScene from "./components/game/IsometricScene";
import GameUI from "./components/ui/GameUI";
import "@fontsource/inter";

// Define control keys for the game
const controls = [
  { name: "up", keys: ["KeyW", "ArrowUp"] },
  { name: "down", keys: ["KeyS", "ArrowDown"] },
  { name: "left", keys: ["KeyA", "ArrowLeft"] },
  { name: "right", keys: ["KeyD", "ArrowRight"] },
  { name: "zoomIn", keys: ["KeyE", "Equal"] },
  { name: "zoomOut", keys: ["KeyQ", "Minus"] },
  { name: "build", keys: ["KeyB"] },
  { name: "pause", keys: ["Space"] },
  { name: "select", keys: ["KeyF"] },
  { name: "cancel", keys: ["Escape"] },
];

// Main App component
function App() {
  const { phase, start } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound, 
    setMiningSound,
    setBuildingSound,
    setDwarfTalkSound
  } = useAudio();

  // Preload assets and game state
  useEffect(() => {
    async function initializeGame() {
      try {
        // Initialize audio
        const backgroundMusic = new Audio("/sounds/background.mp3");
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.2;
        setBackgroundMusic(backgroundMusic);
        
        const hitSound = new Audio("/sounds/hit.mp3");
        setHitSound(hitSound);
        
        const successSound = new Audio("/sounds/success.mp3");
        setSuccessSound(successSound);
        
        // Additional sound effects for our game
        const miningSound = new Audio("/sounds/hit.mp3");
        miningSound.playbackRate = 1.2;
        setMiningSound(miningSound);
        
        const buildingSound = new Audio("/sounds/hit.mp3");
        buildingSound.playbackRate = 0.8;
        setBuildingSound(buildingSound);
        
        const dwarfTalkSound = new Audio("/sounds/success.mp3");
        dwarfTalkSound.playbackRate = 1.5;
        dwarfTalkSound.volume = 0.3;
        setDwarfTalkSound(dwarfTalkSound);

        // Initialize game world
        const worldSize = 20;
        
        // Create a simple world grid
        const grid = Array(worldSize).fill(0).map((_, y) => 
          Array(worldSize).fill(0).map((_, x) => ({
            x, y,
            type: "terrain" as const,
            walkable: true,
            elevation: 0
          }))
        );
        
        useBuilding.getState().setWorld({
          grid,
          width: worldSize,
          height: worldSize
        });
        
        // Fetch initial game data from API (dwarves, buildings, resources)
        try {
          // Fetch dwarves
          const dwarfResponse = await fetch('/api/dwarves');
          if (dwarfResponse.ok) {
            const dwarves = await dwarfResponse.json();
            useDwarves.getState().setDwarves(dwarves.map((dwarf: any) => ({
              ...dwarf,
              dialogueVisible: false,
              animation: "idle",
              direction: "south",
              path: undefined
            })));
          }
          
          // Fetch buildings
          const buildingResponse = await fetch('/api/buildings');
          if (buildingResponse.ok) {
            const buildings = await buildingResponse.json();
            useBuilding.getState().setBuildings(buildings.map((building: any) => ({
              ...building,
              blocksMovement: building.type === 'wall'
            })));
          }
          
          // Fetch resources
          const resourceResponse = await fetch('/api/resources');
          if (resourceResponse.ok) {
            const resources = await resourceResponse.json();
            useBuilding.getState().setResources(resources.map((resource: any) => ({
              ...resource,
              harvestTime: 0,
              isBeingHarvested: false
            })));
          }
        } catch (error) {
          console.error("Error fetching initial game data:", error);
          // Create fallback data if API calls fail
          createFallbackGameData();
        }
        
        setIsLoading(false);
        
        // Start the game
        start();
      } catch (error) {
        console.error("Error initializing game:", error);
        setIsLoading(false);
        // Create fallback data if initialization fails
        createFallbackGameData();
        start();
      }
    }
    
    initializeGame();
  }, []);
  
  // Create fallback game data if API calls fail
  const createFallbackGameData = () => {
    console.log("Creating fallback game data");
    
    // Create some dwarves
    const dwarfNames = ["Urist", "Gimli", "Durin"];
    const dwarves = dwarfNames.map((name, index) => ({
      id: index + 1,
      name,
      health: 100,
      hunger: Math.floor(Math.random() * 30),
      energy: 80 + Math.floor(Math.random() * 20),
      happiness: 70 + Math.floor(Math.random() * 30),
      x: 5 + index * 2,
      y: 5 + index,
      currentTask: null,
      inventory: {},
      conversation: [],
      memory: [],
      state: "idle",
      dialogueVisible: false,
      animation: "idle" as const,
      direction: "south" as const,
      lastUpdated: new Date()
    }));
    
    useDwarves.getState().setDwarves(dwarves);
    
    // Create some resources
    const resources = [
      // Stone resources
      { id: 1, type: "stone", x: 3, y: 3, quantity: 80, regenerate: false, harvestTime: 0, isBeingHarvested: false },
      { id: 2, type: "stone", x: 7, y: 4, quantity: 60, regenerate: false, harvestTime: 0, isBeingHarvested: false },
      { id: 3, type: "stone", x: 12, y: 6, quantity: 70, regenerate: false, harvestTime: 0, isBeingHarvested: false },
      
      // Wood resources
      { id: 4, type: "wood", x: 8, y: 10, quantity: 50, regenerate: true, harvestTime: 0, isBeingHarvested: false },
      { id: 5, type: "wood", x: 15, y: 8, quantity: 40, regenerate: true, harvestTime: 0, isBeingHarvested: false },
      
      // Food resources
      { id: 6, type: "food", x: 12, y: 12, quantity: 30, regenerate: true, harvestTime: 0, isBeingHarvested: false }
    ];
    
    useBuilding.getState().setResources(resources);
    
    // Create some buildings
    const buildings = [
      // Start with some floor tiles
      { id: 1, type: "floor", x: 5, y: 5, width: 5, height: 5, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: false, function: null },
      
      // Add walls
      { id: 2, type: "wall", x: 5, y: 5, width: 1, height: 5, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: true, function: null },
      { id: 3, type: "wall", x: 9, y: 5, width: 1, height: 5, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: true, function: null },
      { id: 4, type: "wall", x: 6, y: 5, width: 3, height: 1, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: true, function: null },
      { id: 5, type: "wall", x: 6, y: 9, width: 3, height: 1, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: true, function: null },
      
      // Add a bed
      { id: 6, type: "bed", x: 6, y: 7, width: 2, height: 1, complete: true, progress: 100, materials: {}, occupants: [], blocksMovement: false, function: "sleeping" },
    ];
    
    useBuilding.getState().setBuildings(buildings);
  };

  // Main render
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Dwarf Fortress...</h1>
          <div className="w-32 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" 
                 style={{width: '60%'}}></div>
          </div>
          <p className="mt-4 text-gray-400">Preparing dwarves and resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="relative w-full h-full">
        {/* Game Canvas */}
        <div className="absolute inset-0">
          <Canvas
            shadows
            gl={{ antialias: true, alpha: false }}
            camera={{ position: [10, 10, 10], fov: 45 }}
            style={{ background: '#87CEEB' }}
          >
            <KeyboardControls map={controls}>
              <Suspense fallback={null}>
                <IsometricScene />
              </Suspense>
            </KeyboardControls>
          </Canvas>
        </div>
        
        {/* UI Overlay */}
        <GameUI />
      </div>
    </div>
  );
}

export default App;
