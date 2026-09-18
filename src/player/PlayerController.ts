import { Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, PBRMaterial, Color3, Matrix } from "@babylonjs/core";

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

  private walkSpeed: number = 4.5;
  private runSpeed: number = 7.5;
  private crouchSpeed: number = 2.2;
  private currentSpeed: number = 0;

  private onFootstepCallback?: () => void;
  private footstepTimer: number = 0;

  constructor(scene: Scene, initialPosition: Vector3 = new Vector3(0, 1.2, -18)) {
    this.scene = scene;
    this.mesh = this.createPlayerMesh(initialPosition);
    this.setupInput();

    this.scene.registerBeforeRender(() => {
      this.updateMovement();
    });
  }

  private createPlayerMesh(position: Vector3): Mesh {
    const playerMesh = MeshBuilder.CreateCapsule("playerMesh", { height: 1.8, radius: 0.4 }, this.scene);
    playerMesh.position = position;
    playerMesh.checkCollisions = true;

    const mat = new PBRMaterial("playerMat", this.scene);
    mat.albedoColor = new Color3(0.2, 0.4, 0.7);
    mat.roughness = 0.5;
    playerMesh.material = mat;

    return playerMesh;
  }

  private setupInput(): void {
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": this.input.moveForward = true; break;
        case "KeyS": case "ArrowDown": this.input.moveBackward = true; break;
        case "KeyA": case "ArrowLeft": this.input.moveLeft = true; break;
        case "KeyD": case "ArrowRight": this.input.moveRight = true; break;
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
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    let targetSpeed = this.walkSpeed;
    if (this.input.isRunning && !this.input.isCrouching) {
      targetSpeed = this.runSpeed;
    } else if (this.input.isCrouching) {
      targetSpeed = this.crouchSpeed;
    }

    this.currentSpeed = targetSpeed;

    // Direct vectors relative to active camera direction
    const forward = activeCamera.getForwardRay().direction;
    forward.y = 0;
    forward.normalize();

    const right = Vector3.Cross(Vector3.Up(), forward).normalize();

    const moveDir = Vector3.Zero();

    if (this.input.moveForward) moveDir.addInPlace(forward);
    if (this.input.moveBackward) moveDir.addInPlace(forward.scale(-1));
    if (this.input.moveLeft) moveDir.addInPlace(right.scale(-1)); // Corrected left direction
    if (this.input.moveRight) moveDir.addInPlace(right);          // Corrected right direction

    if (moveDir.lengthSquared() > 0) {
      moveDir.normalize();

      // Rotate mesh toward movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = targetAngle;

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
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public setOnFootstepCallback(cb: () => void): void {
    this.onFootstepCallback = cb;
  }
}
