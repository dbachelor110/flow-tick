import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  MarkdownView,
  MarkdownViewModeType,
  Plugin,
  SectionCache,
} from 'obsidian';

import { ChecklistAnalyzer } from 'src/ChecklistAnalyzer';
import { getProgressColor } from 'src/progress';

interface FlowTickChildOption {
  containerEl: HTMLElement;
  currentViewMode: MarkdownViewModeType;
  ctx: MarkdownPostProcessorContext;
  plugin: Plugin;
  onunloadCallback?: (flowTickChild: FlowTickChild) => void;
  progress?: number;
  logger?: Console;
}

class FlowTickChild extends MarkdownRenderChild {
  static readonly CODE_BLOCK_PATTERN = '```';
  static readonly CODE_BLOCK_TAG = 'flowtick';
  static readonly CONTAINER_CLASS_NAME = 'flowtick-container';
  static readonly BAR_CLASS_NAME = 'flowtick-bar';
  static readonly FILL_CLASS_NAME = 'flowtick-fill';

  readonly CURRENT_VIEW_MODE: MarkdownViewModeType;
  readonly id: string = crypto.randomUUID();

  readonly plugin: Plugin;
  readonly ctx: MarkdownPostProcessorContext;

  readonly getProgressColor = getProgressColor;
  readonly onunloadCallback: FlowTickChildOption['onunloadCallback'];

  private progress: number;
  private checklistAnalyzer: ChecklistAnalyzer;
  private logger: Console;

  constructor({
    containerEl,
    currentViewMode,
    ctx,
    plugin,
    onunloadCallback,
    progress = 0,
    logger,
  }: FlowTickChildOption) {
    super(containerEl);

    this.CURRENT_VIEW_MODE = currentViewMode;
    this.plugin = plugin;
    this.onunloadCallback = onunloadCallback;
    this.progress = progress;
    this.ctx = ctx;
    this.logger = logger ?? console;

    this.checklistAnalyzer = new ChecklistAnalyzer(this.plugin.app);
  }

  get currentViewInfo() {
    const activeView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      throw new Error('No active markdown view');
    }

    const currentViewInfo = {
      activeView,
      mode: activeView.getMode(),
    };

    return currentViewInfo;
  }

  get currentFileCache() {
    const activeFile = this.currentViewInfo.activeView.file;

    if (!activeFile) {
      return null;
    }

    const cache = this.plugin.app.metadataCache.getFileCache(activeFile);

    return cache;
  }

  get currentSections() {
    const activeFile = this.currentViewInfo.activeView.file;

    if (!activeFile) {
      return [];
    }

    const cache = this.plugin.app.metadataCache.getFileCache(activeFile);
    return cache?.sections ?? [];
  }

  get startLine() {
    const startLine = this.getStartLineForBlock();
    return startLine;
  }

  get endLine(): number | undefined {
    const endLine = this.getEndLineForBlock();
    return endLine;
  }

  /** create flow tick child container, or return existing one */
  static insertFlowTickChildContainer(codeBlockElement: HTMLElement) {
    const container =
      codeBlockElement.find(`div.${this.CONTAINER_CLASS_NAME}`) ??
      codeBlockElement.createDiv({
        cls: this.CONTAINER_CLASS_NAME,
      });

    return container;
  }

  onload() {
    this.logger.log('Flowtick block loaded at line:', this.startLine);
    this.renderFlowTickBar();
  }

  onunload() {
    this.logger.log('Flowtick block removed at line:', this.startLine);
    this.onunloadCallback?.(this);
  }

  renderFlowTickBar() {
    if (!this.containerEl) {
      this.logger.log('this.containerEl:');
      this.logger.log(this.containerEl);
      this.logger.log('this.startLine:');
      this.logger.log(this.startLine);
      return;
    }
    const currentProgress = this.getCurrentProgress();

    if (currentProgress === this.progress) {
      return;
    }

    this.progress = currentProgress;

    const color = this.getProgressColor(this.progress);

    const flowtickBarEl =
      this.containerEl.find(`.${FlowTickChild.BAR_CLASS_NAME}`) ??
      this.containerEl.createDiv(FlowTickChild.BAR_CLASS_NAME);

    const flowtickFillEl =
      flowtickBarEl.find(`.${FlowTickChild.FILL_CLASS_NAME}`) ??
      flowtickBarEl.createDiv(FlowTickChild.FILL_CLASS_NAME);

    flowtickFillEl.setAttr(
      'style',
      `width:${currentProgress}%; background:${color};`
    );
  }

  private getStartLineForBlock() {
    const sectionInfo = this.ctx.getSectionInfo(this.containerEl);
    return sectionInfo?.lineStart ?? -1;
  }

  private getEndLineForBlock(): number | undefined {
    const currentSections = this.currentSections;

    const flowtickSections = currentSections
      .filter((section) => this.isFlowTickBlock(section))
      .map((section) => section.position.start.line)
      .sort((a, b) => a - b);

    const currentIndex = flowtickSections.indexOf(this.startLine);
    // if is last block, return undefined
    return flowtickSections[currentIndex + 1];
  }

  private isFlowTickBlock(section: SectionCache) {
    if (section.type !== 'code') {
      return false;
    }
    const startLine = section.position.start.line;
    const lineContent =
      this.currentViewInfo.activeView.editor.getLine(startLine);

    return lineContent
      ?.trim()
      .toLowerCase()
      .startsWith(
        `${FlowTickChild.CODE_BLOCK_PATTERN}${FlowTickChild.CODE_BLOCK_TAG}`
      );
  }

  /**
   * get current progress of checklist items in the range
   *
   * @returns progress - A number between 0 and 100 representing the completion percentage of the checklist items in the specified range.
   */
  private getCurrentProgress(): number {
    const itemsInRange = this.checklistAnalyzer.getListItemsInRange(
      this.startLine,
      this.endLine
    );

    const rate = this.checklistAnalyzer.getCompletionRate(itemsInRange);

    const progress = Math.round(rate * 100);

    this.logger.log(
      `FlowTickChild ${this.id} at line ${this.startLine}->${this.endLine}; progress: ${progress}%`
    );

    return progress;
  }
}

export { FlowTickChild };
