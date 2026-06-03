// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  POINT_DATASETS,
  POINT_TRAIL_LENGTH_MILLISECONDS,
  type ArrowPointColorKind,
  type ArrowPointRowCountKind,
  type ArrowPointSourceKind,
  type ArrowPointTimeKind
} from './arrow-point-generator';
import type {ArrowPointRendererMetrics} from './arrow-point-renderer';

const ROW_COUNT_SELECTOR_ID = 'arrow-point-row-count-selector';
const SOURCE_SELECTOR_ID = 'arrow-point-source';
const TIME_SELECTOR_ID = 'arrow-point-time';
const COLOR_SELECTOR_ID = 'arrow-point-colors';
const ANIMATE_TOGGLE_ID = 'arrow-point-animate';
const PICKED_ROW_ID = 'arrow-point-picked-row';
const CURRENT_TIME_ID = 'arrow-point-current-time';
const ROW_COUNT_ID = 'arrow-point-row-count';
const DIMENSION_ID = 'arrow-point-dimension';
const TOTAL_ARROW_BYTES_ID = 'arrow-point-total-arrow-bytes';
const TOTAL_GPU_BYTES_ID = 'arrow-point-total-gpu-bytes';
const TOTAL_GPU_EXPANSION_ID = 'arrow-point-total-gpu-expansion';
const TOTAL_BUILD_TIME_ID = 'arrow-point-total-build-time';
const POINT_ARROW_BYTES_ID = 'arrow-point-position-arrow-bytes';
const POINT_GPU_BYTES_ID = 'arrow-point-position-gpu-bytes';
const POINT_GPU_EXPANSION_ID = 'arrow-point-position-gpu-expansion';
const POINT_BUILD_TIME_ID = 'arrow-point-position-build-time';
const STYLING_ARROW_BYTES_ID = 'arrow-point-styling-arrow-bytes';
const STYLING_GPU_BYTES_ID = 'arrow-point-styling-gpu-bytes';
const STYLING_GPU_EXPANSION_ID = 'arrow-point-styling-gpu-expansion';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-point-streaming-batch-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-point-streaming-batch-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-point-streaming-batch-status-label';

export type ArrowPointControlPanelState = {
  rowCountKind: ArrowPointRowCountKind;
  sourceKind: ArrowPointSourceKind;
  timeKind: ArrowPointTimeKind;
  colorKind: ArrowPointColorKind;
  animate: boolean;
};

export type ArrowPointControlPanelProps = {
  initialState: ArrowPointControlPanelState;
  handlers: {
    onRowCountKindChange: (rowCountKind: ArrowPointRowCountKind) => void | Promise<void>;
    onSourceKindChange: (sourceKind: ArrowPointSourceKind) => void;
    onTimeKindChange: (timeKind: ArrowPointTimeKind) => void;
    onColorKindChange: (colorKind: ArrowPointColorKind) => void;
    onAnimateChange: (enabled: boolean) => void;
  };
};

export class ArrowPointControlPanel {
  private readonly props: ArrowPointControlPanelProps;
  private state: ArrowPointControlPanelState;
  private rowCountSelector: HTMLSelectElement | null = null;
  private sourceSelector: HTMLSelectElement | null = null;
  private timeSelector: HTMLSelectElement | null = null;
  private colorSelector: HTMLSelectElement | null = null;
  private animateToggle: HTMLInputElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor(props: ArrowPointControlPanelProps) {
    this.props = props;
    this.state = props.initialState;
  }

