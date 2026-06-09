// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {COORDINATE_MAGNITUDES, type CoordinateMagnitudeKind} from './arrow-float64-precision-data';
import type {
  ArrowFloat64PrecisionMetrics,
  ArrowFloat64PrecisionViewState
} from './arrow-float64-precision-renderer';

const MAGNITUDE_SELECT_ID = 'arrow-float64-precision-magnitude';
const ZOOM_RANGE_ID = 'arrow-float64-precision-zoom';
const ZOOM_LABEL_ID = 'arrow-float64-precision-zoom-label';
const PAN_LEFT_ID = 'arrow-float64-precision-pan-left';
const PAN_RIGHT_ID = 'arrow-float64-precision-pan-right';
const PAN_UP_ID = 'arrow-float64-precision-pan-up';
const PAN_DOWN_ID = 'arrow-float64-precision-pan-down';
const RESET_VIEW_ID = 'arrow-float64-precision-reset';
const PATH_COUNT_ID = 'arrow-float64-precision-path-count';
const SEGMENT_COUNT_ID = 'arrow-float64-precision-segment-count';
const FLOAT64_ARROW_BYTES_ID = 'arrow-float64-precision-float64-arrow-bytes';
const FLOAT32_ARROW_BYTES_ID = 'arrow-float64-precision-float32-arrow-bytes';
const STYLE_ARROW_BYTES_ID = 'arrow-float64-precision-style-arrow-bytes';
const FLOAT64_GPU_BYTES_ID = 'arrow-float64-precision-float64-gpu-bytes';
const FLOAT32_GPU_BYTES_ID = 'arrow-float64-precision-float32-gpu-bytes';
const FLOAT64_CONVERSION_TIME_ID = 'arrow-float64-precision-float64-conversion-time';
const FLOAT32_CONVERSION_TIME_ID = 'arrow-float64-precision-float32-conversion-time';
const FLOAT32_ERROR_ID = 'arrow-float64-precision-float32-error';
const PAN_LABEL_ID = 'arrow-float64-precision-pan-label';
const LOADING_ID = 'arrow-float64-precision-loading';

export type ArrowFloat64PrecisionControlPanelProps = {
  initialState: ArrowFloat64PrecisionControlPanelState;
  handlers: {
    onCoordinateMagnitudeKindChange: (kind: CoordinateMagnitudeKind) => void;
    onZoomChange: (zoom: number) => void;
    onPanChange: (delta: [number, number]) => void;
    onResetView: () => void;
  };
};

export type ArrowFloat64PrecisionControlPanelState = ArrowFloat64PrecisionViewState & {
  coordinateMagnitudeKind: CoordinateMagnitudeKind;
};

export class ArrowFloat64PrecisionControlPanel {
  private readonly props: ArrowFloat64PrecisionControlPanelProps;
  private magnitudeSelect: HTMLSelectElement | null = null;
  private zoomRange: HTMLInputElement | null = null;
  private zoomLabel: HTMLElement | null = null;
  private panLabel: HTMLElement | null = null;
  private loadingLabel: HTMLElement | null = null;

  constructor(props: ArrowFloat64PrecisionControlPanelProps) {
    this.props = props;
  }

  initialize(): void {
    this.magnitudeSelect = getElement<HTMLSelectElement>(MAGNITUDE_SELECT_ID);
    this.zoomRange = getElement<HTMLInputElement>(ZOOM_RANGE_ID);
    this.zoomLabel = document.getElementById(ZOOM_LABEL_ID);
    this.panLabel = document.getElementById(PAN_LABEL_ID);
    this.loadingLabel = document.getElementById(LOADING_ID);

    if (this.magnitudeSelect) {
      this.magnitudeSelect.onchange = () => {
        const nextKind = this.magnitudeSelect?.value;
        if (isCoordinateMagnitudeKind(nextKind)) {
          this.props.handlers.onCoordinateMagnitudeKindChange(nextKind);
        }
      };
    }
    if (this.zoomRange) {
      this.zoomRange.oninput = () => {
        this.props.handlers.onZoomChange(Number(this.zoomRange?.value ?? 1));
      };
    }
    setButtonHandler(PAN_LEFT_ID, () => this.props.handlers.onPanChange([-42, 0]));
    setButtonHandler(PAN_RIGHT_ID, () => this.props.handlers.onPanChange([42, 0]));
    setButtonHandler(PAN_UP_ID, () => this.props.handlers.onPanChange([0, 42]));
    setButtonHandler(PAN_DOWN_ID, () => this.props.handlers.onPanChange([0, -42]));
    setButtonHandler(RESET_VIEW_ID, () => this.props.handlers.onResetView());
    this.syncControls(this.props.initialState);
  }

