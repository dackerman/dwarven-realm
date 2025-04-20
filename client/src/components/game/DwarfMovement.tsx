import React, { useEffect } from 'react';
import { useDwarves } from '../../lib/stores/useDwarves';
import { useGame } from '../../lib/stores/useGame';
import { findPath } from '../../lib/api';
import { Point2D } from '../../types/game';
import { logDwarfEvent, logDwarfDialogue } from '../../lib/loggerClient';

const MOVEMENT_CHECK_INTERVAL = 200; // Check every 200ms for smoother movement

const DwarfMovement: React.FC = () => {
  const dwarves = useDwarves(state => state.dwarves);
  const phase = useGame(state => state.phase);
  const speed = useGame(state => state.speed);
  
  // Effect to check for dwarves that need to move
  useEffect(() => {
    if (phase !== 'playing') return;
    
    console.log('DwarfMovement component active, checking for movement needs...');
    
    const interval = setInterval(async () => {
      // Process each dwarf's movement
      for (const dwarf of dwarves) {
        try {
          // Check if the dwarf has an active path
          if (dwarf.path && dwarf.path.length > 0) {
            // Move the dwarf along its path - only move one step at a time
            // This creates visual movement as the dwarf progresses along the path
            const nextPath = [...dwarf.path]; // Copy to avoid mutation
            const nextPosition = nextPath[0]; // Get the next position
            console.log(`Moving ${dwarf.name} one step along path from (${dwarf.x},${dwarf.y}) to (${nextPosition.x},${nextPosition.y})`);
            
            // Log the movement event
            logDwarfEvent(
              dwarf.id,
              dwarf.name,
              "MOVEMENT",
              `Moving from (${dwarf.x}, ${dwarf.y}) to (${nextPosition.x}, ${nextPosition.y})`,
              { x: dwarf.x, y: dwarf.y }
            );
            
            useDwarves.getState().moveDwarf(dwarf.id, nextPath);
            continue;
          }
          
          // Check if the dwarf has a target but no path
          if (dwarf.target && (!dwarf.path || dwarf.path.length === 0)) {
            // Dwarf's current position
            const start: Point2D = { x: dwarf.x, y: dwarf.y };
            
            // Calculate a path to the target
            console.log(`Finding path for ${dwarf.name} from (${start.x}, ${start.y}) to (${dwarf.target.x}, ${dwarf.target.y})`);
            const path = await findPath(start, dwarf.target);
            
            // If we found a path, set it on the dwarf
            if (path && path.length > 0) {
              console.log(`Path found for ${dwarf.name} with ${path.length} steps`);
              
              // Log the path finding event
              logDwarfEvent(
                dwarf.id,
                dwarf.name,
                "PATH_FOUND",
                `Found path to target (${dwarf.target.x}, ${dwarf.target.y}) with ${path.length} steps`,
                { x: dwarf.x, y: dwarf.y }
              );
              
              useDwarves.getState().updateDwarf(dwarf.id, { path, animation: 'walking' });
              
              // Start moving one step at a time
              const nextPath = [...path]; // Copy to avoid mutation
              const nextPosition = nextPath[0]; // Get the next position
              console.log(`Initial move for ${dwarf.name} from (${dwarf.x},${dwarf.y}) to (${nextPosition.x},${nextPosition.y})`);
              useDwarves.getState().moveDwarf(dwarf.id, nextPath);
            } else {
              console.log(`No path found for ${dwarf.name} to target (${dwarf.target.x}, ${dwarf.target.y})`);
              
              // Log the failed pathfinding
              logDwarfEvent(
                dwarf.id,
                dwarf.name,
                "NO_PATH_FOUND",
                `Unable to find path to target (${dwarf.target.x}, ${dwarf.target.y})`,
                { x: dwarf.x, y: dwarf.y }
              );
              
              // If we couldn't find a path, clear the target
              useDwarves.getState().updateDwarf(dwarf.id, { 
                target: undefined,
                animation: 'idle',
                currentTask: 'idle',
                state: 'idle'
              });
            }
          }
        } catch (error) {
          console.error(`Error processing movement for dwarf ${dwarf.id}:`, error);
        }
      }
    }, MOVEMENT_CHECK_INTERVAL / speed);
    
    return () => clearInterval(interval);
  }, [dwarves, phase, speed]);
  
  // Handle cases where a dwarf has reached their target
  useEffect(() => {
    dwarves.forEach(dwarf => {
      // If the dwarf has no path but has a target, and they're at the target position
      if (
        (!dwarf.path || dwarf.path.length === 0) && 
        dwarf.target && 
        dwarf.x === dwarf.target.x && 
        dwarf.y === dwarf.target.y
      ) {
        console.log(`${dwarf.name} has reached target (${dwarf.target.x}, ${dwarf.target.y})`);
        
        // Log the target reached event
        logDwarfEvent(
          dwarf.id,
          dwarf.name,
          "TARGET_REACHED",
          `Reached target position (${dwarf.target.x}, ${dwarf.target.y}) for task ${dwarf.currentTask}`,
          { x: dwarf.x, y: dwarf.y }
        );
        
        // Clear the target since we've reached it
        useDwarves.getState().updateDwarf(dwarf.id, { 
          target: undefined,
          animation: dwarf.state === 'idle' ? 'idle' : 'working' // Appropriate animation based on state
        });
      }
    });
  }, [dwarves]);
  
  return null; // This component doesn't render anything
};

export default DwarfMovement;