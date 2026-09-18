import { JournalSystem, Clue, CharacterProfile } from "../investigation/JournalSystem";
import { DialogueSystem, DialogueTree, DialogueNode, DialogueChoice } from "../dialogue/DialogueSystem";
import { ALL_MYTH_CHAPTERS } from "../mythology/MythRegistry";
import { QualityLevel } from "../graphics/GraphicsQualityManager";

export interface UICallbacks {
  onStartNewGame?: () => void;
  onContinueGame?: () => void;
  onSelectChapter?: (chapterId: string) => void;
  onQualityChange?: (quality: QualityLevel) => void;
  onVolumeChange?: (volume: number) => void;
}

export class UIManager {
  private mainMenuEl!: HTMLElement | null;
  private hudEl!: HTMLElement | null;
  private dialogueOverlayEl!: HTMLElement | null;
  private journalOverlayEl!: HTMLElement | null;
  private pauseMenuEl!: HTMLElement | null;
  private optionsMenuEl!: HTMLElement | null;
  private controlsScreenEl!: HTMLElement | null;
  private mythSelectionScreenEl!: HTMLElement | null;
  private loadingScreenEl!: HTMLElement | null;

  private currentJournalSystem: JournalSystem | null = null;
  private isJournalOpen: boolean = false;
  private callbacks: UICallbacks = {};

  constructor(callbacks: UICallbacks = {}) {
    this.callbacks = callbacks;
    this.cacheElements();
    this.setupGlobalEvents();
    this.setupMenuNavigation();
  }

  private cacheElements(): void {
    this.mainMenuEl = document.getElementById("main-menu");
    this.hudEl = document.getElementById("ui-container");
    this.dialogueOverlayEl = document.getElementById("dialogue-overlay");
    this.journalOverlayEl = document.getElementById("journal-overlay");
    this.pauseMenuEl = document.getElementById("pause-menu");
    this.optionsMenuEl = document.getElementById("options-screen") || document.getElementById("options-menu");
    this.controlsScreenEl = document.getElementById("controls-screen");
    this.mythSelectionScreenEl = document.getElementById("myth-selection-screen");
    this.loadingScreenEl = document.getElementById("loading-screen");
  }

