import * as THREE from 'three';
import { BoardManager } from './BoardManager';

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

interface TerrainData {
  type: TerrainType;
  height: number;
  color: number;
}

interface WFCCell {
  collapsed: boolean;
  options: TerrainType[];
}

export class MapManager {
  private terrainMap: Map<string, TerrainData> = new Map();
  private mapWidth: number = 0;
  private mapHeight: number = 0;

  constructor(private boardManager: BoardManager) {}

  generateMap(width: number, height: number): void {
    this.mapWidth = width;
    this.mapHeight = height;
    this.waveFormCollapse();
    this.smoothTerrain();
  }

  getTerrainType(x: number, z: number): TerrainType {
    const key = `${Math.floor(x)},${Math.floor(z)}`;
    const terrainData = this.terrainMap.get(key);
    return terrainData ? terrainData.type : TerrainType.Grass; // Default to grass if not found
  }

  private waveFormCollapse(): void {
    const grid: WFCCell[][] = [];
    for (let y = 0; y < this.mapHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        grid[y][x] = {
          collapsed: false,
          options: Object.values(TerrainType).filter(v => typeof v === 'number') as TerrainType[]
        };
      }
    }

    while (this.hasUncollapsedCells(grid)) {
      const { x, y } = this.findLowestEntropyCell(grid);
      this.collapseCell(grid, x, y);
      this.propagate(grid, x, y);
    }

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const terrainType = grid[y][x].options[0];
        this.terrainMap.set(`${x},${y}`, this.createTerrainData(terrainType));
      }
    }
  }

  private hasUncollapsedCells(grid: WFCCell[][]): boolean {
    return grid.some(row => row.some(cell => !cell.collapsed));
  }

  private findLowestEntropyCell(grid: WFCCell[][]): { x: number, y: number } {
    let minEntropy = Infinity;
    let candidates: { x: number, y: number }[] = [];

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        if (!grid[y][x].collapsed) {
          const entropy = grid[y][x].options.length;
          if (entropy < minEntropy) {
            minEntropy = entropy;
            candidates = [{ x, y }];
          } else if (entropy === minEntropy) {
            candidates.push({ x, y });
          }
        }
      }
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private collapseCell(grid: WFCCell[][], x: number, y: number): void {
    const cell = grid[y][x];
    cell.collapsed = true;
    const chosenOption = cell.options[Math.floor(Math.random() * cell.options.length)];
    cell.options = [chosenOption];
  }

  private propagate(grid: WFCCell[][], x: number, y: number): void {
    const queue: [number, number][] = [[x, y]];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const currentOptions = grid[cy][cx].options;

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;

        if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
          const neighbor = grid[ny][nx];
          if (!neighbor.collapsed) {
            const validOptions = this.getValidOptions(currentOptions, [dx, dy]);
            const newOptions = neighbor.options.filter(option => validOptions.includes(option));

            if (newOptions.length < neighbor.options.length) {
              neighbor.options = newOptions;
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  private getValidOptions(currentOptions: TerrainType[], direction: [number, number]): TerrainType[] {
    const [dx, dy] = direction;
    const allOptions = Object.values(TerrainType).filter(v => typeof v === 'number') as TerrainType[];
    
    const rules: { [key in TerrainType]: TerrainType[] } = {
      [TerrainType.Water]: [TerrainType.Water, TerrainType.Bridge, TerrainType.Dirt],
      [TerrainType.Dirt]: [TerrainType.Dirt, TerrainType.Grass, TerrainType.Path, TerrainType.Water],
      [TerrainType.Grass]: [TerrainType.Grass, TerrainType.Tree, TerrainType.Dirt, TerrainType.Path, TerrainType.Building],
      [TerrainType.Tree]: [TerrainType.Tree, TerrainType.Grass],
      [TerrainType.Building]: [TerrainType.Building, TerrainType.Path, TerrainType.Grass],
      [TerrainType.Wall]: [TerrainType.Wall, TerrainType.Path, TerrainType.Grass],
      [TerrainType.Path]: [TerrainType.Path, TerrainType.Dirt, TerrainType.Grass, TerrainType.Building, TerrainType.Wall],
      [TerrainType.Bridge]: [TerrainType.Bridge, TerrainType.Water, TerrainType.Path]
    };

    let validOptions: TerrainType[] = [];

    for (const option of currentOptions) {
      validOptions = [...validOptions, ...rules[option]];
    }

    // Additional rules based on direction
    if (Math.abs(dx) + Math.abs(dy) === 1) { // Orthogonal neighbors
      if (currentOptions.includes(TerrainType.Water)) {
        validOptions = validOptions.filter(o => o !== TerrainType.Building && o !== TerrainType.Wall);
      }
      if (currentOptions.includes(TerrainType.Building) || currentOptions.includes(TerrainType.Wall)) {
        validOptions = validOptions.filter(o => o !== TerrainType.Water);
      }
    }

    // Ensure uniqueness
    return [...new Set(validOptions)];
  }

  applyMapToBoard(): void {
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

  private getRandomTerrainType(): TerrainType {
    const types = Object.values(TerrainType).filter(v => typeof v === 'number') as TerrainType[];
    return types[Math.floor(Math.random() * types.length)];
  }

  private createTerrainData(type: TerrainType): TerrainData {
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

  private smoothTerrain(): void {
    const smoothedMap = new Map<string, TerrainData>();
    for (let x = 0; x < this.mapWidth; x++) {
      for (let y = 0; y < this.mapHeight; y++) {
        const currentTerrain = this.terrainMap.get(`${x},${y}`)!;
        const neighbors = this.getNeighbors(x, y);
        const avgHeight = neighbors.reduce((sum, neighbor) => sum + neighbor.height, currentTerrain.height) / (neighbors.length + 1);
        smoothedMap.set(`${x},${y}`, { ...currentTerrain, height: avgHeight });
      }
    }
    this.terrainMap = smoothedMap;
  }

  private getNeighbors(x: number, y: number): TerrainData[] {
    const neighbors: TerrainData[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
          const neighbor = this.terrainMap.get(`${nx},${ny}`);
          if (neighbor) neighbors.push(neighbor);
        }
      }
    }
    return neighbors;
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
      const height = this.getInterpolatedHeight(tileX + localX, tileZ + localZ);
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

  public getInterpolatedHeight(x: number, z: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const z1 = z0 + 1;

    const h00 = this.terrainMap.get(`${x0},${z0}`)?.height ?? 0;
    const h10 = this.terrainMap.get(`${x1},${z0}`)?.height ?? 0;
    const h01 = this.terrainMap.get(`${x0},${z1}`)?.height ?? 0;
    const h11 = this.terrainMap.get(`${x1},${z1}`)?.height ?? 0;

    const fx = x - x0;
    const fz = z - z0;

    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return (h0 * (1 - fz) + h1 * fz) * this.boardManager.getSquareSize();
  }

  private addTreeModel(square: THREE.Mesh, baseHeight: number): void {
    const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.25;

    const leavesGeometry = new THREE.ConeGeometry(0.3, 0.7, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 0.75;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    tree.position.copy(square.position);
    tree.position.y += baseHeight * this.boardManager.getSquareSize() + 0.25;
    square.parent?.add(tree);
  }

  private addBuildingModel(square: THREE.Mesh, baseHeight: number): void {
    const buildingGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.copy(square.position);
    building.position.y += baseHeight * this.boardManager.getSquareSize() + 0.5;
    square.parent?.add(building);
  }
}