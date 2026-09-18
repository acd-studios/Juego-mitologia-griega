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
  ParticleSystem
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
import { JournalSystem, Clue } from '../investigation/JournalSystem';
import { DialogueSystem, DialogueTree, DialogueNode } from '../dialogue/DialogueSystem';
import { CustomShaderManager } from '../shaders/CustomShaderManager';
import { LightMirrorPuzzle } from '../puzzles/LightMirrorPuzzle';
import { SacredSymbolPuzzle, SymbolDial } from '../puzzles/SacredSymbolPuzzle';
import { ProceduralTextureGenerator } from '../graphics/ProceduralTextures';
import { GreekArchitectureBuilder } from '../graphics/GreekArchitectureBuilder';
import { HellenicAssetGenerator } from '../graphics/HellenicAssetGenerator';
import { NPCCharacterBuilder } from '../npc/NPCCharacterBuilder';

export class MedusaChapter extends MythChapter {
  private player!: PlayerController;
  private cameraManager!: CameraManager;
  private interactionSystem!: InteractionSystem;
  private journalSystem!: JournalSystem;
  private dialogueSystem!: DialogueSystem;
  private archBuilder!: GreekArchitectureBuilder;
  private assetGenerator!: HellenicAssetGenerator;
  private npcBuilder!: NPCCharacterBuilder;

  private mirrorPuzzle!: LightMirrorPuzzle;
  private symbolPuzzle!: SacredSymbolPuzzle;

  private medusaMesh: Mesh | null = null;
  private survivorNPCMesh: Mesh | null = null;
  private sanctuaryDoorMesh: Mesh | null = null;
  private athenaStatueMesh: TransformNode | null = null;
  private bronzeShieldOfferMesh: Mesh | null = null;

  private isMedusaDefeated: boolean = false;
  private playerHasShield: boolean = false;

