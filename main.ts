import { ListItemCache, MarkdownView, Plugin } from 'obsidian';

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

  async onload() {
    console.log('FlowTick start loading');

    await this.loadSettings();
    this.addSettingTab(new FlowTickSettingTab(this.app, this));

    // Handle ```flowtick``` code blocks
    this.registerMarkdownCodeBlockProcessor(
      'flowtick',
      async (source, element, ctx) => {
        const sectionInfo = ctx.getSectionInfo(element);
        const lineNumber = sectionInfo?.lineStart ?? -1;

        const parent = element.parentElement!;
        const children = Array.from(parent.children);
        const index = children.indexOf(element); // ← Find the element's position among its siblings

        // Find the next .flowtick-code-block element that appears after the current element
        const nextElement = parent.querySelector<HTMLElement>(
          `:scope > :nth-child(n+${index + 2}).block-language-flowtick`
        );

        const endLine = nextElement
          ? ctx.getSectionInfo(nextElement)?.lineStart
          : undefined;

        const container =
          element.find('div.flowtick-container') ??
          element.createDiv({
            cls: 'flowtick-container',
            attr: { 'start-line': lineNumber },
          });

        if (endLine !== undefined) {
          container.setAttr('end-line', endLine.toString());
        }

        this.renderFlowTick(container);
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

  private renderFlowTick(flowTickContainerEl: Element) {
    const rawStartLine = flowTickContainerEl.getAttribute('start-line');
    const rawEndLine = flowTickContainerEl.getAttribute('end-line');

    const startLine = rawStartLine ? Number(rawStartLine) : undefined;
    const endLine = rawEndLine ? Number(rawEndLine) : undefined;

    // ---- (2) Filter listItems belonging to this flowtick interval ----
    const itemsInRange = this.getListItemsInRange(startLine, endLine);
    if (itemsInRange.length === 0) {
      return;
    }

    const listItemTable = this.getListItemTable(itemsInRange);

    console.info(listItemTable);

    // ---- (4) Calculate completion for multi-level checklists ----
    const topLevelTotal = listItemTable.size;
    const topLevelSum = [...listItemTable.values()].reduce(
      (sum, node) => sum + this.calcCompletion(node),
      0
    );
    const percent = topLevelSum / topLevelTotal;

    console.log('FlowTick percent:', percent);

    // ---- (5) Render the progress bar ----
    renderFlowTickBar(flowTickContainerEl, percent * 100);
  }

  private getListItemsInRange(
    startLine?: number,
    endLine?: number
  ): ListItemCache[] {
    console.log('FlowTick getListItemsInRange:', { startLine, endLine });
    const currentFile = this.app.workspace.getActiveFile();
    if (!currentFile) {
      return [];
    }

    const fileCache = this.app.metadataCache.getFileCache(currentFile);
    const listItems = fileCache?.listItems;
    if (!listItems) {
      return [];
    }

    const itemsInRange = listItems.filter((li) => {
      const line = li.position.start.line;
      return this.isNumberInRange(line, startLine, endLine);
    });

    return itemsInRange;
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

    console.log('FlowTick updateAllFlowTick in view:');
    console.info(activeView);
    console.log('current view mode:', activeView?.getMode());

    const currentViewMode = activeView?.getMode();
    if (!currentViewMode) {
      console.log('FlowTick no active markdown view, skip update');
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