  private setupMenuNavigation(): void {
    // Selección de Mito
    const btnSelectMyth = document.getElementById("btn-select-myth");
    btnSelectMyth?.addEventListener("click", () => {
      this.hideMainMenu();
      this.showMythSelectionScreen();
    });

    const btnCloseMyth = document.getElementById("btn-back-myth-selection") || document.getElementById("btn-close-myth-selection");
    btnCloseMyth?.addEventListener("click", () => {
      this.hideMythSelectionScreen();
      this.showMainMenu();
    });

    // Opciones
    const btnOptions = document.getElementById("btn-options");
    btnOptions?.addEventListener("click", () => {
      this.hideMainMenu();
      this.showOptionsMenu();
    });

    const btnCloseOptions = document.getElementById("btn-back-options") || document.getElementById("btn-close-options");
    btnCloseOptions?.addEventListener("click", () => {
      this.hideOptionsMenu();
      this.showMainMenu();
    });

    // Controles
    const btnControls = document.getElementById("btn-controls");
    btnControls?.addEventListener("click", () => {
      this.hideMainMenu();
      this.showControlsScreen();
    });

    const btnCloseControls = document.getElementById("btn-back-controls") || document.getElementById("btn-close-controls");
    btnCloseControls?.addEventListener("click", () => {
      this.hideControlsScreen();
      this.showMainMenu();
    });

    // Pause Menu
    const btnResume = document.getElementById("btn-pause-resume") || document.getElementById("btn-resume");
    btnResume?.addEventListener("click", () => {
      this.hidePauseMenu();
    });

    const btnPauseJournal = document.getElementById("btn-pause-journal");
    btnPauseJournal?.addEventListener("click", () => {
      this.hidePauseMenu();
      this.showJournal();
    });

    const btnExitToMain = document.getElementById("btn-pause-main-menu") || document.getElementById("btn-exit-main");
    btnExitToMain?.addEventListener("click", () => {
      this.hidePauseMenu();
      this.hideHUD();
      this.showMainMenu();
    });

    // Option Quality Buttons
    document.querySelectorAll(".quality-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const quality = (e.target as HTMLElement).getAttribute("data-quality") as QualityLevel;
        if (quality && this.callbacks.onQualityChange) {
          this.callbacks.onQualityChange(quality);
          document.querySelectorAll(".quality-btn").forEach((b) => b.classList.remove("active"));
          (e.target as HTMLElement).classList.add("active");
        }
      });
    });

    // Populate Myth Selection Cards
    this.populateMythSelectionCards();
  }

  private populateMythSelectionCards(): void {
    const container = document.getElementById("chapters-container") || document.getElementById("myths-grid");
    if (!container) return;

    container.innerHTML = "";
    ALL_MYTH_CHAPTERS.forEach((myth) => {
      const card = document.createElement("div");
      card.className = `myth-card ${myth.unlockedByDefault ? "" : "locked"}`;
      card.innerHTML = `
        <div class="myth-card-header">
          <h3>${myth.title}</h3>
          <span class="badge">${myth.unlockedByDefault ? "DESBLOQUEADO" : "BLOQUEADO"}</span>
        </div>
        <p class="subtitle">${myth.subtitle}</p>
        <p class="desc">${myth.description}</p>
        <button class="menu-btn start-myth-btn" ${myth.unlockedByDefault ? "" : "disabled"}>
          ${myth.unlockedByDefault ? "JUGAR MITO" : "BLOQUEADO"}
        </button>
      `;

      if (myth.unlockedByDefault) {
        card.querySelector(".start-myth-btn")?.addEventListener("click", () => {
          this.hideMythSelectionScreen();
          if (this.callbacks.onSelectChapter) {
            this.callbacks.onSelectChapter(myth.id);
          }
        });
      }

      container.appendChild(card);
    });
  }

  private setupGlobalEvents(): void {
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyJ" || e.code === "Tab") {
        e.preventDefault();
        this.toggleJournal();
      } else if (e.code === "Escape") {
        this.togglePauseMenu();
      }
    });

    const closeJournalBtn = document.getElementById("btn-close-journal") || document.getElementById("close-journal-btn");
    if (closeJournalBtn) {
      closeJournalBtn.addEventListener("click", () => {
        this.hideJournal();
      });
    }

    // Journal Tabs matching class jtab-btn in index.html
    document.querySelectorAll(".jtab-btn, .journal-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".jtab-btn, .journal-tab").forEach((t) => t.classList.remove("active"));
        (e.target as HTMLElement).classList.add("active");
        const tabName = (e.target as HTMLElement).getAttribute("data-tab");
        this.switchJournalTab(tabName);
      });
    });
  }

  private switchJournalTab(tabName: string | null): void {
    const cluesList = document.getElementById("clues-list-container");
    if (!cluesList) return;

    if (tabName === "characters") {
      cluesList.innerHTML = `<div class="info-card"><h4>Kallisto</h4><p>Superviviente y Erudito Helénico de la expedición.</p></div>`;
    } else if (tabName === "lore") {
      cluesList.innerHTML = `<div class="info-card"><h4>Mito vs Realidad</h4><p>Compara elementos de las fuentes griegas antiguas contra mitos populares.</p></div>`;
    } else if (tabName === "deduction") {
      cluesList.innerHTML = `<div class="info-card"><h4>Tablero de Deducción</h4><p>Relaciona pistas para desentrañar la verdad del santuario.</p></div>`;
    } else {
      this.populateJournalContent();
    }
  }

  public setJournalSystem(journal: JournalSystem): void {
    this.currentJournalSystem = journal;
  }

  public toggleJournal(): void {
    if (this.isJournalOpen) {
      this.hideJournal();
    } else {
      this.showJournal();
    }
  }

  public showJournal(): void {
    this.isJournalOpen = true;
    this.journalOverlayEl?.classList.remove("hidden");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.populateJournalContent();
  }

  public hideJournal(): void {
    this.isJournalOpen = false;
    this.journalOverlayEl?.classList.add("hidden");
  }

  public togglePauseMenu(): void {
    if (this.pauseMenuEl?.classList.contains("hidden")) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  public showPauseMenu(): void {
    this.pauseMenuEl?.classList.remove("hidden");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  public hidePauseMenu(): void {
    this.pauseMenuEl?.classList.add("hidden");
  }

  private populateJournalContent(): void {
    const listEl = document.getElementById("clues-list-container") || document.getElementById("clues-list");
    if (!listEl || !this.currentJournalSystem) return;

    listEl.innerHTML = "";
    const clues = this.currentJournalSystem.getClues();

    if (clues.length === 0) {
      listEl.innerHTML = `<p class="empty-msg">No has descubierto pistas aún. Explora el templo y examina los objetos.</p>`;
      return;
    }

    clues.forEach((clue) => {
      const card = document.createElement("div");
      card.className = "clue-card";
      card.innerHTML = `
        <h4>${clue.title}</h4>
        <span class="clue-type">${clue.type}</span>
        <p>${clue.description}</p>
        <small>📍 Ubicación: ${clue.locationFound}</small>
        ${clue.mythVsFact ? `<div class="myth-fact"><b>Mito:</b> ${clue.mythVsFact.mythicElement}<br/><b>Realidad:</b> ${clue.mythVsFact.historicalElement}</div>` : ""}
      `;
      listEl.appendChild(card);
    });
  }

  public showMainMenu(): void {
    this.mainMenuEl?.classList.remove("hidden");
  }

  public hideMainMenu(): void {
    this.mainMenuEl?.classList.add("hidden");
  }

  public showMythSelectionScreen(): void {
    this.mythSelectionScreenEl?.classList.remove("hidden");
  }

  public hideMythSelectionScreen(): void {
    this.mythSelectionScreenEl?.classList.add("hidden");
  }

  public showOptionsMenu(): void {
    this.optionsMenuEl?.classList.remove("hidden");
  }

  public hideOptionsMenu(): void {
    this.optionsMenuEl?.classList.add("hidden");
  }

  public showControlsScreen(): void {
    this.controlsScreenEl?.classList.remove("hidden");
  }

  public hideControlsScreen(): void {
    this.controlsScreenEl?.classList.add("hidden");
  }

  public toggleContinueButton(hasSave: boolean): void {
    const continueBtn = document.getElementById("btn-continue") || document.getElementById("continue-btn");
    if (continueBtn) {
      if (hasSave) {
        continueBtn.removeAttribute("disabled");
      } else {
        continueBtn.setAttribute("disabled", "true");
      }
    }
  }

  public showHUD(): void {
    this.hudEl?.classList.remove("hidden");
  }

  public hideHUD(): void {
    this.hudEl?.classList.add("hidden");
  }

  public showLoadingScreen(title: string, subtitle: string): void {
    const titleEl = document.getElementById("loading-title");
    const subEl = document.getElementById("loading-subtitle");
    if (titleEl) titleEl.innerText = title;
    if (subEl) subEl.innerText = subtitle;
    this.loadingScreenEl?.classList.remove("hidden");
  }

  public updateLoadingProgress(percent: number): void {
    const fillEl = document.getElementById("loading-progress") || document.getElementById("loading-fill");
    if (fillEl) fillEl.style.width = `${percent}%`;
  }

  public hideLoadingScreen(): void {
    this.loadingScreenEl?.classList.add("hidden");
  }

  public showInteractionPrompt(actionText: string, objectName: string): void {
    const promptEl = document.getElementById("interaction-prompt");
    if (promptEl) {
      promptEl.innerHTML = `<span class="key-badge">E</span> <span class="action">${actionText}</span> - <span class="name">${objectName}</span>`;
      promptEl.classList.remove("hidden");
    }
  }

  public hideInteractionPrompt(): void {
    const promptEl = document.getElementById("interaction-prompt");
    if (promptEl) promptEl.classList.add("hidden");
  }

  public showNotification(title: string, message: string): void {
    const notifContainer = document.getElementById("notification-toast") || document.getElementById("notification-container");
    if (!notifContainer) return;

    const notif = document.createElement("div");
    notif.className = "notification-toast-item";
    notif.innerHTML = `<strong>${title}</strong><p>${message}</p>`;

    notifContainer.appendChild(notif);
    setTimeout(() => {
      notif.classList.add("fade-out");
      setTimeout(() => notif.remove(), 500);
    }, 3500);
  }

  public showDialogueOverlay(tree: DialogueTree, dialogueSystem: DialogueSystem): void {
    this.dialogueOverlayEl?.classList.remove("hidden");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    dialogueSystem.setOnNodeDisplayCallback((node: DialogueNode) => {
      this.renderDialogueNode(node, dialogueSystem);
    });

    dialogueSystem.setOnDialogueEndCallback(() => {
      this.hideDialogueOverlay();
    });

    dialogueSystem.startDialogue(tree);
  }

  public renderDialogueNode(node: DialogueNode, dialogueSystem: DialogueSystem): void {
    const speakerNameEl = document.getElementById("speaker-name");
    const speakerTitleEl = document.getElementById("speaker-title");
    const dialogueTextEl = document.getElementById("dialogue-text");
    const choicesListEl = document.getElementById("dialogue-choices") || document.getElementById("choices-list");

    if (speakerNameEl) speakerNameEl.innerText = node.speakerName;
    if (speakerTitleEl) speakerTitleEl.innerText = node.speakerTitle || "";
    if (dialogueTextEl) dialogueTextEl.innerText = node.text;

    if (choicesListEl) {
      choicesListEl.innerHTML = "";
      node.choices.forEach((choice: DialogueChoice) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.addEventListener("click", () => {
          dialogueSystem.selectChoice(choice);
        });
        choicesListEl.appendChild(btn);
      });
    }
  }

  public hideDialogueOverlay(): void {
    this.dialogueOverlayEl?.classList.add("hidden");
  }

  public showSubtitle(text: string): void {
    const subContainer = document.getElementById("subtitle-box") || document.getElementById("subtitle-container");
    const subText = document.getElementById("subtitle-text");
    if (subText) subText.innerText = text;

    if (subContainer) {
      subContainer.classList.remove("hidden");
      setTimeout(() => {
        subContainer.classList.add("hidden");
      }, 5000);
    }
  }

  public showResolutionScreen(chapterName: string, cluesFound: number, totalClues: number, decisionsMade: number): void {
    const resEl = document.getElementById("resolution-screen");
    if (!resEl) return;

    resEl.innerHTML = `
      <div class="resolution-content">
        <h2>CAPÍTULO RESUELTO</h2>
        <h3>${chapterName}</h3>
        <div class="stats">
          <p>🔍 Pistas Descubiertas: ${cluesFound} / ${totalClues}</p>
          <p>⚖️ Decisiones Tomadas: ${decisionsMade}</p>
          <p>📜 Misterio Desvelado: El mito de Medusa reflejado en el bronce bendecido de Atenea.</p>
        </div>
        <button id="finish-chapter-btn" class="menu-btn primary">VOLVER AL MENÚ PRINCIPAL</button>
      </div>
    `;
    resEl.classList.remove("hidden");
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    document.getElementById("finish-chapter-btn")?.addEventListener("click", () => {
      resEl.classList.add("hidden");
      this.hideHUD();
      this.showMainMenu();
    });
  }
}
