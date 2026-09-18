export interface DialogueChoice {
  id: string;
  text: string;
  requiredClueId?: string;
  nextDialogueNodeId?: string;
  onSelect?: () => void;
}

export interface DialogueNode {
  id: string;
  speakerName: string;
  speakerTitle: string;
  text: string;
  choices: DialogueChoice[];
}

export interface DialogueTree {
  id: string;
  characterId: string;
  nodes: Map<string, DialogueNode>;
  startNodeId: string;
}

export class DialogueSystem {
  private currentTree: DialogueTree | null = null;
  private currentNode: DialogueNode | null = null;
  private onNodeDisplayCallback?: (node: DialogueNode) => void;
  private onDialogueEndCallback?: () => void;

  public startDialogue(tree: DialogueTree, startNodeId?: string): void {
    this.currentTree = tree;
    const nodeId = startNodeId || tree.startNodeId;
    const node = tree.nodes.get(nodeId);
    if (node) {
      this.currentNode = node;
      if (this.onNodeDisplayCallback) {
        this.onNodeDisplayCallback(node);
      }
    }
  }

  public selectChoice(choice: DialogueChoice): void {
    if (choice.onSelect) {
      choice.onSelect();
    }

    if (choice.nextDialogueNodeId && this.currentTree) {
      const nextNode = this.currentTree.nodes.get(choice.nextDialogueNodeId);
      if (nextNode) {
        this.currentNode = nextNode;
        if (this.onNodeDisplayCallback) {
          this.onNodeDisplayCallback(nextNode);
        }
        return;
      }
    }

    this.endDialogue();
  }

  public endDialogue(): void {
    this.currentTree = null;
    this.currentNode = null;
    if (this.onDialogueEndCallback) {
      this.onDialogueEndCallback();
    }
  }

  public setOnNodeDisplayCallback(cb: (node: DialogueNode) => void): void {
    this.onNodeDisplayCallback = cb;
  }

  public setOnDialogueEndCallback(cb: () => void): void {
    this.onDialogueEndCallback = cb;
  }
}
