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
import { JournalSystem, Clue, CharacterProfile } from '../investigation/JournalSystem';
import { DialogueSystem, DialogueTree, DialogueNode } from '../dialogue/DialogueSystem';
import { CustomShaderManager } from '../shaders/CustomShaderManager';
import { LightMirrorPuzzle } from '../puzzles/LightMirrorPuzzle';
import { SacredSymbolPuzzle, SymbolDial } from '../puzzles/SacredSymbolPuzzle';

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
    this.scene.clearColor = new Color4(0.04, 0.06, 0.09, 1.0);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.015;
    this.scene.fogColor = new Color3(0.06, 0.08, 0.12);

    this.engineManager.setScene(this.scene);
    onProgress(20);

    // Configurar Sistemas Narrative & Audio
    this.journalSystem = new JournalSystem();
    this.dialogueSystem = new DialogueSystem();
    this.setupJournalNotifications();

    // Configurar Jugador, Cámara e Interacción PRIMERO
    this.player = new PlayerController(this.scene, new Vector3(0, 1.2, -18));
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

    // Iluminación
    this.setupLighting();
    onProgress(60);

    // Construir Escenario 3D PBR (Isla, Templo Griego, Santuario, Cueva)
    this.buildIslandEnvironment();
    this.buildTempleAndSanctuary();
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
    hemiLight.intensity = 0.4;
    hemiLight.diffuse = new Color3(0.6, 0.7, 0.85);
    hemiLight.groundColor = new Color3(0.1, 0.12, 0.15);

    const dirLight = new DirectionalLight("moonLight", new Vector3(-0.5, -0.8, 0.5), this.scene);
    dirLight.position = new Vector3(20, 40, -20);
    dirLight.intensity = 0.7;
    dirLight.diffuse = new Color3(0.8, 0.85, 1.0);

    this.graphicsManager.createShadowGenerator(dirLight);

    // Antorchas / Braseros con PointLights cálidos
    this.createBrazierLight(new Vector3(-6, 2, 2));
    this.createBrazierLight(new Vector3(6, 2, 2));
    this.createBrazierLight(new Vector3(-6, 2, 14));
    this.createBrazierLight(new Vector3(6, 2, 14));
  }

  private createBrazierLight(pos: Vector3): void {
    const light = new PointLight("brazierLight", pos, this.scene);
    light.diffuse = new Color3(1.0, 0.6, 0.2);
    light.intensity = 1.5;
    light.range = 10;

    // Partículas de Fuego / Polvo
    const ps = new ParticleSystem("fireParticles", 100, this.scene);
    ps.particleTexture = new Texture("https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/flare.png", this.scene);
    ps.emitter = pos;
    ps.minEmitBox = new Vector3(-0.1, 0, -0.1);
    ps.maxEmitBox = new Vector3(0.1, 0.2, 0.1);
    ps.color1 = new Color4(1.0, 0.5, 0.1, 1.0);
    ps.color2 = new Color4(1.0, 0.2, 0.0, 1.0);
    ps.minSize = 0.1;
    ps.maxSize = 0.3;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.6;
    ps.emitRate = 40;
    ps.start();
  }

  private buildIslandEnvironment(): void {
    // Terreno Costero
    const islandTerrain = MeshBuilder.CreateGround("terrain", { width: 100, height: 100, subdivisions: 30 }, this.scene);
    islandTerrain.position.y = 0;
    islandTerrain.checkCollisions = true;

    const groundMat = new PBRMaterial("groundMat", this.scene);
    groundMat.albedoColor = new Color3(0.18, 0.2, 0.18);
    groundMat.roughness = 0.85;
    islandTerrain.material = groundMat;

    // Agua mística marina con Shader
    const waterMesh = MeshBuilder.CreateGround("seaWater", { width: 140, height: 140 }, this.scene);
    waterMesh.position.y = -0.2;
    waterMesh.material = CustomShaderManager.createAncientWaterMaterial(this.scene);
  }

  private buildTempleAndSanctuary(): void {
    const templeMat = new PBRMaterial("templeMat", this.scene);
    templeMat.albedoColor = new Color3(0.85, 0.82, 0.78);
    templeMat.roughness = 0.3; // Mármol pulido antiguo

    // Estructura principal del Templo de Atenea
    const base = MeshBuilder.CreateBox("templeBase", { width: 18, height: 1.2, depth: 26 }, this.scene);
    base.position = new Vector3(0, 0.6, 8);
    base.material = templeMat;
    base.checkCollisions = true;

    // Columnas Dóricas en PBR
    for (let x = -7; x <= 7; x += 14) {
      for (let z = -2; z <= 18; z += 4) {
        const column = MeshBuilder.CreateCylinder("col_" + x + "_" + z, { height: 6, diameter: 0.9 }, this.scene);
        column.position = new Vector3(x, 4.2, z);
        column.material = templeMat;
        column.checkCollisions = true;
      }
    }

    // Puerta del Santuario Interior (Mecanismo Antiguo)
    this.sanctuaryDoorMesh = MeshBuilder.CreateBox("sanctuaryDoor", { width: 4, height: 5, depth: 0.6 }, this.scene);
    this.sanctuaryDoorMesh.position = new Vector3(0, 3.7, 18);
    const doorMat = new PBRMaterial("doorMat", this.scene);
    doorMat.albedoColor = new Color3(0.3, 0.22, 0.15);
    doorMat.roughness = 0.7;
    this.sanctuaryDoorMesh.material = doorMat;
    this.sanctuaryDoorMesh.checkCollisions = true;

    // Estatua de Atenea en el Santuario Interior
    this.athenaStatueMesh = MeshBuilder.CreateBox("athenaStatue", { width: 1.2, height: 3.5, depth: 1.2 }, this.scene);
    this.athenaStatueMesh.position = new Vector3(0, 3.0, 22);
    const goldMat = new PBRMaterial("goldMat", this.scene);
    goldMat.albedoColor = new Color3(0.9, 0.75, 0.2);
    goldMat.metallic = 0.9;
    goldMat.roughness = 0.2;
    this.athenaStatueMesh.material = goldMat;
  }

  private buildPetrifiedStatues(): void {
    const stoneMat = new PBRMaterial("petrifiedMat", this.scene);
    stoneMat.albedoColor = new Color3(0.4, 0.42, 0.45);
    stoneMat.roughness = 0.9;

    // Estatuas de exploradores petrificados en poses dramáticas
    const statuePositions = [
      new Vector3(-3, 1.8, 1),
      new Vector3(4, 1.8, 6),
      new Vector3(-2, 1.8, 12)
    ];

    statuePositions.forEach((pos, idx) => {
      const statue = MeshBuilder.CreateCapsule("petrified_human_" + idx, { height: 1.7, radius: 0.35 }, this.scene);
      statue.position = pos;
      statue.rotation.z = idx === 1 ? 0.3 : 0;
      statue.material = stoneMat;

      if (this.interactionSystem) {
        this.interactionSystem.registerInteractable({
          id: "statue_" + idx,
          name: "Estatua de Explorador Petrificado",
          actionText: "EXAMINAR HUELLAS DE PIEDRA",
          mesh: statue,
          onInteract: () => {
            this.audioManager.playSFX('clue');
            this.journalSystem.registerClue({
              id: "clue_statue_" + idx,
              title: "Víctima Petrificada #" + (idx + 1),
              type: "STATUE",
              description: "No es una escultura tradicional. Sus facciones muestran verdadero pánico antes de convertirse en piedra instantáneamente.",
              locationFound: "Pórtico del Templo",
              mythVsFact: {
                mythicElement: "Se decía que la mirada de Medusa petrificaba instantáneamente.",
                historicalElement: "Estudios arqueológicos sugieren reacciones químicas desconocidas o mitos para infundir temor."
              }
            });
          }
        });
      }
    });
  }

  private setupInteractableCluesAndNPCs(): void {
    if (!this.interactionSystem) return;

    // NPC: Erudito Kallisto
    this.survivorNPCMesh = MeshBuilder.CreateCapsule("scholar_npc", { height: 1.75, radius: 0.4 }, this.scene);
    this.survivorNPCMesh.position = new Vector3(-5, 1.8, -8);
    const npcMat = new PBRMaterial("npcMat", this.scene);
    npcMat.albedoColor = new Color3(0.7, 0.5, 0.3);
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
    const scrollMesh = MeshBuilder.CreateBox("ancient_scroll", { width: 0.6, height: 0.1, depth: 0.4 }, this.scene);
    scrollMesh.position = new Vector3(3, 1.3, -4);

    this.interactionSystem.registerInteractable({
      id: "obj_scroll",
      name: "Pergamino de Atenea",
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
            mythicElement: "Perseo utilizó el escudo pulido de Atenea como espejo para no mirar a Medusa.",
            historicalElement: "En la iconografía griega antigua, el Aegis/Escudo servía de protección apotropaica."
          }
        });
      }
    });

    // Escudo de Bronce Pulido en el Santuario
    this.bronzeShieldOfferMesh = MeshBuilder.CreateCylinder("bronzeShield", { height: 0.1, diameter: 1.4 }, this.scene);
    this.bronzeShieldOfferMesh.position = new Vector3(0, 2.2, 21);
    this.bronzeShieldOfferMesh.rotation.x = Math.PI / 4;

    const shieldMat = new PBRMaterial("shieldMat", this.scene);
    shieldMat.albedoColor = new Color3(0.9, 0.7, 0.3);
    shieldMat.metallic = 0.95;
    shieldMat.roughness = 0.05; // Reflejo tipo espejo
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
    const mirror1 = MeshBuilder.CreateBox("mirror_1", { width: 0.2, height: 2, depth: 1.2 }, this.scene);
    mirror1.position = new Vector3(-5, 2, 8);
    const mirror2 = MeshBuilder.CreateBox("mirror_2", { width: 0.2, height: 2, depth: 1.2 }, this.scene);
    mirror2.position = new Vector3(5, 2, 12);

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
      this.uiManager.showNotification("Puzzle Resuelto", "El rayo de luz ha alineado los espejos.");
    });

    // 2. Symbol Dial Puzzle para abrir el Santuario
    const dials: SymbolDial[] = [
      { id: "dial_athena", name: "Símbolo de la Búho", symbols: ["🦉", "🌿", "🐍"], currentIndex: 0 },
      { id: "dial_gorgon", name: "Símbolo de la Serpiente", symbols: ["🐍", "🦉", "🌊"], currentIndex: 0 }
    ];

    this.symbolPuzzle = new SacredSymbolPuzzle(dials, [0, 0]);
    this.symbolPuzzle.setOnSolveCallback(() => {
      this.audioManager.playSFX('puzzle_solve');
      this.uiManager.showNotification("Santuario Desbloqueado", "Las puertas de piedra del templo se abren.");

      // Animar apertura de puerta
      if (this.sanctuaryDoorMesh) {
        this.sanctuaryDoorMesh.position.y += 4;
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
    this.medusaMesh = MeshBuilder.CreateCapsule("medusaBoss", { height: 2.2, radius: 0.5 }, this.scene);
    this.medusaMesh.position = new Vector3(0, 2.2, 12);
    this.medusaMesh.material = CustomShaderManager.createMedusaAuraMaterial(this.scene);

    this.uiManager.showSubtitle("Medusa ha despertado... ¡Utiliza el Escudo de Bronce!");

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
