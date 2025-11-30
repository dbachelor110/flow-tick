import {
  ListItemCache,
  MarkdownPostProcessorContext,
  MarkdownView,
  Plugin,
} from 'obsidian';

import { renderFlowTickBar } from 'src/progress';
import {
  DEFAULT_SETTINGS,
  FlowTickSettings,
  FlowTickSettingTab,
} from 'src/settings';

interface listItemNode {
  item: ListItemCache;
  line: number;
  task: string | undefined;
  childrenTable: Map<string, listItemNode>;
}

export default class FlowTick extends Plugin {
  settings: FlowTickSettings;

  flowTickContainerTable = new Map<number, Record<string, HTMLElement>>();

  get currentViewMode() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      throw new Error('No active markdown view');
    }

    return activeView.getMode();
  }

  async onload() {
    console.log('FlowTick start loading');

    await this.loadSettings();
    this.addSettingTab(new FlowTickSettingTab(this.app, this));

    // Handle ```flowtick``` code blocks
    this.registerMarkdownCodeBlockProcessor(
      'flowtick',
      async (_source, element, ctx) => {
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
    const container = codeBlockElement.find('div.flowtick-container');

    if (container) {
      container.setAttribute('start-line', startLineText);
      return container;
    } else {
      return codeBlockElement.createDiv({
        cls: 'flowtick-container',
        attr: { 'start-line': startLineText },
      });
    }
  }

  private registerFlowTickContainer(container: HTMLElement, startLine: number) {
    const currentViewMode = this.currentViewMode;
    if (!currentViewMode) {
      return;
    }

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
      )?.[this.currentViewMode];

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
    const itemsInRange = this.getListItemsInRange(startLine, endLine);
    const listItemTable = this.getListItemTable(itemsInRange);

    // ---- (4) Calculate completion for multi-level checklists ----
    const topLevelTotal = listItemTable.size;
    const topLevelSum = [...listItemTable.values()].reduce(
      (sum, node) => sum + this.calcCompletion(node),
      0
    );
    const percent = topLevelSum / topLevelTotal;

    // ---- (5) Render the progress bar ----
    renderFlowTickBar(flowTickContainerEl, percent * 100);
  }

  private getListItemsInRange(
    startLine?: number,
    endLine?: number
  ): ListItemCache[] {
    const currentFile = this.app.workspace.getActiveFile();

    const fileCache = currentFile
      ? this.app.metadataCache.getFileCache(currentFile)
      : null;

    const listItems = fileCache?.listItems;

    const itemsInRange = listItems?.filter((li) => {
      const line = li.position.start.line;
      return this.isNumberInRange(line, startLine, endLine);
    });

    return itemsInRange ?? [];
  }

  private isNumberInRange(
    target: number,
    start?: number,
    end?: number
  ): boolean {
    const afterStart = start === undefined || target >= start;
    const beforeEnd = end === undefined || target < end;
    return afterStart && beforeEnd;
  }

  private getListItemTable(
    listItems: ListItemCache[]
  ): Map<string, listItemNode> {
    const rootItemNodeTable = new Map<string, listItemNode>();
    const allItemNodeTable = new Map<string, listItemNode>();

    for (const item of listItems) {
      const line = item.position.start.line;

      const parent = item.parent;

      const node: listItemNode = {
        item,
        line,
        task: item.task,
        childrenTable: new Map<string, listItemNode>(),
      };

      const parentIsRoot =
        allItemNodeTable.get(parent.toString()) === undefined;

      if (parentIsRoot) {
        const newRootNode: listItemNode = {
          item,
          line,
          task: undefined,
          childrenTable: new Map<string, listItemNode>(),
        };

        rootItemNodeTable.set(parent.toString(), newRootNode);
        allItemNodeTable.set(parent.toString(), newRootNode);
      }

      allItemNodeTable
        .get(parent.toString())
        ?.childrenTable.set(line.toString(), node);
      allItemNodeTable.set(line.toString(), node);
    }

    return rootItemNodeTable;
  }

  private calcCompletion(node: listItemNode): number {
    const total = node.childrenTable.size;
    if (total === 0) {
      return node.task === 'x' ? 1 : 0;
    }

    const sum = [...node.childrenTable.values()].reduce(
      (sum, child) => sum + this.calcCompletion(child),
      0
    );
    return sum / total;
  }

  private updateAllFlowTick() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    // console.log('FlowTick updateAllFlowTick in view:');
    // console.info(activeView);
    // console.log('current view mode:', activeView?.getMode());

    const currentViewMode = activeView?.getMode();
    if (!currentViewMode) {
      // console.log('FlowTick no active markdown view, skip update');
      return;
    }

    const querySelector =
      currentViewMode === 'source'
        ? '.markdown-source-view .flowtick-container'
        : '.markdown-preview-view .flowtick-container';

    const elements = document.querySelectorAll(querySelector);
    elements.forEach((element) => {
      this.renderFlowTick(element);
    });
  }
}
