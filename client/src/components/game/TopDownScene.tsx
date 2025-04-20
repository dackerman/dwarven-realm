import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../../lib/stores/useGame';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useBuilding } from '../../lib/stores/useBuilding';
import { ClientDwarf, ClientBuilding, ClientResource, Point2D } from '../../types/game';

// Components
import TopDownTerrain from './TopDownTerrain';
import TopDownDwarf from './TopDownDwarf';
import TopDownBuilding from './TopDownBuilding';
import TopDownResource from './TopDownResource';
import AIControls from './AIControls';
import DwarfMovement from './DwarfMovement';

// Constants
const TILE_SIZE = 40; // Size of each tile in pixels
const CAMERA_SPEED = 10; // Speed of camera movement
const ZOOM_SPEED = 0.1; // Speed of zoom
const MIN_ZOOM = 0.5; // Minimum zoom level
const MAX_ZOOM = 2.0; // Maximum zoom level

const TopDownScene: React.FC = () => {
  const { buildings } = useBuilding();
  const { dwarves } = useDwarves();
  const { resources } = useBuilding();
  const { phase, speed } = useGame();
  
  // Camera state
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [zoom, setZoom] = useState(1);
  
  // Container ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse/touch state
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });
  
  // Selected tile/entity
  const [selectedTile, setSelectedTile] = useState<Point2D | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<{ 
    type: 'dwarf' | 'building' | 'resource', 
    id: number 
  } | null>(null);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setCameraY(prev => prev - CAMERA_SPEED / zoom);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setCameraY(prev => prev + CAMERA_SPEED / zoom);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setCameraX(prev => prev - CAMERA_SPEED / zoom);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setCameraX(prev => prev + CAMERA_SPEED / zoom);
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_SPEED));
          break;
        case '-':
        case '_':
          setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_SPEED));
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);
  
  // Handle mouse/touch interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.lastX = cameraX;
      dragRef.current.lastY = cameraY;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      
      setCameraX(dragRef.current.lastX - dx);
      setCameraY(dragRef.current.lastY - dy);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    };
    
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, zoom, cameraX, cameraY]);
  
  // Handle mobile touches
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let lastTouchDistance = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        setIsDragging(true);
        dragRef.current.startX = e.touches[0].clientX;
        dragRef.current.startY = e.touches[0].clientY;
        dragRef.current.lastX = cameraX;
        dragRef.current.lastY = cameraY;
      } else if (e.touches.length === 2) {
        // Double touch - zoom
        lastTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && isDragging) {
        // Single touch - pan
        const dx = (e.touches[0].clientX - dragRef.current.startX) / zoom;
        const dy = (e.touches[0].clientY - dragRef.current.startY) / zoom;
        
        setCameraX(dragRef.current.lastX - dx);
        setCameraY(dragRef.current.lastY - dy);
      } else if (e.touches.length === 2) {
        // Double touch - zoom
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        
        const delta = (currentDistance - lastTouchDistance) * 0.01;
        lastTouchDistance = currentDistance;
        
        setZoom(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
      }
    };
    
    const handleTouchEnd = () => {
      if (isDragging) setIsDragging(false);
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, zoom, cameraX, cameraY]);
  
  // Handle clicks on the grid
  const handleGridClick = (x: number, y: number) => {
    console.log(`Clicked on tile (${x}, ${y})`);
    setSelectedTile({ x, y });
    
    // Check if a dwarf is at this position
    const dwarf = dwarves.find(d => d.x === x && d.y === y);
    if (dwarf) {
      setSelectedEntity({ type: 'dwarf', id: dwarf.id });
      return;
    }
    
    // Check if a building is at this position
    const building = buildings.find(b => b.x === x && b.y === y);
    if (building) {
      setSelectedEntity({ type: 'building', id: building.id });
      return;
    }
    
    // Check if a resource is at this position
    const resource = resources.find(r => r.x === x && r.y === y);
    if (resource) {
      setSelectedEntity({ type: 'resource', id: resource.id });
      return;
    }
    
    // No entity found
    setSelectedEntity(null);
  };
  
  // Render the scene
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Game container with transform for camera and zoom */}
      <div 
        className="absolute"
        style={{
          transform: `translate(${-cameraX}px, ${-cameraY}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out',
          willChange: 'transform'
        }}
      >
        {/* Terrain grid */}
        <TopDownTerrain onTileClick={handleGridClick} />
        
        {/* Resources */}
        {resources.map(resource => (
          <TopDownResource 
            key={`resource-${resource.id}`}
            resource={resource}
            selected={selectedEntity?.type === 'resource' && selectedEntity.id === resource.id}
            onClick={() => handleGridClick(resource.x, resource.y)}
          />
        ))}
        
        {/* Buildings */}
        {buildings.map(building => (
          <TopDownBuilding
            key={`building-${building.id}`}
            building={building}
            selected={selectedEntity?.type === 'building' && selectedEntity.id === building.id}
            onClick={() => handleGridClick(building.x, building.y)}
          />
        ))}
        
        {/* Dwarves */}
        {dwarves.map(dwarf => (
          <TopDownDwarf
            key={`dwarf-${dwarf.id}`}
            dwarf={dwarf}
            selected={selectedEntity?.type === 'dwarf' && selectedEntity.id === dwarf.id}
            onClick={() => handleGridClick(dwarf.x, dwarf.y)}
          />
        ))}
      </div>
      
      {/* AI systems - these don't render anything but control game logic */}
      <AIControls />
      <DwarfMovement />
    </div>
  );
};

export default TopDownScene;