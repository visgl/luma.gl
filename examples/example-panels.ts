// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CustomPanel,
  PanelBox,
  PanelManager,
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

const EXAMPLE_PANEL_HOST_ID = 'example-panel-host';
const EXAMPLE_PANEL_BOX_ID = 'example-panel-box';
const EXAMPLE_PANEL_BOX_WIDTH_PX = 388;

export type ExampleCustomPanelRenderer = (rootElement: HTMLElement) => void | (() => void);

export type ExampleSettingsPanelProps = {
  id: string;
  label?: string;
  schema: SettingsSchema;
  settings: SettingsState;
  onSettingsChange?: SettingsManagerOnChange;
  localStorageConfig?: SettingsManagerLocalStorageConfig;
};

/** Returns the InfoBox host used by panel-managed example content. */
export function makeExamplePanelHostHtml(hostId = EXAMPLE_PANEL_HOST_ID): string {
  return `<div id="${hostId}" data-example-panel-host=""></div>`;
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
        cleanup?.();
        rootElement.replaceChildren();
      };
    }
  });
}

/** Owns one panel-managed InfoBox surface for an example. */
export class ExamplePanelManager {
  private readonly hostId: string;
  private readonly panelBoxId: string;
  private readonly widthPx: number;
  private panel: Panel;
  private hostElement: HTMLElement | null = null;
  private panelManager: PanelManager | null = null;

  constructor({
    panel,
    hostId = EXAMPLE_PANEL_HOST_ID,
    panelBoxId = EXAMPLE_PANEL_BOX_ID,
    widthPx = EXAMPLE_PANEL_BOX_WIDTH_PX
  }: {
    panel: Panel;
    hostId?: string;
    panelBoxId?: string;
    widthPx?: number;
  }) {
    this.panel = panel;
    this.hostId = hostId;
    this.panelBoxId = panelBoxId;
    this.widthPx = widthPx;
  }

  mount(): void {
    if (this.panelManager || typeof document === 'undefined') {
      return;
    }

    const hostElement = document.getElementById(this.hostId);
    if (!(hostElement instanceof HTMLElement)) {
      return;
    }

    this.hostElement = hostElement;
    configurePanelHostElement(hostElement);
    this.panelManager = new PanelManager({parentElement: hostElement});
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
    this.panelManager?.finalize();
    this.panelManager = null;
    this.hostElement = null;
  }

  private render(): void {
    if (!this.panelManager || !this.hostElement) {
      return;
    }

    this.panelManager.setProps({
      components: [
        new PanelBox({
          id: this.panelBoxId,
          _container: this.hostElement as HTMLDivElement,
          widthPx: this.widthPx,
          collapsible: false,
          panel: this.panel
        })
      ]
    });
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
    return new SettingsPanel({
      id: this.id,
      label: this.label,
      schema: this.schema,
      settings: this.settings,
      onSettingsChange: nextSettings => this.setSettingsFromPanel(nextSettings)
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

export function getChangedSetting(
  changedSettings: readonly SettingsChangeDescriptor[] | undefined,
  settingName: string
): SettingsChangeDescriptor | undefined {
  return changedSettings?.find(changedSetting => changedSetting.name === settingName);
}

export function configurePanelHostElement(hostElement: HTMLElement): void {
  hostElement.style.minWidth = '0';
  hostElement.style.setProperty('--menu-backdrop-filter', 'unset');
  hostElement.style.setProperty('--menu-background', 'transparent');
  hostElement.style.setProperty('--menu-border', 'none');
  hostElement.style.setProperty('--menu-shadow', 'none');
}
