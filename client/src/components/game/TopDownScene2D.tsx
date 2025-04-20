import React, { useRef, useState, useEffect } from 'react';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useBuilding } from '../../lib/stores/useBuilding';
import { ClientDwarf, ClientBuilding, ClientResource } from '../../types/game';
import AIControls from './AIControls';
import DwarfMovement from './DwarfMovement';
import { Direction } from '../../types/game';

// Constants
const TILE_SIZE = 40;
const GRID_SIZE = 20;

const TopDownScene2D: React.FC = () => {
  const { dwarves } = useDwarves();
  const { buildings, resources } = useBuilding();
  
  // Camera position and zoom
  const [cameraX, setCameraX] = useState(200);
  const [cameraY, setCameraY] = useState(200);
  const [zoom, setZoom] = useState(1);
  
  // For panning with mouse
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cameraX: 0, cameraY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const moveAmount = 20;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setCameraY(prev => prev - moveAmount);
          break;
        case 'ArrowDown':
        case 's':
          setCameraY(prev => prev + moveAmount);
          break;
        case 'ArrowLeft':
        case 'a':
          setCameraX(prev => prev - moveAmount);
          break;
        case 'ArrowRight':
        case 'd':
          setCameraX(prev => prev + moveAmount);
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(2, prev + 0.1));
          break;
        case '-':
        case '_':
          setZoom(prev => Math.max(0.5, prev - 0.1));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle mouse interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        cameraX,
        cameraY
      };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setCameraX(dragStart.current.cameraX - (e.clientX - dragStart.current.x) / zoom);
      setCameraY(dragStart.current.cameraY - (e.clientY - dragStart.current.y) / zoom);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
    };
    
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('wheel', handleWheel);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, cameraX, cameraY]);
  
  // Render the grid
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        cells.push(
          <div 
            key={`cell-${x}-${y}`}
            className="absolute border border-gray-300"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              backgroundColor: (x + y) % 2 === 0 ? '#a9cc95' : '#8bbb75'
            }}
          />
        );
      }
    }
    
    return cells;
  };
  
  // Render buildings
  const renderBuildings = () => {
    return buildings.map(building => (
      <div
        key={`building-${building.id}`}
        className="absolute flex items-center justify-center text-center"
        style={{
          width: building.width * TILE_SIZE,
          height: building.height * TILE_SIZE,
          left: building.x * TILE_SIZE,
          top: building.y * TILE_SIZE,
          backgroundColor: getBuildingColor(building),
          border: '1px solid rgba(0,0,0,0.2)',
          zIndex: 10
        }}
      >
        <div className="text-xs">
          {building.type}
          {!building.complete && <div className="mt-1">🚧 {building.progress}%</div>}
        </div>
      </div>
    ));
  };
  
  // Get color for building type
  const getBuildingColor = (building: ClientBuilding) => {
    switch (building.type) {
      case 'floor': return 'rgba(200, 180, 150, 0.5)';
      case 'wall': return 'rgba(150, 120, 100, 0.9)';
      case 'door': return 'rgba(120, 90, 60, 0.8)';
      case 'bed': return 'rgba(100, 150, 200, 0.7)';
      case 'table': return 'rgba(160, 140, 120, 0.8)';
      case 'chair': return 'rgba(140, 120, 100, 0.7)';
      case 'workshop': return 'rgba(180, 160, 100, 0.8)';
      case 'storage': return 'rgba(120, 140, 110, 0.8)';
      case 'farm': return 'rgba(140, 180, 120, 0.7)';
      default: return 'rgba(150, 150, 150, 0.6)';
    }
  };
  
  // Render resources
  const renderResources = () => {
    return resources.map(resource => (
      <div
        key={`resource-${resource.id}`}
        className="absolute flex items-center justify-center"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          left: resource.x * TILE_SIZE,
          top: resource.y * TILE_SIZE,
          backgroundColor: getResourceColor(resource),
          border: '1px solid rgba(0,0,0,0.2)',
          zIndex: 5
        }}
      >
        <div className="text-xs">
          {getResourceEmoji(resource)}
          <div>{resource.quantity}</div>
        </div>
      </div>
    ));
  };
  
  // Get color for resource type
  const getResourceColor = (resource: ClientResource) => {
    switch (resource.type) {
      case 'stone': return 'rgba(180, 180, 180, 0.8)';
      case 'wood': return 'rgba(139, 69, 19, 0.8)';
      case 'food': return 'rgba(220, 180, 120, 0.8)';
      case 'metal': return 'rgba(100, 120, 140, 0.8)';
      case 'water': return 'rgba(100, 150, 220, 0.7)';
      default: return 'rgba(150, 150, 150, 0.6)';
    }
  };
  
  // Get emoji for resource type
  const getResourceEmoji = (resource: ClientResource) => {
    switch (resource.type) {
      case 'stone': return '🪨';
      case 'wood': return '🌲';
      case 'food': return '🍖';
      case 'metal': return '⛏️';
      case 'water': return '💧';
      default: return '📦';
    }
  };
  
  // Render dwarves
  const renderDwarves = () => {
    return dwarves.map(dwarf => (
      <div
        key={`dwarf-${dwarf.id}`}
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          left: dwarf.x * TILE_SIZE,
          top: dwarf.y * TILE_SIZE,
          zIndex: 20,
          transition: 'left 0.2s, top 0.2s'
        }}
      >
        {/* Dwarf avatar circle */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center relative"
          style={{
            backgroundColor: getDwarfColor(dwarf),
            border: '2px solid white'
          }}
        >
          {getDwarfEmoji(dwarf)}
          
          {/* Direction indicator */}
          {dwarf.animation === 'walking' && (
            <div 
              className="absolute w-2 h-2 bg-white rounded-full" 
              style={{
                ...getDirectionOffset(dwarf.direction)
              }}
            />
          )}
        </div>
        
        {/* Dwarf name */}
        <div className="text-xs font-bold mt-1 text-black bg-white px-1 rounded-sm">
          {dwarf.name}
        </div>
        
        {/* Dialog bubble */}
        {dwarf.dialogueVisible && dwarf.currentDialogue && (
          <div className="absolute bottom-full mb-2 p-2 bg-white rounded shadow-md text-xs max-w-[150px]">
            {dwarf.currentDialogue}
          </div>
        )}
        
        {/* Status indicators */}
        <div className="absolute top-0 left-0 transform -translate-y-full">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-gray-300 rounded overflow-hidden">
              <div 
                className="bg-red-500 w-full" 
                style={{ height: `${dwarf.health}%` }} 
              />
            </div>
            <div className="w-1 h-4 bg-gray-300 rounded overflow-hidden">
              <div 
                className="bg-yellow-500 w-full" 
                style={{ height: `${dwarf.hunger}%` }} 
              />
            </div>
            <div className="w-1 h-4 bg-gray-300 rounded overflow-hidden">
              <div 
                className="bg-blue-500 w-full" 
                style={{ height: `${dwarf.energy}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    ));
  };
  
  // Get color for dwarf animation state
  const getDwarfColor = (dwarf: ClientDwarf) => {
    switch (dwarf.animation) {
      case 'walking': return '#4CAF50'; // Green
      case 'working': return '#FFC107'; // Amber
      case 'sleeping': return '#2196F3'; // Blue
      case 'eating': return '#FF5722'; // Deep orange
      case 'talking': return '#9C27B0'; // Purple
      case 'idle':
      default: return '#795548'; // Brown
    }
  };
  
  // Get emoji for dwarf activity
  const getDwarfEmoji = (dwarf: ClientDwarf) => {
    switch (dwarf.animation) {
      case 'walking': return '👣';
      case 'working': return '⚒️';
      case 'sleeping': return '💤';
      case 'eating': return '🍖';
      case 'talking': return '💬';
      case 'idle':
      default: return '😐';
    }
  };
  
  // Get position offset for direction indicator
  const getDirectionOffset = (direction: Direction) => {
    switch (direction) {
      case 'north': return { top: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'south': return { bottom: 0, left: '50%', transform: 'translateX(-50%)' };
      case 'east': return { right: 0, top: '50%', transform: 'translateY(-50%)' };
      case 'west': return { left: 0, top: '50%', transform: 'translateY(-50%)' };
      case 'northeast': return { top: 0, right: 0 };
      case 'northwest': return { top: 0, left: 0 };
      case 'southeast': return { bottom: 0, right: 0 };
      case 'southwest': return { bottom: 0, left: 0 };
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-green-900"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className="absolute"
        style={{
          transform: `translate(calc(50% - ${cameraX}px), calc(50% - ${cameraY}px)) scale(${zoom})`,
          transformOrigin: 'center',
          willChange: 'transform'
        }}
      >
        {/* Grid */}
        <div className="relative">
          {renderGrid()}
          {renderBuildings()}
          {renderResources()}
          {renderDwarves()}
        </div>
      </div>
      
      {/* Game logic components */}
      <AIControls />
      <DwarfMovement />
      
      {/* Controls help */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
        <div>WASD / Arrows: Pan camera</div>
        <div>Mouse drag: Pan camera</div>
        <div>+/- or Mouse wheel: Zoom</div>
      </div>
    </div>
  );
};

export default TopDownScene2D;