import { Scene, Mesh, TransformNode, Vector3 } from '@babylonjs/core';

export interface MirrorNode {
  mesh: Mesh;
  angleY: number; // Ángulo actual en grados
}

export class LightMirrorPuzzle {
  private scene: Scene;
  private mirrors: MirrorNode[] = [];
  private targetAngleSolution: number[] = [90, 180, 270];
  private isSolved: boolean = false;
  private onSolveCallback?: () => void;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public registerMirror(mirrorMesh: Mesh, initialAngle: number = 0): void {
    const mirrorNode: MirrorNode = {
      mesh: mirrorMesh,
      angleY: initialAngle,
    };
    mirrorMesh.rotation.y = (initialAngle * Math.PI) / 180;
    this.mirrors.push(mirrorNode);
  }

  public rotateMirror(index: number): void {
    if (this.isSolved || index < 0 || index >= this.mirrors.length) return;

    const mirror = this.mirrors[index];
    mirror.angleY = (mirror.angleY + 90) % 360;
    mirror.mesh.rotation.y = (mirror.angleY * Math.PI) / 180;

    this.checkSolution();
  }

  private checkSolution(): void {
    let matchCount = 0;
    for (let i = 0; i < this.mirrors.length; i++) {
      if (Math.abs(this.mirrors[i].angleY - this.targetAngleSolution[i % this.targetAngleSolution.length]) < 5) {
        matchCount++;
      }
    }

    if (matchCount === this.mirrors.length) {
      this.isSolved = true;
      if (this.onSolveCallback) {
        this.onSolveCallback();
      }
    }
  }

  public setOnSolveCallback(cb: () => void): void {
    this.onSolveCallback = cb;
  }

  public getSolved(): boolean {
    return this.isSolved;
  }
}