  initialize(): void {
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    this.timeSelector = document.getElementById(TIME_SELECTOR_ID) as HTMLSelectElement | null;
    this.colorSelector = document.getElementById(COLOR_SELECTOR_ID) as HTMLSelectElement | null;
    this.animateToggle = document.getElementById(ANIMATE_TOGGLE_ID) as HTMLInputElement | null;
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
    this.rowCountSelector?.addEventListener('change', this.handleRowCountChange);
    this.sourceSelector?.addEventListener('change', this.handleSourceChange);
    this.timeSelector?.addEventListener('change', this.handleTimeChange);
    this.colorSelector?.addEventListener('change', this.handleColorChange);
    this.animateToggle?.addEventListener('change', this.handleAnimateChange);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountChange);
    this.sourceSelector?.removeEventListener('change', this.handleSourceChange);
    this.timeSelector?.removeEventListener('change', this.handleTimeChange);
    this.colorSelector?.removeEventListener('change', this.handleColorChange);
    this.animateToggle?.removeEventListener('change', this.handleAnimateChange);
  }

  syncControls(state: Partial<ArrowPointControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.rowCountSelector) {
      this.rowCountSelector.value = this.state.rowCountKind;
    }
    if (this.sourceSelector) {
      this.sourceSelector.value = this.state.sourceKind;
    }
    if (this.timeSelector) {
      this.timeSelector.value = this.state.timeKind;
      const measureOption = Array.from(this.timeSelector.options).find(
        option => option.value === 'm'
      );
      if (measureOption) {
        measureOption.disabled = this.state.sourceKind === 'xy';
      }
    }
    if (this.colorSelector) {
      this.colorSelector.value = this.state.colorKind;
    }
    if (this.animateToggle) {
      this.animateToggle.checked = this.state.animate;
    }
  }

  setMetrics(metrics: ArrowPointRendererMetrics): void {
    const totalArrowByteLength = metrics.pointArrowByteLength + metrics.stylingArrowByteLength;
    const totalGpuByteLength = metrics.pointGpuByteLength + metrics.stylingGpuByteLength;
    setLabel(ROW_COUNT_ID, formatInteger(metrics.rowCount));
    setLabel(DIMENSION_ID, `${metrics.sourceDimension}D`);
    setLabel(TOTAL_ARROW_BYTES_ID, formatByteLength(totalArrowByteLength));
    setLabel(TOTAL_GPU_BYTES_ID, formatByteLength(totalGpuByteLength));
    setLabel(
      TOTAL_GPU_EXPANSION_ID,
      formatExpansionRatio(totalGpuByteLength, totalArrowByteLength)
    );
    setLabel(TOTAL_BUILD_TIME_ID, formatTimeMs(metrics.preparationTimeMs));
    setLabel(POINT_ARROW_BYTES_ID, formatByteLength(metrics.pointArrowByteLength));
    setLabel(POINT_GPU_BYTES_ID, formatByteLength(metrics.pointGpuByteLength));
    setLabel(
      POINT_GPU_EXPANSION_ID,
      formatExpansionRatio(metrics.pointGpuByteLength, metrics.pointArrowByteLength)
    );
    setLabel(POINT_BUILD_TIME_ID, formatTimeMs(metrics.preparationTimeMs));
    setLabel(STYLING_ARROW_BYTES_ID, formatByteLength(metrics.stylingArrowByteLength));
    setLabel(STYLING_GPU_BYTES_ID, formatByteLength(metrics.stylingGpuByteLength));
    setLabel(
      STYLING_GPU_EXPANSION_ID,
      formatExpansionRatio(metrics.stylingGpuByteLength, metrics.stylingArrowByteLength)
    );
  }

  setPickedLabel(label: string): void {
    setLabel(PICKED_ROW_ID, label);
  }

  setCurrentTimeLabel(label: string): void {
    setLabel(CURRENT_TIME_ID, label);
  }

  setStreamingBatchStatus(loadedBatchCount: number, batchCount: number): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchFill ||
      !this.streamingBatchStatusLabel
    ) {
      return;
    }
    this.streamingBatchStatusRow.style.display = 'block';
    this.streamingBatchStatusRow.setAttribute('aria-valuemax', `${batchCount}`);
    this.streamingBatchStatusRow.setAttribute('aria-valuenow', `${loadedBatchCount}`);
    const progressPercent = batchCount > 0 ? (loadedBatchCount / batchCount) * 100 : 0;
    this.streamingBatchFill.style.width = `${progressPercent}%`;
    this.streamingBatchStatusLabel.textContent = `Loaded ${loadedBatchCount} of ${batchCount} batches`;
  }

  private readonly handleRowCountChange = (): void => {
    const rowCountKind = this.rowCountSelector?.value;
    if (isRowCountKind(rowCountKind)) {
      void this.props.handlers.onRowCountKindChange(rowCountKind);
    }
  };

  private readonly handleSourceChange = (): void => {
    const sourceKind = this.sourceSelector?.value;
    if (isSourceKind(sourceKind)) {
      this.props.handlers.onSourceKindChange(sourceKind);
    }
  };

  private readonly handleTimeChange = (): void => {
    const timeKind = this.timeSelector?.value;
    if (isTimeKind(timeKind)) {
      this.props.handlers.onTimeKindChange(timeKind);
    }
  };

  private readonly handleColorChange = (): void => {
    const colorKind = this.colorSelector?.value;
    if (isColorKind(colorKind)) {
      this.props.handlers.onColorKindChange(colorKind);
    }
  };

  private readonly handleAnimateChange = (): void => {
    this.props.handlers.onAnimateChange(Boolean(this.animateToggle?.checked));
  };
}

