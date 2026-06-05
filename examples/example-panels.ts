// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CustomPanel,
  PanelThemeScope,
  SettingsManager,
  SettingsPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsManagerLocalStorageConfig,
  type SettingsManagerOnChange,
  type SettingsSchema,
  type SettingDescriptor,
  type SettingValue,
  type SettingsState
} from '@deck.gl-community/panels';
import {h, render} from 'preact';

const EXAMPLE_PANEL_HOST_ID = 'example-panel-host';
const EXAMPLE_SETTINGS_PANEL_ATTRIBUTE = 'data-example-settings-panel';
const MODEL_SETTING_NAMES = new Set(['modelKind', 'renderMode']);
const EXAMPLE_PANEL_STYLE = `
[data-example-panel-host] [aria-hidden='true'] {
  display: none !important;
}
[${EXAMPLE_SETTINGS_PANEL_ATTRIBUTE}] [data-setting-row-for] > label,
[${EXAMPLE_SETTINGS_PANEL_ATTRIBUTE}] [data-setting-row-for] button,
[${EXAMPLE_SETTINGS_PANEL_ATTRIBUTE}] [data-setting-row-for] input[type='number'],
[${EXAMPLE_SETTINGS_PANEL_ATTRIBUTE}] [data-setting-row-for] input[type='text'],
[id^='settings-panel-input-'][role='listbox'] > button[role='option'] {
  font-size: 15px !important;
}
`;

export type ExampleCustomPanelRenderer = (rootElement: HTMLElement) => void | (() => void);

export type ExampleSettingsPanelProps = {
  id: string;
  label?: string;
  schema: SettingsSchema;
  settings: SettingsState;
  onSettingsChange?: SettingsManagerOnChange;
  localStorageConfig?: SettingsManagerLocalStorageConfig;
};

/** Returns the InfoBox host used by panel-backed example content. */
export function makeExamplePanelHostHtml(hostId = EXAMPLE_PANEL_HOST_ID): string {
  return `<div id="${hostId}" data-example-panel-host=""></div>`;
}

/** Renders panel content directly inside an existing InfoBox host. */
export function renderExamplePanel(hostElement: HTMLElement, panel: Panel | null): void {
  render(
    panel ? h(PanelThemeScope, {panel}, h('style', {}, EXAMPLE_PANEL_STYLE), panel.content) : null,
    hostElement
  );
}

export function makeHtmlCustomPanel({
  id,
  title,
  html,
  onRender
}: {
  id: string;
  title: string;
  html: string;
  onRender?: ExampleCustomPanelRenderer;
}): Panel {
  return new CustomPanel({
    id,
    title,
    onRenderHTML: rootElement => {
      rootElement.innerHTML = html;
      const cleanup = onRender?.(rootElement);
      return () => {
        if (cleanup) {
          cleanup();
        }
        rootElement.replaceChildren();
      };
    }
  });
}

/** Owns one panel-backed InfoBox surface for an example. */
export class ExamplePanelManager {
  private readonly hostId: string;
  private panel: Panel;
  private hostElement: HTMLElement | null = null;

  constructor({
    panel,
    hostId = EXAMPLE_PANEL_HOST_ID
  }: {
    panel: Panel;
    hostId?: string;
  }) {
    this.panel = panel;
    this.hostId = hostId;
  }

  mount(): void {
    if (this.hostElement || typeof document === 'undefined') {
      return;
    }

    const hostElement = document.getElementById(this.hostId);
    if (!(hostElement instanceof HTMLElement)) {
      return;
    }

    this.hostElement = hostElement;
    configurePanelHostElement(hostElement);
    this.render();
  }

  setPanel(panel: Panel): void {
    this.panel = panel;
    this.render();
  }

  refresh(): void {
    this.render();
  }

  finalize(): void {
    if (this.hostElement) {
      renderExamplePanel(this.hostElement, null);
    }
    this.hostElement = null;
  }

  private render(): void {
    if (!this.hostElement) {
      return;
    }
    renderExamplePanel(this.hostElement, this.panel);
  }
}

