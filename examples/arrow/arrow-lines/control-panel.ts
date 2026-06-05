// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {
  ArrowLineRendererMode,
  ArrowLineRendererModel,
  ArrowLineRendererTimeColumn
} from './arrow-line-renderer';
import {supportsVertexStorageBuffers} from '../utils/device-limits';

const MODEL_SELECTOR_ID = 'arrow-lines-model';
const ROW_COUNT_SELECTOR_ID = 'arrow-lines-row-count';
const MODE_SELECTOR_ID = 'arrow-lines-mode';
const COORDINATE_SELECTOR_ID = 'arrow-lines-coordinates';
const COLOR_COLUMN_SELECTOR_ID = 'arrow-lines-color-column';
const TIME_COLUMN_SELECTOR_ID = 'arrow-lines-time-column';
const MEASURE_SWEEP_TOGGLE_ID = 'arrow-lines-measure-sweep';
const WIDTH_TOGGLE_ID = 'arrow-lines-widths';
const CAP_SELECTOR_ID = 'arrow-lines-cap-style';
const JOINT_SELECTOR_ID = 'arrow-lines-joint-style';
const MITER_LIMIT_INPUT_ID = 'arrow-lines-miter-limit';
const MITER_LIMIT_VALUE_ID = 'arrow-lines-miter-limit-value';
const INFO_DETAILS_ID = 'arrow-lines-details';
const PATH_COUNT_ID = 'arrow-lines-path-count';
const SEGMENT_COUNT_ID = 'arrow-lines-segment-count';
const PATH_ARROW_BYTES_ID = 'arrow-lines-path-arrow-bytes';
const PATH_GPU_BYTES_ID = 'arrow-lines-path-gpu-bytes';
const PATH_GPU_EXPANSION_ID = 'arrow-lines-path-gpu-expansion';
const PATH_PREP_TIME_ID = 'arrow-lines-path-prep-time';
const STYLE_ARROW_BYTES_ID = 'arrow-lines-style-arrow-bytes';
const STYLE_GPU_BYTES_ID = 'arrow-lines-style-gpu-bytes';
const STYLE_GPU_EXPANSION_ID = 'arrow-lines-style-gpu-expansion';
const STYLE_BUILD_TIME_ID = 'arrow-lines-style-build-time';
const COMPUTE_GPU_BYTES_ID = 'arrow-lines-compute-gpu-bytes';
const COMPUTE_GPU_EXPANSION_ID = 'arrow-lines-compute-gpu-expansion';
const TOTAL_ARROW_BYTES_ID = 'arrow-lines-total-arrow-bytes';
const TOTAL_GPU_BYTES_ID = 'arrow-lines-total-gpu-bytes';
const TOTAL_GPU_EXPANSION_ID = 'arrow-lines-total-gpu-expansion';
const DECK_GPU_BYTES_ID = 'arrow-lines-deck-gpu-bytes';
const DECK_GPU_EXPANSION_ID = 'arrow-lines-deck-gpu-expansion';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-lines-streaming-batch-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-lines-streaming-batch-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-lines-streaming-batch-status-label';
const STORAGE_PATH_VERTEX_STORAGE_BUFFER_COUNT = 6;
const TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT = 7;

export type ArrowLineControlPanelRowLabels = {
  '240-stream': string;
  '2400-stream': string;
};

export type ArrowLineControlPanelProps = {
  rowLabels: ArrowLineControlPanelRowLabels;
  deckPathAttributeBytesPerSegment: number;
};

export type ArrowLineControlPanelRowCountKind = keyof ArrowLineControlPanelRowLabels;
export type ArrowLineControlPanelMode = ArrowLineRendererMode;
export type ArrowLineControlPanelCoordinateKind = 'float32' | 'float64' | 'dense-union';
export type ArrowLineControlPanelColorKind = 'none' | 'row-colors' | 'vertex-colors';
export type ArrowLineControlPanelTimeKind = ArrowLineRendererTimeColumn;
export type ArrowLineControlPanelCapKind = 'square' | 'round';
export type ArrowLineControlPanelJointKind = 'miter' | 'round';

