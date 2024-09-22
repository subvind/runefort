import * as THREE from 'three';
import { BoardManager } from './BoardManager';
import { PlayerManager } from './PlayerManager';
import { CameraManager } from './CameraManager';
import { InputManager } from './InputManager';
import { MapManager } from './MapManager';

export class GameEngine {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private boardManager: BoardManager;
  private playerManager: PlayerManager;
  private cameraManager: CameraManager;
  private inputManager: InputManager;
  private mapManager: MapManager;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.boardManager = new BoardManager(this.scene);
    this.mapManager = new MapManager(this.boardManager);
    this.playerManager = new PlayerManager(this.scene, this.mapManager, this.boardManager);
    this.cameraManager = new CameraManager(container.clientWidth / container.clientHeight);
    this.inputManager = new InputManager(
      this.renderer.domElement,
      this.cameraManager,
      this.playerManager,
      this.boardManager
    );

    this.init();

    window.addEventListener('resize', () => this.onWindowResize(container), false);
  }

  private init(): void {
    this.mapManager.generateMap(20, 20); // Generate a 20x20 map
    this.boardManager.createBoard(this.mapManager);
    this.playerManager.createPlayer();
    this.addLighting();
    this.animate();
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
    this.playerManager.update();
    const playerPosition = this.playerManager.getPlayerPosition();
    this.boardManager.updateBoard(playerPosition);
    this.cameraManager.updateCameraPosition(playerPosition);
    this.renderer.render(this.scene, this.cameraManager.getCamera());
  }

  private onWindowResize(container: HTMLElement): void {
    this.cameraManager.updateAspect(container.clientWidth / container.clientHeight);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}