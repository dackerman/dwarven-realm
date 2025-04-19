import React from 'react';
import { ClientDwarf } from '../../types/game';

interface DwarfStatusBarProps {
  dwarf: ClientDwarf;
  isSelected?: boolean;
}

const DwarfStatusBar: React.FC<DwarfStatusBarProps> = ({ 
  dwarf,
  isSelected = false
}) => {
  // Only show if dwarf is selected or needs are critical
  const shouldShow = isSelected || 
                    dwarf.health < 30 || 
                    dwarf.hunger > 70 || 
                    dwarf.energy < 30;
                    
  if (!shouldShow) return null;
  
  return (
    <div 
      className={`flex flex-col items-center transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-80'}`}
      style={{ 
        width: '70px',
        pointerEvents: 'none',
        transformOrigin: 'center bottom'
      }}
    >
      {/* Health Bar */}
      {(dwarf.health < 100 || isSelected) && (
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-0.5">
          <div 
            className={`h-full ${dwarf.health > 50 ? 'bg-green-500' : dwarf.health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${dwarf.health}%` }}
          ></div>
        </div>
      )}
      
      {/* Hunger Bar - Only show if hungry or selected */}
      {(dwarf.hunger > 40 || isSelected) && (
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-0.5">
          <div 
            className={`h-full ${dwarf.hunger < 50 ? 'bg-green-500' : dwarf.hunger < 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${dwarf.hunger}%` }}
          ></div>
        </div>
      )}
      
      {/* Energy Bar - Only show if tired or selected */}
      {(dwarf.energy < 60 || isSelected) && (
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${dwarf.energy > 50 ? 'bg-blue-500' : dwarf.energy > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${dwarf.energy}%` }}
          ></div>
        </div>
      )}
      
      {/* Task Indicator - Only show if selected */}
      {isSelected && dwarf.currentTask && (
        <div className="mt-1 px-1.5 py-0.5 text-xs bg-gray-800/80 text-white rounded-sm capitalize">
          {dwarf.currentTask}
        </div>
      )}
    </div>
  );
};

export default DwarfStatusBar;
