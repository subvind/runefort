import * as THREE from 'three';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private cameraDistance: number = 10;
  private cameraRotation: number = 0;
  private cameraTilt: number = Math.PI / 4; // Initial tilt angle

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  }

  updateCameraPosition(playerPosition: THREE.Vector3): void {
    const cameraOffset = new THREE.Vector3(
      Math.sin(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance
    );
    this.camera.position.copy(playerPosition).add(cameraOffset);
    this.camera.lookAt(playerPosition);
  }

  updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  rotateCamera(direction: 'left' | 'right'): void {
    const rotationSpeed = 0.1;
    this.cameraRotation += direction === 'left' ? rotationSpeed : -rotationSpeed;
  }

  tiltCamera(direction: 'up' | 'down'): void {
    const tiltSpeed = 0.05;
    if (direction === 'up') {
      this.cameraTilt = Math.max(0.1, this.cameraTilt - tiltSpeed);
    } else {
      this.cameraTilt = Math.min(Math.PI / 2, this.cameraTilt + tiltSpeed);
    }
  }

  zoom(delta: number): void {
    this.cameraDistance += delta;
    this.cameraDistance = Math.max(2, Math.min(30, this.cameraDistance)); // Adjusted zoom range
  }
}