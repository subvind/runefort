import * as THREE from 'three';
import { BoardManager } from './BoardManager';
import { TerrainType, TerrainData } from './MapManager/TerrainType';
import { WaveFormCollapse } from './MapManager/WaveFormCollapse';
import { TerrainGenerator } from './MapManager/TerrainGenerator';
import { TerrainSmoother } from './MapManager/TerrainSmoother';
import { TerrainApplier } from './MapManager/TerrainApplier';

export class MapManager {
  private terrainMap: Map<string, TerrainData> = new Map();
  private mapWidth: number = 0;
  private mapHeight: number = 0;

  constructor(private boardManager: BoardManager) {}

  generateMap(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
    const wfc = new WaveFormCollapse(width, height);
    this.terrainMap = wfc.generate();
    const smoother = new TerrainSmoother(width, height);
    this.terrainMap = smoother.smoothTerrain(this.terrainMap);
  }

  getTerrainType(x: number, z: number): TerrainType {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    const terrainData = this.terrainMap.get(key);
    return terrainData ? terrainData.type : TerrainType.Grass; // Default to grass if not found
  }

  applyMapToBoard(): void {
    const applier = new TerrainApplier(this.boardManager, this.terrainMap);
    applier.apply();
  }

  public getInterpolatedHeight(x: number, z: number): number {
    return TerrainGenerator.getInterpolatedHeight(x, z, this.terrainMap, this.boardManager.getSquareSize());
  }
}