  private stoneNormalMap!: Texture;
  private marbleTexture!: Texture;

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
      description: "Investiga la misteriosa desaparición de expediciones en un santuario griego abandonado.",
      unlockedByDefault: true
    };
    super(config, engineManager, uiManager, audioManager, saveSystem, graphicsManager);
  }

  public async load(onProgress: (progress: number) => void): Promise<void> {
    onProgress(10);
    this.scene = new Scene(this.engineManager.getEngine());
    this.scene.clearColor = new Color4(0.02, 0.04, 0.07, 1.0);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.012;
    this.scene.fogColor = new Color3(0.04, 0.07, 0.11);

    this.engineManager.setScene(this.scene);
    onProgress(20);

    // Texturas
    this.stoneNormalMap = ProceduralTextureGenerator.createStoneNormalMap("stoneNorm", this.scene, 512, 1.2);
    this.marbleTexture = ProceduralTextureGenerator.createMarbleTexture("marbleTex", this.scene, 512);

    // Configurar Sistemas Narrative & Audio
    this.journalSystem = new JournalSystem();
    this.dialogueSystem = new DialogueSystem();
    this.setupJournalNotifications();
    this.uiManager.setJournalSystem(this.journalSystem);

    // Cámara en Primera Persona & Player Controller en Hall Cerrado (spawn = 0, 0, -22)
    this.cameraManager = new CameraManager(this.scene, this.engineManager.getCanvas());
    this.player = new PlayerController(this.scene, this.cameraManager, new Vector3(0, 0, -22));

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

    // Iluminación
    this.setupLighting();
    onProgress(60);

    // Arquitectura Griega Encerrada + Templo Exterior + Hellenic Props
    this.archBuilder = new GreekArchitectureBuilder(this.scene);
    this.assetGenerator = new HellenicAssetGenerator(this.scene);
    this.npcBuilder = new NPCCharacterBuilder(this.scene);

    this.buildEnclosedSanctuaryComplex();
    this.buildPetrifiedStatues();
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
    this.uiManager.showNotification("Santuario de Atenea", "Explora la sala cerrada y busca pistas en el diario (WASD + Ratón / Tecla J).");

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
    hemiLight.intensity = 0.3;
    hemiLight.diffuse = new Color3(0.5, 0.6, 0.8);
    hemiLight.groundColor = new Color3(0.08, 0.1, 0.14);

    // Sol abrasador con sombras directas sobre el patio y entrada
    const sunLight = new DirectionalLight("sunLight", new Vector3(-0.5, -0.8, 0.4), this.scene);
    sunLight.position = new Vector3(20, 40, -20);
    sunLight.intensity = 1.1;
    sunLight.diffuse = new Color3(1.0, 0.92, 0.75);

    this.graphicsManager.createShadowGenerator(sunLight);

    // Antorchas de pared cálidas en el hall cerrado
    this.createBrazierLight(new Vector3(-6, 2.5, -24));
    this.createBrazierLight(new Vector3(6, 2.5, -24));
    this.createBrazierLight(new Vector3(-6, 2.5, -16));
    this.createBrazierLight(new Vector3(6, 2.5, -16));
    this.createBrazierLight(new Vector3(0, 3.2, 21));
  }

  private createBrazierLight(pos: Vector3): void {
    this.assetGenerator.createBronzeTripodBrazier(pos);

    const light = new PointLight("brazierLight", new Vector3(pos.x, pos.y + 1.6, pos.z), this.scene);
    light.diffuse = new Color3(1.0, 0.55, 0.15);
    light.intensity = 1.8;
    light.range = 10;
  }

  private buildEnclosedSanctuaryComplex(): void {
    // 1. Hall Cerrado de Inicio con Techo, Paredes y Columnas Ionic
    this.archBuilder.buildEnclosedSpawnHall(new Vector3(0, 0, -20), 18, 7.5, 22);

    // Dynamic Props en el Hall: Ánforas cerámicas
    const amphoraCollider1 = this.assetGenerator.createGreekAmphora(new Vector3(6, 0, -22));
    const amphoraCollider2 = this.assetGenerator.createGreekAmphora(new Vector3(-6.5, 0, -18));

    if (this.interactionSystem) {
      this.interactionSystem.registerInteractable({
        id: "amphora_1",
        name: "Ánfora de Cerámica Ática",
        actionText: "EXAMINAR PINTURA ROJA",
        mesh: amphoraCollider1,
        onInteract: () => {
          this.audioManager.playSFX('clue');
          this.journalSystem.registerClue({
            id: "clue_amphora_paint",
            title: "Pintura Mítica en Ánfora",
            type: "INSCRIPTION",
            description: "Ilustración de figuras rojas mostrando la mirada reflejada de la Gorgona sobre un escudo pulido.",
            locationFound: "Atrio de Entrada",
            mythVsFact: {
              mythicElement: "Las ánforas cerámicas narraban episodios heroicos de la mitología.",
              historicalElement: "La cerámica de figuras rojas fue una técnica artística destacada en la Atenas del siglo V a.C."
            }
          });
        }
      });
    }

    // 2. Terreno Exterior para el Templo del Clímax
    const terrain = MeshBuilder.CreateGround("outerTerrain", { width: 100, height: 100 }, this.scene);
    terrain.position = new Vector3(0, -0.2, 10);
    terrain.checkCollisions = true;

    const groundMat = new PBRMaterial("groundMat", this.scene);
    groundMat.albedoColor = new Color3(0.18, 0.2, 0.18);
    groundMat.bumpTexture = this.stoneNormalMap;
    groundMat.roughness = 0.85;
    terrain.material = groundMat;

    // Agua mística
    const water = MeshBuilder.CreateGround("seaWater", { width: 140, height: 140 }, this.scene);
    water.position = new Vector3(0, -0.5, 10);
    water.material = CustomShaderManager.createAncientWaterMaterial(this.scene);

    // 3. Templo Monumental de Atenea
    const templeMat = new PBRMaterial("templeMat", this.scene);
    templeMat.albedoTexture = this.marbleTexture;
    templeMat.bumpTexture = this.stoneNormalMap;
    templeMat.roughness = 0.35;

    const base = MeshBuilder.CreateBox("templeBase", { width: 18, height: 1.2, depth: 26 }, this.scene);
    base.position = new Vector3(0, 0.6, 9);
    base.material = templeMat;
    base.checkCollisions = true;

    // Puerta del Santuario Interior
    this.sanctuaryDoorMesh = MeshBuilder.CreateBox("sanctuaryDoor", { width: 4.8, height: 5.5, depth: 0.7 }, this.scene);
    this.sanctuaryDoorMesh.position = new Vector3(0, 3.9, 19.5);
    const doorMat = new PBRMaterial("doorMat", this.scene);
    doorMat.albedoColor = new Color3(0.25, 0.18, 0.12);
    doorMat.bumpTexture = this.stoneNormalMap;
    doorMat.roughness = 0.7;
    this.sanctuaryDoorMesh.material = doorMat;
    this.sanctuaryDoorMesh.checkCollisions = true;

    // Monumental Athena Promachos Statue
    this.athenaStatueMesh = this.assetGenerator.createAthenaMonument(new Vector3(0, 1.2, 23.5));
  }

  private buildPetrifiedStatues(): void {
    const stoneMat = new PBRMaterial("petrifiedMat", this.scene);
    stoneMat.albedoColor = new Color3(0.38, 0.4, 0.42);
    stoneMat.bumpTexture = this.stoneNormalMap;
    stoneMat.roughness = 0.92;

    const statuePositions = [
      new Vector3(-3.5, 0.8, -14),
      new Vector3(4.2, 0.8, 7),
      new Vector3(-2.2, 0.8, 13)
    ];

    statuePositions.forEach((pos, idx) => {
      const torso = MeshBuilder.CreateCapsule("torso_" + idx, { height: 1.6, radius: 0.35 }, this.scene);
      torso.position = pos;
      torso.material = stoneMat;

      if (this.interactionSystem) {
        this.interactionSystem.registerInteractable({
          id: "statue_" + idx,
          name: "Explorador Petrificado #" + (idx + 1),
          actionText: "EXAMINAR HUELLAS DE PIEDRA",
          mesh: torso,
          onInteract: () => {
            this.audioManager.playSFX('clue');
            this.journalSystem.registerClue({
              id: "clue_statue_" + idx,
              title: "Víctima Petrificada #" + (idx + 1),
              type: "STATUE",
              description: "Facciones de pánico petrificadas en mármol ceniza.",
              locationFound: "Atrio del Santuario",
              mythVsFact: {
                mythicElement: "La mirada directa de Medusa petrificaba instantáneamente.",
                historicalElement: "Reflejo del terror de fuerzas desconocidas en la antigüedad."
              }
            });
          }
        });
      }
    });
  }

  private setupInteractableCluesAndNPCs(): void {
    if (!this.interactionSystem) return;

    // NPC: Erudito Kallisto animado con túnica helénica y papiro
    this.survivorNPCMesh = this.npcBuilder.createHellenicScholarNPC("Kallisto", new Vector3(-5, 0, -17));

    this.interactionSystem.registerInteractable({
      id: "npc_kallisto",
      name: "Kallisto (Erudito Superviviente)",
      actionText: "HABLAR CON ERUDITO",
      mesh: this.survivorNPCMesh,
      isNPC: true,
      onInteract: () => {
        this.startScholarDialogue();
      }
    });

    // Cofre con Pergamino Sacro
    const chestMesh = MeshBuilder.CreateBox("chest_scroll", { width: 0.8, height: 0.5, depth: 0.5 }, this.scene);
    chestMesh.position = new Vector3(5, 0.25, -17);
    const woodMat = new PBRMaterial("chestWood", this.scene);
    woodMat.albedoColor = new Color3(0.3, 0.2, 0.1);
    chestMesh.material = woodMat;

    this.interactionSystem.registerInteractable({
      id: "obj_chest",
      name: "Cofre Antiguo con Inscripciones",
      actionText: "REGISTRAR COFRE",
      mesh: chestMesh,
      onInteract: () => {
        this.audioManager.playSFX('clue');
        this.journalSystem.registerClue({
          id: "clue_scroll_athena",
          title: "Promesa del Escudo de Bronce",
          type: "INSCRIPTION",
          description: "Pergamino hallado en el cofre: 'La Gorgona no puede ser mirada de frente. Solo mediante el reflejo en el bronce bendecido de la diosa la maldición será disipada'.",
          locationFound: "Atrio de Entrada",
          mythVsFact: {
            mythicElement: "Perseo utilizó el escudo pulido de Atenea como espejo.",
            historicalElement: "Los escudos de bronce de los hoplitas se pulían a espejo."
          }
        });
      }
    });

    // Escudo de Bronce Pulido en el Santuario Interior
    this.bronzeShieldOfferMesh = MeshBuilder.CreateCylinder("bronzeShield", { height: 0.12, diameter: 1.5, tessellation: 32 }, this.scene);
    this.bronzeShieldOfferMesh.position = new Vector3(0, 2.5, 22.5);
    this.bronzeShieldOfferMesh.rotation.x = Math.PI / 4;

    const shieldMat = new PBRMaterial("shieldMat", this.scene);
    shieldMat.albedoColor = new Color3(0.95, 0.78, 0.32);
    shieldMat.metallic = 0.95;
    shieldMat.roughness = 0.04;
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
            description: "Superficie de bronce pulida a espejo. Refleja la luz sin exponer al portador.",
            locationFound: "Altar de Atenea",
            mythVsFact: {
              mythicElement: "Artefacto mitológico bendecido por Atenea.",
              historicalElement: "Escudo de bronce de combate hoplita."
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
    mirror1.position = new Vector3(-5.5, 1.5, 8);
    const mirror2 = MeshBuilder.CreateBox("mirror_2", { width: 0.25, height: 2.2, depth: 1.4 }, this.scene);
    mirror2.position = new Vector3(5.5, 1.5, 13);

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
      this.uiManager.showNotification("Puzzle Resuelto", "El rayo de luz alinea los espejos sagrados.");
    });

    // 2. Symbol Dial Puzzle
    const dials: SymbolDial[] = [
      { id: "dial_athena", name: "Símbolo de la Búho", symbols: ["🦉", "🌿", "🐍"], currentIndex: 0 },
      { id: "dial_gorgon", name: "Símbolo de la Serpiente", symbols: ["🐍", "🦉", "🌊"], currentIndex: 0 }
    ];

    this.symbolPuzzle = new SacredSymbolPuzzle(dials, [0, 0]);
    this.symbolPuzzle.setOnSolveCallback(() => {
      this.audioManager.playSFX('puzzle_solve');
      this.uiManager.showNotification("Santuario Desbloqueado", "Las grandes puertas de piedra se abren.");

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
      text: "¡No avances sin cautela! Las sombras en este santuario convierten la carne en piedra fría...",
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
      text: "Buscábamos el relicario de Atenea. Pero desatamos a la criatura que mora tras el altar sagrado.",
      choices: [
        { id: "end_1", text: "Buscaré una forma de entrar al santuario." }
      ]
    });

    dialogueNodes.set("node_statues_truth", {
      id: "node_statues_truth",
      speakerName: "Kallisto",
      speakerTitle: "Superviviente de la Expedición",
      text: "¡Fueron petrificados! Para enfrentarla sin perecer necesitas el escudo reflejante del altar de Atenea. ¡Nunca la mires a los ojos!",
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
    this.audioManager.startAmbientMythMusic('danger');
    this.scene.fogColor = new Color3(0.02, 0.12, 0.05);
    this.audioManager.playSFX('whisper');

    this.medusaMesh = MeshBuilder.CreateCapsule("medusaBoss", { height: 2.3, radius: 0.55 }, this.scene);
    this.medusaMesh.position = new Vector3(0, 2.5, 13);
    this.medusaMesh.material = CustomShaderManager.createMedusaAuraMaterial(this.scene);

    this.uiManager.showSubtitle("Medusa ha despertado... ¡Utiliza el Escudo Espejo de Bronce!");

    this.cameraManager.transitionToCinematic(this.medusaMesh.position, 4.0).then(() => {
      this.cameraManager.returnToPlayer();
    });

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
