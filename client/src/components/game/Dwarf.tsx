import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { ClientDwarf } from '../../types/game';
import { gridToIso, getDirectionAngle } from '../../lib/isometricUtils';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useAudio } from '../../lib/stores/useAudio';
import { useGame } from '../../lib/stores/useGame';
import DialogBubble from '../ui/DialogBubble';
import DwarfStatusBar from '../ui/DwarfStatusBar';

interface DwarfProps {
  dwarf: ClientDwarf;
}

const DWARF_COLORS = [
  '#8B4513', // Brown
  '#556B2F', // Olive Green
  '#B8860B', // Dark Goldenrod
  '#6B8E23', // Olive Drab
  '#A0522D', // Sienna
];

const Dwarf: React.FC<DwarfProps> = ({ dwarf }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const prevPosition = useRef<THREE.Vector3 | null>(null);
  const { playDwarfTalk } = useAudio();
  const selectedDwarfId = useDwarves(state => state.selectedDwarfId);
  const { phase, settings } = useGame();
  
  // Calculate isometric position
  const position = useMemo(() => {
    return gridToIso(dwarf.x, dwarf.y, 0.3); // Slight elevation to place on terrain
  }, [dwarf.x, dwarf.y]);
  
  // Determine dwarf color based on ID
  const dwarfColor = useMemo(() => {
    return DWARF_COLORS[dwarf.id % DWARF_COLORS.length];
  }, [dwarf.id]);
  
  // Animation state
  const animationState = useRef({
    walkSpeed: 0.2,
    bobAmount: 0.05,
    bobSpeed: 3,
    rotationTarget: 0,
    currentTime: 0
  });
  
  // Play talk sound when dialogue becomes visible
  useEffect(() => {
    if (dwarf.dialogueVisible && dwarf.currentDialogue) {
      playDwarfTalk();
    }
  }, [dwarf.dialogueVisible, dwarf.currentDialogue, playDwarfTalk]);
  
  // Handle animations and movement
  useFrame((state, delta) => {
    if (!meshRef.current || phase !== 'playing') return;
    
    // Update animation time
    animationState.current.currentTime += delta;
    
    // Store current position for reference if not set
    if (!prevPosition.current) {
      prevPosition.current = new THREE.Vector3().copy(position);
    }

    // Check if position has changed
    const hasMovedX = Math.abs(prevPosition.current.x - position.x) > 0.01;
    const hasMovedZ = Math.abs(prevPosition.current.z - position.z) > 0.01;
    const hasMoved = hasMovedX || hasMovedZ;
    
    // Rotate the dwarf based on direction
    if (dwarf.direction) {
      const targetAngle = getDirectionAngle(dwarf.direction);
      animationState.current.rotationTarget = targetAngle;
      
      // Smoothly interpolate current rotation to target
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        animationState.current.rotationTarget,
        0.2
      );
    }
    
    // Apply vertical bobbing animation when walking
    if (dwarf.animation === 'walking') {
      const bobAmount = animationState.current.bobAmount;
      const bobSpeed = animationState.current.bobSpeed;
      const time = animationState.current.currentTime;
      
      // Bob up and down while walking
      meshRef.current.position.y = position.y + Math.sin(time * bobSpeed) * bobAmount;
    } else {
      // Reset to base position
      meshRef.current.position.y = position.y;
    }
    
    // Update to new position
    meshRef.current.position.x = position.x;
    meshRef.current.position.z = position.z;
    
    // Store current position for next frame
    prevPosition.current.copy(position);
  });
  
  // Determine if this dwarf is selected
  const isSelected = selectedDwarfId === dwarf.id;
  
  return (
    <group position={position}>
      {/* Dwarf body */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, 0.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          useDwarves.getState().selectDwarf(dwarf.id);
        }}
      >
        {/* Body */}
        <boxGeometry args={[0.4, 0.5, 0.25]} />
        <meshStandardMaterial color={dwarfColor} roughness={0.7} />
        
        {/* Head */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color={dwarfColor} roughness={0.7} />
        </mesh>
        
        {/* Beard */}
        <mesh position={[0, 0.15, 0.15]}>
          <boxGeometry args={[0.3, 0.2, 0.15]} />
          <meshStandardMaterial color="#C0C0C0" roughness={0.7} />
        </mesh>
        
        {/* Selection indicator (only shown when selected) */}
        {isSelected && (
          <mesh position={[0, -0.3, 0]}>
            <ringGeometry args={[0.3, 0.35, 16]} />
            <meshBasicMaterial color="#FFFF00" side={THREE.DoubleSide} />
          </mesh>
        )}
      </mesh>
      
      {/* Status indicators and dialogue */}
      <Html position={[0, 1.2, 0]} center sprite occlude>
        {/* Only show dialogue if enabled and dwarf has something to say */}
        {settings.showDialogues && dwarf.dialogueVisible && dwarf.currentDialogue && (
          <DialogBubble 
            text={dwarf.currentDialogue || ""} 
            name={dwarf.name}
            type={dwarf.state === 'idle' ? 'neutral' : dwarf.state === 'sleeping' ? 'muted' : 'active'}
          />
        )}
        
        {/* Status bar showing health, hunger, energy */}
        <DwarfStatusBar dwarf={dwarf} isSelected={isSelected} />
      </Html>
    </group>
  );
};

export default Dwarf;
