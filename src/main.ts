import { EngineManager } from './core/EngineManager';
import { UIManager } from './ui/UIManager';
import { SaveSystem } from './save/SaveSystem';
import { GraphicsQualityManager, QualityLevel } from './graphics/GraphicsQualityManager';
import { AudioManager, AudioSettings } from './audio/AudioManager';
import { MedusaChapter } from './chapters/MedusaChapter';

class GameApp {
  private engineManager!: EngineManager;
  private uiManager!: UIManager;
  private saveSystem!: SaveSystem;
  private graphicsManager!: GraphicsQualityManager;
  private audioManager!: AudioManager;
  private activeChapter: MedusaChapter | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    console.log("Inicializando Mitos de Grecia...");
    const canvas = document.getElementById("renderCanvas") as unknown as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas de renderizado no encontrado.");
      return;
    }

    // Inicializar managers de arquitectura core
    this.saveSystem = new SaveSystem();
    await this.saveSystem.init();

    this.engineManager = new EngineManager(canvas);
    await this.engineManager.initEngine();

    this.graphicsManager = new GraphicsQualityManager(this.engineManager);
    this.audioManager = new AudioManager();

    this.uiManager = new UIManager();

    // Bind UI buttons matching IDs in index.html
    const newGameBtn = document.getElementById("btn-new-game") || document.getElementById("new-game-btn");
    newGameBtn?.addEventListener("click", () => this.startChapter('medusa'));

    const continueBtn = document.getElementById("btn-continue") || document.getElementById("continue-btn");
    continueBtn?.addEventListener("click", () => this.continueGame());

    // Cargar opciones guardadas
    const savedSettings = this.saveSystem.getSettings();
    if (savedSettings) {
      this.graphicsManager.setQuality(savedSettings.graphicsQuality);
    }

    // Verificar progreso guardado para botón Continuar
    const hasSave = this.saveSystem.hasSavedGame();
    this.uiManager.toggleContinueButton(hasSave);

    console.log("Juego listo para la interacción del usuario.");
  }

  private async startChapter(chapterId: string): Promise<void> {
    this.uiManager.showLoadingScreen("Cargando Mito de Medusa...", "La isla yerma guarda los secretos del santuario profanado.");
    this.uiManager.hideMainMenu();

    if (this.activeChapter) {
      this.activeChapter.dispose();
    }

    if (chapterId === 'medusa') {
      this.activeChapter = new MedusaChapter(
        this.engineManager,
        this.uiManager,
        this.audioManager,
        this.saveSystem,
        this.graphicsManager
      );

      await this.activeChapter.load((progress: number) => {
        this.uiManager.updateLoadingProgress(progress);
      });

      this.uiManager.hideLoadingScreen();
      this.activeChapter.start();
    }
  }

  private async continueGame(): Promise<void> {
    const save = this.saveSystem.loadGame();
    if (save) {
      await this.startChapter(save.currentChapterId);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new GameApp();
});
