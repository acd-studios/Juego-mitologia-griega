import {
  Scene,
  Vector3,
  Color3,
  MeshBuilder,
  Mesh,
  TransformNode,
  PBRMaterial
} from "@babylonjs/core";
import { ProceduralTextureGenerator } from "./ProceduralTextures";

export class HellenicAssetGenerator {
  private scene: Scene;
  private marbleMat: PBRMaterial;
  private bronzeMat: PBRMaterial;
  private terracottaMat: PBRMaterial;
  private goldMat: PBRMaterial;
  private stoneMat: PBRMaterial;

  constructor(scene: Scene) {
    this.scene = scene;

    const stoneNorm = ProceduralTextureGenerator.createStoneNormalMap("hellenicNorm", scene, 512, 1.4);
    const marbleTex = ProceduralTextureGenerator.createMarbleTexture("hellenicMarble", scene, 512);

    this.marbleMat = new PBRMaterial("hMarbleMat", scene);
    this.marbleMat.albedoTexture = marbleTex;
    this.marbleMat.bumpTexture = stoneNorm;
    this.marbleMat.roughness = 0.28;
    this.marbleMat.metallic = 0.05;

    this.bronzeMat = new PBRMaterial("hBronzeMat", scene);
    this.bronzeMat.albedoColor = new Color3(0.35, 0.26, 0.16);
    this.bronzeMat.bumpTexture = stoneNorm;
    this.bronzeMat.metallic = 0.88;
    this.bronzeMat.roughness = 0.32;

    this.terracottaMat = new PBRMaterial("hTerracottaMat", scene);
    this.terracottaMat.albedoColor = new Color3(0.68, 0.38, 0.22);
    this.terracottaMat.bumpTexture = stoneNorm;
    this.terracottaMat.roughness = 0.75;

    this.goldMat = new PBRMaterial("hGoldMat", scene);
    this.goldMat.albedoColor = new Color3(0.92, 0.78, 0.28);
    this.goldMat.metallic = 0.92;
    this.goldMat.roughness = 0.18;

    this.stoneMat = new PBRMaterial("hStoneMat", scene);
    this.stoneMat.albedoColor = new Color3(0.32, 0.34, 0.36);
    this.stoneMat.bumpTexture = stoneNorm;
    this.stoneMat.roughness = 0.92;
  }

