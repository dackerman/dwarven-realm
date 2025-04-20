import React from 'react';
import { ClientBuilding } from '../../types/game';

// Constants
const TILE_SIZE = 40;

interface TopDownBuildingProps {
  building: ClientBuilding;
  selected: boolean;
  onClick: () => void;
}

const TopDownBuilding: React.FC<TopDownBuildingProps> = ({ building, selected, onClick }) => {
  // Get building color and icon based on building type
  const getBuildingStyle = () => {
    const baseStyle = {
      width: building.width * TILE_SIZE,
      height: building.height * TILE_SIZE,
      left: building.x * TILE_SIZE,
      top: building.y * TILE_SIZE,
    };
    
    // Building styling based on type
    switch (building.type) {
      case 'floor':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(200, 180, 150, 0.5)',
          border: '1px solid rgba(150, 120, 100, 0.6)',
          zIndex: 1
        };
      case 'wall':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(150, 120, 100, 0.9)',
          border: '2px solid rgba(100, 80, 60, 0.8)',
          zIndex: 10
        };
      case 'door':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(120, 90, 60, 0.8)',
          border: '2px solid rgba(80, 60, 40, 0.7)',
          zIndex: 10
        };
      case 'bed':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(100, 150, 200, 0.7)',
          border: '1px solid rgba(80, 120, 160, 0.8)',
          zIndex: 5
        };
      case 'table':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(160, 140, 120, 0.8)',
          border: '1px solid rgba(120, 100, 80, 0.7)',
          zIndex: 5
        };
      case 'chair':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(140, 120, 100, 0.7)',
          border: '1px solid rgba(100, 80, 60, 0.6)',
          zIndex: 5
        };
      case 'workshop':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(180, 160, 100, 0.8)',
          border: '2px solid rgba(140, 120, 80, 0.7)',
          zIndex: 5
        };
      case 'storage':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(120, 140, 110, 0.8)',
          border: '1px solid rgba(100, 120, 90, 0.7)',
          zIndex: 5
        };
      case 'farm':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(140, 180, 120, 0.7)',
          border: '1px dashed rgba(100, 140, 80, 0.8)',
          zIndex: 5
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(150, 150, 150, 0.6)',
          border: '1px solid rgba(120, 120, 120, 0.7)',
          zIndex: 5
        };
    }
  };
  
  // Get building icon based on building type
  const getBuildingIcon = () => {
    switch (building.type) {
      case 'floor':
        return null; // No icon for floor
      case 'wall':
        return '🧱';
      case 'door':
        return '🚪';
      case 'bed':
        return '🛏️';
      case 'table':
        return '🪑';
      case 'chair':
        return '🪑';
      case 'workshop':
        return '⚒️';
      case 'storage':
        return '📦';
      case 'farm':
        return '🌱';
      default:
        return '🏗️';
    }
  };
  
  // Render construction progress if building is not complete
  const renderConstructionProgress = () => {
    if (building.complete) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
        <div className="w-3/4 h-2 bg-gray-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500" 
            style={{ width: `${building.progress || 0}%` }} 
          />
        </div>
      </div>
    );
  };
  
  // Show building occupants
  const renderOccupants = () => {
    if (!building.occupants || building.occupants.length === 0) return null;
    
    return (
      <div className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
        {building.occupants.length}
      </div>
    );
  };
  
  return (
    <div 
      className={`absolute transition-all duration-200 ${selected ? 'ring-2 ring-white' : ''}`}
      style={getBuildingStyle()}
      onClick={onClick}
    >
      {/* Building visualization */}
      <div className="relative w-full h-full flex items-center justify-center cursor-pointer">
        {/* Building icon */}
        <span className="text-lg">{getBuildingIcon()}</span>
        
        {/* Building type label */}
        <span className="absolute bottom-0 left-0 text-xs p-1 bg-black bg-opacity-20 text-white">
          {building.type}
        </span>
        
        {/* Render construction progress */}
        {renderConstructionProgress()}
        
        {/* Show occupants */}
        {renderOccupants()}
      </div>
    </div>
  );
};

export default TopDownBuilding;