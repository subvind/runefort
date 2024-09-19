import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { PlayerManager } from './PlayerManager';
import { BoardManager } from './BoardManager';

export class InputManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(
    private domElement: HTMLCanvasElement,
    private cameraManager: CameraManager,
    private playerManager: PlayerManager,
    private boardManager: BoardManager
  ) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.domElement.addEventListener('click', (event) => this.onMouseClick(event), false);
    window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
    window.addEventListener('wheel', (event) => this.onWheel(event), false);
  }

  private onMouseClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());

    const intersects = this.raycaster.intersectObjects(this.boardManager.getBoard().children);

    if (intersects.length > 0) {
      const clickedSquare = intersects[0].object;
      this.playerManager.movePlayerToSquare(clickedSquare);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'a':
      case 'ArrowLeft':
        this.cameraManager.rotateCamera('left');
        break;
      case 'd':
      case 'ArrowRight':
        this.cameraManager.rotateCamera('right');
        break;
      case 'w':
      case 'ArrowUp':
        this.cameraManager.tiltCamera('up');
        break;
      case 's':
      case 'ArrowDown':
        this.cameraManager.tiltCamera('down');
        break;
    }
  }

  private onWheel(event: WheelEvent): void {
    const zoomFactor = 0.01; // Reduced zoom factor for more gradual zooming
    this.cameraManager.zoom(event.deltaY * zoomFactor);
  }
}