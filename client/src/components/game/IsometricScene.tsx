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
    // Get the global Three.js camera from R3F to work with it directly
    const { camera, controls } = useThree();
    
    // Store the original camera position and target for resetting if needed
    const originalPosition = new THREE.Vector3().copy(camera.position);
    
    // Update camera function - this forces Three.js to refresh the camera view
    const updateCamera = () => {
      // Force a re-render with this camera
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    };
    
    // Handle all camera control events coming from MobileControls component
    const handleCameraControl = (e: Event) => {
      const customEvent = e as CustomEvent<{
        action: 'pan' | 'zoom' | 'rotate', 
        deltaX?: number, 
        deltaY?: number, 
        delta?: number,
        angle?: number
      }>;
      
      // Extract event details
      const { action, deltaX, deltaY, delta, angle } = customEvent.detail;
      
      // Log the event for debugging
      console.log('Mobile camera control:', action, customEvent.detail);
      
      // Handle panning (one-finger drag)
      if (action === 'pan' && deltaX !== undefined && deltaY !== undefined) {
        // Dramatically increase sensitivity for mobile - values are tiny with touch events
        const MOBILE_PAN_SENSITIVITY = 30.0;
        
        // Create vectors for moving the camera in the viewing plane
        // First, get the camera's right vector (for left/right movement)
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(camera.quaternion);
        // Keep right vector on the xz plane for consistent panning
        right.y = 0;
        right.normalize();
        
        // And the forward vector (for in/out movement)
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(camera.quaternion);
        forward.y = 0; // Keep movement on the xz plane
        forward.normalize();
        
        // Scale the movement based on the current camera distance from center
        // This makes panning more natural at different zoom levels
        const distanceScale = camera.position.length() / 15;
        const scaledSensitivity = MOBILE_PAN_SENSITIVITY * Math.max(1, distanceScale);
        
        console.log(`Using scaled sensitivity: ${scaledSensitivity.toFixed(2)} (distance=${distanceScale.toFixed(2)})`);
        
        // Move the camera directly by updating its position
        // Note: Reversed deltaX and deltaY for more intuitive movement
        camera.position.add(
          right.multiplyScalar(-deltaX * scaledSensitivity)
        );
        camera.position.add(
          forward.multiplyScalar(-deltaY * scaledSensitivity)
        );
        
        // Make sure the camera still looks at the center
        camera.lookAt(0, 0, 0);
        
        // Log the new position
        console.log('Camera moved to:', 
          camera.position.x.toFixed(2), 
          camera.position.y.toFixed(2), 
          camera.position.z.toFixed(2)
        );
        
        // Force update
        updateCamera();
      } 
      // Handle zooming (pinch gesture)
      else if (action === 'zoom' && delta !== undefined) {
        // Increase sensitivity for mobile - pinch gesture values are very small
        const MOBILE_ZOOM_SENSITIVITY = 25.0;
        
        // Calculate direction vector from camera to (0,0,0)
        const direction = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();
        
        // Scale zoom sensitivity based on current camera distance
        // Makes zooming feel more consistent at different distances
        const distance = camera.position.length();
        const scaledSensitivity = MOBILE_ZOOM_SENSITIVITY * Math.max(0.5, distance / 15);
        
        // Log the sensitivity scaling
        console.log(`Zoom with delta=${delta.toFixed(4)}, scaled sensitivity=${scaledSensitivity.toFixed(2)}`);
        
        // Move camera along this vector (negative delta = zoom in toward center)
        const moveAmount = delta * scaledSensitivity;
        
        // Calculate new position
        const newPosition = camera.position.clone().add(
          direction.multiplyScalar(moveAmount)
        );
        
        // Only allow zoom if we're not too close to ground or too far away
        if (newPosition.length() > 5 && newPosition.length() < 50) {
          camera.position.copy(newPosition);
          
          // Log what happened
          console.log('Camera zoomed to:', 
            camera.position.x.toFixed(2), 
            camera.position.y.toFixed(2), 
            camera.position.z.toFixed(2),
            `(distance: ${newPosition.length().toFixed(2)})`
          );
          
          // Make sure we're still looking at the center
          camera.lookAt(0, 0, 0);
          
          // Force update
          updateCamera();
        }
      }
      // Handle rotation (two-finger twist)
      else if (action === 'rotate' && angle !== undefined) {
        // Dramatically increase rotation sensitivity for mobile - two-finger rotation values are tiny
        const MOBILE_ROTATION_SENSITIVITY = 30.0;
        
        // Calculate the rotation amount
        const rotationAmount = angle * MOBILE_ROTATION_SENSITIVITY;
        
        console.log(`Rotating camera with angle=${angle.toFixed(6)}, rotationAmount=${rotationAmount.toFixed(4)}`);
        
        // Create a pivot point at the origin (0,0,0)
        const pivotPoint = new THREE.Vector3(0, 0, 0);
        
        // Calculate the vector from pivot to camera
        const cameraToPivot = camera.position.clone().sub(pivotPoint);
        
        // Create a rotation matrix around the Y axis
        const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAmount);
        
        // Apply the rotation to the camera-to-pivot vector
        cameraToPivot.applyMatrix4(rotationMatrix);
        
        // Set the new camera position
        camera.position.copy(pivotPoint).add(cameraToPivot);
        
        // Make sure camera is still looking at the center
        camera.lookAt(pivotPoint);
        
        // Keep camera upright
        camera.up.set(0, 1, 0);
        
        // Update our rotation tracker
        cameraRotation.current += rotationAmount;
        
        // Log what happened
        console.log('Camera rotated, new position:', 
          camera.position.x.toFixed(2), 
          camera.position.y.toFixed(2), 
          camera.position.z.toFixed(2),
          `(total rotation: ${cameraRotation.current.toFixed(4)})`
        );
        
        // Force update
        updateCamera();
      }
    };
    
    // Register the event listener
    window.addEventListener('camera-control', handleCameraControl);
    console.log('Mobile camera controls activated');
    
    // Clean up on component unmount
    return () => {
      window.removeEventListener('camera-control', handleCameraControl);
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

// Main IsometricScene component with mobile support
const IsometricScene: React.FC = () => {
  // Add a debug message to the console to verify component is loaded
  React.useEffect(() => {
    console.log('IsometricScene component mounted');
    
    // Add dummy touch event listeners to document to ensure they're enabled
    const enableTouchSupport = () => {
      document.addEventListener('touchstart', () => {}, { passive: false });
      document.addEventListener('touchmove', () => {}, { passive: false });
      document.addEventListener('touchend', () => {}, { passive: false });
      console.log('Global touch event listeners added');
    };
    
    enableTouchSupport();
    
    return () => {
      console.log('IsometricScene component unmounted');
    };
  }, []);
  
  return <SceneSetup />;
};

export default IsometricScene;
