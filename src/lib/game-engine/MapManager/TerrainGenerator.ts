import { TerrainType, TerrainData } from './TerrainType';

export class TerrainGenerator {
  static createTerrainData(type: TerrainType): TerrainData {
    switch (type) {
      case TerrainType.Dirt:
        return { type, height: Math.random() * 0.5, color: 0x8B4513 };
      case TerrainType.Grass:
        return { type, height: 1.5 + Math.random() * 0.5, color: 0x808080 };
      case TerrainType.Tree:
        return { type, height: 0.5 + Math.random() * 0.5, color: 0x228B22 };
      case TerrainType.Building:
        return { type, height: 1 + Math.random() * 0.5, color: 0xA0522D };
      case TerrainType.Wall:
        return { type, height: 0.8 + Math.random() * 0.2, color: 0x808080 };
      case TerrainType.Path:
        return { type, height: 0.1, color: 0xD2B48C };
      case TerrainType.Bridge:
        return { type, height: 0.3 + Math.random() * 0.2, color: 0x8B4513 };
      case TerrainType.Water:
        return { type, height: -0.3 - Math.random() * 0.2, color: 0x4169E1 };
    }
  }

  static getInterpolatedHeight(x: number, z: number, terrainMap: Map<string, TerrainData>, squareSize: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const z1 = z0 + 1;

    const h00 = terrainMap.get(`${x0},${z0}`)?.height ?? 0;
    const h10 = terrainMap.get(`${x1},${z0}`)?.height ?? 0;
    const h01 = terrainMap.get(`${x0},${z1}`)?.height ?? 0;
    const h11 = terrainMap.get(`${x1},${z1}`)?.height ?? 0;

    const fx = x - x0;
    const fz = z - z0;

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return (h0 * (1 - fz) + h1 * fz) * squareSize;
  }
}