export function makeArrowPointControlPanelHtml(): string {
  return `\
  <p>Renders Arrow point columns as instanced circle impostors with optional measure or timestamp animation.</p>
  <div style="max-height: calc(100vh - 72px); overflow-y: auto; overflow-x: hidden; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Table</h3>
      <div style="display: grid; grid-template-columns: minmax(74px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
        <select id="${ROW_COUNT_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="10k-stream">${POINT_DATASETS['10k-stream'].label}</option>
          <option value="100k-stream">${POINT_DATASETS['100k-stream'].label}</option>
        </select>
        <span>Batches</span>
        <div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="box-sizing: border-box; display: none; position: relative; width: 100%; min-width: 0; height: 34px; overflow: hidden; border: 1px solid rgba(37, 99, 235, 0.32); border-radius: 6px; background: #dbeafe; color: #0f172a; font-size: 13px; line-height: 1.4;">
          <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%); transition: width 220ms ease;"></span>
          <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 batches</span>
        </div>
        <span>Hover</span>
        <strong id="${PICKED_ROW_ID}" style="box-sizing: border-box; display: flex; align-items: center; min-width: 0; min-height: 34px; padding: 0 10px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 6px; background: rgba(248, 250, 252, 0.88); color: #0f172a; font-variant-numeric: tabular-nums;">Hover point</strong>
        <label for="${SOURCE_SELECTOR_ID}">Points</label>
        <select id="${SOURCE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="xy">FixedSizeList&lt;Float32, 2&gt; (XY)</option>
          <option value="xym">FixedSizeList&lt;Float32, 3&gt; (XYM)</option>
          <option value="xyzm">FixedSizeList&lt;Float32, 4&gt; (XYZM)</option>
          <option value="dense-union">DenseUnion Point XY/XYM/XYZM</option>
        </select>
        <label for="${TIME_SELECTOR_ID}">Time</label>
        <select id="${TIME_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="none">None</option>
          <option value="m">M coordinate</option>
          <option value="timestamp">TimestampMillisecond column</option>
        </select>
        <label for="${COLOR_SELECTOR_ID}">Colors</label>
        <select id="${COLOR_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="constant">Constant</option>
          <option value="row-colors">Row - FixedSizeList&lt;Uint8, 4&gt;</option>
        </select>
        <span>Animate</span>
        <label style="display: flex; align-items: center; min-height: 34px; gap: 8px; font-size: 14px; font-weight: 600;">
          <input id="${ANIMATE_TOGGLE_ID}" type="checkbox" checked />
          <span>temporal sweep</span>
        </label>
        <span>Clock</span>
        <strong id="${CURRENT_TIME_ID}" style="box-sizing: border-box; display: flex; align-items: center; min-width: 0; min-height: 34px; padding: 0 10px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 6px; background: rgba(248, 250, 252, 0.88); color: #0f172a; font-variant-numeric: tabular-nums;">-</strong>
      </div>
    </section>
    <section style="overflow: visible; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Metrics</h3>
      <table style="display: table; width: 100%; min-width: 100%; table-layout: fixed; box-sizing: border-box; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(208, 215, 222, 0.9); border-collapse: collapse; color: #334155; font-size: 13px; line-height: 1.4;">
        <thead>
          <tr style="color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; font-size: 11px;">
            <th style="width: 20%; padding: 8px 8px 6px 0; text-align: left; font-weight: 700; white-space: nowrap;">columns</th>
            <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">Arrow</th>
            <th style="width: 22%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">GPU</th>
            <th style="width: 16%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">exp</th>
            <th style="width: 20%; padding: 8px 0 6px 8px; text-align: right; font-weight: 700; white-space: nowrap;">time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 700;">total</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${TOTAL_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">points</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${POINT_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${POINT_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${POINT_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${POINT_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">styles</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLING_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLING_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLING_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 8px; color: #64748b; font-size: 12px; line-height: 1.4;">Rows <strong id="${ROW_COUNT_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">0</strong> · source dimension <strong id="${DIMENSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">0D</strong> · trail ${formatInteger(POINT_TRAIL_LENGTH_MILLISECONDS)} ms</div>
      <details style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
        <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">What this example isolates</summary>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
          <tbody>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">Input</td><td style="padding: 7px 0;">FixedSizeList&lt;Float32, 2 | 3 | 4&gt; point rows or DenseUnion point rows.</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">Temporal</td><td style="padding: 7px 0;">The sweep uses either an M coordinate or a separate TimestampMillisecond column.</td></tr>
            <tr><td style="padding: 7px 0; font-weight: 700;">Picking</td><td style="padding: 7px 0;">Each circle instance carries the original Arrow row index for hover picking.</td></tr>
          </tbody>
        </table>
      </details>
    </section>
  </div>
  `;
}

