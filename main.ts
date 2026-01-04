import { MarkdownView, Plugin } from 'obsidian';

import { FlowTickChild } from 'src/FlowTickChild';
import {
  DEFAULT_SETTINGS,
  FlowTickSettings,
  FlowTickSettingTab,
} from 'src/settings';
import { useLogger } from 'src/useLogger';

const { logger, setDebug } = useLogger(false, ['log', 'info']);

export default class FlowTick extends Plugin {
  settings: FlowTickSettings;

  /** table to store all flowtick children by view mode and start line */
  flowTickChildTable = {
    source: new Map<number, FlowTickChild>(),
    preview: new Map<number, FlowTickChild>(),
  };

  /** updating flag */
  private updating = false;

  // about logger
  private logger = logger;
  private setDebug = setDebug;

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
    this.logger.log('FlowTick start loading');

    await this.loadSettings();
    this.addSettingTab(new FlowTickSettingTab(this.app, this));

    // Handle ```flowtick``` code blocks
    this.registerMarkdownCodeBlockProcessor(
      'flowtick',
      async (_source, element, ctx) => {
        this.logger.log('in registerMarkdownCodeBlockProcessor');

        // Create or update the current flowtick container
        const container = FlowTickChild.insertFlowTickChildContainer(element);

        const flowtickChild = new FlowTickChild({
          containerEl: container,
          currentViewMode: this.currentViewInfo.mode,
          ctx,
          plugin: this,
          onunloadCallback: (flowTickChild) => {
            const { startLine } = flowTickChild;
            const { mode } = flowTickChild.currentViewInfo;
            this.flowTickChildTable[mode].delete(startLine);
          },
        });

        ctx.addChild(flowtickChild);

        // Register the flowtick container for later updates
        this.registerFlowTickChild(flowtickChild, flowtickChild.startLine);
      }
    );

    this.app.metadataCache.on('changed', async (_file, _data, _cache) => {
      this.logger.log('in changed event');
      await this.updateAllFlowTick();
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.setDebug(this.settings.debug);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.setDebug(this.settings.debug);
  }

  private registerFlowTickChild(
    flowtTickChild: FlowTickChild,
    startLine: number
  ) {
    const currentViewMode = this.currentViewInfo.mode;

    this.flowTickChildTable[currentViewMode].set(startLine, flowtTickChild);
  }

  private async updateAllFlowTick() {
    if (this.updating) {
      return;
    }

    this.updating = true;
    // sleep for the update interval
    await this.updateInterval();

    const { mode } = this.currentViewInfo;

    const flowTickChildren = [...this.flowTickChildTable[mode].values()];
    flowTickChildren.forEach((flowTickChild) => {
      flowTickChild.renderFlowTickBar();
    });

    this.updating = false;
  }

  /** sleep for the update interval */
  private async updateInterval() {
    await sleep(this.settings.tickUpdateInterval);
  }
}
