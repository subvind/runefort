import * as THREE from 'three';
import { BoardManager } from './BoardManager';

export enum TerrainType {
  Ground,
  Mountain,
  Tree,
  Building,
  Wall,
  Path,
  Bridge,
  River
}

interface TerrainData {
  type: TerrainType;
  height: number;
  color: number;
}

export class MapManager {
  private terrainMap: Map<string, TerrainData> = new Map();

  constructor(private boardManager: BoardManager) {}

  generateMap(width: number, height: number): void {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const terrainType = this.getRandomTerrainType();
        this.terrainMap.set(`${x},${y}`, this.createTerrainData(terrainType));
      }
    }
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
          this.applyTerrainToSquare(object, terrainData);
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
      case TerrainType.Ground:
        return { type, height: 0, color: 0x8B4513 };
      case TerrainType.Mountain:
        return { type, height: 2, color: 0x808080 };
      case TerrainType.Tree:
        return { type, height: 1, color: 0x228B22 };
      case TerrainType.Building:
        return { type, height: 1.5, color: 0xA0522D };
      case TerrainType.Wall:
        return { type, height: 1, color: 0x808080 };
      case TerrainType.Path:
        return { type, height: 0, color: 0xD2B48C };
      case TerrainType.Bridge:
        return { type, height: 0.5, color: 0x8B4513 };
      case TerrainType.River:
        return { type, height: -0.5, color: 0x4169E1 };
    }
  }

  private applyTerrainToSquare(square: THREE.Mesh, terrainData: TerrainData): void {
    const material = square.material as THREE.MeshPhongMaterial;
    material.color.setHex(terrainData.color);
    square.position.y = terrainData.height * this.boardManager.getSquareSize() / 2;
    square.scale.y = Math.max(0.1, Math.abs(terrainData.height));

    if (terrainData.type === TerrainType.Tree) {
      this.addTreeModel(square);
    } else if (terrainData.type === TerrainType.Building) {
      this.addBuildingModel(square);
    }
  }

  private addTreeModel(square: THREE.Mesh): void {
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
    tree.position.y += square.scale.y / 2;
    square.parent?.add(tree);
  }

  private addBuildingModel(square: THREE.Mesh): void {
    const buildingGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
    const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.copy(square.position);
    building.position.y += square.scale.y / 2 + 0.5;
    square.parent?.add(building);
  }
}