function setLabel(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatByteLength(byteLength: number): string {
  if (byteLength < 1000) {
    return `${formatInteger(byteLength)} B`;
  }
  if (byteLength < 1000 ** 2) {
    return `${formatMetricDigits(byteLength / 1000)} kB`;
  }
  if (byteLength < 1000 ** 3) {
    return `${formatMetricDigits(byteLength / 1000 ** 2)} MB`;
  }
  return `${formatMetricDigits(byteLength / 1000 ** 3)} GB`;
}

function formatExpansionRatio(byteLength: number, arrowByteLength: number): string {
  const expansionFactor =
    Number.isFinite(arrowByteLength) && arrowByteLength > 0 ? byteLength / arrowByteLength : null;
  return expansionFactor === null ? '-' : `${formatMetricDigits(expansionFactor)}x`;
}

function formatTimeMs(timeMs: number): string {
  if (timeMs < 1) {
    return '<1 ms';
  }
  return `${formatMetricDigits(timeMs)} ms`;
}

function formatMetricDigits(value: number): string {
  if (value >= 100) {
    return value.toFixed(0);
  }
  if (value >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

function isRowCountKind(value: unknown): value is ArrowPointRowCountKind {
  return value === '10k-stream' || value === '100k-stream';
}

function isSourceKind(value: unknown): value is ArrowPointSourceKind {
  return value === 'xy' || value === 'xym' || value === 'xyzm' || value === 'dense-union';
}

function isTimeKind(value: unknown): value is ArrowPointTimeKind {
  return value === 'none' || value === 'm' || value === 'timestamp';
}

function isColorKind(value: unknown): value is ArrowPointColorKind {
  return value === 'constant' || value === 'row-colors';
}
