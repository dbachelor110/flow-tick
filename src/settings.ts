import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface FlowTickSettings {
  refreshInterval: number;
  colorMode: 'default';
}

export const DEFAULT_SETTINGS: FlowTickSettings = {
  refreshInterval: 1000,
  colorMode: 'default',
};

interface FlowTickPlugin extends Plugin {
  settings: FlowTickSettings;
  saveSettings(): Promise<void>;
}

export class FlowTickSettingTab extends PluginSettingTab {
  plugin: FlowTickPlugin;

  constructor(app: App, plugin: FlowTickPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Refresh Interval')
      .setDesc('How often FlowTick progress bars re-render (ms)')
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.refreshInterval))
          .onChange(async (value) => {
            this.plugin.settings.refreshInterval = Number(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Color Mode')
      .setDesc('Default color rule: 1-20 red, 21-99 green, 100 blue')
      .addDropdown((drop) =>
        drop
          .addOption('default', 'Default Color Mode')
          .setValue(this.plugin.settings.colorMode)
          .onChange(async (value) => {
            if (value !== 'default') {
              throw new Error('Unsupported color mode');
            }

            this.plugin.settings.colorMode = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
