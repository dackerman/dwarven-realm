import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ClientBuilding } from '../../types/game';
import { useTexture } from '../../hooks/useThreeUtils';
import { gridToIso, createIsometricBox } from '../../lib/isometricUtils';
import { BuildingType } from '@shared/schema';
import { useBuilding } from '../../lib/stores/useBuilding';

interface BuildingProps {
  building: ClientBuilding;
}

// Colors for different building types
const BUILDING_COLORS = {
  [BuildingType.Wall]: '#808080', // Gray
  [BuildingType.Floor]: '#D2B48C', // Tan
  [BuildingType.Door]: '#8B4513', // Brown
  [BuildingType.Bed]: '#4682B4', // Steel blue
  [BuildingType.Table]: '#DEB887', // Burlywood
  [BuildingType.Chair]: '#A0522D', // Sienna
  [BuildingType.Workshop]: '#2F4F4F', // Dark slate gray
  [BuildingType.Storage]: '#B8860B', // Dark goldenrod
  [BuildingType.Farm]: '#228B22', // Forest green
};

const Building: React.FC<BuildingProps> = ({ building }) => {
  const woodTexture = useTexture('/textures/wood.jpg');
  const stoneTexture = useTexture('/textures/asphalt.png');
  
  // Get build job info if applicable
  const buildJob = useBuilding(state => state.getBuildJobByBuildingId(building.id));
  
  // Determine building position
  const position = useMemo(() => {
    return gridToIso(building.x, building.y, 0);
  }, [building.x, building.y]);
  
  // Determine which texture to use based on building type
  const texture = useMemo(() => {
    switch (building.type) {
      case BuildingType.Wall:
      case BuildingType.Floor:
      case BuildingType.Workshop:
        return stoneTexture;
      case BuildingType.Door:
      case BuildingType.Bed:
      case BuildingType.Table:
      case BuildingType.Chair:
      case BuildingType.Storage:
      case BuildingType.Farm:
        return woodTexture;
      default:
        return woodTexture;
    }
  }, [building.type, woodTexture, stoneTexture]);
  
  // Determine building geometry and dimensions
  const { geometry, width, height, depth } = useMemo(() => {
    let boxWidth = building.width;
    let boxHeight = 0.5;
    let boxDepth = building.height * 0.5;
    
    // Adjust height based on building type
    switch (building.type) {
      case BuildingType.Wall:
        boxHeight = 1.5;
        break;
      case BuildingType.Workshop:
        boxHeight = 1.2;
        break;
      case BuildingType.Storage:
        boxHeight = 1.0;
        break;
      default:
        boxHeight = 0.3;
    }
    
    return {
      geometry: new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth),
      width: boxWidth,
      height: boxHeight,
      depth: boxDepth
    };
  }, [building.type, building.width, building.height]);
  
  // Material options for complete vs. in-progress buildings
  const materialProps = useMemo(() => {
    if (!building.complete) {
      // Building in progress
      return {
        opacity: Math.max(0.3, building.progress / 100),
        transparent: true,
        wireframe: building.progress < 50,
        color: BUILDING_COLORS[building.type as BuildingType] || '#CCCCCC',
      };
    } else {
      // Completed building
      return {
        map: texture,
        color: BUILDING_COLORS[building.type as BuildingType] || '#CCCCCC',
      };
    }
  }, [building.complete, building.progress, building.type, texture]);
  
  // Center the building on the grid cell
  const centeredPosition = useMemo(() => {
    const centerX = position.x + (width / 2) - 0.5;
    const centerY = position.y + (height / 2);
    const centerZ = position.z + (depth / 2) - 0.25;
    
    return new THREE.Vector3(centerX, centerY, centerZ);
  }, [position, width, height, depth]);
  
  return (
    <mesh
      position={centeredPosition}
      castShadow
      receiveShadow
      onClick={() => {
        // Handle building click (e.g., show details)
        console.log('Building clicked:', building);
      }}
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        {...materialProps}
        roughness={0.7}
        metalness={0.1}
      />
      
      {/* Add a progress indicator for buildings under construction */}
      {!building.complete && (
        <group position={[0, height / 2 + 0.1, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.05]} />
            <meshBasicMaterial color="#333333" />
          </mesh>
          <mesh position={[-0.4 + (0.8 * building.progress / 100) / 2, 0.1, 0]}>
            <boxGeometry args={[(0.8 * building.progress / 100), 0.05, 0.05]} />
            <meshBasicMaterial color="#00FF00" />
          </mesh>
        </group>
      )}
    </mesh>
  );
};

export default Building;
