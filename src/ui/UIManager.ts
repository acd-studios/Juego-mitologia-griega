import { DialogueTree, DialogueSystem, DialogueNode } from '../dialogue/DialogueSystem';
import { QualityLevel } from '../graphics/GraphicsQualityManager';
import { AudioSettings } from '../audio/AudioManager';
import { ALL_MYTH_CHAPTERS } from '../mythology/MythRegistry';

export interface UIManagerCallbacks {
  onStartNewGame: () => void;
  onContinueGame: () => void;
  onSelectChapter: (chapterId: string) => void;
  onQualityChange: (quality: QualityLevel) => void;
  onAudioSettingsChange: (settings: Partial<AudioSettings>) => void;
}

export class UIManager {
  private callbacks: UIManagerCallbacks;

  // Elementos HTML
  private mainMenuEl: HTMLElement;
  private mythSelectionEl: HTMLElement;
  private optionsEl: HTMLElement;
  private controlsEl: HTMLElement;
  private loadingEl: HTMLElement;
  private dialogueOverlayEl: HTMLElement;
  private journalOverlayEl: HTMLElement;
  private pauseMenuEl: HTMLElement;
  private resolutionEl: HTMLElement;
  private interactionPromptEl: HTMLElement;
  private toastEl: HTMLElement;
  private reticleEl: HTMLElement;
  private subtitleBoxEl: HTMLElement;

  constructor(callbacks: UIManagerCallbacks) {
    this.callbacks = callbacks;

    this.mainMenuEl = document.getElementById("main-menu")!;
    this.mythSelectionEl = document.getElementById("myth-selection-screen")!;
    this.optionsEl = document.getElementById("options-screen")!;
    this.controlsEl = document.getElementById("controls-screen")!;
    this.loadingEl = document.getElementById("loading-screen")!;
    this.dialogueOverlayEl = document.getElementById("dialogue-overlay")!;
    this.journalOverlayEl = document.getElementById("journal-overlay")!;
    this.pauseMenuEl = document.getElementById("pause-menu")!;
    this.resolutionEl = document.getElementById("resolution-screen")!;
    this.interactionPromptEl = document.getElementById("interaction-prompt")!;
    this.toastEl = document.getElementById("notification-toast")!;
    this.reticleEl = document.getElementById("reticle")!;
    this.subtitleBoxEl = document.getElementById("subtitle-box")!;

    this.setupMenuNavigation();
    this.setupOptionsMenu();
    this.populateMythChapters();
  }

  private setupMenuNavigation(): void {
    document.getElementById("btn-new-game")?.addEventListener("click", () => {
      this.callbacks.onStartNewGame();
    });

    document.getElementById("btn-continue")?.addEventListener("click", () => {
      this.callbacks.onContinueGame();
    });

    document.getElementById("btn-select-myth")?.addEventListener("click", () => {
      this.showScreen(this.mythSelectionEl);
    });

    document.getElementById("btn-options")?.addEventListener("click", () => {
      this.showScreen(this.optionsEl);
    });

    document.getElementById("btn-controls")?.addEventListener("click", () => {
      this.showScreen(this.controlsEl);
    });

    document.getElementById("btn-back-myth-selection")?.addEventListener("click", () => {
      this.showScreen(this.mainMenuEl);
    });

    document.getElementById("btn-back-options")?.addEventListener("click", () => {
      this.showScreen(this.mainMenuEl);
    });

    document.getElementById("btn-back-controls")?.addEventListener("click", () => {
      this.showScreen(this.mainMenuEl);
    });

    document.getElementById("btn-res-continue")?.addEventListener("click", () => {
      this.hideScreen(this.resolutionEl);
      this.showMainMenu();
    });
  }

  private populateMythChapters(): void {
    const container = document.getElementById("chapters-container");
    if (!container) return;
    container.innerHTML = "";

    ALL_MYTH_CHAPTERS.forEach((ch, idx) => {
      const card = document.createElement("div");
      card.className = `chapter-card ${ch.unlockedByDefault ? '' : 'locked'}`;
      card.innerHTML = `
        <span class="chapter-tag">CAPÍTULO 0${idx + 1}</span>
        <h3 class="chapter-title">${ch.title}</h3>
        <p class="chapter-desc">${ch.description}</p>
        <button class="menu-btn ${ch.unlockedByDefault ? 'highlight' : ''}" ${ch.unlockedByDefault ? '' : 'disabled'}>
          <span class="btn-text">${ch.unlockedByDefault ? 'EXPLORAR MITO' : 'BLOQUEADO'}</span>
        </button>
      `;

      if (ch.unlockedByDefault) {
        card.querySelector("button")?.addEventListener("click", () => {
          this.callbacks.onSelectChapter(ch.id);
        });
      }

      container.appendChild(card);
    });
  }

  private setupOptionsMenu(): void {
    const qualityBtns = document.querySelectorAll(".quality-btn");
    qualityBtns.forEach((btn) => {
      btn.addEventListener("click", (evt) => {
        qualityBtns.forEach((b) => b.classList.remove("active"));
        const target = evt.currentTarget as HTMLElement;
        target.classList.add("active");
        const q = target.getAttribute("data-quality") as QualityLevel;
        if (q) this.callbacks.onQualityChange(q);
      });
    });
  }

