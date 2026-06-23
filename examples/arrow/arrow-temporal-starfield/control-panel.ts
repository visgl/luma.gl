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
import type {TemporalStarfieldStyleKind} from './arrow-temporal-starfield-data';
import {
  DEFAULT_TEMPORAL_STARFIELD_EVENT_COLOR,
  DEFAULT_TEMPORAL_STARFIELD_STAR_SIZE
} from './arrow-temporal-starfield-renderer';

const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-temporal-starfield-streaming-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-temporal-starfield-streaming-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-temporal-starfield-streaming-status-label';
const PREPARATION_PATH_ID = 'arrow-temporal-starfield-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-temporal-starfield-current-timestamp';
const POSITIONS_COLUMN_ID = 'arrow-temporal-starfield-positions-column';
const EVENT_STARTS_COLUMN_ID = 'arrow-temporal-starfield-event-starts-column';
const STAR_SIZES_COLUMN_ID = 'arrow-temporal-starfield-star-sizes-column';
const EVENT_COLORS_COLUMN_ID = 'arrow-temporal-starfield-event-colors-column';
const TIMESTAMP_ORIGIN_ID = 'arrow-temporal-starfield-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-temporal-starfield-duration-origin';
const PULSE_PERIOD_ORIGIN_ID = 'arrow-temporal-starfield-pulse-period-origin';

export type ArrowTemporalStarfieldControlPanelState = {
  renderMode: 'attributes' | 'storage';
  timeColumn: 'timestamp' | 'xyzm';
  starSizeKind: TemporalStarfieldStyleKind;
  eventColorKind: TemporalStarfieldStyleKind;
  supportsStorage: boolean;
};

export type ArrowTemporalStarfieldControlPanelLabels = {
  preparationPath: string;
  currentTimestamp: string;
  positionsColumn: string;
  eventStartsColumn: string;
  starSizesColumn: string;
  eventColorsColumn: string;
  timestampOrigin: string;
  durationOrigin: string;
  pulsePeriodOrigin: string;
};

export type ArrowTemporalStarfieldControlPanelHandlers = {
  onRenderModeChange: (renderMode: 'attributes' | 'storage') => void;
  onTimeColumnChange: (timeColumn: 'timestamp' | 'xyzm') => void;
  onStarSizeKindChange: (starSizeKind: TemporalStarfieldStyleKind) => void;
  onEventColorKindChange: (eventColorKind: TemporalStarfieldStyleKind) => void;
};

export type ArrowTemporalStarfieldControlPanelOptions = {
  initialState: ArrowTemporalStarfieldControlPanelState;
  handlers: ArrowTemporalStarfieldControlPanelHandlers;
  onRefresh: () => void;
};

