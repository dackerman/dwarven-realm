import React, { useEffect, useState, useRef } from 'react';
import { ClientDwarf } from '../../types/game';

// Constants
const TILE_SIZE = 40;
const DWARF_SIZE = 20; // Smaller than tile size for visibility

interface TopDownDwarfProps {
  dwarf: ClientDwarf;
  selected: boolean;
  onClick: () => void;
}

const TopDownDwarf: React.FC<TopDownDwarfProps> = ({ dwarf, selected, onClick }) => {
  // State for smooth animations
  const [position, setPosition] = useState({ x: dwarf.x * TILE_SIZE, y: dwarf.y * TILE_SIZE });
  
  // For animation
  const animationRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: dwarf.x, y: dwarf.y });
  
  // Direction indicator offsets
  const directionOffset = {
    north: { x: 0, y: -5 },
    south: { x: 0, y: 5 },
    east: { x: 5, y: 0 },
    west: { x: -5, y: 0 },
    northeast: { x: 3, y: -3 },
    northwest: { x: -3, y: -3 },
    southeast: { x: 3, y: 3 },
    southwest: { x: -3, y: 3 }
  };
  
  // For smooth movement transitions
  useEffect(() => {
    if (dwarf.x !== lastPositionRef.current.x || dwarf.y !== lastPositionRef.current.y) {
      // Calculate target position
      const targetX = dwarf.x * TILE_SIZE;
      const targetY = dwarf.y * TILE_SIZE;
      
      // Update position gradually with animation
      let startTime: number;
      const duration = 200; // Animation duration in ms
      
      // Cancel any existing animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Animation function
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Calculate new position with easing
        const newX = lastPositionRef.current.x * TILE_SIZE + (targetX - lastPositionRef.current.x * TILE_SIZE) * progress;
        const newY = lastPositionRef.current.y * TILE_SIZE + (targetY - lastPositionRef.current.y * TILE_SIZE) * progress;
        
        setPosition({ x: newX, y: newY });
        
        // Continue animation if not complete
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete, update reference
          lastPositionRef.current = { x: dwarf.x, y: dwarf.y };
        }
      };
      
      // Start animation
      animationRef.current = requestAnimationFrame(animate);
    }
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dwarf.x, dwarf.y]);
  
  // Render dialogue if visible
  const renderDialogue = () => {
    if (!dwarf.dialogueVisible || !dwarf.currentDialogue) return null;
    
    return (
      <div className="absolute bg-white border border-gray-300 rounded p-2 shadow-md bottom-full mb-2 whitespace-nowrap text-sm max-w-[150px]"
        style={{ 
          left: '50%', 
          transform: 'translateX(-50%)'
        }}
      >
        {dwarf.currentDialogue}
      </div>
    );
  };
  
  // Determine dwarf color based on state/task
  const getDwarfColor = () => {
    switch (dwarf.animation) {
      case 'walking':
        return '#4CAF50'; // Green for walking
      case 'working':
        return '#FFC107'; // Amber for working
      case 'sleeping':
        return '#2196F3'; // Blue for sleeping
      case 'eating':
        return '#FF5722'; // Deep orange for eating
      case 'talking':
        return '#9C27B0'; // Purple for talking
      case 'idle':
      default:
        return '#795548'; // Brown for idle
    }
  };
  
  // Get activity indicator based on animation state
  const getActivityIndicator = () => {
    switch (dwarf.animation) {
      case 'walking':
        return '👣';
      case 'working':
        return '⚒️';
      case 'sleeping':
        return '💤';
      case 'eating':
        return '🍖';
      case 'talking':
        return '💬';
      case 'idle':
      default:
        return '';
    }
  };
  
  // Direction indicator
  const renderDirectionIndicator = () => {
    if (dwarf.animation !== 'walking') return null;
    
    const offset = directionOffset[dwarf.direction] || { x: 0, y: 0 };
    
    return (
      <div 
        className="absolute w-2 h-2 bg-white rounded-full"
        style={{
          top: DWARF_SIZE / 2 + offset.y,
          left: DWARF_SIZE / 2 + offset.x,
        }}
      />
    );
  };
  
  // Status bars (health, hunger, energy)
  const renderStatusBars = () => {
    return (
      <div className="absolute -top-1 left-0 transform -translate-y-full w-full space-y-1">
        {/* Health */}
        <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-red-500" 
            style={{ width: `${dwarf.health}%` }} 
          />
        </div>
        
        {/* Hunger */}
        <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500" 
            style={{ width: `${dwarf.hunger}%` }} 
          />
        </div>
        
        {/* Energy */}
        <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${dwarf.energy}%` }} 
          />
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className={`absolute rounded-full flex items-center justify-center transition-transform duration-200 transform hover:scale-110 cursor-pointer ${selected ? 'ring-2 ring-white ring-offset-2' : ''}`}
      style={{
        width: DWARF_SIZE,
        height: DWARF_SIZE,
        backgroundColor: getDwarfColor(),
        left: position.x + (TILE_SIZE - DWARF_SIZE) / 2,
        top: position.y + (TILE_SIZE - DWARF_SIZE) / 2,
        // Add subtle animation based on state
        animation: dwarf.animation === 'idle' 
          ? 'none' 
          : `${dwarf.animation} 0.5s infinite alternate`
      }}
      onClick={onClick}
    >
      {/* Activity indicator */}
      <span className="text-xs">{getActivityIndicator()}</span>
      
      {/* Direction indicator */}
      {renderDirectionIndicator()}
      
      {/* Dialogue bubble */}
      {renderDialogue()}
      
      {/* Status bars */}
      {renderStatusBars()}
      
      {/* Name label */}
      <div className="absolute -bottom-5 left-0 w-full text-center text-xs whitespace-nowrap">
        {dwarf.name}
      </div>
    </div>
  );
};

export default TopDownDwarf;