import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../lib/stores/useGame';

// We'll use custom events to communicate with the IsometricScene component
const CAMERA_CONTROL_EVENT = 'camera-control';

interface CameraControlEvent {
  action: 'pan' | 'zoom';
  deltaX?: number;
  deltaY?: number;
  delta?: number;
}

const MobileControls: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useGame();
  
  // Helper function to dispatch camera control events
  const emitCameraControl = (data: CameraControlEvent) => {
    const event = new CustomEvent(CAMERA_CONTROL_EVENT, { detail: data });
    window.dispatchEvent(event);
    console.log('Mobile control event:', data);
  };
  
  // Camera control functions
  const panCamera = (deltaX: number, deltaY: number) => {
    emitCameraControl({ action: 'pan', deltaX, deltaY });
  };
  
  const zoomCamera = (delta: number) => {
    emitCameraControl({ action: 'zoom', delta });
  };
  
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