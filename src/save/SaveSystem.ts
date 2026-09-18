export interface SavedGameState {
  currentChapterId: string;
  timestamp: number;
  unlockedClues: string[];
  resolvedPuzzles: string[];
  decisions: Record<string, string>;
  unlockedChapters: string[];
  playerTransform?: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
}

export interface UserSettings {
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export class SaveSystem {
  private readonly SAVE_KEY = "mitos_grecia_savegame";
  private readonly SETTINGS_KEY = "mitos_grecia_settings";

  public async init(): Promise<void> {
    // Inicialización de persistencia local
  }

  public hasSavedGame(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  public saveGame(state: SavedGameState): void {
    try {
      state.timestamp = Date.now();
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
      console.log("Progreso de mitología guardado con éxito.");
    } catch (e) {
      console.error("Error guardando progreso en almacenamiento local:", e);
    }
  }

  public loadGame(): SavedGameState | null {
    try {
      const data = localStorage.getItem(this.SAVE_KEY);
      if (!data) return null;
      return JSON.parse(data) as SavedGameState;
    } catch (e) {
      console.error("Error cargando partida guardada:", e);
      return null;
    }
  }

  public saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Error guardando ajustes de usuario:", e);
    }
  }

  public getSettings(): UserSettings | null {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      if (!data) return null;
      return JSON.parse(data) as UserSettings;
    } catch (e) {
      return null;
    }
  }

  public clearSaveData(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }
}
