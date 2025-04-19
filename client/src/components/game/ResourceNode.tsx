import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ClientResource } from '../../types/game';
import { gridToIso } from '../../lib/isometricUtils';
import { ResourceType } from '@shared/schema';

interface ResourceNodeProps {
  resource: ClientResource;
}

// Colors for different resource types
const RESOURCE_COLORS = {
  [ResourceType.Stone]: '#808080', // Gray
  [ResourceType.Wood]: '#8B4513', // Brown
  [ResourceType.Food]: '#228B22', // Forest green
  [ResourceType.Metal]: '#B87333', // Copper
  [ResourceType.Water]: '#1E90FF', // Dodger blue
};

const ResourceNode: React.FC<ResourceNodeProps> = ({ resource }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationRef = useRef(0);
  
  // Calculate isometric position
  const position = useMemo(() => {
    return gridToIso(resource.x, resource.y, 0);
  }, [resource.x, resource.y]);
  
  // Determine size based on resource quantity
  const size = useMemo(() => {
    return 0.5 + (resource.quantity / 100) * 0.5;
  }, [resource.quantity]);
  
  // Resource geometry based on type
  const geometry = useMemo(() => {
    switch (resource.type) {
      case ResourceType.Stone:
        return new THREE.DodecahedronGeometry(size * 0.5, 0);
      case ResourceType.Wood:
        return new THREE.CylinderGeometry(size * 0.2, size * 0.2, size, 8);
      case ResourceType.Food:
        return new THREE.SphereGeometry(size * 0.4, 8, 8);
      case ResourceType.Metal:
        return new THREE.OctahedronGeometry(size * 0.4);
      case ResourceType.Water:
        return new THREE.CylinderGeometry(size * 0.4, size * 0.4, size * 0.2, 16);
      default:
        return new THREE.BoxGeometry(size * 0.5, size * 0.5, size * 0.5);
    }
  }, [resource.type, size]);
  
  // Slight bobbing animation for resources that are being harvested
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Rotate wood resources slightly
    if (resource.type === ResourceType.Wood) {
      rotationRef.current = (rotationRef.current + delta * 0.1) % (Math.PI * 2);
      meshRef.current.rotation.y = rotationRef.current;
    }
    
    // Apply harvesting animation
    if (resource.isBeingHarvested) {
      meshRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 5) * 0.05;
      
      // Scale down slightly while being harvested
      meshRef.current.scale.setScalar(0.9 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
    } else {
      // Reset position and scale
      meshRef.current.position.y = position.y;
      meshRef.current.scale.setScalar(1);
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y + (size * 0.25), position.z]}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={RESOURCE_COLORS[resource.type as ResourceType] || '#CCCCCC'}
        roughness={0.7}
        metalness={resource.type === ResourceType.Metal ? 0.5 : 0.1}
      />
      
      {/* Show quantity indicator */}
      {resource.quantity > 0 && (
        <mesh position={[0, size * 0.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={
            resource.quantity > 75 ? '#00FF00' :
            resource.quantity > 50 ? '#FFFF00' :
            resource.quantity > 25 ? '#FFA500' : '#FF0000'
          } />
        </mesh>
      )}
    </mesh>
  );
};

export default ResourceNode;
