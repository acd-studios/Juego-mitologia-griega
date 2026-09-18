import { Scene, Vector3, Mesh, MeshBuilder, PBRMaterial, Color3 } from "@babylonjs/core";
import { CameraManager } from "../camera/CameraManager";

export interface PlayerInput {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  isRunning: boolean;
  isCrouching: boolean;
  interact: boolean;
}

export class PlayerController {
  private scene: Scene;
  private cameraManager: CameraManager;
  private mesh: Mesh;
  private input: PlayerInput = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isRunning: false,
    isCrouching: false,
    interact: false
  };

  private walkSpeed: number = 4.8;
  private runSpeed: number = 8.0;
  private crouchSpeed: number = 2.4;
  private currentSpeed: number = 0;

  private onFootstepCallback?: () => void;
  private footstepTimer: number = 0;

  constructor(scene: Scene, cameraManager: CameraManager, initialPosition: Vector3 = new Vector3(0, 0, -18)) {
    this.scene = scene;
    this.cameraManager = cameraManager;
    this.mesh = this.createPlayerCollider(initialPosition);
    this.setupInput();

    this.scene.registerBeforeRender(() => {
      this.updateMovement();
    });
  }

  private createPlayerCollider(position: Vector3): Mesh {
    const playerMesh = MeshBuilder.CreateCapsule("playerCollider", { height: 1.8, radius: 0.4 }, this.scene);
    playerMesh.position = position;
    playerMesh.checkCollisions = true;
    playerMesh.isVisible = false; // Hidden in First-Person view
    return playerMesh;
  }

  private setupInput(): void {
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": this.input.moveForward = true; break;
        case "KeyS": case "ArrowDown": this.input.moveBackward = true; break;
        case "KeyA": case "ArrowLeft": this.input.moveLeft = true; break;  // Left
        case "KeyD": case "ArrowRight": this.input.moveRight = true; break; // Right
        case "ShiftLeft": case "ShiftRight": this.input.isRunning = true; break;
        case "KeyC": case "ControlLeft": this.input.isCrouching = !this.input.isCrouching; break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": this.input.moveForward = false; break;
        case "KeyS": case "ArrowDown": this.input.moveBackward = false; break;
        case "KeyA": case "ArrowLeft": this.input.moveLeft = false; break;
        case "KeyD": case "ArrowRight": this.input.moveRight = false; break;
        case "ShiftLeft": case "ShiftRight": this.input.isRunning = false; break;
      }
    });
  }

  private updateMovement(): void {
    const camera = this.cameraManager.getCamera();

    let targetSpeed = this.walkSpeed;
    if (this.input.isRunning && !this.input.isCrouching) {
      targetSpeed = this.runSpeed;
    } else if (this.input.isCrouching) {
      targetSpeed = this.crouchSpeed;
    }

    this.currentSpeed = targetSpeed;

    // Get camera forward and right directions on the horizontal XZ plane
    const forward = camera.getDirection(Vector3.Forward());
    forward.y = 0;
    forward.normalize();

    const right = camera.getDirection(Vector3.Right());
    right.y = 0;
    right.normalize();

    const moveDir = Vector3.Zero();

    if (this.input.moveForward) moveDir.addInPlace(forward);
    if (this.input.moveBackward) moveDir.addInPlace(forward.scale(-1));
    if (this.input.moveLeft) moveDir.addInPlace(right.scale(-1)); // A = LEFT (correct)
    if (this.input.moveRight) moveDir.addInPlace(right);          // D = RIGHT (correct)

    const isMoving = moveDir.lengthSquared() > 0;

    if (isMoving) {
      moveDir.normalize();
      const deltaTime = this.scene.getEngine().getDeltaTime() * 0.001;
      const velocity = moveDir.scale(this.currentSpeed * deltaTime);

      this.mesh.moveWithCollisions(velocity);

      // Footstep sound timing
      this.footstepTimer += deltaTime;
      const interval = this.input.isRunning ? 0.3 : 0.5;
      if (this.footstepTimer >= interval) {
        this.footstepTimer = 0;
        if (this.onFootstepCallback) {
          this.onFootstepCallback();
        }
      }
    }

    // Sync camera position to player collider
    this.cameraManager.updatePosition(this.mesh.position, isMoving, this.input.isRunning ? 1.5 : 1.0);
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public setOnFootstepCallback(cb: () => void): void {
    this.onFootstepCallback = cb;
  }
}
