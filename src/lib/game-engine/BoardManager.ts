import * as THREE from 'three';
import { MapManager } from './MapManager';
import { TerrainType } from './MapManager/TerrainType';

export class BoardManager {
  private board: THREE.Group;
  private tileSize: number = 8; // Size of each tile (8x8 squares)
  private squareSize: number = 1;
  private loadedTiles: Map<string, THREE.Group> = new Map();
  private visibleRange: number = 3; // Number of tiles visible in each direction
  private mapManager: MapManager;

  constructor(private scene: THREE.Scene) {
    this.board = new THREE.Group();
    this.scene.add(this.board);
  }

  createBoard(mapManager: MapManager): void {
    this.mapManager = mapManager;
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
        const worldX = x + tileX * this.tileSize;
        const worldZ = z + tileZ * this.tileSize;
        const terrainType = this.mapManager.getTerrainType(worldX, worldZ);
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.MeshPhongMaterial({
          color: this.getColorForTerrainType(terrainType),
          vertexColors: true,
        });

        const positions = [];
        const colors = [];
        const indices = [];
        const color = new THREE.Color(this.getColorForTerrainType(terrainType));

        for (let i = 0; i <= 1; i++) {
          for (let j = 0; j <= 1; j++) {
            const vx = worldX + i;
            const vz = worldZ + j;
            const height = this.mapManager.getInterpolatedHeight(vx, vz);
            positions.push(i * this.squareSize, height, j * this.squareSize);
            colors.push(color.r, color.g, color.b);
          }
        }

        indices.push(0, 1, 2, 2, 1, 3);

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const square = new THREE.Mesh(geometry, material);
        square.position.set(
          x * this.squareSize - tileOffset + tileX * this.tileSize * this.squareSize,
          0,
          z * this.squareSize - tileOffset + tileZ * this.tileSize * this.squareSize
        );
        square.userData.defaultColor = color.getHex();
        tile.add(square);
      }
    }

    return tile;
  }

  private getColorForTerrainType(terrainType: TerrainType): number {
    switch (terrainType) {
      case TerrainType.Dirt: return 0x8B4513;
      case TerrainType.Grass: return 0x228B22;
      case TerrainType.Tree: return 0x006400;
      case TerrainType.Building: return 0xA0522D;
      case TerrainType.Wall: return 0x808080;
      case TerrainType.Path: return 0xD2B48C;
      case TerrainType.Bridge: return 0x8B4513;
      case TerrainType.Water: return 0x4169E1;
      default: return 0xFFFFFF;
    }
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

  getVisibleRange() {
    return this.visibleRange;
  }
  getTileSize() {
    return this.tileSize;
  }

  highlightSquare(square: THREE.Mesh): void {
    const geometry = square.geometry as THREE.BufferGeometry;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const highlightColor = new THREE.Color(0xFFFF00);
    for (let i = 0; i < colors.count; i++) {
      colors.setXYZ(i, highlightColor.r, highlightColor.g, highlightColor.b);
    }
    colors.needsUpdate = true;
  }

  resetHighlight(square: THREE.Mesh): void {
    const geometry = square.geometry as THREE.BufferGeometry;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const defaultColor = new THREE.Color(square.userData.defaultColor);
    for (let i = 0; i < colors.count; i++) {
      colors.setXYZ(i, defaultColor.r, defaultColor.g, defaultColor.b);
    }
    colors.needsUpdate = true;
  }

  getTerrainHeight(x: number, z: number): number {
    return this.mapManager.getInterpolatedHeight(x, z);
  }
}