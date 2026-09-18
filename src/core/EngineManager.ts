import { Engine, WebGPUEngine, Scene } from '@babylonjs/core';

export class EngineManager {
  private canvas: HTMLCanvasElement;
  private engine!: Engine;
  private currentScene: Scene | null = null;
  private isWebGPU: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public async initEngine(): Promise<void> {
    // Intentar WebGPU si está disponible en el navegador; si no, fallback a WebGL2 / WebGL
    if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
      try {
        const webgpuEngine = new WebGPUEngine(this.canvas, {
          stencil: true,
          antialias: true,
        });
        await webgpuEngine.initAsync();
        this.engine = webgpuEngine;
        this.isWebGPU = true;
        console.log("Motor 3D inicializado con WebGPU para máximo rendimiento.");
      } catch (e) {
        console.warn("WebGPU no disponible o rechazado. Activando fallback WebGL...", e);
        this.initWebGL();
      }
    } else {
      this.initWebGL();
    }

    // Adaptación a cambios de tamaño de ventana
    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    // Render loop principal
    this.engine.runRenderLoop(() => {
      if (this.currentScene && this.currentScene.activeCamera) {
        this.currentScene.render();
      }
    });
  }

  private initWebGL(): void {
    this.engine = new Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
    });
    this.isWebGPU = false;
    console.log("Motor 3D inicializado con WebGL.");
  }

  public getEngine(): Engine {
    return this.engine;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public setScene(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    this.currentScene = scene;
  }

  public getScene(): Scene | null {
    return this.currentScene;
  }

  public isWebGPUActive(): boolean {
    return this.isWebGPU;
  }
}
