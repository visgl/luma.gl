// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';

const PREPARATION_PATH_ID = 'arrow-time-columns-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-time-columns-current-timestamp';
const DATE_ORIGIN_ID = 'arrow-time-columns-date-origin';
const TIME_ORIGIN_ID = 'arrow-time-columns-time-origin';
const TIMESTAMP_ORIGIN_ID = 'arrow-time-columns-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-time-columns-duration-origin';

export type TimeColumnsRenderMode = 'attributes' | 'storage';

export type ArrowTimeColumnsControlPanelState = {
  renderMode: TimeColumnsRenderMode;
  supportsStorage: boolean;
};

export type ArrowTimeColumnsControlPanelLabels = {
  preparationPath: string;
  currentTimestamp: string;
  dateOrigin: string;
  timeOrigin: string;
  timestampOrigin: string;
  durationOrigin: string;
};

export type ArrowTimeColumnsControlPanelHandlers = {
  onRenderModeChange: (renderMode: TimeColumnsRenderMode) => void;
};

export type ArrowTimeColumnsControlPanelOptions = {
  initialState: ArrowTimeColumnsControlPanelState;
  handlers: ArrowTimeColumnsControlPanelHandlers;
  onRefresh: () => void;
};

export class ArrowTimeColumnsControlPanel {
  private readonly handlers: ArrowTimeColumnsControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowTimeColumnsControlPanelState;
  private labels: Partial<ArrowTimeColumnsControlPanelLabels> = {};
  private rootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh}: ArrowTimeColumnsControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-time-columns-settings',
      schema: makeArrowTimeColumnsSettingsSchema(initialState),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-time-columns-description',
      title: 'Description',
      html: makeArrowTimeColumnsControlPanelHtml(),
      onRender: rootElement => {
        this.rootElement = rootElement;
        this.renderLabels();
        return () => {
          if (this.rootElement === rootElement) {
            this.rootElement = null;
          }
        };
      }
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
    this.rootElement = null;
  }

  syncControls(state: Partial<ArrowTimeColumnsControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(
      makeArrowTimeColumnsSettingsSchema(this.state),
      this.state
    );
    this.onRefresh();
  }

  setLabels(labels: Partial<ArrowTimeColumnsControlPanelLabels>): void {
    this.labels = {...this.labels, ...labels};
    this.renderLabels();
  }

  setCurrentTimestampLabel(label: string): void {
    this.setLabels({currentTimestamp: label});
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.state = settings as ArrowTimeColumnsControlPanelState;
    const renderMode = getChangedSetting(changedSettings, 'renderMode')?.nextValue;
    if (isTimeColumnsRenderMode(renderMode)) {
      this.handlers.onRenderModeChange(renderMode);
    }
  };

  private renderLabels(): void {
    setTextContent(this.rootElement, PREPARATION_PATH_ID, this.labels.preparationPath);
    setTextContent(this.rootElement, CURRENT_TIMESTAMP_ID, this.labels.currentTimestamp);
    setTextContent(this.rootElement, DATE_ORIGIN_ID, this.labels.dateOrigin);
    setTextContent(this.rootElement, TIME_ORIGIN_ID, this.labels.timeOrigin);
    setTextContent(this.rootElement, TIMESTAMP_ORIGIN_ID, this.labels.timestampOrigin);
    setTextContent(this.rootElement, DURATION_ORIGIN_ID, this.labels.durationOrigin);
  }
}

export function makeArrowTimeColumnsSettingsSchema(
  state: ArrowTimeColumnsControlPanelState
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'renderer',
        name: 'Renderer',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'renderMode',
            label: 'Model',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Attributes', value: 'attributes'},
              ...(state.supportsStorage ? [{label: 'Storage', value: 'storage'}] : [])
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowTimeColumnsControlPanelHtml(): string {
  return `\
  <p>Prepares Arrow <code>Date</code>, <code>Time</code>, <code>Timestamp</code>, and <code>Duration</code> columns as relative <code>Float32</code> GPU rows.</p>
  ${makeStatusRow('Prepare', `<strong id="${PREPARATION_PATH_ID}"></strong>`)}
  ${makeStatusRow('Current', `<strong id="${CURRENT_TIMESTAMP_ID}"></strong>`)}
  <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px 10px; margin-top: 12px; font-size: 12px;">
    <strong>Column</strong><strong>Prepared / origin</strong>
    <code>eventDates: DateDay</code><span><code>Float32 day</code><br><span id="${DATE_ORIGIN_ID}"></span></span>
    <code>eventTimes: TimeMillisecond</code><span><code>Float32 millisecond</code><br><span id="${TIME_ORIGIN_ID}"></span></span>
    <code>eventStarts: TimestampMillisecond</code><span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
    <code>eventDurations: DurationMillisecond</code><span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
  </div>
  `;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function isTimeColumnsRenderMode(value: unknown): value is TimeColumnsRenderMode {
  return value === 'attributes' || value === 'storage';
}

function setTextContent(
  rootElement: HTMLElement | null,
  id: string,
  value: string | undefined
): void {
  const element = rootElement?.querySelector<HTMLElement>(`#${id}`);
  if (element && value !== undefined) {
    element.textContent = value;
  }
}
