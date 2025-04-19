import * as THREE from 'three';
import { Point2D, Direction } from '../types/game';

// Constants for the isometric projection
const TILE_WIDTH = 1;
const TILE_HEIGHT = 0.5;
const TILE_DEPTH = 0.7;

/**
 * Converts grid coordinates to isometric coordinates
 */
export function gridToIso(x: number, y: number, z: number = 0): THREE.Vector3 {
  return new THREE.Vector3(
    (x - y) * (TILE_WIDTH / 2),
    z * TILE_DEPTH,
    (x + y) * (TILE_HEIGHT / 2)
  );
}

/**
 * Converts isometric coordinates to grid coordinates
 */
export function isoToGrid(x: number, y: number): Point2D {
  // First determine the z-depth (we assume ground level)
  const z = y / TILE_DEPTH;
  
  // Then solve for grid coords
  const gridX = ((x / (TILE_WIDTH / 2)) + ((y - z * TILE_DEPTH) / (TILE_HEIGHT / 2))) / 2;
  const gridY = ((y - z * TILE_DEPTH) / (TILE_HEIGHT / 2) - (x / (TILE_WIDTH / 2))) / 2;
  
  return { x: Math.round(gridX), y: Math.round(gridY) };
}

/**
 * Calculates the direction from one point to another
 */
export function getDirection(fromX: number, fromY: number, toX: number, toY: number): Direction {
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  if (dx === 0 && dy === 0) return "south"; // Default direction if no movement
  
  // Determine the primary direction based on the dominant axis
  if (Math.abs(dx) > Math.abs(dy)) {
    // East-West dominant
    if (dx > 0) {
      return Math.abs(dy) > Math.abs(dx) / 2 ? (dy > 0 ? "southeast" : "northeast") : "east";
    } else {
      return Math.abs(dy) > Math.abs(dx) / 2 ? (dy > 0 ? "southwest" : "northwest") : "west";
    }
  } else {
    // North-South dominant
    if (dy > 0) {
      return Math.abs(dx) > Math.abs(dy) / 2 ? (dx > 0 ? "southeast" : "southwest") : "south";
    } else {
      return Math.abs(dx) > Math.abs(dy) / 2 ? (dx > 0 ? "northeast" : "northwest") : "north";
    }
  }
}

/**
 * Gets the angle in radians for a given direction
 */
export function getDirectionAngle(direction: Direction): number {
  const angles: Record<Direction, number> = {
    "east": 0,
    "northeast": Math.PI * 0.25,
    "north": Math.PI * 0.5,
    "northwest": Math.PI * 0.75,
    "west": Math.PI,
    "southwest": Math.PI * 1.25,
    "south": Math.PI * 1.5,
    "southeast": Math.PI * 1.75
  };
  
  return angles[direction];
}

/**
 * Calculates Manhattan distance between two points
 */
export function getManhattanDistance(p1: Point2D, p2: Point2D): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Gets adjacent grid positions
 */
export function getAdjacentPositions(pos: Point2D): Point2D[] {
  return [
    { x: pos.x + 1, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x, y: pos.y - 1 }
  ];
}

/**
 * Creates a box geometry for isometric tiles
 */
export function createIsometricBox(width: number = 1, height: number = 1, depth: number = 1): THREE.BufferGeometry {
  const w = width * TILE_WIDTH;
  const h = height * TILE_DEPTH;
  const d = depth * TILE_HEIGHT;
  
  return new THREE.BoxGeometry(w, h, d);
}

/**
 * Helper to create isometric coordinates for UI positioning
 */
export function worldToScreenPosition(position: THREE.Vector3, camera: THREE.Camera, canvas: HTMLElement): THREE.Vector2 {
  const vector = position.clone();
  vector.project(camera);
  
  return new THREE.Vector2(
    (vector.x + 1) * canvas.clientWidth / 2,
    (-vector.y + 1) * canvas.clientHeight / 2
  );
}
