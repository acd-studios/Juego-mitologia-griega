import {
  Scene,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  PBRMaterial,
  Texture,
  Mesh,
  TransformNode,
  ShadowGenerator,
  ParticleSystem,
  DynamicTexture
} from '@babylonjs/core';
import { EngineManager } from '../core/EngineManager';
import { UIManager } from '../ui/UIManager';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../save/SaveSystem';
import { GraphicsQualityManager } from '../graphics/GraphicsQualityManager';
import { MythChapter, MythChapterConfig } from './MythChapter';
import { PlayerController } from '../player/PlayerController';
import { CameraManager } from '../camera/CameraManager';
import { InteractionSystem } from '../interaction/InteractionSystem';
import { JournalSystem, Clue, CharacterProfile } from '../investigation/JournalSystem';
import { DialogueSystem, DialogueTree, DialogueNode } from '../dialogue/DialogueSystem';
import { CustomShaderManager } from '../shaders/CustomShaderManager';
import { LightMirrorPuzzle } from '../puzzles/LightMirrorPuzzle';
import { SacredSymbolPuzzle, SymbolDial } from '../puzzles/SacredSymbolPuzzle';
import { ProceduralTextureGenerator } from '../graphics/ProceduralTextures';

export class MedusaChapter extends MythChapter {
  private player!: PlayerController;
  private cameraManager!: CameraManager;
  private interactionSystem!: InteractionSystem;
  private journalSystem!: JournalSystem;
  private dialogueSystem!: DialogueSystem;

  private mirrorPuzzle!: LightMirrorPuzzle;
  private symbolPuzzle!: SacredSymbolPuzzle;

  private medusaMesh: Mesh | null = null;
  private survivorNPCMesh: Mesh | null = null;
  private sanctuaryDoorMesh: Mesh | null = null;
  private athenaStatueMesh: Mesh | null = null;
  private bronzeShieldOfferMesh: Mesh | null = null;

  private isMedusaDefeated: boolean = false;
  private playerHasShield: boolean = false;

  private stoneNormalMap!: Texture;
  private marbleTexture!: Texture;
  private mossRoughnessMap!: Texture;

  constructor(
    engineManager: EngineManager,
    uiManager: UIManager,
    audioManager: AudioManager,
    saveSystem: SaveSystem,
    graphicsManager: GraphicsQualityManager
  ) {
    const config: MythChapterConfig = {
      id: "medusa",
      title: "LA MIRADA DE MEDUSA",
      subtitle: "El templo de las sombras y el mármol silenciado",
      description: "Investiga la misteriosa desaparición de expediciones en una isla abandonada y descubre la trágica verdad del santuario profanado.",
      unlockedByDefault: true
    };
    super(config, engineManager, uiManager, audioManager, saveSystem, graphicsManager);
  }

  public async load(onProgress: (progress: number) => void): Promise<void> {
    onProgress(10);
    this.scene = new Scene(this.engineManager.getEngine());
    this.scene.clearColor = new Color4(0.03, 0.05, 0.08, 1.0);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.014;
    this.scene.fogColor = new Color3(0.05, 0.08, 0.12);

    this.engineManager.setScene(this.scene);
    onProgress(20);

    // Procedural Normal & Roughness Maps
    this.stoneNormalMap = ProceduralTextureGenerator.createStoneNormalMap("stoneNorm", this.scene, 512, 1.2);
    this.marbleTexture = ProceduralTextureGenerator.createMarbleTexture("marbleTex", this.scene, 512);
    this.mossRoughnessMap = ProceduralTextureGenerator.createMossRoughnessMap("mossRough", this.scene, 256);

    // Configurar Sistemas Narrative & Audio
    this.journalSystem = new JournalSystem();
    this.dialogueSystem = new DialogueSystem();
    this.setupJournalNotifications();

    // Configurar Jugador, Cámara e Interacción
    this.player = new PlayerController(this.scene, new Vector3(0, 1.2, -22));
    this.cameraManager = new CameraManager(this.scene, this.engineManager.getCanvas());
    this.cameraManager.followTarget(this.player.getMesh());

    this.player.setOnFootstepCallback(() => {
      this.audioManager.playSFX('footstep');
    });

    this.interactionSystem = new InteractionSystem(this.scene, {
      onHoverStart: (target) => {
        this.uiManager.showInteractionPrompt(target.actionText, target.name);
      },
      onHoverEnd: () => {
        this.uiManager.hideInteractionPrompt();
      }
    });

    onProgress(40);

    // Iluminación Cinematográfica
    this.setupLighting();
    onProgress(60);

    // Construcción de Escenario 3D Altamente Detallado & Currado
    this.buildIslandEnvironment();
    this.buildTempleAndSanctuary();
    this.buildPetrifiedStatues();
    this.buildEnvironmentDebrisAndTrees();
    onProgress(80);

    // Puzzles & Pistas
    this.setupPuzzles();
    this.setupInteractableCluesAndNPCs();

    // Aplicar gráficos postprocesado
    this.graphicsManager.applySettingsToScene(this.scene);
    onProgress(100);
  }

