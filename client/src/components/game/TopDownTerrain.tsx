import React from 'react';
import { useBuilding } from '../../lib/stores/useBuilding';

// Constants
const TILE_SIZE = 40;
const GRID_SIZE = 20; // 20x20 grid

interface TopDownTerrainProps {
  onTileClick: (x: number, y: number) => void;
}

const TopDownTerrain: React.FC<TopDownTerrainProps> = ({ onTileClick }) => {
  const { world } = useBuilding();
  
  // Generate grid cells
  const renderGridCells = () => {
    const cells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Get terrain type from world data (if available)
        const cellType = world?.grid?.[y]?.[x]?.type || 'terrain';
        const walkable = world?.grid?.[y]?.[x]?.walkable ?? true;
        const elevation = world?.grid?.[y]?.[x]?.elevation ?? 0;
        
        // Set styling based on terrain type
        const getTerrainStyle = () => {
          switch (cellType) {
            case 'terrain':
              // Base terrain colors with slight variations based on elevation
              return {
                backgroundColor: elevation > 0 
                  ? `hsl(80, ${40 + elevation * 5}%, ${60 - elevation * 5}%)`
                  : `hsl(60, ${30 + Math.abs(elevation) * 2}%, ${60 - Math.abs(elevation) * 2}%)`,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              };
            default:
              return {
                backgroundColor: '#a9cc95',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              };
          }
        };
        
        cells.push(
          <div
            key={`tile-${x}-${y}`}
            className="absolute transition-colors duration-300 hover:brightness-110"
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              cursor: 'pointer',
              ...getTerrainStyle()
            }}
            onClick={() => onTileClick(x, y)}
          >
            {/* Optional: Grid coordinates for debugging */}
            {/* <span className="text-xs opacity-50">{x},{y}</span> */}
          </div>
        );
      }
    }
    
    return cells;
  };
  
  return (
    <div className="relative" style={{ width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }}>
      {renderGridCells()}
      
      {/* Grid lines - optional */}
      <div className="absolute inset-0 grid" style={{ 
        backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
        width: GRID_SIZE * TILE_SIZE,
        height: GRID_SIZE * TILE_SIZE
      }} />
    </div>
  );
};

export default TopDownTerrain;