/** Owns one schema-driven settings surface and its structured change manager. */
export class ExampleSettingsPanelManager {
  private readonly id: string;
  private readonly label: string;
  private readonly settingsManager = new SettingsManager();
  private readonly unsubscribe: () => void;
  private schema: SettingsSchema;
  private settings: SettingsState;

  constructor({
    id,
    label = 'Settings',
    schema,
    settings,
    onSettingsChange,
    localStorageConfig
  }: ExampleSettingsPanelProps) {
    this.id = id;
    this.label = label;
    this.schema = schema;
    this.settings = settings;
    this.settingsManager.setLocalStoragePersistence(localStorageConfig);
    this.setSchemaAndSettings(schema, settings);
    this.unsubscribe = this.settingsManager.setOnSettingsChange((nextSettings, changedSettings) => {
      this.settings = nextSettings;
      onSettingsChange?.(nextSettings, changedSettings);
    });
  }

  getSettingsWithLocalStorage(settings: SettingsState): SettingsState {
    return this.settingsManager.getSettingsWithLocalStorage(settings);
  }

  setSchemaAndSettings(schema: SettingsSchema, settings: SettingsState): void {
    this.schema = schema;
    this.settings = settings;
    this.settingsManager.setSettingDefinitions(getSettingDefinitions(schema));
    this.settingsManager.setCurrentSettings(settings);
  }

  setSettings(settings: SettingsState): void {
    this.settings = settings;
    this.settingsManager.setCurrentSettings(settings);
  }

  setSettingsFromPanel(settings: SettingsState): void {
    this.settingsManager.setSettings(settings);
  }

  setSettingValue(settingName: string, settingValue: SettingValue): void {
    this.settingsManager.setSettingValue(settingName, settingValue);
  }

  makePanel(): Panel {
    const [settingsPanel] = SettingsPanel.createSectionPanels({
      label: this.label,
      schema: makeInlineSettingsSchema(this.schema),
      settings: this.settings,
      onSettingsChange: nextSettings => this.setSettingsFromPanel(nextSettings)
    });
    if (!settingsPanel) {
      return makeExampleSettingsPanel(
        new SettingsPanel({
          id: this.id,
          label: this.label,
          schema: makeInlineSettingsSchema(this.schema),
          settings: this.settings,
          onSettingsChange: nextSettings => this.setSettingsFromPanel(nextSettings)
        })
      );
    }
    return makeExampleSettingsPanel({
      ...settingsPanel,
      id: this.id,
      title: this.schema.title ?? this.label
    });
  }

  finalize(): void {
    this.unsubscribe();
  }
}

export function getSettingDefinitions(schema: SettingsSchema): Map<string, SettingDescriptor> {
  const settingDefinitions = new Map<string, SettingDescriptor>();
  for (const section of schema.sections) {
    for (const setting of section.settings) {
      settingDefinitions.set(setting.name, setting);
    }
  }
  return settingDefinitions;
}

export function makeInlineSettingsSchema(schema: SettingsSchema): SettingsSchema {
  const settings = schema.sections.flatMap(section => section.settings);
  return {
    title: schema.title,
    sections: [
      {
        id: 'settings',
        name: '',
        initiallyCollapsed: false,
        settings: [
          ...settings.filter(setting => MODEL_SETTING_NAMES.has(setting.name)),
          ...settings.filter(setting => !MODEL_SETTING_NAMES.has(setting.name))
        ]
      }
    ]
  };
}

function makeExampleSettingsPanel(panel: Panel): Panel {
  return {
    ...panel,
    content: h('div', {[EXAMPLE_SETTINGS_PANEL_ATTRIBUTE]: ''}, panel.content)
  };
}

export function getChangedSetting(
  changedSettings: readonly SettingsChangeDescriptor[] | undefined,
  settingName: string
): SettingsChangeDescriptor | undefined {
  return changedSettings?.find(changedSetting => changedSetting.name === settingName);
}

export function configurePanelHostElement(hostElement: HTMLElement): void {
  hostElement.style.minWidth = '0';
  hostElement.style.width = '100%';
  hostElement.style.setProperty('--menu-backdrop-filter', 'unset');
  hostElement.style.setProperty('--menu-background', 'transparent');
  hostElement.style.setProperty('--menu-border', 'none');
  hostElement.style.setProperty('--menu-shadow', 'none');
}