  public showMainMenu(): void {
    this.hideAllScreens();
    this.mainMenuEl.classList.remove("hidden");
    this.mainMenuEl.classList.add("active");
  }

  public hideMainMenu(): void {
    this.mainMenuEl.classList.add("hidden");
  }

  public toggleContinueButton(enabled: boolean): void {
    const btn = document.getElementById("btn-continue") as HTMLButtonElement;
    if (btn) {
      btn.disabled = !enabled;
      if (enabled) btn.classList.remove("disabled");
      else btn.classList.add("disabled");
    }
  }

  public showLoadingScreen(title: string, quote?: string): void {
    this.loadingEl.classList.remove("hidden");
    const tEl = document.getElementById("loading-title");
    const qEl = document.getElementById("loading-subtitle");
    if (tEl) tEl.innerText = title;
    if (qEl && quote) qEl.innerText = `"${quote}"`;
  }

  public updateLoadingProgress(percentage: number): void {
    const pBar = document.getElementById("loading-progress");
    if (pBar) pBar.style.width = `${percentage}%`;
  }

  public hideLoadingScreen(): void {
    this.loadingEl.classList.add("hidden");
  }

  public showHUD(): void {
    this.reticleEl.classList.remove("hidden");
  }

  public hideHUD(): void {
    this.reticleEl.classList.add("hidden");
    this.hideInteractionPrompt();
  }

  public showInteractionPrompt(action: string, targetName: string): void {
    this.interactionPromptEl.classList.remove("hidden");
    const actEl = document.getElementById("prompt-action");
    const tarEl = document.getElementById("prompt-target");
    if (actEl) actEl.innerText = action;
    if (tarEl) tarEl.innerText = targetName;
    this.reticleEl.classList.add("active");
  }

  public hideInteractionPrompt(): void {
    this.interactionPromptEl.classList.add("hidden");
    this.reticleEl.classList.remove("active");
  }

  public showNotification(title: string, message: string): void {
    this.toastEl.classList.remove("hidden");
    const tMsg = document.getElementById("toast-msg");
    if (tMsg) tMsg.innerText = message;

    setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 4000);
  }

  public showSubtitle(text: string, durationMs: number = 5000): void {
    this.subtitleBoxEl.classList.remove("hidden");
    const subTxt = document.getElementById("subtitle-text");
    if (subTxt) subTxt.innerText = text;

    setTimeout(() => {
      this.subtitleBoxEl.classList.add("hidden");
    }, durationMs);
  }

  public showDialogueOverlay(tree: DialogueTree, dialogueSystem: DialogueSystem): void {
    this.dialogueOverlayEl.classList.remove("hidden");
    this.hideHUD();

    dialogueSystem.setOnNodeDisplayCallback((node) => {
      const nameEl = document.getElementById("speaker-name");
      const titleEl = document.getElementById("speaker-title");
      const textEl = document.getElementById("dialogue-text");
      const choicesContainer = document.getElementById("dialogue-choices");

      if (nameEl) nameEl.innerText = node.speakerName;
      if (titleEl) titleEl.innerText = node.speakerTitle;
      if (textEl) textEl.innerText = node.text;

      if (choicesContainer) {
        choicesContainer.innerHTML = "";
        node.choices.forEach((choice) => {
          const btn = document.createElement("button");
          btn.className = "choice-btn";
          btn.innerText = "► " + choice.text;
          btn.addEventListener("click", () => {
            dialogueSystem.selectChoice(choice);
          });
          choicesContainer.appendChild(btn);
        });
      }
    });

    dialogueSystem.setOnDialogueEndCallback(() => {
      this.dialogueOverlayEl.classList.add("hidden");
      this.showHUD();
    });

    dialogueSystem.startDialogue(tree);
  }

  public showResolutionScreen(title: string, cluesCount: number, totalClues: number, puzzlesSolved: number): void {
    this.hideHUD();
    this.resolutionEl.classList.remove("hidden");

    const titleEl = document.getElementById("res-chapter-title");
    const cluesEl = document.getElementById("res-clues-count");
    const puzzlesEl = document.getElementById("res-puzzles-count");

    if (titleEl) titleEl.innerText = title;
    if (cluesEl) cluesEl.innerText = `${cluesCount}/${totalClues}`;
    if (puzzlesEl) puzzlesEl.innerText = `${puzzlesSolved}/3`;
  }

  private showScreen(screenEl: HTMLElement): void {
    this.hideAllScreens();
    screenEl.classList.remove("hidden");
  }

  private hideScreen(screenEl: HTMLElement): void {
    screenEl.classList.add("hidden");
  }

  private hideAllScreens(): void {
    this.mainMenuEl.classList.add("hidden");
    this.mythSelectionEl.classList.add("hidden");
    this.optionsEl.classList.add("hidden");
    this.controlsEl.classList.add("hidden");
    this.pauseMenuEl.classList.add("hidden");
    this.resolutionEl.classList.add("hidden");
  }
}
