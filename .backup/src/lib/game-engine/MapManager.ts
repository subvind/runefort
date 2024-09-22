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

  constructor(private boardManager: BoardManager) {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const initialSize = (visibleRange * 2 + 1) * tileSize;
    
    this.wfc = new WaveFormCollapse(initialSize, initialSize);
    this.smoother = new TerrainSmoother(initialSize, initialSize);
  }

  updateTerrain(centerX: number, centerZ: number): void {
    const tileSize = this.boardManager.getTileSize();
    const visibleRange = this.boardManager.getVisibleRange();
    const halfSize = (visibleRange + 1) * tileSize;

    for (let x = centerX - halfSize; x <= centerX + halfSize; x += tileSize) {
      for (let z = centerZ - halfSize; z <= centerZ + halfSize; z += tileSize) {
        this.generateTerrainChunk(x, z, tileSize);
      }
    }

    this.cleanupDistantTerrain(centerX, centerZ, halfSize + tileSize);
  }

  private generateTerrainChunk(x: number, z: number, size: number): void {
    const chunkKey = `${Math.floor(x / size)},${Math.floor(z / size)}`;
    if (!this.terrainMap.has(chunkKey)) {
      const newChunk = this.wfc.generateChunk(size, size);
      const smoothedChunk = this.smoother.smoothChunk(newChunk);
      for (const [key, value] of smoothedChunk) {
        this.terrainMap.set(`${x + parseInt(key.split(',')[0])},${z + parseInt(key.split(',')[1])}`, value);
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
    const applier = new TerrainApplier(this.boardManager, this.terrainMap);
    applier.apply(centerX, centerZ);
  }

  getInterpolatedHeight(x: number, z: number): number {
    return TerrainGenerator.getInterpolatedHeight(x, z, this.terrainMap, this.boardManager.getSquareSize());
  }
}