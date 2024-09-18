import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private player: THREE.Mesh;
  private board: THREE.Group;
  private boardSize: number = 8;
  private squareSize: number = 1;
  private cameraDistance: number = 10;
  private cameraRotation: number = 0;
  private cameraTilt: number = Math.PI / 4; // Initial tilt angle

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();

    window.addEventListener('resize', () => this.onWindowResize(container), false);
    this.renderer.domElement.addEventListener('click', (event) => this.onMouseClick(event), false);
    window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
    window.addEventListener('wheel', (event) => this.onWheel(event), false);
  }

  private init(): void {
    this.createBoard();
    this.createPlayer();
    this.addLighting();
    this.updateCameraPosition();
    this.animate();
  }

  private createBoard(): void {
    this.board = new THREE.Group();
    const boardOffset = (this.boardSize * this.squareSize) / 2 - this.squareSize / 2;

    for (let x = 0; x < this.boardSize; x++) {
      for (let z = 0; z < this.boardSize; z++) {
        const geometry = new THREE.BoxGeometry(this.squareSize, 0.1, this.squareSize);
        const material = new THREE.MeshPhongMaterial({
          color: (x + z) % 2 === 0 ? 0xFFFFFF : 0x000000
        });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(
          x * this.squareSize - boardOffset,
          0,
          z * this.squareSize - boardOffset
        );
        this.board.add(square);
      }
    }
    this.scene.add(this.board);
  }

  private createPlayer(): void {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.set(0, 0.3, 0);
    this.scene.add(this.player);
  }

  private addLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  }

  private updateCameraPosition(): void {
    const playerPosition = this.player.position;
    const cameraOffset = new THREE.Vector3(
      Math.sin(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraTilt) * this.cameraDistance,
      Math.cos(this.cameraRotation) * Math.sin(this.cameraTilt) * this.cameraDistance
    );
    this.camera.position.copy(playerPosition).add(cameraOffset);
    this.camera.lookAt(playerPosition);
  }

  private onWindowResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private onMouseClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.board.children);

    if (intersects.length > 0) {
      const clickedSquare = intersects[0].object;
      this.movePlayerToSquare(clickedSquare);
    }
  }

  private movePlayerToSquare(square: THREE.Object3D): void {
    this.player.position.x = square.position.x;
    this.player.position.z = square.position.z;
    this.player.position.y = 0.3; // Slightly above the board
  }

  private onKeyDown(event: KeyboardEvent): void {
    const rotationSpeed = 0.1;
    const tiltSpeed = 0.05;
    switch (event.key) {
      case 'a':
      case 'ArrowLeft':
        this.cameraRotation += rotationSpeed;
        break;
      case 'd':
      case 'ArrowRight':
        this.cameraRotation -= rotationSpeed;
        break;
      case 'w':
      case 'ArrowUp':
        this.cameraTilt = Math.max(0.1, this.cameraTilt - tiltSpeed);
        break;
      case 's':
      case 'ArrowDown':
        this.cameraTilt = Math.min(Math.PI / 2, this.cameraTilt + tiltSpeed);
        break;
    }
  }

  private onWheel(event: WheelEvent): void {
    const zoomSpeed = 0.1;
    this.cameraDistance += event.deltaY * zoomSpeed;
    this.cameraDistance = Math.max(5, Math.min(20, this.cameraDistance));
  }
}