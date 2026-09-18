import { Scene, Vector3, Mesh, MeshBuilder, PBRMaterial, Color3, TransformNode, PointLight } from "@babylonjs/core";
import { ProceduralTextureGenerator } from "./ProceduralTextures";
import { HellenicAssetGenerator } from "./HellenicAssetGenerator";

export class GreekArchitectureBuilder {
  private scene: Scene;
  private marbleMaterial: PBRMaterial;
  private stoneMaterial: PBRMaterial;
  private woodMaterial: PBRMaterial;
  private goldMaterial: PBRMaterial;
  private assetGenerator: HellenicAssetGenerator;

  constructor(scene: Scene) {
    this.scene = scene;
    this.assetGenerator = new HellenicAssetGenerator(scene);

    const stoneNorm = ProceduralTextureGenerator.createStoneNormalMap("archStoneNorm", scene, 512, 1.2);
    const marbleTex = ProceduralTextureGenerator.createMarbleTexture("archMarbleTex", scene, 512);

    this.marbleMaterial = new PBRMaterial("marbleMat", scene);
    this.marbleMaterial.albedoTexture = marbleTex;
    this.marbleMaterial.bumpTexture = stoneNorm;
    this.marbleMaterial.roughness = 0.3;
    this.marbleMaterial.metallic = 0.05;

    this.stoneMaterial = new PBRMaterial("ancientStoneMat", scene);
    this.stoneMaterial.albedoColor = new Color3(0.25, 0.26, 0.28);
    this.stoneMaterial.bumpTexture = stoneNorm;
    this.stoneMaterial.roughness = 0.85;

    this.woodMaterial = new PBRMaterial("ancientWoodMat", scene);
    this.woodMaterial.albedoColor = new Color3(0.22, 0.15, 0.1);
    this.woodMaterial.bumpTexture = stoneNorm;
    this.woodMaterial.roughness = 0.7;

    this.goldMaterial = new PBRMaterial("templeGoldMat", scene);
    this.goldMaterial.albedoColor = new Color3(0.9, 0.75, 0.25);
    this.goldMaterial.metallic = 0.9;
    this.goldMaterial.roughness = 0.2;
  }

  /**
   * Builds Propylaea Entry Atrium with coffered ceiling, carved friezes, and Corinthian columns.
   */
  public buildEnclosedSpawnHall(centerPos: Vector3, width: number = 18, height: number = 7.5, depth: number = 22): TransformNode {
    const hallGroup = new TransformNode("enclosedSpawnHall", this.scene);

    // Marble tile floor with border grid
    const floor = MeshBuilder.CreateBox("hallFloor", { width: width, height: 0.4, depth: depth }, this.scene);
    floor.position = new Vector3(centerPos.x, centerPos.y - 0.2, centerPos.z);
    floor.material = this.marbleMaterial;
    floor.checkCollisions = true;
    floor.parent = hallGroup;

    // Coffered Roof / Ceiling
    const ceiling = MeshBuilder.CreateBox("hallCeiling", { width: width, height: 0.5, depth: depth }, this.scene);
    ceiling.position = new Vector3(centerPos.x, centerPos.y + height, centerPos.z);
    ceiling.material = this.stoneMaterial;
    ceiling.checkCollisions = true;
    ceiling.parent = hallGroup;

    // Back Wall
    const backWall = MeshBuilder.CreateBox("hallBackWall", { width: width, height: height, depth: 0.8 }, this.scene);
    backWall.position = new Vector3(centerPos.x, centerPos.y + height / 2, centerPos.z - depth / 2);
    backWall.material = this.stoneMaterial;
    backWall.checkCollisions = true;
    backWall.parent = hallGroup;

    // Side Walls
    const leftWall = MeshBuilder.CreateBox("hallLeftWall", { width: 0.8, height: height, depth: depth }, this.scene);
    leftWall.position = new Vector3(centerPos.x - width / 2, centerPos.y + height / 2, centerPos.z);
    leftWall.material = this.stoneMaterial;
    leftWall.checkCollisions = true;
    leftWall.parent = hallGroup;

    const rightWall = MeshBuilder.CreateBox("hallRightWall", { width: 0.8, height: height, depth: depth }, this.scene);
    rightWall.position = new Vector3(centerPos.x + width / 2, centerPos.y + height / 2, centerPos.z);
    rightWall.material = this.stoneMaterial;
    rightWall.checkCollisions = true;
    rightWall.parent = hallGroup;

    // Carved Frieze Panels on walls
    this.assetGenerator.createFriezePanel(new Vector3(centerPos.x - width / 2 + 0.45, centerPos.y + height - 1.2, centerPos.z), 12, 1.2, hallGroup);
    this.assetGenerator.createFriezePanel(new Vector3(centerPos.x + width / 2 - 0.45, centerPos.y + height - 1.2, centerPos.z), 12, 1.2, hallGroup);

    // Interior Fluted Ionic/Corinthian Columns
    for (let z = -depth / 2 + 4; z <= depth / 2 - 4; z += 6) {
      this.createIonicColumn(new Vector3(centerPos.x - width / 2 + 2.2, centerPos.y, centerPos.z + z), height - 0.4, hallGroup);
      this.createIonicColumn(new Vector3(centerPos.x + width / 2 - 2.2, centerPos.y, centerPos.z + z), height - 0.4, hallGroup);
    }

    return hallGroup;
  }

  public createIonicColumn(pos: Vector3, height: number, parent?: TransformNode): Mesh {
    const colGroup = new TransformNode("ionicCol", this.scene);

    const plinth = MeshBuilder.CreateBox("colPlinth", { width: 1.2, height: 0.35, depth: 1.2 }, this.scene);
    plinth.position = new Vector3(pos.x, pos.y + 0.17, pos.z);
    plinth.material = this.marbleMaterial;
    plinth.parent = colGroup;

    const shaft = MeshBuilder.CreateCylinder("colShaft", { height: height - 1.6, diameterTop: 0.8, diameterBottom: 0.95, tessellation: 24 }, this.scene);
    shaft.position = new Vector3(pos.x, pos.y + (height - 1.6) / 2 + 0.35, pos.z);
    shaft.material = this.marbleMaterial;
    shaft.checkCollisions = true;
    shaft.parent = colGroup;

    this.assetGenerator.createCorinthianCapital(new Vector3(pos.x, pos.y + height - 1.3, pos.z), colGroup);

    if (parent) {
      colGroup.parent = parent;
    }

    return shaft;
  }
}