export type ArrowLineControlPanelState = {
  mode: ArrowLineControlPanelMode;
  rowCountKind: ArrowLineControlPanelRowCountKind;
  coordinateKind: ArrowLineControlPanelCoordinateKind;
  colorKind: ArrowLineControlPanelColorKind;
  timeKind: ArrowLineControlPanelTimeKind;
  modelKind: ArrowLineRendererModel;
  capKind: ArrowLineControlPanelCapKind;
  jointKind: ArrowLineControlPanelJointKind;
  miterLimit: number;
};

export type ArrowLineControlPanelMetrics = {
  pathCount: string;
  segmentCount: string;
  pathArrowBytes: string;
  pathGpuBytes: string;
  pathGpuExpansion: string;
  pathPrepTime: string;
  styleArrowBytes: string;
  styleGpuBytes: string;
  styleGpuExpansion: string;
  styleBuildTime: string;
  computeGpuBytes: string;
  computeGpuExpansion: string;
  totalArrowBytes: string;
  totalGpuBytes: string;
  totalGpuExpansion: string;
  deckGpuBytes: string;
  deckGpuExpansion: string;
};

export type ArrowLineControlPanelHandlers = {
  onRowCountChange: (rowCountKind: ArrowLineControlPanelRowCountKind) => void | Promise<void>;
  onModeChange: (mode: ArrowLineControlPanelMode) => void | Promise<void>;
  onCoordinateChange: (coordinateKind: ArrowLineControlPanelCoordinateKind) => void | Promise<void>;
  onColorChange: (colorKind: ArrowLineControlPanelColorKind) => void | Promise<void>;
  onTimeChange: (timeKind: ArrowLineControlPanelTimeKind) => void | Promise<void>;
  onModelChange: (modelKind: ArrowLineRendererModel) => void | Promise<void>;
  onMeasureSweepChange: (enabled: boolean) => void;
  onWidthChange: (enabled: boolean) => void;
  onCapChange: (capKind: ArrowLineControlPanelCapKind) => void;
  onJointChange: (jointKind: ArrowLineControlPanelJointKind) => void;
  onMiterLimitChange: (miterLimit: number) => void;
};

export type ArrowLineControlPanelOptions = {
  device: Device;
  initialState: ArrowLineControlPanelState;
  handlers: ArrowLineControlPanelHandlers;
};