export class ArrowTemporalStarfieldControlPanel {
  private readonly handlers: ArrowTemporalStarfieldControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowTemporalStarfieldControlPanelState;
  private labels: Partial<ArrowTemporalStarfieldControlPanelLabels> = {};
  private loadedBatchCount: number | null = null;
  private streamingBatchCount = 0;
  private rootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh}: ArrowTemporalStarfieldControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-temporal-starfield-settings',
      schema: makeArrowTemporalStarfieldSettingsSchema(initialState),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-temporal-starfield-description',
      title: 'Description',
      html: makeArrowTemporalStarfieldControlPanelHtml(),
      onRender: rootElement => {
        this.rootElement = rootElement;
        this.render();
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

  syncControls(state: Partial<ArrowTemporalStarfieldControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(
      makeArrowTemporalStarfieldSettingsSchema(this.state),
      this.state
    );
    this.onRefresh();
  }

  setLabels(labels: Partial<ArrowTemporalStarfieldControlPanelLabels>): void {
    this.labels = {...this.labels, ...labels};
    this.renderLabels();
  }

  setCurrentTimestampLabel(label: string): void {
    this.setLabels({currentTimestamp: label});
  }

  setStreamingBatchStatus(loadedBatchCount: number | null, streamingBatchCount: number): void {
    this.loadedBatchCount = loadedBatchCount;
    this.streamingBatchCount = streamingBatchCount;
    renderStreamingBatchStatus(this.rootElement, loadedBatchCount, streamingBatchCount);
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.state = settings as ArrowTemporalStarfieldControlPanelState;
    const timeColumn = getChangedSetting(changedSettings, 'timeColumn')?.nextValue;
    if (isTemporalStarfieldTimeColumn(timeColumn)) {
      this.handlers.onTimeColumnChange(timeColumn);
    }
    const renderMode = getChangedSetting(changedSettings, 'renderMode')?.nextValue;
    if (isTemporalStarfieldRenderMode(renderMode)) {
      this.handlers.onRenderModeChange(renderMode);
    }
    const starSizeKind = getChangedSetting(changedSettings, 'starSizeKind')?.nextValue;
    if (isTemporalStarfieldStyleKind(starSizeKind)) {
      this.handlers.onStarSizeKindChange(starSizeKind);
    }
    const eventColorKind = getChangedSetting(changedSettings, 'eventColorKind')?.nextValue;
    if (isTemporalStarfieldStyleKind(eventColorKind)) {
      this.handlers.onEventColorKindChange(eventColorKind);
    }
  };

  private render(): void {
    renderStreamingBatchStatus(this.rootElement, this.loadedBatchCount, this.streamingBatchCount);
    this.renderLabels();
  }

  private renderLabels(): void {
    setTextContent(this.rootElement, PREPARATION_PATH_ID, this.labels.preparationPath);
    setTextContent(this.rootElement, CURRENT_TIMESTAMP_ID, this.labels.currentTimestamp);
    setTextContent(this.rootElement, POSITIONS_COLUMN_ID, this.labels.positionsColumn);
    setTextContent(this.rootElement, EVENT_STARTS_COLUMN_ID, this.labels.eventStartsColumn);
    setTextContent(this.rootElement, STAR_SIZES_COLUMN_ID, this.labels.starSizesColumn);
    setTextContent(this.rootElement, EVENT_COLORS_COLUMN_ID, this.labels.eventColorsColumn);
    setTextContent(this.rootElement, TIMESTAMP_ORIGIN_ID, this.labels.timestampOrigin);
    setTextContent(this.rootElement, DURATION_ORIGIN_ID, this.labels.durationOrigin);
    setTextContent(this.rootElement, PULSE_PERIOD_ORIGIN_ID, this.labels.pulsePeriodOrigin);
  }
}

