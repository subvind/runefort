import * as THREE from 'three';
import { BoardManager } from './BoardManager';
import { TerrainType, TerrainData } from './MapManager/TerrainType';
import { WaveFormCollapse } from './MapManager/WaveFormCollapse';
import { TerrainGenerator } from './MapManager/TerrainGenerator';
import { TerrainSmoother } from './MapManager/TerrainSmoother';
import { TerrainApplier } from './MapManager/TerrainApplier';

export class MapManager {
  private terrainMap: Map<string, TerrainData> = new Map();
  private wfc: WaveFormCollapse;
  private smoother: TerrainSmoother;
  private applier: TerrainApplier;

  constructor(private boardManager: BoardManager) {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const chunkSize = (visibleRange * 2 + 1) * tileSize;
    
    this.wfc = new WaveFormCollapse(chunkSize, chunkSize);
    this.smoother = new TerrainSmoother(chunkSize, chunkSize);
    this.applier = new TerrainApplier(this.boardManager, this.terrainMap);
  }

  updateTerrain(centerX: number, centerZ: number): void {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const chunkSize = (visibleRange * 2 + 1) * tileSize;
    const halfSize = (visibleRange + 1) * tileSize;

    for (let x = centerX - halfSize; x <= centerX + halfSize; x += chunkSize) {
      for (let z = centerZ - halfSize; z <= centerZ + halfSize; z += chunkSize) {
        this.generateTerrainChunk(x, z, chunkSize);
      }
    }

    this.cleanupDistantTerrain(centerX, centerZ, halfSize + chunkSize);
  }

  private generateTerrainChunk(x: number, z: number, size: number): void {
    const chunkKey = `${Math.floor(x / size)},${Math.floor(z / size)}`;
    if (!this.terrainMap.has(chunkKey)) {
      const newChunk = this.wfc.generateChunk(size, size);
      const smoothedChunk = this.smoother.smoothChunk(newChunk);
      for (const [key, value] of smoothedChunk) {
        const [localX, localZ] = key.split(',').map(Number);
        const globalX = x + localX;
        const globalZ = z + localZ;
        this.terrainMap.set(`${globalX},${globalZ}`, value);
      }
    }
  }

  private cleanupDistantTerrain(centerX: number, centerZ: number, maxDistance: number): void {
    for (const [key, _] of this.terrainMap) {
      const [x, z] = key.split(',').map(Number);
      if (Math.abs(x - centerX) > maxDistance || Math.abs(z - centerZ) > maxDistance) {
        this.terrainMap.delete(key);
      }
    }
  }

  getTerrainType(x: number, z: number): TerrainType {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    const terrainData = this.terrainMap.get(key);
    return terrainData ? terrainData.type : TerrainType.Grass;
  }

  applyMapToBoard(centerX: number, centerZ: number): void {
    this.applier.apply(centerX, centerZ, this.terrainMap);
  }

  getInterpolatedHeight(x: number, z: number): number {
    return TerrainGenerator.getInterpolatedHeight(x, z, this.terrainMap, this.boardManager.getSquareSize());
  }
}