  destroy(): void {
    if (this.magnitudeSelect) {
      this.magnitudeSelect.onchange = null;
    }
    if (this.zoomRange) {
      this.zoomRange.oninput = null;
    }
    for (const id of [PAN_LEFT_ID, PAN_RIGHT_ID, PAN_UP_ID, PAN_DOWN_ID, RESET_VIEW_ID]) {
      const button = document.getElementById(id) as HTMLButtonElement | null;
      if (button) {
        button.onclick = null;
      }
    }
    this.magnitudeSelect = null;
    this.zoomRange = null;
    this.zoomLabel = null;
    this.panLabel = null;
    this.loadingLabel = null;
  }

  syncControls(state: ArrowFloat64PrecisionControlPanelState): void {
    if (this.magnitudeSelect) {
      this.magnitudeSelect.value = state.coordinateMagnitudeKind;
    }
    if (this.zoomRange) {
      this.zoomRange.value = String(state.zoom);
    }
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${state.zoom.toFixed(1)}x`;
    }
    if (this.panLabel) {
      this.panLabel.textContent = `${formatNumber(state.pan[0])}, ${formatNumber(state.pan[1])}`;
    }
  }

  setLoading(isLoading: boolean): void {
    if (this.loadingLabel) {
      this.loadingLabel.textContent = isLoading ? 'Converting Arrow paths...' : '';
    }
  }

  setMetrics(metrics: ArrowFloat64PrecisionMetrics): void {
    setLabel(PATH_COUNT_ID, formatInteger(metrics.pathCount));
    setLabel(SEGMENT_COUNT_ID, formatInteger(metrics.segmentCount));
    setLabel(FLOAT64_ARROW_BYTES_ID, formatByteLength(metrics.float64SourceArrowByteLength));
    setLabel(FLOAT32_ARROW_BYTES_ID, formatByteLength(metrics.float32SourceArrowByteLength));
    setLabel(STYLE_ARROW_BYTES_ID, formatByteLength(metrics.styleArrowByteLength));
    setLabel(FLOAT64_GPU_BYTES_ID, formatByteLength(metrics.float64PreparedGpuByteLength));
    setLabel(FLOAT32_GPU_BYTES_ID, formatByteLength(metrics.float32PreparedGpuByteLength));
    setLabel(FLOAT64_CONVERSION_TIME_ID, `${metrics.float64ConversionTimeMs.toFixed(1)}ms`);
    setLabel(FLOAT32_CONVERSION_TIME_ID, `${metrics.float32ConversionTimeMs.toFixed(1)}ms`);
    setLabel(FLOAT32_ERROR_ID, `${formatMetric(metrics.maxFloat32LocalError)} world units`);
  }
}

export function makeArrowFloat64PrecisionControlPanelHtml(): string {
  return `\
  <div style="min-width: 280px; max-width: 360px; max-height: 150px; overflow-y: auto; padding: 8px 10px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 10px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 12px/1.25 system-ui, sans-serif;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7px; align-items: end;">
      <label style="display: grid; gap: 4px; font-weight: 700;">
        Magnitude
        <select id="${MAGNITUDE_SELECT_ID}" style="font: inherit; padding: 4px 6px;">
          ${Object.entries(COORDINATE_MAGNITUDES)
            .map(([kind, option]) => `<option value="${kind}">${option.label}</option>`)
            .join('')}
        </select>
      </label>
      <label style="display: grid; gap: 4px; font-weight: 700;">
        Zoom <span id="${ZOOM_LABEL_ID}" style="font-weight: 500; color: #475569;">1.0x</span>
        <input id="${ZOOM_RANGE_ID}" type="range" min="0.65" max="3.5" step="0.05" value="1" />
      </label>
    </div>
    <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap; margin-top: 6px;">
      <span style="font-weight: 700;">Pan</span>
      ${makeButton(PAN_LEFT_ID, 'Left')}
      ${makeButton(PAN_RIGHT_ID, 'Right')}
      ${makeButton(PAN_UP_ID, 'Up')}
      ${makeButton(PAN_DOWN_ID, 'Down')}
      ${makeButton(RESET_VIEW_ID, 'Reset')}
    </div>
    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 3px; color: #64748b; font-size: 11px;">
      <span>Pan <span id="${PAN_LABEL_ID}">0, 0</span></span>
      <span id="${LOADING_ID}" style="color: #1d4ed8; font-weight: 700;"></span>
    </div>
    <details style="margin-top: 6px; border-top: 1px solid rgba(203, 213, 225, 0.9); padding-top: 6px; color: #334155;">
      <summary style="cursor: pointer; font-weight: 700;">
        Metrics: F32 error <strong id="${FLOAT32_ERROR_ID}" style="font-variant-numeric: tabular-nums;">-</strong>, rebase conversion <strong id="${FLOAT64_CONVERSION_TIME_ID}" style="font-variant-numeric: tabular-nums;">-</strong>
      </summary>
      <div style="max-height: 90px; overflow-y: auto; display: grid; grid-template-columns: 1fr auto; gap: 3px 10px; margin-top: 4px; padding-right: 4px;">
        ${makeMetricRow('Paths', PATH_COUNT_ID)}
        ${makeMetricRow('Segments', SEGMENT_COUNT_ID)}
        ${makeMetricRow('F64 Arrow', FLOAT64_ARROW_BYTES_ID)}
        ${makeMetricRow('F32 Arrow', FLOAT32_ARROW_BYTES_ID)}
        ${makeMetricRow('Style', STYLE_ARROW_BYTES_ID)}
        ${makeMetricRow('F64 GPU', FLOAT64_GPU_BYTES_ID)}
        ${makeMetricRow('F32 GPU', FLOAT32_GPU_BYTES_ID)}
        ${makeMetricRow('F32 conversion', FLOAT32_CONVERSION_TIME_ID)}
      </div>
      <div style="margin-top: 4px; color: #475569; font-size: 11px;">Left: Float32 cast. Right: Float64 origin rebasing, not <code>project64</code>.</div>
    </details>
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums;">-</strong>`;
}

function makeButton(id: string, label: string): string {
  return `<button id="${id}" type="button" style="border: 1px solid #cbd5e1; border-radius: 7px; background: #f8fafc; color: #0f172a; padding: 3px 6px; font: inherit; cursor: pointer;">${label}</button>`;
}

function setButtonHandler(id: string, handler: () => void): void {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (button) {
    button.onclick = handler;
  }
}

function setLabel(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function getElement<TElement extends HTMLElement>(id: string): TElement | null {
  return document.getElementById(id) as TElement | null;
}

function isCoordinateMagnitudeKind(value: unknown): value is CoordinateMagnitudeKind {
  return (
    value === '1e7' ||
    value === '1e8' ||
    value === '1e9' ||
    value === '1e10' ||
    value === '1e16' ||
    value === '1e17' ||
    value === '1e18'
  );
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumFractionDigits: 0}).format(value);
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 3}).format(value);
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetric(byteLength / 1000)} kB`;
  }
  return `${formatMetric(byteLength / 1000 ** 2)} MB`;
}
