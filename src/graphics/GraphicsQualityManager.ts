import { Scene, ShadowGenerator, DirectionalLight, DefaultRenderingPipeline, SSAORenderingPipeline, Color4 } from '@babylonjs/core';
import { EngineManager } from '../core/EngineManager';

export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface GraphicsConfig {
  quality: QualityLevel;
  shadows: boolean;
  shadowMapSize: number;
  bloom: boolean;
  ssao: boolean;
  postProcessing: boolean;
  vignette: boolean;
}

export class GraphicsQualityManager {
  private engineManager: EngineManager;
  private currentQuality: QualityLevel = 'HIGH';
  private config: GraphicsConfig;
  private pipeline: DefaultRenderingPipeline | null = null;
  private ssaoPipeline: SSAORenderingPipeline | null = null;
  private shadowGenerators: ShadowGenerator[] = [];

  constructor(engineManager: EngineManager) {
    this.engineManager = engineManager;
    this.config = this.getConfigForLevel('HIGH');
  }

  public getConfigForLevel(level: QualityLevel): GraphicsConfig {
    switch (level) {
      case 'LOW':
        return { quality: 'LOW', shadows: false, shadowMapSize: 512, bloom: false, ssao: false, postProcessing: false, vignette: false };
      case 'MEDIUM':
        return { quality: 'MEDIUM', shadows: true, shadowMapSize: 1024, bloom: false, ssao: false, postProcessing: true, vignette: true };
      case 'HIGH':
        return { quality: 'HIGH', shadows: true, shadowMapSize: 2048, bloom: true, ssao: true, postProcessing: true, vignette: true };
      case 'ULTRA':
        return { quality: 'ULTRA', shadows: true, shadowMapSize: 4096, bloom: true, ssao: true, postProcessing: true, vignette: true };
    }
  }

  public setQuality(level: QualityLevel): void {
    this.currentQuality = level;
    this.config = this.getConfigForLevel(level);

    const scene = this.engineManager.getScene();
    if (scene) {
      this.applySettingsToScene(scene);
    }
  }

  public getQuality(): QualityLevel {
    return this.currentQuality;
  }

  public getConfig(): GraphicsConfig {
    return this.config;
  }

  public setupPipeline(scene: Scene): void {
    if (!this.config.postProcessing) return;

    if (this.pipeline) {
      this.pipeline.dispose();
    }

    this.pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, scene.cameras);

    // Bloom
    this.pipeline.bloomEnabled = this.config.bloom;
    if (this.config.bloom) {
      this.pipeline.bloomThreshold = 0.7;
      this.pipeline.bloomWeight = 0.4;
      this.pipeline.bloomKernel = 64;
      this.pipeline.bloomScale = 0.5;
    }

    // Vignette
    this.pipeline.imageProcessingEnabled = true;
    this.pipeline.imageProcessing.vignetteEnabled = this.config.vignette;
    if (this.config.vignette) {
      this.pipeline.imageProcessing.vignetteWeight = 1.2;
      this.pipeline.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0.8);
    }

    // SSAO
    if (this.config.ssao) {
      try {
        this.ssaoPipeline = new SSAORenderingPipeline("ssao", scene, 0.75, scene.cameras);
      } catch (e) {
        console.warn("SSAO no soportado en este navegador/contexto. Desactivando SSAO fallback.");
      }
    }
  }

  public createShadowGenerator(light: DirectionalLight): ShadowGenerator | null {
    if (!this.config.shadows) return null;

    const shadowGen = new ShadowGenerator(this.config.shadowMapSize, light);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
    shadowGen.bias = 0.001;

    this.shadowGenerators.push(shadowGen);
    return shadowGen;
  }

  public applySettingsToScene(scene: Scene): void {
    this.setupPipeline(scene);
    for (const sg of this.shadowGenerators) {
      sg.mapSize = this.config.shadowMapSize;
    }
  }
}