  public start(): void {
    this.audioManager.startAmbientMythMusic('mysterious');
    this.uiManager.showHUD();
    this.uiManager.showNotification("Mito de Medusa Iniciado", "Explora la isla para desentrañar el misterio.");

    // Registrar perfil inicial de NPC y Lore
    this.journalSystem.registerCharacter({
      id: "scholar_kallisto",
      name: "Kallisto",
      title: "Superviviente de la Expedición",
      bio: "Anciano erudito helénico desorientado que busca proteger las reliquias del santuario.",
      relationship: "Incierta / Temeroso",
      knownInformation: ["Diferentes viajeros desaparecieron.", "Mencionó susurros cerca del templo."],
      hiddenSecrets: ["Sabe qué ocurrió en el altar de Atenea."]
    });
  }

  private setupLighting(): void {
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.35;
    hemiLight.diffuse = new Color3(0.55, 0.65, 0.82);
    hemiLight.groundColor = new Color3(0.08, 0.1, 0.14);

    const dirLight = new DirectionalLight("moonLight", new Vector3(-0.6, -0.7, 0.4), this.scene);
    dirLight.position = new Vector3(25, 45, -25);
    dirLight.intensity = 0.8;
    dirLight.diffuse = new Color3(0.75, 0.85, 1.0);

    this.graphicsManager.createShadowGenerator(dirLight);

    // Braseros sagrados de bronce con llama cálida
    this.createBrazierLight(new Vector3(-7, 2.2, 2));
    this.createBrazierLight(new Vector3(7, 2.2, 2));
    this.createBrazierLight(new Vector3(-7, 2.2, 16));
    this.createBrazierLight(new Vector3(7, 2.2, 16));
    this.createBrazierLight(new Vector3(0, 3.2, 21));
  }

  private createBrazierLight(pos: Vector3): void {
    // Pedestal de bronce tallado
    const pedestal = MeshBuilder.CreateCylinder("brazierPedestal", { height: 1.2, diameterTop: 0.7, diameterBottom: 0.9, tessellation: 12 }, this.scene);
    pedestal.position = new Vector3(pos.x, pos.y - 0.6, pos.z);
    const bronzeMat = new PBRMaterial("bronzeMat", this.scene);
    bronzeMat.albedoColor = new Color3(0.3, 0.22, 0.14);
    bronzeMat.metallic = 0.8;
    bronzeMat.roughness = 0.35;
    pedestal.material = bronzeMat;

    const bowl = MeshBuilder.CreateCylinder("brazierBowl", { height: 0.4, diameterTop: 1.1, diameterBottom: 0.3 }, this.scene);
    bowl.position = new Vector3(pos.x, pos.y, pos.z);
    bowl.material = bronzeMat;

    const light = new PointLight("brazierLight", pos, this.scene);
    light.diffuse = new Color3(1.0, 0.55, 0.15);
    light.intensity = 1.8;
    light.range = 12;

    // Partículas procedurales de fuego
    const ps = new ParticleSystem("fireParticles", 120, this.scene);
    ps.particleTexture = ProceduralTextureGenerator.createMossRoughnessMap("fireTex", this.scene, 128);
    ps.emitter = pos;
    ps.minEmitBox = new Vector3(-0.15, 0.1, -0.15);
    ps.maxEmitBox = new Vector3(0.15, 0.3, 0.15);
    ps.color1 = new Color4(1.0, 0.6, 0.1, 0.9);
    ps.color2 = new Color4(0.9, 0.2, 0.05, 0.2);
    ps.minSize = 0.15;
    ps.maxSize = 0.45;
    ps.minLifeTime = 0.3;
    ps.maxLifeTime = 0.8;
    ps.emitRate = 45;
    ps.gravity = new Vector3(0, 2, 0);
    ps.start();
  }

