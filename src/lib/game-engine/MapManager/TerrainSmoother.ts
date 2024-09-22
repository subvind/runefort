import { TerrainData } from './TerrainType';

export class TerrainSmoother {
  constructor(private mapWidth: number, private mapHeight: number) {}

  smoothTerrain(terrainMap: Map<string, TerrainData>): Map<string, TerrainData> {
    const smoothedMap = new Map<string, TerrainData>();
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const currentTerrain = terrainMap.get(`${x},${y}`)!;
        const neighbors = this.getNeighbors(x, y, terrainMap);
        const avgHeight = neighbors.reduce((sum, neighbor) => sum + neighbor.height, currentTerrain.height) / (neighbors.length + 1);
        smoothedMap.set(`${x},${y}`, { ...currentTerrain, height: avgHeight });
      }
    }
    return smoothedMap;
  }

  private getNeighbors(x: number, y: number, terrainMap: Map<string, TerrainData>): TerrainData[] {
    const neighbors: TerrainData[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
          const neighbor = terrainMap.get(`${nx},${ny}`);
          if (neighbor) neighbors.push(neighbor);
        }
      }
    }
    return neighbors;
  }
  
  smoothChunk(chunk: Map<string, TerrainData>): Map<string, TerrainData> {
    const smoothedChunk = new Map<string, TerrainData>();
    const chunkSize = Math.sqrt(chunk.size);
    const padding = 1; // Add padding to consider neighboring chunks

    for (let x = -padding; x < chunkSize + padding; x++) {
      for (let y = -padding; y < chunkSize + padding; y++) {
        const key = `${x},${y}`;
        const currentTerrain = chunk.get(key);
        
        if (currentTerrain) {
          const neighbors = this.getChunkNeighbors(x, y, chunk, chunkSize);
          const avgHeight = this.calculateAverageHeight(currentTerrain, neighbors);
          smoothedChunk.set(key, { ...currentTerrain, height: avgHeight });
        }
      }
    }

    // Remove padding cells
    for (let x = -padding; x < chunkSize + padding; x++) {
      for (let y = -padding; y < chunkSize + padding; y++) {
        if (x < 0 || x >= chunkSize || y < 0 || y >= chunkSize) {
          smoothedChunk.delete(`${x},${y}`);
        }
      }
    }

    return smoothedChunk;
  }

  private getChunkNeighbors(x: number, y: number, chunk: Map<string, TerrainData>, chunkSize: number): TerrainData[] {
    const neighbors: TerrainData[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        const neighbor = chunk.get(`${nx},${ny}`);
        if (neighbor) neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  private calculateAverageHeight(current: TerrainData, neighbors: TerrainData[]): number {
    const totalHeight = neighbors.reduce((sum, neighbor) => sum + neighbor.height, current.height);
    return totalHeight / (neighbors.length + 1);
  }
}