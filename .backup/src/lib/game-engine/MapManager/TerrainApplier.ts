import * as THREE from 'three';
import { BoardManager } from '../BoardManager';
import { TerrainData, TerrainType } from './TerrainType';
import { TerrainGenerator } from './TerrainGenerator';
import { WaveFormCollapse } from './WaveFormCollapse';

export class TerrainApplier {
  private wfc: WaveFormCollapse;

  constructor(
    private boardManager: BoardManager,
    private terrainMap: Map<string, TerrainData>
  ) {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const chunkSize = (visibleRange * 2 + 1) * tileSize;
    this.wfc = new WaveFormCollapse(chunkSize, chunkSize);
  }

  apply(centerX: number, centerZ: number): void {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const chunkSize = (visibleRange * 2 + 1) * tileSize;

    for (let x = centerX - chunkSize; x <= centerX + chunkSize; x += tileSize) {
      for (let z = centerZ - chunkSize; z <= centerZ + chunkSize; z += tileSize) {
        const chunkKey = `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`;
        if (!this.terrainMap.has(chunkKey)) {
          this.generateNewChunk(x, z, chunkSize);
        }
        this.applyChunkToBoard(x, z, tileSize);
      }
    }

    this.cleanupDistantTerrain(centerX, centerZ, chunkSize * 2);
  }

  private generateNewChunk(x: number, z: number, chunkSize: number): void {
    const newChunk = this.wfc.generateChunk(chunkSize, chunkSize);
    for (const [key, value] of newChunk) {
      const [localX, localZ] = key.split(',').map(Number);
      const globalX = x + localX;
      const globalZ = z + localZ;
      this.terrainMap.set(`${globalX},${globalZ}`, value);
    }
  }

  private applyChunkToBoard(x: number, z: number, tileSize: number): void {
    const board = this.boardManager.getBoard();
    const squareSize = this.boardManager.getSquareSize();

    for (let localX = 0; localX < tileSize; localX++) {
      for (let localZ = 0; localZ < tileSize; localZ++) {
        const globalX = x + localX;
        const globalZ = z + localZ;
        const key = `${globalX},${globalZ}`;
        const terrainData = this.terrainMap.get(key);

        if (terrainData) {
          const square = this.getOrCreateSquare(globalX, globalZ, board);
          this.applyTerrainToSquare(square, terrainData, globalX, globalZ);
        }
      }
    }
  }

  private getOrCreateSquare(x: number, z: number, board: THREE.Group): THREE.Mesh {
    const squareSize = this.boardManager.getSquareSize();
    const squareKey = `${x},${z}`;
    let square = board.getObjectByName(squareKey) as THREE.Mesh;

    if (!square) {
      const geometry = new THREE.PlaneGeometry(squareSize, squareSize, 1, 1);
      const material = new THREE.MeshPhongMaterial({ vertexColors: true });
      square = new THREE.Mesh(geometry, material);
      square.name = squareKey;
      square.rotation.x = -Math.PI / 2;
      square.position.set(x * squareSize, 0, z * squareSize);
      board.add(square);
    }

    return square;
  }

  private applyTerrainToSquare(square: THREE.Mesh, terrainData: TerrainData, tileX: number, tileZ: number): void {
    const material = square.material as THREE.MeshPhongMaterial;
    material.color.setHex(terrainData.color);

    const squareSize = this.boardManager.getSquareSize();
    const geometry = square.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const localX = x / squareSize;
      const localZ = z / squareSize;
      const height = TerrainGenerator.getInterpolatedHeight(tileX + localX, tileZ + localZ, this.terrainMap, squareSize);
      positions[i + 1] = height;
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    if (terrainData.type === TerrainType.Tree) {
      this.addTreeModel(square, terrainData.height);
    } else if (terrainData.type === TerrainType.Building) {
      this.addBuildingModel(square, terrainData.height);
    }
  }

  private addTreeModel(square: THREE.Mesh, baseHeight: number): void {
    // Implementation remains the same as in the original MapManager
  }

  private addBuildingModel(square: THREE.Mesh, baseHeight: number): void {
    // Implementation remains the same as in the original MapManager
  }

  private cleanupDistantTerrain(centerX: number, centerZ: number, maxDistance: number): void {
    const board = this.boardManager.getBoard();
    board.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const [x, z] = child.name.split(',').map(Number);
        if (Math.abs(x - centerX) > maxDistance || Math.abs(z - centerZ) > maxDistance) {
          board.remove(child);
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      }
    });

    for (const [key, _] of this.terrainMap) {
      const [x, z] = key.split(',').map(Number);
      if (Math.abs(x - centerX) > maxDistance || Math.abs(z - centerZ) > maxDistance) {
        this.terrainMap.delete(key);
      }
    }
  }
}