import * as THREE from 'three';
import { TerrainType, TerrainData } from './TerrainType';
import { BoardManager } from '../BoardManager';

export class TerrainRenderer {
  constructor(private boardManager: BoardManager) {}

  applyTerrainToSquare(square: THREE.Mesh, terrainData: TerrainData, tileX: number, tileZ: number): void {
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

  private getInterpolatedHeight(x: number, z: number): number {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const x1 = x0 + 1;
    const z1 = z0 + 1;

    const h00 = this.boardManager.getTerrainHeight(x0, z0);
    const h10 = this.boardManager.getTerrainHeight(x1, z0);
    const h01 = this.boardManager.getTerrainHeight(x0, z1);
    const h11 = this.boardManager.getTerrainHeight(x1, z1);

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