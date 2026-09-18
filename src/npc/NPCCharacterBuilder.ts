import { Scene, Vector3, Mesh, MeshBuilder, PBRMaterial, Color3, TransformNode } from "@babylonjs/core";

export class NPCCharacterBuilder {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public createHellenicScholarNPC(name: string, position: Vector3): Mesh {
    const rootGroup = new TransformNode("npcRoot_" + name, this.scene);

    const torso = MeshBuilder.CreateCylinder("npcTorso_" + name, { height: 1.2, diameterTop: 0.5, diameterBottom: 0.7 }, this.scene);
    torso.position = new Vector3(position.x, position.y + 1.0, position.z);
    torso.parent = rootGroup;

    const tunicMat = new PBRMaterial("tunicMat_" + name, this.scene);
    tunicMat.albedoColor = new Color3(0.7, 0.55, 0.35);
    tunicMat.roughness = 0.8;
    torso.material = tunicMat;

    const head = MeshBuilder.CreateSphere("npcHead_" + name, { diameter: 0.38 }, this.scene);
    head.position = new Vector3(position.x, position.y + 1.8, position.z);
    head.parent = rootGroup;

    const skinMat = new PBRMaterial("skinMat_" + name, this.scene);
    skinMat.albedoColor = new Color3(0.82, 0.65, 0.52);
    skinMat.roughness = 0.6;
    head.material = skinMat;

    const shawl = MeshBuilder.CreateBox("npcShawl_" + name, { width: 0.6, height: 0.8, depth: 0.25 }, this.scene);
    shawl.position = new Vector3(position.x - 0.1, position.y + 1.15, position.z);
    shawl.rotation.z = 0.25;
    shawl.parent = rootGroup;

    const shawlMat = new PBRMaterial("shawlMat_" + name, this.scene);
    shawlMat.albedoColor = new Color3(0.2, 0.3, 0.45);
    shawl.material = shawlMat;

    const leftArm = MeshBuilder.CreateCylinder("npcArmL_" + name, { height: 0.6, diameter: 0.12 }, this.scene);
    leftArm.position = new Vector3(position.x - 0.35, position.y + 1.1, position.z + 0.1);
    leftArm.rotation = new Vector3(0.8, 0, -0.4);
    leftArm.parent = rootGroup;
    leftArm.material = skinMat;

    const scroll = MeshBuilder.CreateCylinder("npcScroll_" + name, { height: 0.4, diameter: 0.08 }, this.scene);
    scroll.position = new Vector3(position.x - 0.35, position.y + 0.9, position.z + 0.3);
    scroll.rotation.x = Math.PI / 2;
    scroll.parent = rootGroup;

    let idleTime = Math.random() * 10;
    this.scene.registerBeforeRender(() => {
      idleTime += this.scene.getEngine().getDeltaTime() * 0.002;

      const breath = Math.sin(idleTime * 2) * 0.02;
      torso.scaling.y = 1.0 + breath * 0.5;
      torso.position.y = position.y + 1.0 + breath * 0.2;

      head.rotation.y = Math.sin(idleTime * 1.2) * 0.1;
      head.rotation.z = Math.cos(idleTime * 0.8) * 0.05;
    });

    // Invisible pickable collider for raycast ray interaction
    const collider = MeshBuilder.CreateCapsule("npcCollider_" + name, { height: 1.8, radius: 0.45 }, this.scene);
    collider.position = new Vector3(position.x, position.y + 0.9, position.z);
    collider.visibility = 0.001;
    collider.isPickable = true;
    collider.checkCollisions = true;

    return collider;
  }
}
