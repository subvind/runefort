import * as THREE from 'three';
import { MapManager } from './MapManager';

export class PlayerManager {
  private player: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Group;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private walkAnimation: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private moveSpeed: number = 0.1;

  constructor(private scene: THREE.Scene, private mapManager: MapManager) {}

  createPlayer(): void {
    this.player = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.player.add(this.body);

    // Head
    this.head = new THREE.Group();
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFCC99 });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    this.head.add(headMesh);

    // Face
    this.addFace();

    this.head.position.set(0, 0.625, 0);
    this.player.add(this.head);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.125, 0.5, 0.125);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(0.3125, 0.125, 0);
    this.player.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(-0.3125, 0.125, 0);
    this.player.add(this.rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.125, 0.5, 0.125);
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x0000FF });
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(0.125, -0.625, 0);
    this.player.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(-0.125, -0.625, 0);
    this.player.add(this.rightLeg);

    this.player.position.set(0, this.getTerrainHeight(0, 0), 0);
    this.scene.add(this.player);
  }

  private addFace(): void {
    const eyeGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.1, 0.1, 0.25);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.1, 0.1, 0.25);
    this.head.add(rightEye);

    const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
    const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.1, 0.25);
    this.head.add(mouth);
  }

  private animateWalk(): void {
    this.walkAnimation += 0.2;
    const swingAngle = Math.sin(this.walkAnimation) * 0.5;

    this.leftArm.rotation.x = -swingAngle;
    this.rightArm.rotation.x = swingAngle;
    this.leftLeg.rotation.x = swingAngle;
    this.rightLeg.rotation.x = -swingAngle;
  }

  private resetPose(): void {
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
  }

  getPlayerPosition(): THREE.Vector3 {
    return this.player.position;
  }

  movePlayerToSquare(square: THREE.Object3D): void {
    const terrainHeight = this.getTerrainHeight(square.position.x, square.position.z);
    this.targetPosition = new THREE.Vector3(square.position.x, terrainHeight, square.position.z);
  }

  private getTerrainHeight(x: number, z: number): number {
    const terrainHeight = this.mapManager.getInterpolatedHeight(x, z);
    return terrainHeight + 0.95; // Add player's height offset
  }

  update(): void {
    if (this.targetPosition) {
      const currentPosition = this.player.position;
      const direction = this.targetPosition.clone().sub(currentPosition);
      const distance = direction.length();

      if (distance > this.moveSpeed) {
        direction.normalize().multiplyScalar(this.moveSpeed);
        const newPosition = currentPosition.clone().add(direction);
        
        // Update Y position based on terrain height
        newPosition.y = this.getTerrainHeight(newPosition.x, newPosition.z);
        
        this.player.position.copy(newPosition);
        this.player.lookAt(new THREE.Vector3(this.targetPosition.x, this.player.position.y, this.targetPosition.z));
        this.animateWalk();
      } else {
        this.player.position.copy(this.targetPosition);
        this.resetPose();
        this.targetPosition = null;
      }
    }
  }
}