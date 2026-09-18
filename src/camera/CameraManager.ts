import {
  Scene,
  ArcRotateCamera,
  Vector3,
  Mesh,
  Animation,
  QuadraticEase,
  EasingFunction
} from '@babylonjs/core';

export class CameraManager {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private targetMesh: Mesh | null = null;
  private isCinematic: boolean = false;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;

    // Cámara en tercera persona suave
    this.camera = new ArcRotateCamera(
      "ThirdPersonCamera",
      Math.PI / 2,
      Math.PI / 3,
      7.0,
      Vector3.Zero(),
      this.scene
    );

    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = 2.5;
    this.camera.upperRadiusLimit = 12.0;
    this.camera.lowerBetaLimit = 0.2;
    this.camera.upperBetaLimit = Math.PI / 2 - 0.05; // Evitar pasar por debajo del suelo
    this.camera.wheelPrecision = 50;
    this.camera.checkCollisions = true;
    this.camera.inertia = 0.8;

    this.scene.activeCamera = this.camera;
  }

  public followTarget(target: Mesh): void {
    this.targetMesh = target;
    this.scene.onBeforeRenderObservable.add(() => {
      if (this.targetMesh && !this.isCinematic) {
        // Seguir la posición del jugador con offset de cabeza
        const targetPos = this.targetMesh.position.add(new Vector3(0, 1.4, 0));
        this.camera.target = Vector3.Lerp(this.camera.target, targetPos, 0.15);
      }
    });
  }

  /**
   * Transición suave cinematográfica a un objetivo específico para eventos narrativos o revelaciones.
   */
  public transitionToCinematic(targetPos: Vector3, radius: number, alpha: number, beta: number, durationFrames: number = 120): Promise<void> {
    return new Promise((resolve) => {
      this.isCinematic = true;

      const ease = new QuadraticEase();
      ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

      Animation.CreateAndStartAnimation("camAlpha", this.camera, "alpha", 60, durationFrames, this.camera.alpha, alpha, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
      Animation.CreateAndStartAnimation("camBeta", this.camera, "beta", 60, durationFrames, this.camera.beta, beta, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);
      Animation.CreateAndStartAnimation("camRadius", this.camera, "radius", 60, durationFrames, this.camera.radius, radius, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);

      const animTarget = Animation.CreateAndStartAnimation("camTarget", this.camera, "target", 60, durationFrames, this.camera.target, targetPos, Animation.ANIMATIONLOOPMODE_CONSTANT, ease);

      if (animTarget) {
        animTarget.onAnimationEnd = () => {
          resolve();
        };
      } else {
        setTimeout(resolve, (durationFrames / 60) * 1000);
      }
    });
  }

  public returnToPlayer(): void {
    this.isCinematic = false;
  }

  public getCamera(): ArcRotateCamera {
    return this.camera;
  }
}
