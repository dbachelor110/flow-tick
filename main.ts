import {
  MarkdownPostProcessorContext,
  MarkdownView,
  Plugin,
  TFile,
} from 'obsidian';

import { ChecklistAnalyzer } from 'src/checklist';
import { renderFlowTickBar } from 'src/progress';
import {
  DEFAULT_SETTINGS,
  FlowTickSettings,
  FlowTickSettingTab,
} from 'src/settings';

export default class FlowTick extends Plugin {
  settings: FlowTickSettings;
  checklistAnalyzer: ChecklistAnalyzer;

  flowTickContainerTable = new Map<number, Record<string, HTMLElement>>();

  private readonly FLOWTICK_CONTAINER_CLASS_NAME = 'flowtick-container';

  private readonly SOURCE_VIEW_CLASS_NAME = 'markdown-source-view';
  private readonly PREVIEW_VIEW_CLASS_NAME = 'markdown-preview-view';

  get currentViewInfo() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      throw new Error('No active markdown view');
    }

    const currentViewInfo = {
      activeView,
      mode: activeView.getMode(),
    };

    return currentViewInfo;
  }

  async onload() {
    console.log('FlowTick start loading');

    this.checklistAnalyzer = new ChecklistAnalyzer(this.app);
    await this.loadSettings();
    this.addSettingTab(new FlowTickSettingTab(this.app, this));

    // Handle ```flowtick``` code blocks
    this.registerMarkdownCodeBlockProcessor(
      'flowtick',
      async (_source, element, ctx) => {
        console.log('in registerMarkdownCodeBlockProcessor');
        const startLine = this.getElementLineNumber(element, ctx);

        // Create or update the current flowtick container
        const container = this.insertFlowTickContainer(element, startLine);

        // Register the flowtick container for later updates
        this.registerFlowTickContainer(container, startLine);

        // Update the previous flowtick container's end line
        this.updatePreviousFlowTickContainer(startLine);
      }
    );

    this.registerInterval(
      window.setInterval(
        () => this.updateAllFlowTick(),
        this.settings.refreshInterval
      )
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private getElementLineNumber(
    element: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) {
    const sectionInfo = ctx.getSectionInfo(element);
    return sectionInfo?.lineStart ?? -1;
  }

  private insertFlowTickContainer(
    codeBlockElement: HTMLElement,
    startLine: number
  ) {
    const startLineText = startLine.toString();
    const container = codeBlockElement.find(
      `div.${this.FLOWTICK_CONTAINER_CLASS_NAME}`
    );

    if (container) {
      container.setAttribute('start-line', startLineText);
      return container;
    } else {
      return codeBlockElement.createDiv({
        cls: this.FLOWTICK_CONTAINER_CLASS_NAME,
        attr: { 'start-line': startLineText },
      });
    }
  }

  private registerFlowTickContainer(container: HTMLElement, startLine: number) {
    const currentViewMode = this.currentViewInfo.mode;

    const currentPathFlowTickContainerTable =
      this.flowTickContainerTable.get(startLine) ?? {};

    this.flowTickContainerTable.set(startLine, {
      ...currentPathFlowTickContainerTable,
      [currentViewMode]: container,
    });
  }

  private updatePreviousFlowTickContainer(lineNumber: number) {
    const previousFlowTickContainerIndex = [
      ...this.flowTickContainerTable.keys(),
    ]
      .filter((line) => line < lineNumber)
      .sort((a, b) => a - b)
      .pop();

    if (previousFlowTickContainerIndex !== undefined) {
      const previousFlowTickContainer = this.flowTickContainerTable.get(
        previousFlowTickContainerIndex
      )?.[this.currentViewInfo.mode];

      previousFlowTickContainer?.setAttribute(
        'end-line',
        lineNumber.toString()
      );
    }
  }

  private renderFlowTick(flowTickContainerEl: Element) {
    const rawStartLine = flowTickContainerEl.getAttribute('start-line');
    const rawEndLine = flowTickContainerEl.getAttribute('end-line');

    const startLine = rawStartLine ? Number(rawStartLine) : undefined;
    const endLine = rawEndLine ? Number(rawEndLine) : undefined;

    // ---- (2) Filter listItems belonging to this flowtick interval ----
    const itemsInRange = this.checklistAnalyzer.getListItemsInRange(
      startLine,
      endLine
    );
    const percent = this.checklistAnalyzer.getCompletionRate(itemsInRange);

    // ---- (5) Render the progress bar ----
    renderFlowTickBar(flowTickContainerEl, percent * 100);
  }

  private async updateAllFlowTick() {
    const { activeView, mode } = this.currentViewInfo;

    if (activeView.file) {
      this.syncFlowTickPositions(activeView.file, activeView, mode);
    }

    const flowTickContainers = this.getAllFlowTickContainers();
    flowTickContainers.forEach((element) => {
      this.renderFlowTick(element);
    });
  }

  private syncFlowTickPositions(
    file: TFile,
    activeView: MarkdownView,
    currentViewMode: string
  ) {
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache || !cache.sections) {
      return;
    }

    const editor = activeView.editor;

    // Find all flowtick blocks in the cache
    const flowtickBlocks = cache.sections.filter((section) => {
      if (section.type !== 'code') {
        return false;
      }
      // Check the first line of the block for the language identifier
      // section.position.start.line is where \`\`\`flowtick starts
      const startLine = section.position.start.line;
      const lineContent = editor.getLine(startLine);
      return lineContent?.trim().toLowerCase().startsWith('```flowtick');
    });

    if (flowtickBlocks.length === 0) {
      return;
    }

    const flowTickContainers = this.getAllFlowTickContainers();

    // Sync attributes for matched blocks
    for (
      let i = 0;
      i < Math.min(flowtickBlocks.length, flowTickContainers.length);
      i++
    ) {
      const block = flowtickBlocks[i];
      const element = flowTickContainers[i];

      const newStartLine = block.position.start.line;

      let newEndLine = -1;
      if (i < flowtickBlocks.length - 1) {
        newEndLine = flowtickBlocks[i + 1].position.start.line;
      }

      if (element instanceof HTMLElement) {
        const currentStart = element.getAttribute('start-line');
        if (currentStart !== newStartLine.toString()) {
          element.setAttribute('start-line', newStartLine.toString());
        }

        if (newEndLine !== -1) {
          const currentEnd = element.getAttribute('end-line');
          if (currentEnd !== newEndLine.toString()) {
            element.setAttribute('end-line', newEndLine.toString());
          }
        } else {
          element.removeAttribute('end-line');
        }
      }

      // Update the table to reflect the new position
      // First, clean up any old entry for this view mode that might conflict or be stale
      // This is a bit brute-force: iterate and remove current element if found elsewhere
      for (const [line, record] of this.flowTickContainerTable.entries()) {
        if (record[currentViewMode] === element) {
          if (line !== newStartLine) {
            delete record[currentViewMode];
            if (Object.keys(record).length === 0) {
              this.flowTickContainerTable.delete(line);
            }
          }
        }
      }

      // Set the new entry
      const currentPathFlowTickContainerTable =
        this.flowTickContainerTable.get(newStartLine) ?? {};

      this.flowTickContainerTable.set(newStartLine, {
        ...currentPathFlowTickContainerTable,
        [currentViewMode]: element as HTMLElement,
      });
    }
  }

  /**
   * get all flowtick container elements in the current view
   */
  private getAllFlowTickContainers() {
    const { mode } = this.currentViewInfo;
    // Find DOM elements
    const querySelector =
      mode === 'source'
        ? `.${this.SOURCE_VIEW_CLASS_NAME} .${this.FLOWTICK_CONTAINER_CLASS_NAME}`
        : `.${this.PREVIEW_VIEW_CLASS_NAME} .${this.FLOWTICK_CONTAINER_CLASS_NAME}`;

    const elements = document.querySelectorAll(querySelector);

    return elements;
  }
}
