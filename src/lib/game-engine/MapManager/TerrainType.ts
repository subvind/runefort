export enum TerrainType {
  Dirt,
  Grass,
  Tree,
  Building,
  Wall,
  Path,
  Bridge,
  Water
}

export interface TerrainData {
  type: TerrainType;
  height: number;
  color: number;
}