export function makeArrowTemporalStarfieldSettingsSchema(
  state: ArrowTemporalStarfieldControlPanelState
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'data',
        name: 'Data',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'timeColumn',
            label: 'Time',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'timestamp - TimestampMillisecond', value: 'timestamp'},
              {label: 'M coordinate - FixedSizeList<Float32, 4>', value: 'xyzm'}
            ]
          },
          {
            name: 'renderMode',
            label: 'Model',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Attributes', value: 'attributes'},
              ...(state.supportsStorage ? [{label: 'Storage', value: 'storage'}] : [])
            ]
          },
          {
            name: 'starSizeKind',
            label: 'Sizes',
            type: 'select',
            persist: 'none',
            options: [
              {
                label: `Constant Float32 ${DEFAULT_TEMPORAL_STARFIELD_STAR_SIZE}`,
                value: 'constant'
              },
              {label: 'Row - Float32', value: 'column'}
            ]
          },
          {
            name: 'eventColorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {
                label: `Constant RGBA8 [${DEFAULT_TEMPORAL_STARFIELD_EVENT_COLOR.join(', ')}]`,
                value: 'constant'
              },
              {label: 'Row - FixedSizeList<Uint8, 4>', value: 'column'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowTemporalStarfieldControlPanelHtml(): string {
  return `\
  <p>Prepares Arrow <code>Timestamp</code> and <code>Duration</code> columns as relative <code>Float32</code> GPU rows, then uses them as per-star animation inputs.</p>
  ${makeStatusRow('Batches', makeProgressBar())}
  ${makeStatusRow('Prepare', `<strong id="${PREPARATION_PATH_ID}"></strong>`)}
  ${makeStatusRow('Current', `<strong id="${CURRENT_TIMESTAMP_ID}"></strong>`)}
  <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px 10px; margin-top: 12px; font-size: 12px;">
    <strong>Column</strong><strong>Prepared / origin</strong>
    <code id="${POSITIONS_COLUMN_ID}">positions: FixedSizeList&lt;Float32, 2&gt;</code><span><code>vec2 Float32</code></span>
    <code id="${EVENT_STARTS_COLUMN_ID}">eventStarts: TimestampMillisecond</code><span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
    <code>eventDurations: DurationMillisecond</code><span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
    <code>pulsePeriods: DurationMillisecond</code><span><code>Float32 millisecond</code><br><span id="${PULSE_PERIOD_ORIGIN_ID}"></span></span>
    <code id="${STAR_SIZES_COLUMN_ID}">starSizes: Float32</code><span><code>Float32</code></span>
    <code id="${EVENT_COLORS_COLUMN_ID}">eventColors: FixedSizeList&lt;Uint8, 4&gt;</code><span><code>unorm8x4</code></span>
  </div>
  `;
}

function makeProgressBar(): string {
  return `<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" style="display: none; position: relative; height: 24px; overflow: hidden; border: 1px solid #bfdbfe; border-radius: 6px; background: #dbeafe;"><span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #2563eb;"></span><span id="${STREAMING_BATCH_STATUS_LABEL_ID}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700;">Loaded 0 batches</span></div>`;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function renderStreamingBatchStatus(
  rootElement: HTMLElement | null,
  loadedBatchCount: number | null,
  streamingBatchCount: number
): void {
  const statusRow = getElement(rootElement, STREAMING_BATCH_STATUS_ROW_ID);
  const fill = getElement(rootElement, STREAMING_BATCH_FILL_ID);
  const label = getElement(rootElement, STREAMING_BATCH_STATUS_LABEL_ID);
  if (!statusRow || !fill || !label) {
    return;
  }
  if (loadedBatchCount === null) {
    statusRow.style.display = 'none';
    fill.style.width = '0%';
    label.textContent = `Loaded 0 of ${streamingBatchCount} batches`;
    statusRow.setAttribute('aria-valuenow', '0');
    return;
  }
  const safeLoadedBatchCount = Math.min(Math.max(loadedBatchCount, 0), streamingBatchCount);
  statusRow.style.display = 'block';
  statusRow.setAttribute('aria-valuenow', String(safeLoadedBatchCount));
  statusRow.setAttribute('aria-valuemax', String(streamingBatchCount));
  fill.style.width = `${getStreamingBatchProgressPercent(safeLoadedBatchCount, streamingBatchCount)}%`;
  label.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
}

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  return streamingBatchCount <= 0 ? 0 : (loadedBatchCount / streamingBatchCount) * 100;
}

function isTemporalStarfieldRenderMode(value: unknown): value is 'attributes' | 'storage' {
  return value === 'attributes' || value === 'storage';
}

function isTemporalStarfieldTimeColumn(value: unknown): value is 'timestamp' | 'xyzm' {
  return value === 'timestamp' || value === 'xyzm';
}

function isTemporalStarfieldStyleKind(value: unknown): value is TemporalStarfieldStyleKind {
  return value === 'constant' || value === 'column';
}

function setTextContent(
  rootElement: HTMLElement | null,
  id: string,
  value: string | undefined
): void {
  const element = getElement(rootElement, id);
  if (element && value !== undefined) {
    element.textContent = value;
  }
}

function getElement(rootElement: HTMLElement | null, id: string): HTMLElement | null {
  return rootElement?.querySelector<HTMLElement>(`#${id}`) ?? null;
}