export class ArrowLineControlPanel {
  private readonly device: Device;
  private readonly handlers: ArrowLineControlPanelHandlers;
  private state: ArrowLineControlPanelState;
  private modelSelector: HTMLSelectElement | null = null;
  private rowCountSelector: HTMLSelectElement | null = null;
  private modeSelector: HTMLSelectElement | null = null;
  private coordinateSelector: HTMLSelectElement | null = null;
  private colorColumnSelector: HTMLSelectElement | null = null;
  private timeColumnSelector: HTMLSelectElement | null = null;
  private measureSweepToggle: HTMLInputElement | null = null;
  private widthToggle: HTMLInputElement | null = null;
  private capSelector: HTMLSelectElement | null = null;
  private jointSelector: HTMLSelectElement | null = null;
  private miterLimitInput: HTMLInputElement | null = null;
  private miterLimitValue: HTMLOutputElement | null = null;
  private pathCountLabel: HTMLElement | null = null;
  private segmentCountLabel: HTMLElement | null = null;
  private pathArrowBytesLabel: HTMLElement | null = null;
  private pathGpuBytesLabel: HTMLElement | null = null;
  private pathGpuExpansionLabel: HTMLElement | null = null;
  private pathPrepTimeLabel: HTMLElement | null = null;
  private styleArrowBytesLabel: HTMLElement | null = null;
  private styleGpuBytesLabel: HTMLElement | null = null;
  private styleGpuExpansionLabel: HTMLElement | null = null;
  private styleBuildTimeLabel: HTMLElement | null = null;
  private computeGpuBytesLabel: HTMLElement | null = null;
  private computeGpuExpansionLabel: HTMLElement | null = null;
  private totalArrowBytesLabel: HTMLElement | null = null;
  private totalGpuBytesLabel: HTMLElement | null = null;
  private totalGpuExpansionLabel: HTMLElement | null = null;
  private deckGpuBytesLabel: HTMLElement | null = null;
  private deckGpuExpansionLabel: HTMLElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({device, initialState, handlers}: ArrowLineControlPanelOptions) {
    this.device = device;
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    this.modelSelector = document.getElementById(MODEL_SELECTOR_ID) as HTMLSelectElement | null;
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.modeSelector = document.getElementById(MODE_SELECTOR_ID) as HTMLSelectElement | null;
    this.coordinateSelector = document.getElementById(
      COORDINATE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.colorColumnSelector = document.getElementById(
      COLOR_COLUMN_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.timeColumnSelector = document.getElementById(
      TIME_COLUMN_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.measureSweepToggle = document.getElementById(
      MEASURE_SWEEP_TOGGLE_ID
    ) as HTMLInputElement | null;
    this.widthToggle = document.getElementById(WIDTH_TOGGLE_ID) as HTMLInputElement | null;
    this.capSelector = document.getElementById(CAP_SELECTOR_ID) as HTMLSelectElement | null;
    this.jointSelector = document.getElementById(JOINT_SELECTOR_ID) as HTMLSelectElement | null;
    this.miterLimitInput = document.getElementById(MITER_LIMIT_INPUT_ID) as HTMLInputElement | null;
    this.miterLimitValue = document.getElementById(
      MITER_LIMIT_VALUE_ID
    ) as HTMLOutputElement | null;
    this.pathCountLabel = document.getElementById(PATH_COUNT_ID);
    this.segmentCountLabel = document.getElementById(SEGMENT_COUNT_ID);
    this.pathArrowBytesLabel = document.getElementById(PATH_ARROW_BYTES_ID);
    this.pathGpuBytesLabel = document.getElementById(PATH_GPU_BYTES_ID);
    this.pathGpuExpansionLabel = document.getElementById(PATH_GPU_EXPANSION_ID);
    this.pathPrepTimeLabel = document.getElementById(PATH_PREP_TIME_ID);
    this.styleArrowBytesLabel = document.getElementById(STYLE_ARROW_BYTES_ID);
    this.styleGpuBytesLabel = document.getElementById(STYLE_GPU_BYTES_ID);
    this.styleGpuExpansionLabel = document.getElementById(STYLE_GPU_EXPANSION_ID);
    this.styleBuildTimeLabel = document.getElementById(STYLE_BUILD_TIME_ID);
    this.computeGpuBytesLabel = document.getElementById(COMPUTE_GPU_BYTES_ID);
    this.computeGpuExpansionLabel = document.getElementById(COMPUTE_GPU_EXPANSION_ID);
    this.totalArrowBytesLabel = document.getElementById(TOTAL_ARROW_BYTES_ID);
    this.totalGpuBytesLabel = document.getElementById(TOTAL_GPU_BYTES_ID);
    this.totalGpuExpansionLabel = document.getElementById(TOTAL_GPU_EXPANSION_ID);
    this.deckGpuBytesLabel = document.getElementById(DECK_GPU_BYTES_ID);
    this.deckGpuExpansionLabel = document.getElementById(DECK_GPU_EXPANSION_ID);
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);

    this.syncControls(this.state);
    this.modelSelector?.addEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.addEventListener('change', this.handleRowCountSelection);
    this.modeSelector?.addEventListener('change', this.handleModeSelection);
    this.coordinateSelector?.addEventListener('change', this.handleCoordinateSelection);
    this.colorColumnSelector?.addEventListener('change', this.handleColorColumnSelection);
    this.timeColumnSelector?.addEventListener('change', this.handleTimeColumnSelection);
    this.measureSweepToggle?.addEventListener('change', this.handleMeasureSweepToggle);
    this.widthToggle?.addEventListener('change', this.handleWidthToggle);
    this.capSelector?.addEventListener('change', this.handleCapSelection);
    this.jointSelector?.addEventListener('change', this.handleJointSelection);
    this.miterLimitInput?.addEventListener('input', this.handleMiterLimitInput);
  }

  destroy(): void {
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountSelection);
    this.modeSelector?.removeEventListener('change', this.handleModeSelection);
    this.coordinateSelector?.removeEventListener('change', this.handleCoordinateSelection);
    this.colorColumnSelector?.removeEventListener('change', this.handleColorColumnSelection);
    this.timeColumnSelector?.removeEventListener('change', this.handleTimeColumnSelection);
    this.measureSweepToggle?.removeEventListener('change', this.handleMeasureSweepToggle);
    this.widthToggle?.removeEventListener('change', this.handleWidthToggle);
    this.capSelector?.removeEventListener('change', this.handleCapSelection);
    this.jointSelector?.removeEventListener('change', this.handleJointSelection);
    this.miterLimitInput?.removeEventListener('input', this.handleMiterLimitInput);
  }

  syncControls(state: Partial<ArrowLineControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.rowCountSelector) {
      this.rowCountSelector.value = this.state.rowCountKind;
    }
    if (this.modeSelector) {
      this.modeSelector.value = this.state.mode;
    }
    if (this.coordinateSelector) {
      this.coordinateSelector.value = this.state.coordinateKind;
    }
    if (this.colorColumnSelector) {
      this.colorColumnSelector.value = this.state.colorKind;
    }
    if (this.timeColumnSelector) {
      this.timeColumnSelector.value = this.state.timeKind;
    }
    if (this.modelSelector) {
      this.modelSelector.value = this.state.modelKind;
    }
    if (this.capSelector) {
      this.capSelector.value = this.state.capKind;
    }
    if (this.jointSelector) {
      this.jointSelector.value = this.state.jointKind;
    }
    if (this.miterLimitInput) {
      this.miterLimitInput.value = this.state.miterLimit.toFixed(2);
    }
    this.updateSelectorAvailability();
    this.syncMiterLimitControls();
  }

