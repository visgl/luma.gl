// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const RENDER_MODE_SELECTOR_ID = 'arrow-temporal-starfield-render-mode';
const INPUT_KIND_SELECTOR_ID = 'arrow-temporal-starfield-input-kind';
const TIME_COLUMN_SELECTOR_ID = 'arrow-temporal-starfield-time-column';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-temporal-starfield-streaming-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-temporal-starfield-streaming-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-temporal-starfield-streaming-status-label';
const PREPARATION_PATH_ID = 'arrow-temporal-starfield-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-temporal-starfield-current-timestamp';
const POSITIONS_COLUMN_ID = 'arrow-temporal-starfield-positions-column';
const EVENT_STARTS_COLUMN_ID = 'arrow-temporal-starfield-event-starts-column';
const TIMESTAMP_ORIGIN_ID = 'arrow-temporal-starfield-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-temporal-starfield-duration-origin';
const PULSE_PERIOD_ORIGIN_ID = 'arrow-temporal-starfield-pulse-period-origin';

export type ArrowTemporalStarfieldControlPanelState = {
  inputKind: 'eager' | 'streaming';
  renderMode: 'attributes' | 'storage';
  timeColumn: 'timestamp' | 'xyzm';
  supportsStorage: boolean;
};

export type ArrowTemporalStarfieldControlPanelLabels = {
  preparationPath: string;
  currentTimestamp: string;
  positionsColumn: string;
  eventStartsColumn: string;
  timestampOrigin: string;
  durationOrigin: string;
  pulsePeriodOrigin: string;
};

export type ArrowTemporalStarfieldControlPanelHandlers = {
  onInputKindChange: (inputKind: 'eager' | 'streaming') => void;
  onRenderModeChange: (renderMode: 'attributes' | 'storage') => void;
  onTimeColumnChange: (timeColumn: 'timestamp' | 'xyzm') => void;
};

export type ArrowTemporalStarfieldControlPanelOptions = {
  initialState: ArrowTemporalStarfieldControlPanelState;
  handlers: ArrowTemporalStarfieldControlPanelHandlers;
};

export class ArrowTemporalStarfieldControlPanel {
  private readonly handlers: ArrowTemporalStarfieldControlPanelHandlers;
  private state: ArrowTemporalStarfieldControlPanelState;
  private inputKindSelector: HTMLSelectElement | null = null;
  private renderModeSelector: HTMLSelectElement | null = null;
  private timeColumnSelector: HTMLSelectElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;
  private preparationPathLabel: HTMLElement | null = null;
  private currentTimestampLabel: HTMLElement | null = null;
  private positionsColumnLabel: HTMLElement | null = null;
  private eventStartsColumnLabel: HTMLElement | null = null;
  private timestampOriginLabel: HTMLElement | null = null;
  private durationOriginLabel: HTMLElement | null = null;
  private pulsePeriodOriginLabel: HTMLElement | null = null;

