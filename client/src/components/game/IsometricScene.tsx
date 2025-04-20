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
  
  // For camera rotation
  const cameraRotation = useRef(0);
  const pendingRotation = useRef(0);
  
  // Handle mobile control events
  useEffect(() => {
    const { camera } = useThree();
    
    const handleCameraControl = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: 'pan' | 'zoom' | 'rotate', 
        deltaX?: number, 
        deltaY?: number, 
        delta?: number,
        angle?: number
      }>;
      
      const { action, deltaX, deltaY, delta, angle } = customEvent.detail;
      
      console.log('Camera control event received:', customEvent.detail);
      
      if (action === 'pan' && deltaX !== undefined && deltaY !== undefined) {
        // Make panning more responsive on mobile - use direct camera manipulation
        console.log('Executing camera pan with values:', -deltaX, -deltaY);
        
        // Get camera direction vectors
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        // Right vector (perpendicular to up and forward)
        const upVector = new THREE.Vector3(0, 1, 0);
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(upVector, dir).normalize();
        
        // Forward vector (perpendicular to up and right)
        const forwardVector = new THREE.Vector3();
        forwardVector.crossVectors(rightVector, upVector).normalize();
        
        // Apply movement with increased sensitivity for mobile
        const mobileSpeed = 2.0; // Much higher than the desktop speed for better response
        
        camera.position.addScaledVector(rightVector, -deltaX * mobileSpeed);
        camera.position.addScaledVector(forwardVector, -deltaY * mobileSpeed);
        
        // Log what's happening to make sure our code is working
        console.log('Camera moved to:', camera.position.x, camera.position.y, camera.position.z);
        
        // Ensure camera keeps looking in the same direction
        const target = new THREE.Vector3();
        target.copy(camera.position).add(dir);
        camera.lookAt(target);
      } 
      else if (action === 'zoom' && delta !== undefined) {
        // For zoom events, we'll handle them through direct camera manipulation
        console.log('Processing zoom:', delta);
        
        // Get current forward direction
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        // Apply zoom with increased sensitivity for mobile
        const mobileZoomSpeed = 2.0; // Increased for more responsive zooming
        const futurePosition = camera.position.clone().addScaledVector(dir, delta * mobileZoomSpeed);
        
        // Prevent zooming too close to the ground
        if (futurePosition.y > 2) {
          camera.position.addScaledVector(dir, delta * mobileZoomSpeed);
          console.log('Camera zoomed to:', camera.position.x, camera.position.y, camera.position.z);
        }
      }
      else if (action === 'rotate' && angle !== undefined) {
        // For rotation, apply immediately rather than using the frame loop
        console.log('Executing camera rotation with angle:', angle);
        
        // Apply rotation with increased sensitivity for mobile
        const mobileRotationSpeed = 5.0; // Increased for better responsiveness
        const rotationAmount = angle * mobileRotationSpeed;
        
        // Create rotation matrix for Y-axis rotation
        const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAmount);
        
        // Apply to camera position (rotate around Y axis)
        const cameraPosition = new THREE.Vector3().copy(camera.position);
        cameraPosition.applyMatrix4(rotationMatrix);
        camera.position.copy(cameraPosition);
        
        // Keep camera upright
        camera.up.set(0, 1, 0);
        
        // Look at the center point (0,0,0)
        camera.lookAt(0, 0, 0);
        
        // Update our rotation tracker
        cameraRotation.current += rotationAmount;
        console.log('Rotation applied. Total camera rotation:', cameraRotation.current);
      }
    };
    
    try {
      // Add event listener for camera control events from mobile controls
      window.addEventListener('camera-control', handleCameraControl);
      console.log('Camera control event listener registered successfully');
    } catch (error) {
      console.error('Failed to register camera control event listener:', error);
    }
    
    return () => {
      try {
        window.removeEventListener('camera-control', handleCameraControl);
      } catch (error) {
        console.error('Failed to remove camera control event listener:', error);
      }
    };
  }, []);

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
  
  // Game loop with keyboard controls and rotation handling
  useFrame((state, delta) => {
    if (phase !== 'playing') return;
    
    // Handle any pending rotation
    if (Math.abs(pendingRotation.current) > 0.001) {
      const { camera } = state;
      
      // Extract a reasonable amount of rotation to apply this frame
      // to make the rotation smooth
      const rotationThisFrame = pendingRotation.current * 0.1;
      pendingRotation.current -= rotationThisFrame;
      
      // Update our total rotation tracker
      cameraRotation.current += rotationThisFrame;
      
      // Create rotation matrix for Y-axis rotation
      const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationThisFrame);
      
      // Apply to camera position
      const cameraPosition = new THREE.Vector3().copy(camera.position);
      cameraPosition.applyMatrix4(rotationMatrix);
      camera.position.copy(cameraPosition);
      
      // Keep camera upright
      camera.up.set(0, 1, 0);
      
      // Look at the center
      camera.lookAt(0, 0, 0);
      
      if (Math.abs(pendingRotation.current) < 0.001) {
        // Clean up any tiny remaining rotation to avoid floating point errors
        pendingRotation.current = 0;
        console.log('Rotation complete. Total camera rotation:', cameraRotation.current);
      }
    }
    
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
