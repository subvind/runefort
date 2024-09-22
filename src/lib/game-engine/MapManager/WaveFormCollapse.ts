import { TerrainType, TerrainData } from './TerrainType';
import { TerrainGenerator } from './TerrainGenerator';

interface WFCCell {
  collapsed: boolean;
  options: TerrainType[];
}

export class WaveFormCollapse {
  private grid: WFCCell[][];

  constructor(private width: number, private height: number) {
    this.grid = this.initializeGrid();
  }

  generate(): Map<string, TerrainData> {
    while (this.hasUncollapsedCells()) {
      const { x, y } = this.findLowestEntropyCell();
      this.collapseCell(x, y);
      this.propagate(x, y);
    }

    return this.createTerrainMap();
  }

  private initializeGrid(): WFCCell[][] {
    const grid: WFCCell[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = {
          collapsed: false,
          options: Object.values(TerrainType).filter(v => typeof v === 'number') as TerrainType[]
        };
      }
    }
    return grid;
  }

  private hasUncollapsedCells(): boolean {
    return this.grid.some(row => row.some(cell => !cell.collapsed));
  }

  private findLowestEntropyCell(): { x: number, y: number } {
    let minEntropy = Infinity;
    let candidates: { x: number, y: number }[] = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.grid[y][x].collapsed) {
          const entropy = this.grid[y][x].options.length;
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

  private collapseCell(x: number, y: number): void {
    const cell = this.grid[y][x];
    cell.collapsed = true;
    const chosenOption = cell.options[Math.floor(Math.random() * cell.options.length)];
    cell.options = [chosenOption];
  }

  private propagate(x: number, y: number): void {
    const queue: [number, number][] = [[x, y]];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const currentOptions = this.grid[cy][cx].options;

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          const neighbor = this.grid[ny][nx];
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

  private createTerrainMap(): Map<string, TerrainData> {
    const terrainMap = new Map<string, TerrainData>();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const terrainType = this.grid[y][x].options[0];
        terrainMap.set(`${x},${y}`, TerrainGenerator.createTerrainData(terrainType));
      }
    }
    return terrainMap;
  }
}