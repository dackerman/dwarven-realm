import React from 'react';
import { BuildingType } from '@shared/schema';
import { useBuilding } from '../../lib/stores/useBuilding';
import { useAudio } from '../../lib/stores/useAudio';

interface BuildMenuProps {
  onClose: () => void;
  onSelect: (type: BuildingType) => void;
  selectedType: BuildingType | null;
}

const BuildMenu: React.FC<BuildMenuProps> = ({ 
  onClose,
  onSelect,
  selectedType
}) => {
  const { playSuccess } = useAudio();
  const getBuildingCost = useBuilding(state => state.getBuildingCost);
  
  // Building categories
  const categories = [
    {
      name: "Structures",
      buildings: [
        BuildingType.Wall,
        BuildingType.Floor,
        BuildingType.Door,
      ]
    },
    {
      name: "Furniture",
      buildings: [
        BuildingType.Bed,
        BuildingType.Table,
        BuildingType.Chair,
      ]
    },
    {
      name: "Workshops",
      buildings: [
        BuildingType.Workshop,
        BuildingType.Storage,
        BuildingType.Farm,
      ]
    }
  ];
  
  // Get building description
  const getBuildingDescription = (type: BuildingType): string => {
    switch (type) {
      case BuildingType.Wall:
        return "A stone wall that blocks passage. Essential for fortress security.";
      case BuildingType.Floor:
        return "A basic stone floor. Provides stable ground for building.";
      case BuildingType.Door:
        return "A wooden door that can be opened or closed. Controls passage.";
      case BuildingType.Bed:
        return "A place for dwarves to sleep and regain energy.";
      case BuildingType.Table:
        return "A place for dwarves to eat and socialize.";
      case BuildingType.Chair:
        return "A seat for dwarves to rest and reduce fatigue.";
      case BuildingType.Workshop:
        return "A facility for crafting items and processing materials.";
      case BuildingType.Storage:
        return "A designated area for storing resources and items.";
      case BuildingType.Farm:
        return "A plot for growing food crops. Essential for feeding dwarves.";
      default:
        return "A building for your fortress.";
    }
  };
  
  // Format resource costs
  const formatCost = (type: BuildingType): string => {
    const costs = getBuildingCost(type);
    return Object.entries(costs)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(", ");
  };
  
  // Handle selection
  const handleSelect = (type: BuildingType) => {
    onSelect(type);
    playSuccess();
  };
  
  return (
    <div className="absolute bottom-14 left-4 bg-gray-900/90 text-white p-4 rounded-lg pointer-events-auto w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">Build Menu</h3>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto pr-2">
        {categories.map((category) => (
          <div key={category.name} className="mb-4">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">{category.name}</h4>
            <div className="space-y-1">
              {category.buildings.map((buildingType) => (
                <div 
                  key={buildingType}
                  className={`p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors ${selectedType === buildingType ? 'bg-blue-900' : ''}`}
                  onClick={() => handleSelect(buildingType)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{buildingType}</span>
                    <span className="text-xs text-gray-400">{formatCost(buildingType)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{getBuildingDescription(buildingType)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildMenu;
