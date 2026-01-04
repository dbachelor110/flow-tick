import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface FlowTickSettings {
  tickUpdateInterval: number;
  colorMode: 'default';
  debug: boolean;
}

const DEFAULT_SETTINGS: FlowTickSettings = {
  tickUpdateInterval: 1000,
  colorMode: 'default',
  debug: false,
};

interface FlowTickPlugin extends Plugin {
  settings: FlowTickSettings;
  saveSettings(): Promise<void>;
}

class FlowTickSettingTab extends PluginSettingTab {
  plugin: FlowTickPlugin;

  constructor(app: App, plugin: FlowTickPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Tick update interval')
      .setDesc('How often flow tick progress bars re-render (ms)')
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.tickUpdateInterval))
          .onChange(async (value) => {
            this.plugin.settings.tickUpdateInterval = Number(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Color mode')
      .setDesc('Default color rule: 1-20 red, 21-99 green, 100 blue')
      .addDropdown((drop) =>
        drop
          .addOption('default', 'Default color mode')
          .setValue(this.plugin.settings.colorMode)
          .onChange(async (value) => {
            if (value !== 'default') {
              throw new Error('Unsupported color mode');
            }

            this.plugin.settings.colorMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Debug mode')
      .setDesc('Enable or disable debug logging')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debug).onChange(async (value) => {
          this.plugin.settings.debug = value;
          await this.plugin.saveSettings();
        })
      );
  }
}

export type { FlowTickSettings };

export { DEFAULT_SETTINGS, FlowTickSettingTab };
