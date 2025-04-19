import React, { useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MobileControls: React.FC = () => {
  const { camera } = useThree();
  const [isVisible, setIsVisible] = useState(true);
  
  // Camera control functions
  const panCamera = useCallback((deltaX: number, deltaY: number) => {
    const speed = 0.5; // Increased for mobile
    const dir = new THREE.Vector3();
    const rightVector = new THREE.Vector3();
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Get right and forward vectors from camera
    camera.getWorldDirection(dir);
    rightVector.crossVectors(upVector, dir).normalize();
    
    // Move camera position
    camera.position.addScaledVector(rightVector, deltaX * speed);
    
    // For vertical movement, use a vector perpendicular to both
    // the up vector and the right vector
    const forwardVector = new THREE.Vector3();
    forwardVector.crossVectors(rightVector, upVector);
    camera.position.addScaledVector(forwardVector, deltaY * speed);
    
    // Update the target that the camera is looking at
    const target = new THREE.Vector3();
    target.copy(camera.position).add(dir);
    camera.lookAt(target);
    
    console.log(`Camera panned: ${deltaX}, ${deltaY}`);
  }, [camera]);
  
  const zoomCamera = useCallback((delta: number) => {
    const speed = 0.5; // Increased for mobile
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    
    // Prevent zooming too close to the ground
    const futurePosition = camera.position.clone().addScaledVector(dir, delta * speed);
    if (futurePosition.y > 2) { // Minimum height above ground
      camera.position.addScaledVector(dir, delta * speed);
      
      // Look at the center point again
      const target = new THREE.Vector3(0, 0, 0);
      camera.lookAt(target);
      
      console.log(`Camera zoomed: ${delta}`);
    }
  }, [camera]);
  
  // Handle button clicks
  const handlePanUp = () => panCamera(0, 1);
  const handlePanDown = () => panCamera(0, -1);
  const handlePanLeft = () => panCamera(-1, 0);
  const handlePanRight = () => panCamera(1, 0);
  const handleZoomIn = () => zoomCamera(1);
  const handleZoomOut = () => zoomCamera(-1);
  
  // Hide controls after a period of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000); // 10 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show controls when screen is tapped
  const handleTap = () => {
    setIsVisible(true);
    
    // Hide again after 10 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 10000);
  };
  
  if (!isVisible) {
    return (
      <div 
        className="absolute bottom-20 right-4 p-3 bg-gray-900/60 rounded-full pointer-events-auto"
        onClick={handleTap}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 7l4-4 4 4"></path>
          <path d="M8 17l4 4 4-4"></path>
          <path d="M4 11h16"></path>
        </svg>
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-20 right-4 pointer-events-auto">
      {/* Navigation Controls */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-900/80 rounded-lg">
        {/* Top row */}
        <div className="w-12 h-12"></div>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handlePanUp}
          aria-label="Pan up"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7"></path>
          </svg>
        </button>
        <div className="w-12 h-12"></div>
        
        {/* Middle row */}
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handlePanLeft}
          aria-label="Pan left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={() => setIsVisible(false)}
          aria-label="Hide controls"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handlePanRight}
          aria-label="Pan right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </button>
        
        {/* Bottom row */}
        <div className="w-12 h-12"></div>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handlePanDown}
          aria-label="Pan down"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7"></path>
          </svg>
        </button>
        <div className="w-12 h-12"></div>
      </div>
      
      {/* Zoom Controls */}
      <div className="mt-2 flex flex-col gap-1 items-center bg-gray-900/80 p-1 rounded-lg">
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button 
          className="flex items-center justify-center w-12 h-12 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MobileControls;