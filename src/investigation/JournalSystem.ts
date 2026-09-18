export interface Clue {
  id: string;
  title: string;
  type: 'INSCRIPTION' | 'OBJECT' | 'STATUE' | 'SYMBOL' | 'MEMORY' | 'EVIDENCE';
  description: string;
  locationFound: string;
  mythVsFact: {
    mythicElement: string;
    historicalElement: string;
  };
  icon?: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  relationship: string;
  knownInformation: string[];
  hiddenSecrets: string[];
}

export interface DeductionHypothesis {
  id: string;
  question: string;
  requiredClueIds: string[];
  conclusion: string;
  isUnlocked: boolean;
  isSolved: boolean;
}

export class JournalSystem {
  private clues: Map<string, Clue> = new Map();
  private characters: Map<string, CharacterProfile> = new Map();
  private hypotheses: Map<string, DeductionHypothesis> = new Map();
  private onClueAddedCallback?: (clue: Clue) => void;

  public registerClue(clue: Clue): void {
    if (!this.clues.has(clue.id)) {
      this.clues.set(clue.id, clue);
      if (this.onClueAddedCallback) {
        this.onClueAddedCallback(clue);
      }
      this.checkHypotheses();
    }
  }

  public registerCharacter(character: CharacterProfile): void {
    this.characters.set(character.id, character);
  }

  public registerHypothesis(hypothesis: DeductionHypothesis): void {
    this.hypotheses.set(hypothesis.id, hypothesis);
  }

  public getClues(): Clue[] {
    return Array.from(this.clues.values());
  }

  public getCharacters(): CharacterProfile[] {
    return Array.from(this.characters.values());
  }

  public getHypotheses(): DeductionHypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  public setOnClueAddedCallback(cb: (clue: Clue) => void): void {
    this.onClueAddedCallback = cb;
  }

  private checkHypotheses(): void {
    this.hypotheses.forEach((hyp) => {
      const hasAll = hyp.requiredClueIds.every((id) => this.clues.has(id));
      if (hasAll) {
        hyp.isUnlocked = true;
      }
    });
  }

  public solveHypothesis(id: string): boolean {
    const hyp = this.hypotheses.get(id);
    if (hyp && hyp.isUnlocked) {
      hyp.isSolved = true;
      return true;
    }
    return false;
  }
}