  setMetricValues(metrics: ArrowLineControlPanelMetrics): void {
    setMetricText(this.pathCountLabel, metrics.pathCount);
    setMetricText(this.segmentCountLabel, metrics.segmentCount);
    setMetricText(this.pathArrowBytesLabel, metrics.pathArrowBytes);
    setMetricText(this.pathGpuBytesLabel, metrics.pathGpuBytes);
    setMetricText(this.pathGpuExpansionLabel, metrics.pathGpuExpansion);
    setMetricText(this.pathPrepTimeLabel, metrics.pathPrepTime);
    setMetricText(this.styleArrowBytesLabel, metrics.styleArrowBytes);
    setMetricText(this.styleGpuBytesLabel, metrics.styleGpuBytes);
    setMetricText(this.styleGpuExpansionLabel, metrics.styleGpuExpansion);
    setMetricText(this.styleBuildTimeLabel, metrics.styleBuildTime);
    setMetricText(this.computeGpuBytesLabel, metrics.computeGpuBytes);
    setMetricText(this.computeGpuExpansionLabel, metrics.computeGpuExpansion);
    setMetricText(this.totalArrowBytesLabel, metrics.totalArrowBytes);
    setMetricText(this.totalGpuBytesLabel, metrics.totalGpuBytes);
    setMetricText(this.totalGpuExpansionLabel, metrics.totalGpuExpansion);
    setMetricText(this.deckGpuBytesLabel, metrics.deckGpuBytes);
    setMetricText(this.deckGpuExpansionLabel, metrics.deckGpuExpansion);
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
      this.streamingBatchStatusLabel.textContent = `Loaded 0 of ${streamingBatchCount} batches`;
      this.streamingBatchFill.style.width = '0%';
      this.streamingBatchStatusRow.setAttribute('aria-valuenow', '0');
      return;
    }

    const safeLoadedBatchCount = Math.min(
      streamingBatchCount,
      Math.max(0, Math.trunc(loadedBatchCount))
    );
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

  private readonly handleRowCountSelection = (): void => {
    const nextRowCountKind = this.rowCountSelector?.value;
    if (isArrowLineControlPanelRowCountKind(nextRowCountKind)) {
      void this.handlers.onRowCountChange(nextRowCountKind);
    }
  };

  private readonly handleModeSelection = (): void => {
    const nextMode = this.modeSelector?.value;
    if (isArrowLineControlPanelMode(nextMode)) {
      void this.handlers.onModeChange(nextMode);
    }
  };

