// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const RENDER_MODE_SELECTOR_ID = 'arrow-time-columns-render-mode';
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
};

export class ArrowTimeColumnsControlPanel {
  private readonly handlers: ArrowTimeColumnsControlPanelHandlers;
  private state: ArrowTimeColumnsControlPanelState;
  private renderModeSelector: HTMLSelectElement | null = null;
  private preparationPathLabel: HTMLElement | null = null;
  private currentTimestampLabel: HTMLElement | null = null;
  private dateOriginLabel: HTMLElement | null = null;
  private timeOriginLabel: HTMLElement | null = null;
  private timestampOriginLabel: HTMLElement | null = null;
  private durationOriginLabel: HTMLElement | null = null;

  constructor({initialState, handlers}: ArrowTimeColumnsControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    if (!this.renderModeSelector) {
      this.renderModeSelector = document.getElementById(
        RENDER_MODE_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.renderModeSelector?.addEventListener('change', this.handleRenderModeSelection);
    }

    this.preparationPathLabel ??= document.getElementById(PREPARATION_PATH_ID);
    this.currentTimestampLabel ??= document.getElementById(CURRENT_TIMESTAMP_ID);
    this.dateOriginLabel ??= document.getElementById(DATE_ORIGIN_ID);
    this.timeOriginLabel ??= document.getElementById(TIME_ORIGIN_ID);
    this.timestampOriginLabel ??= document.getElementById(TIMESTAMP_ORIGIN_ID);
    this.durationOriginLabel ??= document.getElementById(DURATION_ORIGIN_ID);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.renderModeSelector?.removeEventListener('change', this.handleRenderModeSelection);
    this.renderModeSelector = null;
    this.preparationPathLabel = null;
    this.currentTimestampLabel = null;
    this.dateOriginLabel = null;
    this.timeOriginLabel = null;
    this.timestampOriginLabel = null;
    this.durationOriginLabel = null;
  }

  syncControls(state: Partial<ArrowTimeColumnsControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (!this.renderModeSelector) {
      return;
    }

    this.renderModeSelector.value = this.state.renderMode;
    this.renderModeSelector.disabled = !this.state.supportsStorage;
    const storageOption = this.renderModeSelector.querySelector(
      'option[value="storage"]'
    ) as HTMLOptionElement | null;
    if (storageOption) {
      storageOption.disabled = !this.state.supportsStorage;
    }
  }

  setLabels(labels: Partial<ArrowTimeColumnsControlPanelLabels>): void {
    setTextContent(this.preparationPathLabel, labels.preparationPath);
    setTextContent(this.currentTimestampLabel, labels.currentTimestamp);
    setTextContent(this.dateOriginLabel, labels.dateOrigin);
    setTextContent(this.timeOriginLabel, labels.timeOrigin);
    setTextContent(this.timestampOriginLabel, labels.timestampOrigin);
    setTextContent(this.durationOriginLabel, labels.durationOrigin);
  }

  setCurrentTimestampLabel(label: string): void {
    setTextContent(this.currentTimestampLabel, label);
  }

  private readonly handleRenderModeSelection = (): void => {
    const requestedRenderMode = this.renderModeSelector?.value;
    if (!isTimeColumnsRenderMode(requestedRenderMode)) {
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

export function makeArrowTimeColumnsControlPanelHtml(): string {
  return `
<p>Prepares Arrow <code>Date</code>, <code>Time</code>, <code>Timestamp</code>, and <code>Duration</code> columns as relative <code>Float32</code> GPU rows.</p>
<div style="display: grid; grid-template-columns: auto 1fr; gap: 0.3rem 0.7rem; align-items: center;">
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
<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.35rem 0.7rem; margin-top: 0.65rem; font-size: 0.78rem;">
  <strong>Column</strong>
  <strong>Prepared / origin</strong>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDates: DateDay</code>
  <span><code>Float32 day</code><br><span id="${DATE_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventTimes: TimeMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIME_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventStarts: TimestampMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${TIMESTAMP_ORIGIN_ID}"></span></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventDurations: DurationMillisecond</code>
  <span><code>Float32 millisecond</code><br><span id="${DURATION_ORIGIN_ID}"></span></span>
</div>
`;
}

function isTimeColumnsRenderMode(value: string | undefined): value is TimeColumnsRenderMode {
  return value === 'attributes' || value === 'storage';
}

function setTextContent(element: HTMLElement | null, value: string | undefined): void {
  if (element && value !== undefined) {
    element.textContent = value;
  }
}