  public createCorinthianCapital(position: Vector3, parent?: TransformNode): TransformNode {
    const capitalGroup = new TransformNode("corinthianCapital", this.scene);
    capitalGroup.position = position;

    const ring = MeshBuilder.CreateTorus("capitalRing", { diameter: 1.1, thickness: 0.14, tessellation: 24 }, this.scene);
    ring.position = new Vector3(0, 0.1, 0);
    ring.material = this.marbleMat;
    ring.parent = capitalGroup;

    const basket = MeshBuilder.CreateCylinder("capitalBasket", { height: 1.1, diameterTop: 1.35, diameterBottom: 1.0, tessellation: 20 }, this.scene);
    basket.position = new Vector3(0, 0.65, 0);
    basket.material = this.marbleMat;
    basket.parent = capitalGroup;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leaf = MeshBuilder.CreateBox("acanthusLeaf1_" + i, { width: 0.22, height: 0.55, depth: 0.12 }, this.scene);
      leaf.position = new Vector3(Math.cos(angle) * 0.55, 0.4, Math.sin(angle) * 0.55);
      leaf.rotation = new Vector3(0.25, -angle, 0.15);
      leaf.material = this.marbleMat;
      leaf.parent = capitalGroup;
    }

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const volute = MeshBuilder.CreateTorus("voluteSpiral_" + i, { diameter: 0.35, thickness: 0.08, tessellation: 16 }, this.scene);
      volute.position = new Vector3(Math.cos(angle) * 0.65, 1.05, Math.sin(angle) * 0.65);
      volute.rotation = new Vector3(Math.PI / 2, angle, 0);
      volute.material = this.marbleMat;
      volute.parent = capitalGroup;
    }

    const abacus = MeshBuilder.CreateBox("abacusSlab", { width: 1.5, height: 0.22, depth: 1.5 }, this.scene);
    abacus.position = new Vector3(0, 1.25, 0);
    abacus.material = this.marbleMat;
    abacus.parent = capitalGroup;

    if (parent) {
      capitalGroup.parent = parent;
    }

    return capitalGroup;
  }

  public createGreekAmphora(position: Vector3, parent?: TransformNode): Mesh {
    const amphoraGroup = new TransformNode("amphoraVase", this.scene);
    amphoraGroup.position = position;

    const base = MeshBuilder.CreateCylinder("amphoraBase", { height: 0.15, diameterTop: 0.45, diameterBottom: 0.55 }, this.scene);
    base.position = new Vector3(0, 0.08, 0);
    base.material = this.terracottaMat;
    base.parent = amphoraGroup;

    const bellyLower = MeshBuilder.CreateCylinder("amphoraBellyL", { height: 0.6, diameterTop: 0.9, diameterBottom: 0.45 }, this.scene);
    bellyLower.position = new Vector3(0, 0.45, 0);
    bellyLower.material = this.terracottaMat;
    bellyLower.parent = amphoraGroup;

    const bellyUpper = MeshBuilder.CreateCylinder("amphoraBellyU", { height: 0.5, diameterTop: 0.5, diameterBottom: 0.9 }, this.scene);
    bellyUpper.position = new Vector3(0, 0.95, 0);
    bellyUpper.material = this.terracottaMat;
    bellyUpper.parent = amphoraGroup;

    const neck = MeshBuilder.CreateCylinder("amphoraNeck", { height: 0.45, diameterTop: 0.42, diameterBottom: 0.48 }, this.scene);
    neck.position = new Vector3(0, 1.4, 0);
    neck.material = this.terracottaMat;
    neck.parent = amphoraGroup;

    const rim = MeshBuilder.CreateTorus("amphoraRim", { diameter: 0.48, thickness: 0.08, tessellation: 20 }, this.scene);
    rim.position = new Vector3(0, 1.62, 0);
    rim.material = this.terracottaMat;
    rim.parent = amphoraGroup;

    const handleL = MeshBuilder.CreateTorus("handleL", { diameter: 0.5, thickness: 0.07, tessellation: 16 }, this.scene);
    handleL.position = new Vector3(-0.38, 1.15, 0);
    handleL.rotation = new Vector3(0, 0, Math.PI / 2);
    handleL.material = this.terracottaMat;
    handleL.parent = amphoraGroup;

    const handleR = MeshBuilder.CreateTorus("handleR", { diameter: 0.5, thickness: 0.07, tessellation: 16 }, this.scene);
    handleR.position = new Vector3(0.38, 1.15, 0);
    handleR.rotation = new Vector3(0, 0, Math.PI / 2);
    handleR.material = this.terracottaMat;
    handleR.parent = amphoraGroup;

    // Collider for interaction (visibility = 0 allows raycasting picking without drawing mesh)
    const collider = MeshBuilder.CreateCylinder("amphoraCollider", { height: 1.7, diameter: 0.9 }, this.scene);
    collider.position = new Vector3(position.x, position.y + 0.85, position.z);
    collider.visibility = 0.001;
    collider.isPickable = true;
    collider.checkCollisions = true;

    if (parent) {
      amphoraGroup.parent = parent;
    }

    return collider;
  }

  public createBronzeTripodBrazier(position: Vector3, parent?: TransformNode): TransformNode {
    const tripodGroup = new TransformNode("bronzeTripodBrazier", this.scene);
    tripodGroup.position = position;

    const ring = MeshBuilder.CreateTorus("tripodRing", { diameter: 1.1, thickness: 0.08, tessellation: 24 }, this.scene);
    ring.position = new Vector3(0, 1.4, 0);
    ring.material = this.bronzeMat;
    ring.parent = tripodGroup;

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const leg = MeshBuilder.CreateCylinder("tripodLeg_" + i, { height: 1.5, diameterTop: 0.08, diameterBottom: 0.12 }, this.scene);
      leg.position = new Vector3(Math.cos(angle) * 0.45, 0.7, Math.sin(angle) * 0.45);
      leg.rotation = new Vector3(Math.sin(angle) * 0.25, angle, Math.cos(angle) * 0.25);
      leg.material = this.bronzeMat;
      leg.parent = tripodGroup;

      const foot = MeshBuilder.CreateSphere("clawFoot_" + i, { diameter: 0.18 }, this.scene);
      foot.position = new Vector3(Math.cos(angle) * 0.6, 0.08, Math.sin(angle) * 0.6);
      foot.material = this.bronzeMat;
      foot.parent = tripodGroup;
    }

    const bowl = MeshBuilder.CreateCylinder("brazierBowl", { height: 0.45, diameterTop: 1.15, diameterBottom: 0.4, tessellation: 24 }, this.scene);
    bowl.position = new Vector3(0, 1.5, 0);
    bowl.material = this.bronzeMat;
    bowl.parent = tripodGroup;

    for (let i = 0; i < 2; i++) {
      const hAngle = i * Math.PI;
      const hRing = MeshBuilder.CreateTorus("bHandleRing_" + i, { diameter: 0.25, thickness: 0.05, tessellation: 16 }, this.scene);
      hRing.position = new Vector3(Math.cos(hAngle) * 0.6, 1.55, Math.sin(hAngle) * 0.6);
      hRing.material = this.bronzeMat;
      hRing.parent = tripodGroup;
    }

    if (parent) {
      tripodGroup.parent = parent;
    }

    return tripodGroup;
  }

  public createFriezePanel(position: Vector3, width: number = 4.0, height: number = 1.2, parent?: TransformNode): Mesh {
    const panelGroup = new TransformNode("friezePanel", this.scene);
    panelGroup.position = position;

    const slab = MeshBuilder.CreateBox("friezeSlab", { width: width, height: height, depth: 0.3 }, this.scene);
    slab.position = new Vector3(0, 0, 0);
    slab.material = this.marbleMat;
    slab.parent = panelGroup;

    const triglyphCount = Math.floor(width / 1.0);
    for (let i = 0; i <= triglyphCount; i++) {
      const x = -width / 2 + (i / triglyphCount) * width;
      const triglyph = MeshBuilder.CreateBox("triglyph_" + i, { width: 0.22, height: height - 0.1, depth: 0.38 }, this.scene);
      triglyph.position = new Vector3(x, 0, 0.04);
      triglyph.material = this.marbleMat;
      triglyph.parent = panelGroup;
    }

    if (parent) {
      panelGroup.parent = parent;
    }

    return slab;
  }

  public createAthenaMonument(position: Vector3, parent?: TransformNode): TransformNode {
    const athenaGroup = new TransformNode("athenaMonument", this.scene);
    athenaGroup.position = position;

    const pedestalLower = MeshBuilder.CreateBox("athenaPedestal1", { width: 2.5, height: 0.6, depth: 2.5 }, this.scene);
    pedestalLower.position = new Vector3(0, 0.3, 0);
    pedestalLower.material = this.marbleMat;
    pedestalLower.parent = athenaGroup;

    const pedestalUpper = MeshBuilder.CreateBox("athenaPedestal2", { width: 2.1, height: 0.8, depth: 2.1 }, this.scene);
    pedestalUpper.position = new Vector3(0, 1.0, 0);
    pedestalUpper.material = this.marbleMat;
    pedestalUpper.parent = athenaGroup;

    const body = MeshBuilder.CreateCylinder("athenaBody", { height: 3.8, diameterTop: 1.0, diameterBottom: 1.4, tessellation: 24 }, this.scene);
    body.position = new Vector3(0, 3.3, 0);
    body.material = this.goldMat;
    body.parent = athenaGroup;

    const aegis = MeshBuilder.CreateBox("athenaAegis", { width: 1.15, height: 1.2, depth: 0.7 }, this.scene);
    aegis.position = new Vector3(0, 4.2, 0);
    aegis.material = this.goldMat;
    aegis.parent = athenaGroup;

    const head = MeshBuilder.CreateSphere("athenaHead", { diameter: 0.55 }, this.scene);
    head.position = new Vector3(0, 5.2, 0);
    head.material = this.goldMat;
    head.parent = athenaGroup;

    const helmetCrest = MeshBuilder.CreateBox("helmetCrest", { width: 0.12, height: 0.6, depth: 0.8 }, this.scene);
    helmetCrest.position = new Vector3(0, 5.65, 0.1);
    helmetCrest.material = this.goldMat;
    helmetCrest.parent = athenaGroup;

    const shield = MeshBuilder.CreateCylinder("athenaShield", { height: 0.12, diameter: 2.2, tessellation: 32 }, this.scene);
    shield.position = new Vector3(-0.95, 3.8, 0.3);
    shield.rotation = new Vector3(0, Math.PI / 4, Math.PI / 2);
    shield.material = this.goldMat;
    shield.parent = athenaGroup;

    const spear = MeshBuilder.CreateCylinder("athenaSpear", { height: 6.2, diameter: 0.1 }, this.scene);
    spear.position = new Vector3(0.9, 4.2, -0.2);
    spear.rotation.z = -0.12;
    spear.material = this.goldMat;
    spear.parent = athenaGroup;

    if (parent) {
      athenaGroup.parent = parent;
    }

    return athenaGroup;
  }
}