  constructor({initialState, handlers}: ArrowTemporalStarfieldControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    if (!this.inputKindSelector) {
      this.inputKindSelector = document.getElementById(
        INPUT_KIND_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.inputKindSelector?.addEventListener('change', this.handleInputKindSelection);
    }

    if (!this.renderModeSelector) {
      this.renderModeSelector = document.getElementById(
        RENDER_MODE_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.renderModeSelector?.addEventListener('change', this.handleRenderModeSelection);
    }

    if (!this.timeColumnSelector) {
      this.timeColumnSelector = document.getElementById(
        TIME_COLUMN_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.timeColumnSelector?.addEventListener('change', this.handleTimeColumnSelection);
    }

    this.streamingBatchStatusRow ??= document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill ??= document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel ??= document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
    this.preparationPathLabel ??= document.getElementById(PREPARATION_PATH_ID);
    this.currentTimestampLabel ??= document.getElementById(CURRENT_TIMESTAMP_ID);
    this.positionsColumnLabel ??= document.getElementById(POSITIONS_COLUMN_ID);
    this.eventStartsColumnLabel ??= document.getElementById(EVENT_STARTS_COLUMN_ID);
    this.timestampOriginLabel ??= document.getElementById(TIMESTAMP_ORIGIN_ID);
    this.durationOriginLabel ??= document.getElementById(DURATION_ORIGIN_ID);
    this.pulsePeriodOriginLabel ??= document.getElementById(PULSE_PERIOD_ORIGIN_ID);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.inputKindSelector?.removeEventListener('change', this.handleInputKindSelection);
    this.renderModeSelector?.removeEventListener('change', this.handleRenderModeSelection);
    this.timeColumnSelector?.removeEventListener('change', this.handleTimeColumnSelection);
    this.inputKindSelector = null;
    this.renderModeSelector = null;
    this.timeColumnSelector = null;
    this.streamingBatchStatusRow = null;
    this.streamingBatchFill = null;
    this.streamingBatchStatusLabel = null;
    this.preparationPathLabel = null;
    this.currentTimestampLabel = null;
    this.positionsColumnLabel = null;
    this.eventStartsColumnLabel = null;
    this.timestampOriginLabel = null;
    this.durationOriginLabel = null;
    this.pulsePeriodOriginLabel = null;
  }

  syncControls(state: Partial<ArrowTemporalStarfieldControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.inputKindSelector) {
      this.inputKindSelector.value = this.state.inputKind;
    }

    if (this.timeColumnSelector) {
      this.timeColumnSelector.value = this.state.timeColumn;
    }

    if (this.renderModeSelector) {
      this.renderModeSelector.value = this.state.renderMode;
      this.renderModeSelector.disabled = !this.state.supportsStorage;
      const storageOption = this.renderModeSelector.querySelector(
        'option[value="storage"]'
      ) as HTMLOptionElement | null;
      if (storageOption) {
        storageOption.disabled = !this.state.supportsStorage;
      }
    }
  }

  setLabels(labels: Partial<ArrowTemporalStarfieldControlPanelLabels>): void {
    setTextContent(this.preparationPathLabel, labels.preparationPath);
    setTextContent(this.currentTimestampLabel, labels.currentTimestamp);
    setTextContent(this.positionsColumnLabel, labels.positionsColumn);
    setTextContent(this.eventStartsColumnLabel, labels.eventStartsColumn);
    setTextContent(this.timestampOriginLabel, labels.timestampOrigin);
    setTextContent(this.durationOriginLabel, labels.durationOrigin);
    setTextContent(this.pulsePeriodOriginLabel, labels.pulsePeriodOrigin);
  }

  setCurrentTimestampLabel(label: string): void {
    setTextContent(this.currentTimestampLabel, label);
  }

  setStreamingBatchStatus(loadedBatchCount: number | null, streamingBatchCount: number): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchFill ||
      !this.streamingBatchStatusLabel
    ) {
      return;
    }

    if (loadedBatchCount === null) {
      this.streamingBatchStatusRow.style.display = 'none';
      this.streamingBatchFill.style.width = '0%';
      this.streamingBatchStatusLabel.textContent = `Loaded 0 of ${streamingBatchCount} batches`;
      this.streamingBatchStatusRow.setAttribute('aria-valuenow', '0');
      return;
    }

    const safeLoadedBatchCount = Math.min(Math.max(loadedBatchCount, 0), streamingBatchCount);
    const progressPercent = getStreamingBatchProgressPercent(
      safeLoadedBatchCount,
      streamingBatchCount
    );
    this.streamingBatchStatusRow.style.display = 'block';
    this.streamingBatchStatusRow.setAttribute('aria-valuenow', String(safeLoadedBatchCount));
    this.streamingBatchStatusRow.setAttribute('aria-valuemax', String(streamingBatchCount));
    this.streamingBatchFill.style.width = `${progressPercent}%`;
    this.streamingBatchStatusLabel.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
  }

  private readonly handleInputKindSelection = (): void => {
    const requestedInputKind = this.inputKindSelector?.value;
    if (!isTemporalStarfieldInputKind(requestedInputKind)) {
      return;
    }
    this.syncControls({inputKind: requestedInputKind});
    this.handlers.onInputKindChange(requestedInputKind);
  };

