import { useThree } from '@react-three/fiber';
import { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useMemo } from 'react';
import { gridToIso, isoToGrid } from '../lib/isometricUtils';
import { Point2D } from '../types/game';

export function useIsometricCamera() {
  const { camera, size } = useThree();
  
  useEffect(() => {
    // Set up isometric camera position
    const distance = 20;
    const angle = Math.PI / 4; // 45 degrees
    
    // Position camera for isometric view
    camera.position.set(
      distance * Math.cos(angle),
      distance * 0.8, // Height above the scene
      distance * Math.sin(angle)
    );
    
    // Look at the center
    camera.lookAt(0, 0, 0);
    
    // Update perspective for isometric view
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 45;
      camera.near = 0.1;
      camera.far = 1000;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);
  
  // Function to pan the camera
  const panCamera = useCallback((deltaX: number, deltaY: number) => {
    const speed = 0.1;
    const dir = new THREE.Vector3();
    const rightVector = new THREE.Vector3();
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // Get right and forward vectors from camera
    camera.getWorldDirection(dir);
    rightVector.crossVectors(upVector, dir).normalize();
    
    // Move camera position
    camera.position.addScaledVector(rightVector, deltaX * speed);
    
    // For vertical movement, use a vector perpendicular to both
    // the up vector and the right vector (essentially the camera's forward vector but on the horizontal plane)
    const forwardVector = new THREE.Vector3();
    forwardVector.crossVectors(rightVector, upVector);
    camera.position.addScaledVector(forwardVector, deltaY * speed);
    
    // Update the target that the camera is looking at to maintain the same view angle
    const target = new THREE.Vector3();
    target.copy(camera.position).add(dir);
    camera.lookAt(target);
  }, [camera]);
  
  // Function to zoom the camera
  const zoomCamera = useCallback((delta: number) => {
    const speed = 0.1;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    
    // Prevent zooming too close to the ground
    const futurePosition = camera.position.clone().addScaledVector(dir, delta * speed);
    if (futurePosition.y > 2) { // Minimum height above ground
      camera.position.addScaledVector(dir, delta * speed);
    }
  }, [camera]);
  
  return { panCamera, zoomCamera };
}

export function useGridSelection() {
  const { camera, raycaster, mouse, scene } = useThree();
  const [selectedTile, setSelectedTile] = useState<Point2D | null>(null);
  
  // Ground plane for raycasting
  const groundPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }, []);
  
  const checkIntersection = useCallback((event: MouseEvent) => {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray
    raycaster.setFromCamera(mouse, camera);
    
    // Create a point to store the intersection
    const intersectionPoint = new THREE.Vector3();
    
    // Check for intersection with the ground plane
    if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
      // Convert the 3D intersection point to grid coordinates
      const gridPos = isoToGrid(intersectionPoint.x, intersectionPoint.z);
      setSelectedTile(gridPos);
      return gridPos;
    }
    
    return null;
  }, [camera, mouse, raycaster, groundPlane]);
  
  return { selectedTile, checkIntersection };
}

export function useTexture(path: string) {
  const texture = useMemo(() => {
    return new THREE.TextureLoader().load(path);
  }, [path]);
  
  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  }, [texture]);
  
  return texture;
}

export function useModelPosition(x: number, y: number, z: number = 0) {
  // Convert grid position to isometric position
  return useMemo(() => gridToIso(x, y, z), [x, y, z]);
}