  private buildIslandEnvironment(): void {
    // Terreno irregular costero con relieve
    const islandTerrain = MeshBuilder.CreateGroundFromHeightMap(
      "terrain",
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='black'/><circle cx='32' cy='32' r='28' fill='white'/></svg>",
      { width: 110, height: 110, subdivisions: 40, minHeight: -1, maxHeight: 4 },
      this.scene
    );
    islandTerrain.position.y = -0.5;
    islandTerrain.checkCollisions = true;

    const groundMat = new PBRMaterial("groundMat", this.scene);
    groundMat.albedoColor = new Color3(0.16, 0.18, 0.16);
    groundMat.bumpTexture = this.stoneNormalMap;
    groundMat.useParallax = true;
    groundMat.parallaxScaleBias = 0.02;
    groundMat.roughness = 0.85;
    islandTerrain.material = groundMat;

    // Arrecifes y rocas costeras irregulares
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 38 + Math.random() * 8;
      const rock = MeshBuilder.CreatePolyhedron("cliffRock_" + i, { type: 2, size: 2.5 + Math.random() * 3.5 }, this.scene);
      rock.position = new Vector3(Math.cos(angle) * dist, Math.random() * 2, Math.sin(angle) * dist);
      rock.rotation = new Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.scaling = new Vector3(1 + Math.random(), 0.8 + Math.random() * 1.5, 1 + Math.random());

      const rockMat = new PBRMaterial("rockMat_" + i, this.scene);
      rockMat.albedoColor = new Color3(0.2, 0.22, 0.24);
      rockMat.bumpTexture = this.stoneNormalMap;
      rockMat.roughness = 0.9;
      rock.material = rockMat;
      rock.checkCollisions = true;
    }

