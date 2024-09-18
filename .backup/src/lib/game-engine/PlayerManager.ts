import * as THREE from 'three';

export class PlayerManager {
  private scene: THREE.Scene;
  private player: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createPlayer(): void {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.set(0, 0.3, 0);
    this.scene.add(this.player);
  }

  getPlayer(): THREE.Mesh {
    return this.player;
  }

  movePlayerToSquare(square: THREE.Object3D): void {
    this.player.position.x = square.position.x;
    this.player.position.z = square.position.z;
    this.player.position.y = 0.3; // Slightly above the board
  }
}