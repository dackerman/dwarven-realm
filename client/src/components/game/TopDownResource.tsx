import React from 'react';
import { ClientResource } from '../../types/game';

// Constants
const TILE_SIZE = 40;

interface TopDownResourceProps {
  resource: ClientResource;
  selected: boolean;
  onClick: () => void;
}

const TopDownResource: React.FC<TopDownResourceProps> = ({ resource, selected, onClick }) => {
  // Get resource color and style based on resource type
  const getResourceStyle = () => {
    const baseStyle = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      left: resource.x * TILE_SIZE,
      top: resource.y * TILE_SIZE,
      zIndex: 2,
    };
    
    // Resource styling based on type
    switch (resource.type) {
      case 'stone':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(180, 180, 180, 0.8)',
          border: '1px solid rgba(150, 150, 150, 0.9)',
        };
      case 'wood':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(139, 69, 19, 0.8)',
          border: '1px solid rgba(100, 50, 10, 0.9)',
        };
      case 'food':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(220, 180, 120, 0.8)',
          border: '1px solid rgba(180, 140, 100, 0.9)',
        };
      case 'metal':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 120, 140, 0.8)',
          border: '1px solid rgba(80, 100, 120, 0.9)',
        };
      case 'water':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 150, 220, 0.7)',
          border: '1px solid rgba(80, 130, 200, 0.8)',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(150, 150, 150, 0.6)',
          border: '1px solid rgba(120, 120, 120, 0.7)',
        };
    }
  };
  
  // Get resource icon based on resource type
  const getResourceIcon = () => {
    switch (resource.type) {
      case 'stone':
        return '🪨';
      case 'wood':
        return '🌲';
      case 'food':
        return '🍖';
      case 'metal':
        return '⛏️';
      case 'water':
        return '💧';
      default:
        return '📦';
    }
  };
  
  // Show resource quantity as a label
  const renderQuantity = () => {
    return (
      <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tl">
        {resource.quantity}
      </div>
    );
  };
  
  // Show harvest progress if being harvested
  const renderHarvestProgress = () => {
    if (!resource.isBeingHarvested) return null;
    
    return (
      <div className="absolute inset-x-0 bottom-0 h-1">
        <div 
          className="h-full bg-green-500" 
          style={{ 
            width: `${resource.harvestTime}%`,
            transition: 'width 0.5s ease-out'
          }} 
        />
      </div>
    );
  };
  
  return (
    <div 
      className={`absolute transition-all duration-200 cursor-pointer hover:brightness-110 ${selected ? 'ring-2 ring-white' : ''}`}
      style={getResourceStyle()}
      onClick={onClick}
    >
      {/* Resource visualization */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Resource icon */}
        <span className="text-2xl">{getResourceIcon()}</span>
        
        {/* Resource quantity */}
        {renderQuantity()}
        
        {/* Harvest progress */}
        {renderHarvestProgress()}
        
        {/* Being harvested indicator */}
        {resource.isBeingHarvested && (
          <div className="absolute top-0 left-0 bg-yellow-500 text-xs p-1 rounded-br">
            ⚒️
          </div>
        )}
      </div>
    </div>
  );
};

export default TopDownResource;