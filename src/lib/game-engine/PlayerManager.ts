import * as THREE from 'three';

export class PlayerManager {
  private player: THREE.Group;
  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private walkAnimation: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private moveSpeed: number = 0.1;

  constructor(private scene: THREE.Scene) {}

  createPlayer(): void {
    this.player = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.player.add(this.body);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFCC99 });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
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

    this.player.position.set(0, 0.95, 0);
    this.scene.add(this.player);
  }
  
  getPlayerPosition(): THREE.Vector3 {
    return this.player.position;
  }

  movePlayerToSquare(square: THREE.Object3D): void {
    this.targetPosition = new THREE.Vector3(square.position.x, 0.95, square.position.z);
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

  update(): void {
    if (this.targetPosition) {
      const currentPosition = this.player.position;
      const direction = this.targetPosition.clone().sub(currentPosition);
      const distance = direction.length();

      if (distance > this.moveSpeed) {
        direction.normalize().multiplyScalar(this.moveSpeed);
        this.player.position.add(direction);
        this.player.lookAt(this.targetPosition);
        this.animateWalk();
      } else {
        this.player.position.copy(this.targetPosition);
        this.resetPose();
        this.targetPosition = null;
      }
    }
  }
}