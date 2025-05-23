import React, { useEffect, useRef, useState } from 'react';

// We'll use custom events to communicate with the IsometricScene component
const CAMERA_CONTROL_EVENT = 'camera-control';

interface TouchState {
  isDragging: boolean;
  isPinching: boolean;
  isRotating: boolean;
  touchCount: number;
  lastX: number;
  lastY: number;
  lastDist: number;
  lastAngle: number;
}

interface CameraControlEvent {
  action: 'pan' | 'zoom' | 'rotate';
  deltaX?: number;
  deltaY?: number;
  delta?: number;
  angle?: number;
}

const MobileControls: React.FC = () => {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Touch controls ready. Waiting for input...');
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Helper function to dispatch camera control events
  const emitCameraControl = (data: CameraControlEvent) => {
    try {
      // Make sure the event name exactly matches what's in IsometricScene.tsx
      const event = new CustomEvent('camera-control', { detail: data });
      window.dispatchEvent(event);
      console.log('Touch control event emitted:', data);
      setDebugInfo(`Last event: ${data.action} - ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Error emitting camera control event:', error);
      setDebugInfo(`Error: ${error}`);
    }
  };
  
  useEffect(() => {
    // Track touch state
    const touchState: TouchState = {
      isDragging: false,
      isPinching: false,
      isRotating: false,
      touchCount: 0,
      lastX: 0,
      lastY: 0,
      lastDist: 0,
      lastAngle: 0
    };
    
    // Get touch element
    const touchArea = touchAreaRef.current;
    if (!touchArea) {
      console.error('Touch area ref is null');
      setDebugInfo('Error: Touch area not initialized');
      return;
    }
    
    // Mobile controls initialized
    setDebugInfo('Mobile controls initialized');
    
    // Calculate distance between two touch points
    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Calculate angle between two touch points
    const getAngle = (touch1: Touch, touch2: Touch): number => {
      return Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );
    };
    
    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      // Touch start detected
      setDebugInfo(`Touch start: ${e.touches.length} touches`);
      
      touchState.touchCount = e.touches.length;
      
      if (touchState.touchCount === 1) {
        // Single touch for panning
        touchState.isDragging = true;
        touchState.isPinching = false;
        touchState.isRotating = false;
        touchState.lastX = e.touches[0].clientX;
        touchState.lastY = e.touches[0].clientY;
        // Single touch captured
      } 
      else if (touchState.touchCount === 2) {
        // Two touches for pinch zoom and rotation
        touchState.isDragging = false;
        touchState.isPinching = true;
        touchState.isRotating = true;
        touchState.lastDist = getDistance(e.touches[0], e.touches[1]);
        touchState.lastAngle = getAngle(e.touches[0], e.touches[1]);
        // Two touches detected
      }
    };
    
    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      // Stop propagation and prevent default
      e.stopPropagation();
      e.preventDefault(); // Prevent default scrolling behavior
      
      if (touchState.touchCount === 1 && touchState.isDragging) {
        // Handle panning with one finger
        const deltaX = e.touches[0].clientX - touchState.lastX;
        const deltaY = e.touches[0].clientY - touchState.lastY;
        
        // Only send raw touch events - we'll handle scaling in the camera component
        // Don't apply a scaling factor here as we'll do that in IsometricScene
        const RAW_TOUCH_THRESHOLD = 0.2; // Very small threshold to catch all movements
        
        if (Math.abs(deltaX) > RAW_TOUCH_THRESHOLD || Math.abs(deltaY) > RAW_TOUCH_THRESHOLD) {
          // Send raw delta values scaled by small factor to avoid tiny movements
          emitCameraControl({
            action: 'pan',
            deltaX: deltaX * 0.1, // Reduce raw value to avoid excessively large movements
            deltaY: deltaY * 0.1  // The camera handler will multiply by a larger factor
          });
          
          touchState.lastX = e.touches[0].clientX;
          touchState.lastY = e.touches[0].clientY;
        }
      } 
      else if (touchState.touchCount === 2) {
        // Handle two-finger gestures
        
        if (touchState.isPinching) {
          // Handle pinch zoom
          const currentDist = getDistance(e.touches[0], e.touches[1]);
          const deltaDist = currentDist - touchState.lastDist;
          
          // Lower threshold to catch more pinch events
          const PINCH_THRESHOLD = 0.1;
          
          if (Math.abs(deltaDist) > PINCH_THRESHOLD) {
            // Normalize the delta to avoid excessive zoom speeds with very small values
            const normalizedDelta = deltaDist * 0.01;
            
            
            // Send the normalized value - our camera handler will apply the appropriate scaling
            emitCameraControl({
              action: 'zoom',
              // Negate to match the expected zoom direction
              delta: -normalizedDelta
            });
            
            touchState.lastDist = currentDist;
          }
        }
        
        if (touchState.isRotating) {
          // Handle rotation
          const currentAngle = getAngle(e.touches[0], e.touches[1]);
          const deltaAngle = currentAngle - touchState.lastAngle;
          
          // Lower threshold for more responsive rotation
          const ROTATION_THRESHOLD = 0.001;
          
          if (Math.abs(deltaAngle) > ROTATION_THRESHOLD) {
            
            // Just send the raw angle - scaling happens in camera handler
            emitCameraControl({
              action: 'rotate',
              angle: deltaAngle
            });
            
            touchState.lastAngle = currentAngle;
          }
        }
      }
    };
    
    // Handle touch end
    const handleTouchEnd = (e: TouchEvent) => {
      // Touch end detected
      setDebugInfo(`Touch end: ${e.touches.length} touches remaining`);
      
      touchState.touchCount = e.touches.length;
      
      if (touchState.touchCount === 0) {
        // All fingers lifted
        touchState.isDragging = false;
        touchState.isPinching = false;
        touchState.isRotating = false;
      } 
      else if (touchState.touchCount === 1) {
        // One finger left, back to panning
        touchState.isDragging = true;
        touchState.isPinching = false;
        touchState.isRotating = false;
        touchState.lastX = e.touches[0].clientX;
        touchState.lastY = e.touches[0].clientY;
      }
    };
    
    // Add event listeners
    touchArea.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    touchArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // Clean up
    return () => {
      touchArea.removeEventListener('touchstart', handleTouchStart);
      touchArea.removeEventListener('touchmove', handleTouchMove);
      touchArea.removeEventListener('touchend', handleTouchEnd);
      touchArea.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);
  
  return (
    <>
      {/* Main touch area - must be behind UI elements so UI buttons work */}
      <div 
        ref={touchAreaRef}
        className="absolute inset-0 touch-none z-5 pointer-events-auto"
        style={{ 
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none'
        }}
        id="mobile-touch-area"
      ></div>
      
      {/* Debug panel - Added to help troubleshoot */}
      <div className="absolute top-16 left-4 p-2 rounded-lg bg-red-600/80 text-white text-xs pointer-events-none z-50">
        Debug: {debugInfo}
      </div>
      
      {/* Information panel in the bottom corner to indicate touch controls are available */}
      <div className="absolute bottom-20 right-4 p-2 rounded-lg bg-gray-900/80 text-white text-sm pointer-events-none z-50">
        <div className="flex items-center space-x-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span>Pan: one finger drag</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span>Zoom: pinch</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 15L9 9m0 6l6-6"/>
          </svg>
          <span>Rotate: two finger twist</span>
        </div>
      </div>
    </>
  );
};

export default MobileControls;