import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
  Ray,
  RayHelper
} from '@babylonjs/core';

export interface PlayerInputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  isRunning: boolean;
  isCrouching: boolean;
}

export class PlayerController {
  private scene: Scene;
  private mesh: Mesh;
  private walkSpeed: number = 4.5;
  private runSpeed: number = 8.0;
  private crouchSpeed: number = 2.2;
  private input: PlayerInputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isRunning: false,
    isCrouching: false,
  };

  private enabled: boolean = true;
  private heightNormal: number = 1.8;
  private heightCrouch: number = 1.0;
  private onFootstepCallback?: () => void;
  private footstepTimer: number = 0;

  constructor(scene: Scene, startPosition: Vector3 = new Vector3(0, 1, 0)) {
    this.scene = scene;

    // Crear la malla del jugador (cuerpo estilizado PBR / indicador)
    this.mesh = MeshBuilder.CreateCapsule("player", { height: this.heightNormal, radius: 0.4 }, this.scene);
    this.mesh.position = startPosition;

    const playerMat = new StandardMaterial("playerMat", this.scene);
    playerMat.diffuseColor = new Color3(0.2, 0.25, 0.35);
    playerMat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.mesh.material = playerMat;
    this.mesh.checkCollisions = true;

    this.setupInput();
    this.setupUpdateLoop();
  }

  private setupInput(): void {
    window.addEventListener('keydown', (evt) => {
      if (!this.enabled) return;
      this.handleKey(evt.code, true);
    });

    window.addEventListener('keyup', (evt) => {
      this.handleKey(evt.code, false);
    });
  }

  private handleKey(code: string, isDown: boolean): void {
    switch (code) {
      case 'KeyW': case 'ArrowUp': this.input.moveForward = isDown; break;
      case 'KeyS': case 'ArrowDown': this.input.moveBackward = isDown; break;
      case 'KeyA': case 'ArrowLeft': this.input.moveLeft = isDown; break;
      case 'KeyD': case 'ArrowRight': this.input.moveRight = isDown; break;
      case 'ShiftLeft': case 'ShiftRight': this.input.isRunning = isDown; break;
      case 'KeyC': case 'ControlLeft': this.input.isCrouching = isDown; break;
    }
  }

  private setupUpdateLoop(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.enabled) return;
      this.updateMovement();
    });
  }

  private updateMovement(): void {
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    // Ajuste de altura por agacharse
    const targetScaleY = this.input.isCrouching ? (this.heightCrouch / this.heightNormal) : 1.0;
    this.mesh.scaling.y = Vector3.Lerp(this.mesh.scaling, new Vector3(1, targetScaleY, 1), deltaTime * 10).y;

    // Calcular dirección basada en la cámara
    let moveDir = Vector3.Zero();
    const forward = activeCamera.getForwardRay().direction;
    forward.y = 0;
    forward.normalize();

    const right = Vector3.Cross(Vector3.Up(), forward).normalize();

    if (this.input.moveForward) moveDir.addInPlace(forward);
    if (this.input.moveBackward) moveDir.addInPlace(forward.scale(-1));
    if (this.input.moveLeft) moveDir.addInPlace(right);
    if (this.input.moveRight) moveDir.addInPlace(right.scale(-1));

    if (moveDir.lengthSquared() > 0) {
      moveDir.normalize();

      // Orientar malla hacia la dirección de movimiento
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mesh.rotation.y = Vector3.Lerp(
        new Vector3(0, this.mesh.rotation.y, 0),
        new Vector3(0, targetAngle, 0),
        deltaTime * 12
      ).y;

      // Determinar velocidad
      let currentSpeed = this.walkSpeed;
      if (this.input.isRunning && !this.input.isCrouching) {
        currentSpeed = this.runSpeed;
      } else if (this.input.isCrouching) {
        currentSpeed = this.crouchSpeed;
      }

      // Aplicar desplazamiento con colisión
      const displacement = moveDir.scale(currentSpeed * deltaTime);
      this.mesh.moveWithCollisions(displacement);

      // Sonido de pasos
      this.footstepTimer += deltaTime * (currentSpeed / this.walkSpeed);
      if (this.footstepTimer > 0.45) {
        this.footstepTimer = 0;
        if (this.onFootstepCallback) this.onFootstepCallback();
      }
    }
  }

  public setOnFootstepCallback(cb: () => void): void {
    this.onFootstepCallback = cb;
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public getPosition(): Vector3 {
    return this.mesh.position;
  }

  public setPosition(pos: Vector3): void {
    this.mesh.position = pos;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.input = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, isRunning: false, isCrouching: false };
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}
