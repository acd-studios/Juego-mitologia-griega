import { Scene } from '@babylonjs/core';
import { EngineManager } from '../core/EngineManager';
import { UIManager } from '../ui/UIManager';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../save/SaveSystem';
import { GraphicsQualityManager } from '../graphics/GraphicsQualityManager';

export interface MythChapterConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  unlockedByDefault?: boolean;
}

export abstract class MythChapter {
  public config: MythChapterConfig;
  protected engineManager: EngineManager;
  protected uiManager: UIManager;
  protected audioManager: AudioManager;
  protected saveSystem: SaveSystem;
  protected graphicsManager: GraphicsQualityManager;
  protected scene!: Scene;

  constructor(
    config: MythChapterConfig,
    engineManager: EngineManager,
    uiManager: UIManager,
    audioManager: AudioManager,
    saveSystem: SaveSystem,
    graphicsManager: GraphicsQualityManager
  ) {
    this.config = config;
    this.engineManager = engineManager;
    this.uiManager = uiManager;
    this.audioManager = audioManager;
    this.saveSystem = saveSystem;
    this.graphicsManager = graphicsManager;
  }

  public abstract load(onProgress: (progress: number) => void): Promise<void>;
  public abstract start(): void;
  public abstract dispose(): void;

  public getScene(): Scene {
    return this.scene;
  }
}