    // Agua marina con Shader místico
    const waterMesh = MeshBuilder.CreateGround("seaWater", { width: 160, height: 160 }, this.scene);
    waterMesh.position.y = -0.6;
    waterMesh.material = CustomShaderManager.createAncientWaterMaterial(this.scene);
  }

  private buildTempleAndSanctuary(): void {
    const templeMat = new PBRMaterial("templeMat", this.scene);
    templeMat.albedoTexture = this.marbleTexture;
    templeMat.bumpTexture = this.stoneNormalMap;
    templeMat.roughness = 0.35;
    templeMat.metallic = 0.05;

    // Escalinata de entrada al Templo de Atenea
    for (let step = 0; step < 4; step++) {
      const stair = MeshBuilder.CreateBox("stair_" + step, { width: 19 - step * 0.5, height: 0.35, depth: 1.8 }, this.scene);
      stair.position = new Vector3(0, step * 0.35, -4 - step * 1.2);
      stair.material = templeMat;
      stair.checkCollisions = true;
    }

    // Base Estilóbato del Templo
    const base = MeshBuilder.CreateBox("templeBase", { width: 18, height: 1.2, depth: 28 }, this.scene);
    base.position = new Vector3(0, 1.2, 9);
    base.material = templeMat;
    base.checkCollisions = true;

    // Columnas Dóricas acanaladas con capiteles y plintos
    for (let x = -7.5; x <= 7.5; x += 15) {
      for (let z = -2; z <= 20; z += 4.4) {
        const isBroken = (x === 7.5 && z === 11.2); // Columna derrumbada por el tiempo

        if (isBroken) {
          // Fragmentos de columna caídos en el suelo
          const fallenCol1 = MeshBuilder.CreateCylinder("brokenCol1", { height: 3, diameter: 1.0, tessellation: 16 }, this.scene);
          fallenCol1.position = new Vector3(x - 1, 2.0, z);
          fallenCol1.rotation = new Vector3(Math.PI / 2, 0.4, 0.2);
          fallenCol1.material = templeMat;

          const fallenCol2 = MeshBuilder.CreateCylinder("brokenCol2", { height: 2.5, diameter: 0.95, tessellation: 16 }, this.scene);
          fallenCol2.position = new Vector3(x - 2.5, 1.8, z + 1.5);
          fallenCol2.rotation = new Vector3(1.2, 0.8, -0.4);
          fallenCol2.material = templeMat;
          continue;
        }

        const colGroup = new TransformNode("colGroup_" + x + "_" + z, this.scene);

        // Plinto base
        const plinth = MeshBuilder.CreateBox("plinth", { width: 1.2, height: 0.4, depth: 1.2 }, this.scene);
        plinth.position = new Vector3(x, 2.0, z);
        plinth.material = templeMat;
        plinth.parent = colGroup;

        // Fuste acanalado
        const shaft = MeshBuilder.CreateCylinder("shaft", { height: 6.2, diameterTop: 0.85, diameterBottom: 1.0, tessellation: 16 }, this.scene);
        shaft.position = new Vector3(x, 5.3, z);
        shaft.material = templeMat;
        shaft.checkCollisions = true;
        shaft.parent = colGroup;

        // Capitel dórico
        const capital = MeshBuilder.CreateBox("capital", { width: 1.35, height: 0.5, depth: 1.35 }, this.scene);
        capital.position = new Vector3(x, 8.5, z);
        capital.material = templeMat;
        capital.parent = colGroup;
      }
    }

    // Arquitrabe y Friso superior
    const architrave = MeshBuilder.CreateBox("architrave", { width: 18.5, height: 1.2, depth: 28.5 }, this.scene);
    architrave.position = new Vector3(0, 9.2, 9);
    architrave.material = templeMat;

    // Puerta del Santuario Interior (Mecanismo Antiguo de Madera y Bronce)
    this.sanctuaryDoorMesh = MeshBuilder.CreateBox("sanctuaryDoor", { width: 4.8, height: 5.5, depth: 0.7 }, this.scene);
    this.sanctuaryDoorMesh.position = new Vector3(0, 4.2, 19.5);
    const doorMat = new PBRMaterial("doorMat", this.scene);
    doorMat.albedoColor = new Color3(0.25, 0.18, 0.12);
    doorMat.bumpTexture = this.stoneNormalMap;
    doorMat.roughness = 0.7;
    doorMat.metallic = 0.2;
    this.sanctuaryDoorMesh.material = doorMat;
    this.sanctuaryDoorMesh.checkCollisions = true;

    // Estatua Monumental de Atenea con Lanza y Casco Helénico
    const statueGroup = new TransformNode("athenaStatueGroup", this.scene);

    const pedestal = MeshBuilder.CreateBox("athenaPedestal", { width: 2.2, height: 1.2, depth: 2.2 }, this.scene);
    pedestal.position = new Vector3(0, 2.4, 23.5);
    pedestal.material = templeMat;
    pedestal.parent = statueGroup;

    this.athenaStatueMesh = MeshBuilder.CreateCylinder("athenaBody", { height: 3.6, diameterTop: 0.9, diameterBottom: 1.2 }, this.scene);
    this.athenaStatueMesh.position = new Vector3(0, 4.8, 23.5);
    const goldMat = new PBRMaterial("goldMat", this.scene);
    goldMat.albedoColor = new Color3(0.88, 0.72, 0.25);
    goldMat.metallic = 0.85;
    goldMat.roughness = 0.25;
    this.athenaStatueMesh.material = goldMat;
    this.athenaStatueMesh.parent = statueGroup;

    // Lanza de la Diosa
    const spear = MeshBuilder.CreateCylinder("athenaSpear", { height: 5.5, diameter: 0.1 }, this.scene);
    spear.position = new Vector3(0.8, 5.0, 23.2);
    spear.rotation.z = -0.15;
    spear.material = goldMat;
    spear.parent = statueGroup;
  }

  private buildPetrifiedStatues(): void {
    const stoneMat = new PBRMaterial("petrifiedMat", this.scene);
    stoneMat.albedoColor = new Color3(0.38, 0.4, 0.42);
    stoneMat.bumpTexture = this.stoneNormalMap;
    stoneMat.roughness = 0.92;

    // Poses dramáticas de exploradores petrificados
    const statueConfigs = [
      { pos: new Vector3(-3.5, 2.2, 1), rotZ: -0.2, title: "Explorador con Antorcha Caída" },
      { pos: new Vector3(4.2, 2.2, 7), rotZ: 0.35, title: "Guerrero Intentando Cubrirse" },
      { pos: new Vector3(-2.2, 2.2, 13), rotZ: 0.1, title: "Erudito Aterrorizado" }
    ];

    statueConfigs.forEach((cfg, idx) => {
      const statueGroup = new TransformNode("statueGroup_" + idx, this.scene);

      // Torso humano petrificado
      const torso = MeshBuilder.CreateCapsule("torso_" + idx, { height: 1.4, radius: 0.32 }, this.scene);
      torso.position = cfg.pos;
      torso.rotation.z = cfg.rotZ;
      torso.material = stoneMat;
      torso.parent = statueGroup;

      // Cabeza inclinada en gesto de horror
      const head = MeshBuilder.CreateSphere("head_" + idx, { diameter: 0.4 }, this.scene);
      head.position = new Vector3(cfg.pos.x, cfg.pos.y + 0.85, cfg.pos.z);
      head.material = stoneMat;
      head.parent = statueGroup;

      // Brazos alzados en agonía
      const arm1 = MeshBuilder.CreateCylinder("arm1_" + idx, { height: 0.7, diameter: 0.14 }, this.scene);
      arm1.position = new Vector3(cfg.pos.x + 0.35, cfg.pos.y + 0.4, cfg.pos.z);
      arm1.rotation = new Vector3(0.5, 0, -0.8);
      arm1.material = stoneMat;
      arm1.parent = statueGroup;

      if (this.interactionSystem) {
        this.interactionSystem.registerInteractable({
          id: "statue_" + idx,
          name: cfg.title,
          actionText: "EXAMINAR HUELLAS DE PIEDRA",
          mesh: torso,
          onInteract: () => {
            this.audioManager.playSFX('clue');
            this.journalSystem.registerClue({
              id: "clue_statue_" + idx,
              title: cfg.title,
              type: "STATUE",
              description: "No es una escultura tradicional. Las facciones humanas en el rostro de piedra reflejan pavor absoluto antes de quedar petrificado.",
              locationFound: "Pórtico del Templo de Atenea",
              mythVsFact: {
                mythicElement: "Se decía que la mirada de Medusa petrificaba instantáneamente a los mortales.",
                historicalElement: "Los mitos helénicos personificaban fuerzas temibles del mar y volcanes mediante criaturas apotropaicas."
              }
            });
          }
        });
      }
    });
  }

  private buildEnvironmentDebrisAndTrees(): void {
    const woodMat = new PBRMaterial("woodMat", this.scene);
    woodMat.albedoColor = new Color3(0.2, 0.15, 0.1);
    woodMat.roughness = 0.9;

    const leafMat = new PBRMaterial("leafMat", this.scene);
    leafMat.albedoColor = new Color3(0.12, 0.22, 0.12);
    leafMat.roughness = 0.8;

    // Olivos antiguos retorcidos
    const treePositions = [
      new Vector3(-12, 0, -10),
      new Vector3(14, 0, -8),
      new Vector3(-14, 0, 12),
      new Vector3(12, 0, 18)
    ];

    treePositions.forEach((pos, idx) => {
      const trunk = MeshBuilder.CreateCylinder("trunk_" + idx, { height: 4, diameterTop: 0.6, diameterBottom: 1.1, tessellation: 10 }, this.scene);
      trunk.position = new Vector3(pos.x, pos.y + 2, pos.z);
      trunk.rotation = new Vector3(0.1, idx, -0.15);
      trunk.material = woodMat;

      const foliage = MeshBuilder.CreatePolyhedron("foliage_" + idx, { type: 1, size: 2.2 }, this.scene);
      foliage.position = new Vector3(pos.x, pos.y + 4.2, pos.z);
      foliage.material = leafMat;
    });

    // Ánforas rotas y fragmentos de cerámica dispersos
    for (let i = 0; i < 8; i++) {
      const amphora = MeshBuilder.CreateCylinder("amphora_" + i, { height: 0.8, diameterTop: 0.3, diameterBottom: 0.15 }, this.scene);
      amphora.position = new Vector3(-6 + i * 1.8, 1.4, -2 + (i % 3));
      amphora.rotation = new Vector3(1.2, i * 0.7, 0.4);

      const clayMat = new PBRMaterial("clayMat_" + i, this.scene);
      clayMat.albedoColor = new Color3(0.65, 0.35, 0.2);
      clayMat.roughness = 0.75;
      amphora.material = clayMat;
    }
  }

  private setupInteractableCluesAndNPCs(): void {
    if (!this.interactionSystem) return;

    // NPC: Erudito Kallisto
    this.survivorNPCMesh = MeshBuilder.CreateCapsule("scholar_npc", { height: 1.75, radius: 0.4 }, this.scene);
    this.survivorNPCMesh.position = new Vector3(-6, 1.2, -12);
    const npcMat = new PBRMaterial("npcMat", this.scene);
    npcMat.albedoColor = new Color3(0.65, 0.48, 0.32);
    npcMat.roughness = 0.8;
    this.survivorNPCMesh.material = npcMat;

    this.interactionSystem.registerInteractable({
      id: "npc_kallisto",
      name: "Kallisto (Superviviente)",
      actionText: "HABLAR CON ERUDITO",
      mesh: this.survivorNPCMesh,
      isNPC: true,
      onInteract: () => {
        this.startScholarDialogue();
      }
    });

    // Pergamino Antiguo Inscripción
    const scrollMesh = MeshBuilder.CreateBox("ancient_scroll", { width: 0.7, height: 0.12, depth: 0.45 }, this.scene);
    scrollMesh.position = new Vector3(3.2, 1.5, -3.5);

    this.interactionSystem.registerInteractable({
      id: "obj_scroll",
      name: "Pergamino Sacro de Atenea",
      actionText: "LEER INSCRIPCIÓN",
      mesh: scrollMesh,
      onInteract: () => {
        this.audioManager.playSFX('clue');
        this.journalSystem.registerClue({
          id: "clue_scroll_athena",
          title: "Promesa del Escudo de Bronce",
          type: "INSCRIPTION",
          description: "Inscripción sacra: 'La Gorgona no puede ser mirada de frente. Solo mediante el reflejo en el bronce bendecido de la diosa la maldición será disipada'.",
          locationFound: "Altar Exterior",
          mythVsFact: {
            mythicElement: "Perseo utilizó el escudo pulido de Atenea como espejo para decapitar a Medusa sin mirarla.",
            historicalElement: "En la iconografía griega antigua, el Aegis/Escudo servía de protección apotropaica contra el mal."
          }
        });
      }
    });

    // Escudo de Bronce Pulido en el Santuario Interior
    this.bronzeShieldOfferMesh = MeshBuilder.CreateCylinder("bronzeShield", { height: 0.12, diameter: 1.5, tessellation: 32 }, this.scene);
    this.bronzeShieldOfferMesh.position = new Vector3(0, 3.2, 22.5);
    this.bronzeShieldOfferMesh.rotation.x = Math.PI / 4;

    const shieldMat = new PBRMaterial("shieldMat", this.scene);
    shieldMat.albedoColor = new Color3(0.95, 0.78, 0.32);
    shieldMat.metallic = 0.95;
    shieldMat.roughness = 0.04; // Reflejo tipo espejo perfecto
    this.bronzeShieldOfferMesh.material = shieldMat;

    this.interactionSystem.registerInteractable({
      id: "obj_bronze_shield",
      name: "Escudo Espejo de Bronce",
      actionText: "RECOGER ARTEFACTO SAGRADO",
      mesh: this.bronzeShieldOfferMesh,
      onInteract: () => {
        if (!this.playerHasShield) {
          this.playerHasShield = true;
          this.audioManager.playSFX('clue');
          this.bronzeShieldOfferMesh?.setEnabled(false);
          this.uiManager.showNotification("Artefacto Obtenido", "Has conseguido el Escudo Espejo de Bronce.");
          this.journalSystem.registerClue({
            id: "clue_shield_obtained",
            title: "Escudo Espejo de Bronce",
            type: "OBJECT",
            description: "Superficie de bronce pulida a la perfección. Refleja con total claridad el entorno sin exponer al portador.",
            locationFound: "Altar de Atenea",
            mythVsFact: {
              mythicElement: "Artefacto mitológico entregado por la diosa Atenea.",
              historicalElement: "Los escudos de bronce de los hoplitas griegos se pulían minuciosamente antes de las batallas."
            }
          });

          this.triggerMedusaEncounter();
        }
      }
    });
  }

  private setupPuzzles(): void {
    if (!this.interactionSystem) return;

    // 1. Light & Mirror Puzzle
    this.mirrorPuzzle = new LightMirrorPuzzle(this.scene);
    const mirror1 = MeshBuilder.CreateBox("mirror_1", { width: 0.25, height: 2.2, depth: 1.4 }, this.scene);
    mirror1.position = new Vector3(-5.5, 2.3, 8);
    const mirror2 = MeshBuilder.CreateBox("mirror_2", { width: 0.25, height: 2.2, depth: 1.4 }, this.scene);
    mirror2.position = new Vector3(5.5, 2.3, 13);

    this.mirrorPuzzle.registerMirror(mirror1, 0);
    this.mirrorPuzzle.registerMirror(mirror2, 90);

    this.interactionSystem.registerInteractable({
      id: "puzzle_mirror_1",
      name: "Espejo de Bronce I",
      actionText: "ROTAR ESPEJO",
      mesh: mirror1,
      onInteract: () => {
        this.mirrorPuzzle.rotateMirror(0);
        this.audioManager.playSFX('interact');
      }
    });

    this.interactionSystem.registerInteractable({
      id: "puzzle_mirror_2",
      name: "Espejo de Bronce II",
      actionText: "ROTAR ESPEJO",
      mesh: mirror2,
      onInteract: () => {
        this.mirrorPuzzle.rotateMirror(1);
        this.audioManager.playSFX('interact');
      }
    });

    this.mirrorPuzzle.setOnSolveCallback(() => {
      this.audioManager.playSFX('puzzle_solve');
      this.uiManager.showNotification("Puzzle Resuelto", "El rayo de luz ha alineado los espejos sagrados.");
    });

    // 2. Symbol Dial Puzzle para abrir el Santuario
    const dials: SymbolDial[] = [
      { id: "dial_athena", name: "Símbolo de la Búho", symbols: ["🦉", "🌿", "🐍"], currentIndex: 0 },
      { id: "dial_gorgon", name: "Símbolo de la Serpiente", symbols: ["🐍", "🦉", "🌊"], currentIndex: 0 }
    ];

    this.symbolPuzzle = new SacredSymbolPuzzle(dials, [0, 0]);
    this.symbolPuzzle.setOnSolveCallback(() => {
      this.audioManager.playSFX('puzzle_solve');
      this.uiManager.showNotification("Santuario Desbloqueado", "Las grandes puertas de piedra del templo se abren.");

      // Animar apertura de puerta
      if (this.sanctuaryDoorMesh) {
        this.sanctuaryDoorMesh.position.y += 4.5;
      }
    });

    if (this.sanctuaryDoorMesh) {
      this.interactionSystem.registerInteractable({
        id: "puzzle_door_mechanism",
        name: "Mecanismo del Santuario",
        actionText: "RESOLVER COMBINACIÓN DE SÍMBOLOS",
        mesh: this.sanctuaryDoorMesh,
        onInteract: () => {
          if (!this.symbolPuzzle.getSolved()) {
            this.symbolPuzzle.rotateDial(0);
            this.symbolPuzzle.rotateDial(1);
          }
        }
      });
    }
  }

  private startScholarDialogue(): void {
    const dialogueNodes = new Map<string, DialogueNode>();
    dialogueNodes.set("start", {
      id: "start",
      speakerName: "Kallisto",
      speakerTitle: "Superviviente de la Expedición",
      text: "¡No te acerques más al templo! Las sombras aquí tienen ojos y convierten la carne en piedra impasible...",
      choices: [
        {
          id: "c1",
          text: "¿Qué ocurrió con tu expedición?",
          nextDialogueNodeId: "node_expedition"
        },
        {
          id: "c2",
          text: "He examinado las estatuas. No son esculturas.",
          requiredClueId: "clue_statue_0",
          nextDialogueNodeId: "node_statues_truth"
        }
      ]
    });

    dialogueNodes.set("node_expedition", {
      id: "node_expedition",
      speakerName: "Kallisto",
      speakerTitle: "Superviviente de la Expedición",
      text: "Buscábamos el relicario de Atenea, pero desatamos algo antiguo que yacía en la cueva tras el altar. Uno a uno sucumbieron sin poder defenderse.",
      choices: [
        { id: "end_1", text: "Buscaré una forma de entrar al santuario." }
      ]
    });

    dialogueNodes.set("node_statues_truth", {
      id: "node_statues_truth",
      speakerName: "Kallisto",
      speakerTitle: "Superviviente de la Expedición",
      text: "¡Así es! Fueron petrificados en un pestañeo. Si pretendes enfrentarla, necesitas el escudo reflejante del altar sagrado de Atenea. ¡Nunca la mires a los ojos!",
      choices: [
        { id: "end_2", text: "Gracias por la advertencia, Kallisto." }
      ]
    });

    const tree: DialogueTree = {
      id: "kallisto_tree",
      characterId: "scholar_kallisto",
      nodes: dialogueNodes,
      startNodeId: "start"
    };

    this.uiManager.showDialogueOverlay(tree, this.dialogueSystem);
  }

  private triggerMedusaEncounter(): void {
    // Cambio ambiental supernatural
    this.audioManager.startAmbientMythMusic('danger');
    this.scene.fogColor = new Color3(0.02, 0.12, 0.05); // Niebla verde de serpiente
    this.audioManager.playSFX('whisper');

    // Generar aparición de Medusa con Aura Shader
    this.medusaMesh = MeshBuilder.CreateCapsule("medusaBoss", { height: 2.3, radius: 0.55 }, this.scene);
    this.medusaMesh.position = new Vector3(0, 2.5, 13);
    this.medusaMesh.material = CustomShaderManager.createMedusaAuraMaterial(this.scene);

    this.uiManager.showSubtitle("Medusa ha despertado... ¡Utiliza el Escudo Espejo de Bronce!");

    // Transición cinematográfica
    this.cameraManager.transitionToCinematic(this.medusaMesh.position, 6.0, Math.PI / 4, Math.PI / 3, 90).then(() => {
      this.cameraManager.returnToPlayer();
    });

    // Registro de interacción final para neutralizar a Medusa
    if (this.interactionSystem) {
      this.interactionSystem.registerInteractable({
        id: "boss_medusa",
        name: "Medusa la Gorgona",
        actionText: "REFLEJAR MIRADA CON ESCUDO DE BRONCE",
        mesh: this.medusaMesh,
        onInteract: () => {
          this.resolveChapterClimax();
        }
      });
    }
  }

  private resolveChapterClimax(): void {
    if (this.isMedusaDefeated) return;
    this.isMedusaDefeated = true;

    this.audioManager.playSFX('puzzle_solve');
    this.uiManager.showSubtitle("Al alzar el escudo espejo, el rayo de su propia mirada se refleja en la superficie pulida...");

    setTimeout(() => {
      if (this.medusaMesh) {
        this.medusaMesh.dispose();
      }

      // Guardar victoria
      this.saveSystem.saveGame({
        currentChapterId: "medusa",
        timestamp: Date.now(),
        unlockedClues: this.journalSystem.getClues().map(c => c.id),
        resolvedPuzzles: ["mirror_puzzle", "symbol_puzzle"],
        decisions: { medusaOutcome: "reflected_shield" },
        unlockedChapters: ["medusa", "minotaur", "orpheus"]
      });

      this.uiManager.showResolutionScreen(
        "LA MIRADA DE MEDUSA",
        this.journalSystem.getClues().length,
        5,
        3
      );
    }, 2500);
  }

  private setupJournalNotifications(): void {
    this.journalSystem.setOnClueAddedCallback((clue) => {
      this.uiManager.showNotification("Nueva Pista", clue.title);
    });
  }

  public dispose(): void {
    this.audioManager.stopAmbientMythMusic();
    if (this.scene) {
      this.scene.dispose();
    }
  }
}
