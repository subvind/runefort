import * as THREE from 'three';
import { BoardManager } from '../BoardManager';
import { TerrainData, TerrainType } from './TerrainType';
import { TerrainGenerator } from './TerrainGenerator';

export class TerrainApplier {
  constructor(private boardManager: BoardManager, private terrainMap: Map<string, TerrainData>) {}

  apply(): void {
    const board = this.boardManager.getBoard();
    board.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const position = object.position;
        const tileX = Math.floor(position.x / this.boardManager.getSquareSize());
        const tileZ = Math.floor(position.z / this.boardManager.getSquareSize());
        const terrainData = this.terrainMap.get(`${tileX},${tileZ}`);

        if (terrainData) {
          this.applyTerrainToSquare(object, terrainData, tileX, tileZ);
        }
      }
    });
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
}