  private readonly handleCoordinateSelection = (): void => {
    const nextCoordinateKind = this.coordinateSelector?.value;
    if (isArrowLineControlPanelCoordinateKind(nextCoordinateKind)) {
      void this.handlers.onCoordinateChange(nextCoordinateKind);
    }
  };

  private readonly handleColorColumnSelection = (): void => {
    const nextColorKind = this.colorColumnSelector?.value;
    if (isArrowLineControlPanelColorKind(nextColorKind)) {
      void this.handlers.onColorChange(nextColorKind);
    }
  };

  private readonly handleTimeColumnSelection = (): void => {
    const nextTimeKind = this.timeColumnSelector?.value;
    if (
      isArrowLineControlPanelTimeKind(nextTimeKind) &&
      (nextTimeKind !== 'timestamps' ||
        supportsVertexStorageBuffers(this.device, TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT))
    ) {
      void this.handlers.onTimeChange(nextTimeKind);
    }
  };

  private readonly handleModelSelection = (): void => {
    const nextModelKind = this.modelSelector?.value;
    if (
      isArrowLineRendererModel(nextModelKind) &&
      (nextModelKind !== 'storage' ||
        supportsVertexStorageBuffers(this.device, STORAGE_PATH_VERTEX_STORAGE_BUFFER_COUNT)) &&
      (nextModelKind !== 'trips' ||
        supportsVertexStorageBuffers(this.device, TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT)) &&
      (nextModelKind !== 'attribute' || this.state.timeKind !== 'timestamps')
    ) {
      this.handlers.onModelChange(nextModelKind);
    }
  };

  private readonly handleMeasureSweepToggle = (): void => {
    this.handlers.onMeasureSweepChange(Boolean(this.measureSweepToggle?.checked));
  };

  private readonly handleWidthToggle = (): void => {
    this.handlers.onWidthChange(Boolean(this.widthToggle?.checked));
  };

  private readonly handleCapSelection = (): void => {
    this.handlers.onCapChange(this.capSelector?.value === 'round' ? 'round' : 'square');
  };

  private readonly handleJointSelection = (): void => {
    this.handlers.onJointChange(this.jointSelector?.value === 'round' ? 'round' : 'miter');
  };

  private readonly handleMiterLimitInput = (): void => {
    const nextMiterLimit = Number(this.miterLimitInput?.value ?? this.state.miterLimit);
    this.handlers.onMiterLimitChange(
      Number.isFinite(nextMiterLimit) ? nextMiterLimit : this.state.miterLimit
    );
  };

  private updateSelectorAvailability(): void {
    const isPolygonMode = this.state.mode === 'polygons';
    const supportsStoragePath = supportsVertexStorageBuffers(
      this.device,
      STORAGE_PATH_VERTEX_STORAGE_BUFFER_COUNT
    );
    const supportsTripsPath = supportsVertexStorageBuffers(
      this.device,
      TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT
    );
    if (this.coordinateSelector) {
      for (const option of Array.from(this.coordinateSelector.options)) {
        option.disabled = isPolygonMode && option.value !== 'dense-union';
      }
    }
    if (this.colorColumnSelector) {
      for (const option of Array.from(this.colorColumnSelector.options)) {
        option.disabled = isPolygonMode && option.value === 'vertex-colors';
      }
    }
    if (this.timeColumnSelector) {
      for (const option of Array.from(this.timeColumnSelector.options)) {
        option.disabled =
          (isPolygonMode && option.value !== 'none') ||
          (option.value === 'timestamps' && !supportsTripsPath);
      }
    }
    if (!this.modelSelector) {
      return;
    }
    for (const option of Array.from(this.modelSelector.options)) {
      option.disabled =
        (option.value === 'storage' &&
          (!supportsStoragePath || this.state.timeKind === 'timestamps')) ||
        (option.value === 'attribute' && this.state.timeKind === 'timestamps') ||
        (option.value === 'trips' &&
          (!supportsTripsPath || this.state.timeKind !== 'timestamps' || isPolygonMode));
      if (option.value === 'auto') {
        option.textContent = `auto (${getAutoPathModelLabel(this.device, this.state.timeKind)})`;
      }
    }
    this.modelSelector.disabled = false;
  }

