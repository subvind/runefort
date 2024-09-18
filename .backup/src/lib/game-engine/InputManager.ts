import * as THREE from 'three';
import { BoardManager } from './BoardManager';
import { PlayerManager } from './PlayerManager';
import { CameraManager } from './CameraManager';

export class InputManager {
  private domElement: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private boardManager: BoardManager;
  private playerManager: PlayerManager;
  private cameraManager: CameraManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    boardManager: BoardManager,
    playerManager: PlayerManager,
    cameraManager: CameraManager
  ) {
    this.domElement = domElement;
    this.camera = camera;
    this.boardManager = boardManager;
    this.playerManager = playerManager;
    this.cameraManager = cameraManager;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.domElement.addEventListener('click', (event) => this.onMouseClick(event), false);
    window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
    window.addEventListener('wheel', (event) => this.onWheel(event), false);
  }

  private onMouseClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.boardManager.getBoard().children);

    if (intersects.length > 0) {
      const clickedSquare = intersects[0].object;
      this.playerManager.movePlayerToSquare(clickedSquare);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    const rotationSpeed = 0.1;
    const tiltSpeed = 0.05;
    switch (event.key) {
      case 'a':
      case 'ArrowLeft':
        this.cameraManager.rotateCamera(rotationSpeed);
        break;
      case 'd':
      case 'ArrowRight':
        this.cameraManager.rotateCamera(-rotationSpeed);
        break;
      case 'w':
      case 'ArrowUp':
        this.cameraManager.tiltCamera(-tiltSpeed);
        break;
      case 's':
      case 'ArrowDown':
        this.cameraManager.tiltCamera(tiltSpeed);
        break;
    }
  }

  private onWheel(event: WheelEvent): void {
    const zoomSpeed = 0.1;
    this.cameraManager.zoomCamera(event.deltaY * zoomSpeed);
  }
}