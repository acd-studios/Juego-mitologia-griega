export interface SymbolDial {
  id: string;
  name: string;
  symbols: string[];
  currentIndex: number;
}

export class SacredSymbolPuzzle {
  private dials: SymbolDial[];
  private targetCombination: number[];
  private isSolved: boolean = false;
  private onSolveCallback?: () => void;

  constructor(dials: SymbolDial[], targetCombination: number[]) {
    this.dials = dials;
    this.targetCombination = targetCombination;
  }

  public rotateDial(dialIndex: number): void {
    if (this.isSolved || dialIndex < 0 || dialIndex >= this.dials.length) return;

    const dial = this.dials[dialIndex];
    dial.currentIndex = (dial.currentIndex + 1) % dial.symbols.length;

    this.checkSolution();
  }

  private checkSolution(): void {
    const isCorrect = this.dials.every((dial, idx) => dial.currentIndex === this.targetCombination[idx]);
    if (isCorrect) {
      this.isSolved = true;
      if (this.onSolveCallback) {
        this.onSolveCallback();
      }
    }
  }

  public setOnSolveCallback(cb: () => void): void {
    this.onSolveCallback = cb;
  }

  public getDials(): SymbolDial[] {
    return this.dials;
  }

  public getSolved(): boolean {
    return this.isSolved;
  }
}
