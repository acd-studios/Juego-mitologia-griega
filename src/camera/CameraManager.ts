import { Scene, Vector3, UniversalCamera, FreeCamera } from "@babylonjs/core";

export class CameraManager {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private camera: UniversalCamera;

  private isCinematic: boolean = false;
  private headBobTimer: number = 0;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.canvas = canvas;

    // Create First Person UniversalCamera at eye level (y = 1.7m)
    this.camera = new UniversalCamera("firstPersonCamera", new Vector3(0, 1.7, -18), this.scene);
    this.camera.fov = 1.1; // ~63 degrees FOV for natural immersive viewing
    this.camera.minZ = 0.1;
    this.camera.maxZ = 300;

    // Enable mouse look with pointer lock
    this.camera.attachControl(this.canvas, true);
    this.camera.angularSensibility = 2000; // Smooth mouse sensitivity

    // Remove default camera keyboard controls (handled by PlayerController)
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");

    this.scene.activeCamera = this.camera;
  }

  public getCamera(): UniversalCamera {
    return this.camera;
  }

  public updatePosition(playerPosition: Vector3, isMoving: boolean, speedRatio: number = 1.0): void {
    if (this.isCinematic) return;

    // Eye-level offset
    let eyeY = playerPosition.y + 1.7;

    // Head bobbing animation while walking/running
    if (isMoving) {
      this.headBobTimer += this.scene.getEngine().getDeltaTime() * 0.008 * speedRatio;
      const bobY = Math.sin(this.headBobTimer * 10) * 0.05;
      const bobX = Math.cos(this.headBobTimer * 5) * 0.03;
      eyeY += bobY;
      this.camera.position.x = playerPosition.x + bobX;
      this.camera.position.z = playerPosition.z;
    } else {
      this.camera.position.x = playerPosition.x;
      this.camera.position.z = playerPosition.z;
    }

    this.camera.position.y = eyeY;
  }

  public async transitionToCinematic(targetPos: Vector3, durationSec: number = 3.0): Promise<void> {
    this.isCinematic = true;

    const startPos = this.camera.position.clone();
    const endPos = targetPos.add(new Vector3(0, 1.5, -4));

    const startTime = Date.now();
    return new Promise((resolve) => {
      const observer = this.scene.onBeforeRenderObservable.add(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(1.0, elapsed / durationSec);

        // Smooth cubic ease
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this.camera.position = Vector3.Lerp(startPos, endPos, ease);
        this.camera.setTarget(targetPos);

        if (progress >= 1.0) {
          this.scene.onBeforeRenderObservable.remove(observer);
          resolve();
        }
      });
    });
  }

  public returnToPlayer(): void {
    this.isCinematic = false;
  }
}
