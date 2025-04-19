import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

import { useGame } from '../../lib/stores/useGame';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useBuilding } from '../../lib/stores/useBuilding';
import { useIsometricCamera, useGridSelection } from '../../hooks/useThreeUtils';
import { gridToIso } from '../../lib/isometricUtils';

import Terrain from './Terrain';
import Dwarf from './Dwarf';
import Building from './Building';
import ResourceNode from './ResourceNode';
import AIControls from './AIControls';
import DwarfMovement from './DwarfMovement';

// Define key mappings for movement
const keyMap = [
  { name: 'up', keys: ['ArrowUp', 'KeyW'] },
  { name: 'down', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'zoomIn', keys: ['KeyI', 'Equal'] },
  { name: 'zoomOut', keys: ['KeyO', 'Minus'] },
  { name: 'space', keys: ['Space'] },
  { name: 'escape', keys: ['Escape'] },
];

// Scene setup and camera/controls
const SceneSetup: React.FC = () => {
  const { panCamera, zoomCamera } = useIsometricCamera();
  const { selectedTile, checkIntersection } = useGridSelection();
  const { buildings } = useBuilding();
  const { dwarves } = useDwarves();
  const { phase, speed } = useGame();
  
  // Reference to the canvas element for checking mouse interactions
  const { gl } = useThree();
  const canvasRef = useRef<HTMLCanvasElement>(gl.domElement);
  
  // Mouse state for drag detection
  const mouseState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  
  // Handle mobile control events
  useEffect(() => {
    const handleCameraControl = (e: Event) => {
      const customEvent = e as CustomEvent<{action: 'pan' | 'zoom', deltaX?: number, deltaY?: number, delta?: number}>;
      const { action, deltaX, deltaY, delta } = customEvent.detail;
      
      console.log('Camera control event received:', customEvent.detail);
      
      if (action === 'pan' && deltaX !== undefined && deltaY !== undefined) {
        panCamera(-deltaX * 0.5, -deltaY * 0.5);
      } else if (action === 'zoom' && delta !== undefined) {
        zoomCamera(delta * 0.5);
      }
    };
    
    // Add event listener for camera control events from mobile controls
    window.addEventListener('camera-control', handleCameraControl);
    
    return () => {
      window.removeEventListener('camera-control', handleCameraControl);
    };
  }, [panCamera, zoomCamera]);

  // Handle mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    
    const handleMouseDown = (e: MouseEvent) => {
      mouseState.current.isDragging = true;
      mouseState.current.startX = e.clientX;
      mouseState.current.startY = e.clientY;
      mouseState.current.currentX = e.clientX;
      mouseState.current.currentY = e.clientY;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      // Update current mouse position
      mouseState.current.currentX = e.clientX;
      mouseState.current.currentY = e.clientY;
      
      // Handle drag to pan camera
      if (mouseState.current.isDragging) {
        const deltaX = e.clientX - mouseState.current.startX;
        const deltaY = e.clientY - mouseState.current.startY;
        mouseState.current.startX = e.clientX;
        mouseState.current.startY = e.clientY;
        
        panCamera(-deltaX * 0.01, -deltaY * 0.01);
      } else {
        // Just hover
        checkIntersection(e);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      // If it was a short click (not a drag), check for tile selection
      const dragDistance = Math.abs(mouseState.current.startX - mouseState.current.currentX) +
                          Math.abs(mouseState.current.startY - mouseState.current.currentY);
      
      if (dragDistance < 5) {
        // It's a click rather than a drag
        const hitTile = checkIntersection(e);
        if (hitTile) {
          console.log(`Selected tile: ${hitTile.x}, ${hitTile.y}`);
          // Handle tile selection logic here
        }
      }
      
      mouseState.current.isDragging = false;
    };
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.01;
      zoomCamera(delta);
    };
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    
    // Clean up on unmount
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [canvasRef, panCamera, zoomCamera, checkIntersection]);
  
  // Game loop with keyboard controls
  useFrame((state, delta) => {
    if (phase !== 'playing') return;
    
    // Process keyboard commands for camera movement
    const keyboard = state.gl.domElement.parentElement?.parentElement?.querySelector('div[data-key-controls]');
    if (keyboard) {
      const controls = (keyboard as any).__keys;
      
      if (controls) {
        if (controls.up) panCamera(0, -0.1);
        if (controls.down) panCamera(0, 0.1);
        if (controls.left) panCamera(-0.1, 0);
        if (controls.right) panCamera(0.1, 0);
        if (controls.zoomIn) zoomCamera(-0.1);
        if (controls.zoomOut) zoomCamera(0.1);
      }
    }
  });
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
      />
      
      {/* Scene content */}
      <Terrain />
      
      {/* Resources */}
      {useBuilding.getState().resources.map(resource => (
        <ResourceNode 
          key={`resource-${resource.id}`} 
          resource={resource} 
        />
      ))}
      
      {/* Buildings */}
      {buildings.map(building => (
        <Building 
          key={`building-${building.id}`} 
          building={building} 
        />
      ))}
      
      {/* Dwarves */}
      {dwarves.map(dwarf => (
        <Dwarf 
          key={`dwarf-${dwarf.id}`} 
          dwarf={dwarf} 
        />
      ))}
      
      {/* AI control system - handles dwarf AI behaviors */}
      <AIControls />
      
      {/* Movement system - handles dwarf pathfinding and movement */}
      <DwarfMovement />
    </>
  );
};

// Main IsometricScene component
const IsometricScene: React.FC = () => {
  return <SceneSetup />;
};

export default IsometricScene;
