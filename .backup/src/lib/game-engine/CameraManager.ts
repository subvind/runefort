import * as THREE from 'three';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;
  private player: THREE.Mesh | null;
  private cameraDistance: number = 10;
  private cameraRotation: number = 0;
  private cameraTilt: number = Math.PI / 4; // Initial tilt angle

  constructor(camera: THREE.PerspectiveCamera, player: THREE.Mesh | null) {
    this.camera = camera;
    this.player = player;
  }

  setPlayer(player: THREE.Mesh): void {
    this.player = player;
  }

  updateCameraPosition(): void {
    if (!this.player) {
      console.warn('Player not set in CameraManager');
      return;
    }

    const playerPosition = this.player.position;
    const cameraOffset = new THREE.Vector3(
      Math.sin(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance
    );
    this.camera.position.copy(playerPosition).add(cameraOffset);
    this.camera.lookAt(playerPosition);
  }

  rotateCamera(amount: number): void {
    this.cameraRotation += amount;
  }

  tiltCamera(amount: number): void {
    this.cameraTilt = Math.max(0.1, Math.min(Math.PI / 2, this.cameraTilt + amount));
  }

  zoomCamera(amount: number): void {
    this.cameraDistance = Math.max(5, Math.min(20, this.cameraDistance + amount));
  }
}