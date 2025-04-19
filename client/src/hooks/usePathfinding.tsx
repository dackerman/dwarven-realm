import { useState, useCallback, useEffect } from 'react';
import { GridCell, Point2D, GameWorld } from '../types/game';
import { getManhattanDistance } from '../lib/isometricUtils';
import { findPath } from '../lib/api';

interface PathfindingProps {
  world: GameWorld;
  start: Point2D;
  end: Point2D;
  onPathFound?: (path: Point2D[]) => void;
}

export function usePathfinding({ world, start, end, onPathFound }: PathfindingProps) {
  const [path, setPath] = useState<Point2D[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePath = useCallback(async () => {
    if (!world || !start || !end) return;
    
    // Don't calculate if start and end are the same
    if (start.x === end.x && start.y === end.y) {
      setPath([]);
      return;
    }
    
    try {
      setIsCalculating(true);
      setError(null);
      
      // Call the server API for pathfinding
      const foundPath = await findPath(start, end);
      
      setPath(foundPath);
      if (onPathFound) onPathFound(foundPath);
    } catch (err) {
      console.error("Pathfinding error:", err);
      setError("Failed to find path");
      setPath([]);
    } finally {
      setIsCalculating(false);
    }
  }, [world, start, end, onPathFound]);

  useEffect(() => {
    calculatePath();
  }, [calculatePath]);

  // Local fallback implementation if API fails
  const calculateLocalPath = useCallback(() => {
    if (!world || !start || !end) return [];
    
    // If there's no grid or invalid coordinates, return empty path
    if (!world.grid || 
        start.x < 0 || start.x >= world.width || start.y < 0 || start.y >= world.height ||
        end.x < 0 || end.x >= world.width || end.y < 0 || end.y >= world.height) {
      return [];
    }
    
    // Simple A* algorithm
    const openSet: { pos: Point2D, f: number, g: number, parent: Point2D | null }[] = [];
    const closedSet = new Set<string>();
    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};
    
    // Initialize with start position
    const startKey = `${start.x},${start.y}`;
    gScore[startKey] = 0;
    fScore[startKey] = getManhattanDistance(start, end);
    openSet.push({ pos: start, f: fScore[startKey], g: 0, parent: null });
    
    while (openSet.length > 0) {
      // Sort by f-score and get the lowest
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.pos.x},${current.pos.y}`;
      
      // Check if we've reached the end
      if (current.pos.x === end.x && current.pos.y === end.y) {
        // Reconstruct path
        const path: Point2D[] = [];
        let curr = current;
        while (curr.parent) {
          path.unshift(curr.pos);
          const parentKey = `${curr.parent.x},${curr.parent.y}`;
          const parentEntry = openSet.find(item => 
            item.pos.x === curr.parent!.x && item.pos.y === curr.parent!.y
          ) || { pos: curr.parent, f: 0, g: gScore[parentKey] || 0, parent: null };
          curr = parentEntry;
        }
        return path;
      }
      
      closedSet.add(currentKey);
      
      // Check adjacent cells
      const directions = [
        { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
      ];
      
      for (const dir of directions) {
        const neighbor = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // Skip if out of bounds
        if (neighbor.x < 0 || neighbor.x >= world.width || 
            neighbor.y < 0 || neighbor.y >= world.height) {
          continue;
        }
        
        // Skip if in closed set
        if (closedSet.has(neighborKey)) {
          continue;
        }
        
        // Skip if not walkable
        const cell = world.grid[neighbor.y][neighbor.x];
        if (!cell.walkable) {
          continue;
        }
        
        // Calculate g score (distance from start)
        const tentativeG = current.g + 1;
        
        // Skip if we have a better path
        if (neighborKey in gScore && tentativeG >= gScore[neighborKey]) {
          continue;
        }
        
        // This is the best path so far, record it
        gScore[neighborKey] = tentativeG;
        fScore[neighborKey] = tentativeG + getManhattanDistance(neighbor, end);
        
        // Add to open set if not there
        if (!openSet.some(item => item.pos.x === neighbor.x && item.pos.y === neighbor.y)) {
          openSet.push({ 
            pos: neighbor, 
            f: fScore[neighborKey], 
            g: tentativeG, 
            parent: current.pos 
          });
        }
      }
    }
    
    // No path found
    return [];
  }, [world, start, end]);

  // If API fails, fall back to local pathfinding
  useEffect(() => {
    if (error) {
      const localPath = calculateLocalPath();
      setPath(localPath);
      if (onPathFound) onPathFound(localPath);
    }
  }, [error, calculateLocalPath, onPathFound]);

  return { path, isCalculating, error, calculatePath };
}
