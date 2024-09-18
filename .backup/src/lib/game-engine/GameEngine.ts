import * as THREE from 'three';
import { BoardManager } from './BoardManager';
import { PlayerManager } from './PlayerManager';
import { CameraManager } from './CameraManager';
import { InputManager } from './InputManager';

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private boardManager: BoardManager;
  private playerManager: PlayerManager;
  private cameraManager: CameraManager;
  private inputManager: InputManager;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.boardManager = new BoardManager(this.scene);
    this.playerManager = new PlayerManager(this.scene);
    this.cameraManager = new CameraManager(this.camera, this.playerManager.getPlayer());
    this.inputManager = new InputManager(this.renderer.domElement, this.camera, this.boardManager, this.playerManager, this.cameraManager);

    this.init();

    window.addEventListener('resize', () => this.onWindowResize(container), false);
  }

  private init(): void {
    this.boardManager.createBoard();
    this.playerManager.createPlayer();
    this.addLighting();
    this.cameraManager.updateCameraPosition();
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
    this.cameraManager.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}