import * as THREE from 'three';

export class BoardManager {
  private board: THREE.Group;
  private tileSize: number = 8; // Size of each tile (8x8 squares)
  private squareSize: number = 1;
  private loadedTiles: Map<string, THREE.Group> = new Map();
  private visibleRange: number = 3; // Number of tiles visible in each direction

  constructor(private scene: THREE.Scene) {
    this.board = new THREE.Group();
    this.scene.add(this.board);
  }

  createBoard(): void {
    // Initial board creation is no longer needed
    // Tiles will be created dynamically based on player position
  }

  updateBoard(playerPosition: THREE.Vector3): void {
    const centerTileX = Math.floor(playerPosition.x / (this.tileSize * this.squareSize));
    const centerTileZ = Math.floor(playerPosition.z / (this.tileSize * this.squareSize));

    for (let x = centerTileX - this.visibleRange; x <= centerTileX + this.visibleRange; x++) {
      for (let z = centerTileZ - this.visibleRange; z <= centerTileZ + this.visibleRange; z++) {
        this.loadTile(x, z);
      }
    }

    this.unloadDistantTiles(centerTileX, centerTileZ);
  }

  private loadTile(tileX: number, tileZ: number): void {
    const tileKey = `${tileX},${tileZ}`;
    if (!this.loadedTiles.has(tileKey)) {
      const tile = this.createTile(tileX, tileZ);
      this.board.add(tile);
      this.loadedTiles.set(tileKey, tile);
    }
  }

  private createTile(tileX: number, tileZ: number): THREE.Group {
    const tile = new THREE.Group();
    const tileOffset = this.tileSize * this.squareSize / 2 - this.squareSize / 2;

    for (let x = 0; x < this.tileSize; x++) {
      for (let z = 0; z < this.tileSize; z++) {
        const geometry = new THREE.BoxGeometry(this.squareSize, 0.1, this.squareSize);
        const material = new THREE.MeshPhongMaterial({
          color: (x + z) % 2 === 0 ? 0xFFFFFF : 0x000000
        });
        const square = new THREE.Mesh(geometry, material);
        square.position.set(
          x * this.squareSize - tileOffset + tileX * this.tileSize * this.squareSize,
          0,
          z * this.squareSize - tileOffset + tileZ * this.tileSize * this.squareSize
        );
        square.userData.defaultColor = material.color.getHex();
        tile.add(square);
      }
    }

    return tile;
  }

  private unloadDistantTiles(centerTileX: number, centerTileZ: number): void {
    for (const [key, tile] of this.loadedTiles.entries()) {
      const [tileX, tileZ] = key.split(',').map(Number);
      if (
        Math.abs(tileX - centerTileX) > this.visibleRange ||
        Math.abs(tileZ - centerTileZ) > this.visibleRange
      ) {
        this.board.remove(tile);
        this.loadedTiles.delete(key);
      }
    }
  }

  getBoard(): THREE.Group {
    return this.board;
  }

  getSquareSize(): number {
    return this.squareSize;
  }

  highlightSquare(square: THREE.Mesh): void {
    (square.material as THREE.MeshPhongMaterial).color.setHex(0xFFFF00);
  }

  resetHighlight(square: THREE.Mesh): void {
    (square.material as THREE.MeshPhongMaterial).color.setHex(square.userData.defaultColor);
  }
}