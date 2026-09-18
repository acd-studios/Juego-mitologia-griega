import {
  Scene,
  Vector3,
  Ray,
  AbstractMesh,
  Mesh
} from '@babylonjs/core';

export interface InteractableObject {
  id: string;
  name: string;
  actionText: string; // Ej: "INTERACTUAR", "EXAMINAR", "HABLAR", "RESOLVER"
  mesh: AbstractMesh;
  isNPC?: boolean;
  onInteract: () => void;
}

export interface InteractionCallbacks {
  onHoverStart: (target: InteractableObject) => void;
  onHoverEnd: () => void;
}

export class InteractionSystem {
  private scene: Scene;
  private interactables: Map<string, InteractableObject> = new Map();
  private currentTarget: InteractableObject | null = null;
  private callbacks: InteractionCallbacks;
  private maxInteractionDistance: number = 4.0;
  private enabled: boolean = true;

  constructor(scene: Scene, callbacks: InteractionCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    this.setupRaycastCheck();
    this.setupInputListener();
  }

  public registerInteractable(interactable: InteractableObject): void {
    this.interactables.set(interactable.mesh.uniqueId.toString(), interactable);
    interactable.mesh.isPickable = true;
  }

  public unregisterInteractable(mesh: AbstractMesh): void {
    this.interactables.delete(mesh.uniqueId.toString());
  }

  private setupRaycastCheck(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.enabled) {
        if (this.currentTarget) {
          this.currentTarget = null;
          this.callbacks.onHoverEnd();
        }
        return;
      }

      this.checkTargetInFront();
    });
  }

  private checkTargetInFront(): void {
    const activeCamera = this.scene.activeCamera;
    if (!activeCamera) return;

    // Raycast desde el centro de la pantalla/cámara hacia adelante
    const ray = activeCamera.getForwardRay(this.maxInteractionDistance);
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return this.interactables.has(mesh.uniqueId.toString());
    });

    if (hit && hit.hit && hit.pickedMesh) {
      const interactable = this.interactables.get(hit.pickedMesh.uniqueId.toString());
      if (interactable) {
        if (this.currentTarget !== interactable) {
          this.currentTarget = interactable;
          this.callbacks.onHoverStart(interactable);
        }
        return;
      }
    }

    if (this.currentTarget) {
      this.currentTarget = null;
      this.callbacks.onHoverEnd();
    }
  }

  private setupInputListener(): void {
    window.addEventListener('keydown', (evt) => {
      if (!this.enabled || !this.currentTarget) return;
      if (evt.code === 'KeyE' || evt.code === 'Enter') {
        this.currentTarget.onInteract();
      }
    });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.currentTarget) {
      this.currentTarget = null;
      this.callbacks.onHoverEnd();
    }
  }

  public getCurrentTarget(): InteractableObject | null {
    return this.currentTarget;
  }
}
