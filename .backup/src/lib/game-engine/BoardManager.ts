import * as THREE from 'three';

export class BoardManager {
  private board: THREE.Group;
  private boardSize: number = 8;
  private squareSize: number = 1;

  constructor(private scene: THREE.Scene) {
    this.board = new THREE.Group();
  }

  createBoard(): void {
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

  getBoard(): THREE.Group {
    return this.board;
  }
}