  private readonly handleTimeColumnSelection = (): void => {
    const requestedTimeColumn = this.timeColumnSelector?.value;
    if (!isTemporalStarfieldTimeColumn(requestedTimeColumn)) {
      return;
    }
    this.syncControls({timeColumn: requestedTimeColumn});
    this.handlers.onTimeColumnChange(requestedTimeColumn);
  };

  private readonly handleRenderModeSelection = (): void => {
    const requestedRenderMode = this.renderModeSelector?.value;
    if (!isTemporalStarfieldRenderMode(requestedRenderMode)) {
      return;
    }
    const renderMode =
      requestedRenderMode === 'storage' && !this.state.supportsStorage
        ? 'attributes'
        : requestedRenderMode;
    this.syncControls({renderMode});
    this.handlers.onRenderModeChange(renderMode);
  };
}

export function makeArrowTemporalStarfieldControlPanelHtml(): string {
  return `
<p>Prepares Arrow <code>Timestamp</code> and <code>Duration</code> columns as relative <code>Float32</code> GPU rows, then uses them as per-star animation inputs.</p>
<div style="display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.7rem; align-items: center;">
  <label for="${INPUT_KIND_SELECTOR_ID}">Input</label>
  <select id="${INPUT_KIND_SELECTOR_ID}">
    <option value="eager">Arrow table</option>
    <option value="streaming">RecordBatch stream</option>
  </select>
  <label for="${TIME_COLUMN_SELECTOR_ID}">Time</label>
  <select id="${TIME_COLUMN_SELECTOR_ID}">
    <option value="timestamp">timestamp - TimestampMillisecond</option>
    <option value="xyzm">M coordinate - FixedSizeList&lt;Float32, 4&gt;</option>
  </select>
  <label for="${RENDER_MODE_SELECTOR_ID}">Render</label>
  <select id="${RENDER_MODE_SELECTOR_ID}">
    <option value="attributes">Attributes</option>
    <option value="storage">Storage</option>
  </select>
  <span>Prepare</span>
  <strong id="${PREPARATION_PATH_ID}"></strong>
  <span>Current</span>
  <strong id="${CURRENT_TIMESTAMP_ID}"></strong>
</div>
<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" style="display: none; position: relative; width: 100%; height: 1.6rem; margin-top: 0.65rem; overflow: hidden; border: 1px solid rgba(125, 211, 252, 0.42); border-radius: 0.45rem; background: rgba(15, 23, 42, 0.22); color: #e0f2fe;">
  <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, rgba(14, 165, 233, 0.72) 0%, rgba(125, 211, 252, 0.92) 100%); transition: width 220ms ease;"></span>
  <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 0.5rem; color: #f8fafc; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 batches</span>
</div>
<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.35rem 0.7rem; margin-top: 0.65rem; font-size: 0.78rem;">
  <strong>Column</strong>
  <strong>Prepared / origin</strong>
  <code id="${POSITIONS_COLUMN_ID}" style="white-space: normal; overflow-wrap: anywhere;">positions: FixedSizeList&lt;Float32, 2&gt;</code>
  <span><code>vec2 Float32</code></span>
  <code id="${EVENT_STARTS_COLUMN_ID}" style="white-space: normal; overflow-wrap: anywhere;">eventStarts: TimestampMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDurations: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">pulsePeriods: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${PULSE_PERIOD_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventColors: FixedSizeList&lt;Uint8, 4&gt;</code>
  <span><code>vec4 Uint8</code></span>
</div>
`;
}

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  if (streamingBatchCount <= 0) {
    return 0;
  }
  return (loadedBatchCount / streamingBatchCount) * 100;
}

function isTemporalStarfieldInputKind(value: string | undefined): value is 'eager' | 'streaming' {
  return value === 'eager' || value === 'streaming';
}

function isTemporalStarfieldRenderMode(
  value: string | undefined
): value is 'attributes' | 'storage' {
  return value === 'attributes' || value === 'storage';
}

function isTemporalStarfieldTimeColumn(value: string | undefined): value is 'timestamp' | 'xyzm' {
  return value === 'timestamp' || value === 'xyzm';
}

function setTextContent(element: HTMLElement | null, value: string | undefined): void {
  if (element && value !== undefined) {
    element.textContent = value;
  }
}
