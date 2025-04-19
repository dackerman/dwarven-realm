import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '../../hooks/useThreeUtils';
import { useBuilding } from '../../lib/stores/useBuilding';
import { gridToIso, createIsometricBox } from '../../lib/isometricUtils';

interface TerrainProps {
  size?: number;
}

const Terrain: React.FC<TerrainProps> = ({ size = 20 }) => {
  const grassTexture = useTexture('/textures/grass.png');
  const stoneTexture = useTexture('/textures/asphalt.png');
  const sandTexture = useTexture('/textures/sand.jpg');
  
  const { world } = useBuilding();
  
  // Generate terrain mesh based on the world grid
  const terrainMesh = useMemo(() => {
    // If no world data yet, create a default flat plane
    if (!world) {
      const geometry = new THREE.PlaneGeometry(size, size, 1, 1);
      geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
      
      return (
        <mesh 
          receiveShadow 
          position={[0, 0, 0]}
        >
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial 
            map={grassTexture}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      );
    }
    
    // Create a more detailed terrain based on the world grid
    const tiles: JSX.Element[] = [];
    
    // Iterate through the grid
    for (let y = 0; y < world.height; y++) {
      for (let x = 0; x < world.width; x++) {
        const cell = world.grid[y][x];
        
        // Skip if there's a building or resource here (they'll render their own meshes)
        if (cell.type !== 'terrain') continue;
        
        // Get the isometric position
        const position = gridToIso(x, y, cell.elevation * 0.2);
        
        // Determine tile texture based on elevation or other properties
        let tileTexture = grassTexture;
        if (cell.elevation < 0) {
          tileTexture = sandTexture;
        } else if (cell.elevation > 2) {
          tileTexture = stoneTexture;
        }
        
        // Create the tile
        tiles.push(
          <mesh
            key={`terrain-${x}-${y}`}
            position={position}
            receiveShadow
            castShadow={cell.elevation > 0}
          >
            <boxGeometry args={[1, 0.1 + cell.elevation * 0.2, 0.5]} />
            <meshStandardMaterial
              map={tileTexture}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        );
      }
    }
    
    return <>{tiles}</>;
  }, [world, grassTexture, stoneTexture, sandTexture, size]);
  
  return (
    <group>
      {terrainMesh}
    </group>
  );
};

export default Terrain;
