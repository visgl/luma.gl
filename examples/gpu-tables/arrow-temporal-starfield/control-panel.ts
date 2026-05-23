// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const RENDER_MODE_SELECTOR_ID = 'arrow-temporal-starfield-render-mode';
const PREPARATION_PATH_ID = 'arrow-temporal-starfield-preparation-path';
const CURRENT_TIMESTAMP_ID = 'arrow-temporal-starfield-current-timestamp';
const TIMESTAMP_ORIGIN_ID = 'arrow-temporal-starfield-timestamp-origin';
const DURATION_ORIGIN_ID = 'arrow-temporal-starfield-duration-origin';
const PULSE_PERIOD_ORIGIN_ID = 'arrow-temporal-starfield-pulse-period-origin';

export type TemporalStarfieldRenderMode = 'attributes' | 'storage';

export type ArrowTemporalStarfieldControlPanelState = {
  renderMode: TemporalStarfieldRenderMode;
  supportsStorage: boolean;
};

export type ArrowTemporalStarfieldControlPanelLabels = {
  preparationPath: string;
  currentTimestamp: string;
  timestampOrigin: string;
  durationOrigin: string;
  pulsePeriodOrigin: string;
};

export type ArrowTemporalStarfieldControlPanelHandlers = {
  onRenderModeChange: (renderMode: TemporalStarfieldRenderMode) => void;
};

export type ArrowTemporalStarfieldControlPanelOptions = {
  initialState: ArrowTemporalStarfieldControlPanelState;
  handlers: ArrowTemporalStarfieldControlPanelHandlers;
};

export class ArrowTemporalStarfieldControlPanel {
  private readonly handlers: ArrowTemporalStarfieldControlPanelHandlers;
  private state: ArrowTemporalStarfieldControlPanelState;
  private renderModeSelector: HTMLSelectElement | null = null;
  private preparationPathLabel: HTMLElement | null = null;
  private currentTimestampLabel: HTMLElement | null = null;
  private timestampOriginLabel: HTMLElement | null = null;
  private durationOriginLabel: HTMLElement | null = null;
  private pulsePeriodOriginLabel: HTMLElement | null = null;

  constructor({initialState, handlers}: ArrowTemporalStarfieldControlPanelOptions) {
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
    this.timestampOriginLabel ??= document.getElementById(TIMESTAMP_ORIGIN_ID);
    this.durationOriginLabel ??= document.getElementById(DURATION_ORIGIN_ID);
    this.pulsePeriodOriginLabel ??= document.getElementById(PULSE_PERIOD_ORIGIN_ID);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.renderModeSelector?.removeEventListener('change', this.handleRenderModeSelection);
    this.renderModeSelector = null;
    this.preparationPathLabel = null;
    this.currentTimestampLabel = null;
    this.timestampOriginLabel = null;
    this.durationOriginLabel = null;
    this.pulsePeriodOriginLabel = null;
  }

  syncControls(state: Partial<ArrowTemporalStarfieldControlPanelState>): void {
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

  setLabels(labels: Partial<ArrowTemporalStarfieldControlPanelLabels>): void {
    setTextContent(this.preparationPathLabel, labels.preparationPath);
    setTextContent(this.currentTimestampLabel, labels.currentTimestamp);
    setTextContent(this.timestampOriginLabel, labels.timestampOrigin);
    setTextContent(this.durationOriginLabel, labels.durationOrigin);
    setTextContent(this.pulsePeriodOriginLabel, labels.pulsePeriodOrigin);
  }

  setCurrentTimestampLabel(label: string): void {
    setTextContent(this.currentTimestampLabel, label);
  }

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
  <code style="white-space: normal; overflow-wrap: anywhere;">positions: FixedSizeList&lt;Float32, 2&gt;</code>
  <span><code>vec2 Float32</code></span>
  <code style="white-space: normal; overflow-wrap: anywhere;">eventStarts: TimestampMillisecond</code>
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

function isTemporalStarfieldRenderMode(
  value: string | undefined
): value is TemporalStarfieldRenderMode {
  return value === 'attributes' || value === 'storage';
}

function setTextContent(element: HTMLElement | null, value: string | undefined): void {
  if (element && value !== undefined) {
    element.textContent = value;
  }
}