  private syncMiterLimitControls(): void {
    if (this.miterLimitInput) {
      this.miterLimitInput.disabled = this.state.jointKind !== 'miter';
    }
    if (this.miterLimitValue) {
      this.miterLimitValue.textContent = this.state.miterLimit.toFixed(2);
    }
  }
}

export function makeArrowLineControlPanelHtml({
  rowLabels,
  deckPathAttributeBytesPerSegment
}: ArrowLineControlPanelProps): string {
  return `\
  <p>Renders Arrow line rows through <code>ArrowLineRenderer</code>, including DenseUnion line strings and polygon outlines.</p>
  <div style="max-height: calc(100vh - 72px); overflow-y: auto; overflow-x: hidden; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Table</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
        <select id="${ROW_COUNT_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="240-stream">${rowLabels['240-stream']}</option>
          <option value="2400-stream">${rowLabels['2400-stream']}</option>
        </select>
        <label for="${MODE_SELECTOR_ID}">Mode</label>
        <select id="${MODE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="lines">Lines</option>
          <option value="polygons">Polygon outlines</option>
        </select>
        <span>Batches</span>
        <div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="box-sizing: border-box; display: none; position: relative; width: 100%; min-width: 0; height: 34px; overflow: hidden; border: 1px solid rgba(37, 99, 235, 0.32); border-radius: 6px; background: #dbeafe; color: #0f172a; font-size: 13px; line-height: 1.4;">
          <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%); transition: width 220ms ease;"></span>
          <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 batches</span>
        </div>
        <label for="${COORDINATE_SELECTOR_ID}">Lines</label>
        <select id="${COORDINATE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="float32">Float32 - List&lt;FixedSizeList&lt;Float32, 4&gt;&gt;</option>
          <option value="float64">Float64 - List&lt;FixedSizeList&lt;Float64, 4&gt;&gt;</option>
          <option value="dense-union">DenseUnion - LineString/MultiLineString or Polygon/MultiPolygon</option>
        </select>
        <label for="${COLOR_COLUMN_SELECTOR_ID}">Colors</label>
        <select id="${COLOR_COLUMN_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="none">None</option>
          <option value="row-colors">Row - FixedSizeList&lt;Uint8, 4&gt;</option>
          <option value="vertex-colors">Vertex - List&lt;FixedSizeList&lt;Uint8, 4&gt;&gt;</option>
        </select>
        <label for="${TIME_COLUMN_SELECTOR_ID}">Time</label>
        <select id="${TIME_COLUMN_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="none">None</option>
          <option value="xyzm">M coordinate - XYZM</option>
          <option value="timestamps">timestamp - List&lt;TimestampMillisecond&gt;</option>
        </select>
      </div>
    </section>
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Props</h3>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; margin-top: 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${MEASURE_SWEEP_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input id="${MEASURE_SWEEP_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Animate</span>
        </label>
        <label for="${WIDTH_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input id="${WIDTH_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Width</span>
        </label>
      </div>
      <div style="display: grid; grid-template-columns: minmax(56px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; margin-top: 14px; color: #0f172a; font-size: 14px; font-weight: 600;">
        <label for="${CAP_SELECTOR_ID}">Caps</label>
        <select id="${CAP_SELECTOR_ID}" style="min-width: 0; min-height: 32px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="square">Square</option>
          <option value="round">Round</option>
        </select>
        <label for="${JOINT_SELECTOR_ID}">Joins</label>
        <select id="${JOINT_SELECTOR_ID}" style="min-width: 0; min-height: 32px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="miter">Miter</option>
          <option value="round">Round</option>
        </select>
        <label for="${MITER_LIMIT_INPUT_ID}">Miter</label>
        <div style="display: flex; align-items: center; gap: 10px;">
          <input id="${MITER_LIMIT_INPUT_ID}" type="range" min="1" max="8" step="0.25" value="4" style="width: 100%; accent-color: #2563eb;" />
          <output id="${MITER_LIMIT_VALUE_ID}" for="${MITER_LIMIT_INPUT_ID}" style="min-width: 36px; color: #334155; font-variant-numeric: tabular-nums;">4.00</output>
        </div>
      </div>
    </section>
    <section style="overflow: visible; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Metrics</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${MODEL_SELECTOR_ID}">Model</label>
        <select id="${MODEL_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="attribute">attribute</option>
          <option value="storage">storage</option>
          <option value="trips">trips</option>
          <option value="auto">auto</option>
        </select>
      </div>
      ${makeMetricRow('Arrow line rows', PATH_COUNT_ID)}
      ${makeMetricRow('Generated segment rows', SEGMENT_COUNT_ID)}
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
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">lines + time</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${PATH_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${PATH_PREP_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">styles</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${STYLE_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">compute</th>
            <td style="padding: 6px 8px; text-align: right;">-</td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${COMPUTE_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${COMPUTE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
          <tr style="font-style: italic;">
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">deck.gl</th>
            <td style="padding: 6px 8px; text-align: right;">-</td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
        </tbody>
      </table>
      <details id="${INFO_DETAILS_ID}" style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
        <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">What this example isolates</summary>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
          <tbody>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Input</td><td style="padding: 7px 0;">Nested Float32 XYZM Arrow lists, CPU-prepared Float64 lists, DenseUnion LineString/MultiLineString rows, or DenseUnion Polygon/MultiPolygon outline rings plus selectable row color columns, line-aligned color lists, and aligned List&lt;Timestamp&gt; rows</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Time</td><td style="padding: 7px 0;">AttributePathModel and StoragePathModel read numeric M from XYZM; StorageTripsPathModel normalizes List&lt;Timestamp&gt; to relative Float32 milliseconds and filters the trail in storage</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Shared drawing</td><td style="padding: 7px 0;">All modes render the same miter/round joins and square/round caps; storage modes keep generated segment records indexed</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">Attribute model</td><td style="padding: 7px 0;">CPU expansion builds segment records and repeats selected style rows into render attributes</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0;">deck.gl estimate</td><td style="padding: 7px 0;">Approximate PathLayer attribute storage at ${deckPathAttributeBytesPerSegment} bytes per generated segment</td></tr>
            <tr><td style="padding: 7px 0;">Storage model</td><td style="padding: 7px 0;">WebGPU compute expands nested rows while path-aligned colors, per-path widths, and Trips timestamps remain storage-backed</td></tr>
          </tbody>
        </table>
      </details>
    </section>
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(226, 232, 240, 0.9); color: #334155; font-size: 13px; line-height: 1.4;"><span>${label}</span><strong id="${id}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></div>`;
}

