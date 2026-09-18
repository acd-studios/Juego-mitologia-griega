import { JournalSystem, Clue, CharacterProfile } from "../investigation/JournalSystem";
import { DialogueSystem, DialogueTree, DialogueNode, DialogueChoice } from "../dialogue/DialogueSystem";

export class UIManager {
  private mainMenuEl!: HTMLElement | null;
  private hudEl!: HTMLElement | null;
  private dialogueOverlayEl!: HTMLElement | null;
  private journalOverlayEl!: HTMLElement | null;
  private pauseMenuEl!: HTMLElement | null;
  private optionsMenuEl!: HTMLElement | null;
  private loadingScreenEl!: HTMLElement | null;

  private currentJournalSystem: JournalSystem | null = null;
  private isJournalOpen: boolean = false;

  constructor() {
    this.cacheElements();
    this.setupGlobalEvents();
  }

  private cacheElements(): void {
    this.mainMenuEl = document.getElementById("main-menu");
    this.hudEl = document.getElementById("ui-container");
    this.dialogueOverlayEl = document.getElementById("dialogue-overlay");
    this.journalOverlayEl = document.getElementById("journal-overlay");
    this.pauseMenuEl = document.getElementById("pause-menu");
    this.optionsMenuEl = document.getElementById("options-screen") || document.getElementById("options-menu");
    this.loadingScreenEl = document.getElementById("loading-screen");
  }

  private setupGlobalEvents(): void {
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyJ" || e.code === "Tab") {
        e.preventDefault();
        this.toggleJournal();
      }
    });

    const closeJournalBtn = document.getElementById("btn-close-journal") || document.getElementById("close-journal-btn");
    if (closeJournalBtn) {
      closeJournalBtn.addEventListener("click", () => {
        this.hideJournal();
      });
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
    this.populateJournalContent();
  }

  public hideJournal(): void {
    this.isJournalOpen = false;
    this.journalOverlayEl?.classList.add("hidden");
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

    document.getElementById("finish-chapter-btn")?.addEventListener("click", () => {
      resEl.classList.add("hidden");
      this.hideHUD();
      this.showMainMenu();
    });
  }
}
