import * as THREE from 'three';

export class PlayerManager {
  private player: THREE.Mesh;

  constructor(private scene: THREE.Scene) {}

  createPlayer(): void {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.set(0, 0.3, 0);
    this.scene.add(this.player);
  }

  getPlayerPosition(): THREE.Vector3 {
    return this.player.position;
  }

  movePlayerToSquare(square: THREE.Object3D): void {
    this.player.position.x = square.position.x;
    this.player.position.z = square.position.z;
    this.player.position.y = 0.3; // Slightly above the board
  }
}