function isArrowLineControlPanelRowCountKind(
  value: string | undefined
): value is ArrowLineControlPanelRowCountKind {
  return value === '240-stream' || value === '2400-stream';
}

function isArrowLineControlPanelMode(
  value: string | undefined
): value is ArrowLineControlPanelMode {
  return value === 'lines' || value === 'polygons';
}

function isArrowLineControlPanelCoordinateKind(
  value: string | undefined
): value is ArrowLineControlPanelCoordinateKind {
  return value === 'float32' || value === 'float64' || value === 'dense-union';
}

function isArrowLineControlPanelColorKind(
  value: string | undefined
): value is ArrowLineControlPanelColorKind {
  return value === 'none' || value === 'row-colors' || value === 'vertex-colors';
}

function isArrowLineControlPanelTimeKind(
  value: string | undefined
): value is ArrowLineControlPanelTimeKind {
  return value === 'none' || value === 'xyzm' || value === 'timestamps';
}

function isArrowLineRendererModel(value: string | undefined): value is ArrowLineRendererModel {
  return value === 'attribute' || value === 'storage' || value === 'trips' || value === 'auto';
}

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  return streamingBatchCount > 0 ? (loadedBatchCount / streamingBatchCount) * 100 : 0;
}

function getAutoPathModelLabel(device: Device, timeKind: ArrowLineControlPanelTimeKind): string {
  if (
    !supportsVertexStorageBuffers(
      device,
      timeKind === 'timestamps'
        ? TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT
        : STORAGE_PATH_VERTEX_STORAGE_BUFFER_COUNT
    )
  ) {
    return 'attribute';
  }
  return timeKind === 'timestamps' ? 'trips' : 'storage';
}

function setMetricText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
