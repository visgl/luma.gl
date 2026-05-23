// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {ArrowTextLayerModel} from './arrow-text-layer';

const ANIMATE_TOGGLE_ID = 'arrow-text-2d-animate';
const CLIPPING_TOGGLE_ID = 'arrow-text-2d-clipping';
const COLOR_TOGGLE_ID = 'arrow-text-2d-colors';
const SIZE_TOGGLE_ID = 'arrow-text-2d-sizes';
const ANGLE_TOGGLE_ID = 'arrow-text-2d-angles';
const MODEL_SELECTOR_ID = 'arrow-text-2d-model';
const ROW_COUNT_SELECTOR_ID = 'arrow-text-2d-row-count';
const SOURCE_SELECTOR_ID = 'arrow-text-2d-source';
const TEXT_COLOR_SELECTOR_ID = 'arrow-text-2d-color-column';
const ARROW_VECTOR_BYTES_ID = 'arrow-text-2d-arrow-vector-bytes';
const STYLE_ARROW_BYTES_ID = 'arrow-text-2d-style-arrow-bytes';
const ARROW_VECTOR_BUILD_TIME_ID = 'arrow-text-2d-arrow-vector-build-time';
const CPU_GENERATION_TIME_ID = 'arrow-text-2d-cpu-generation-time';
const TOTAL_GPU_BYTES_ID = 'arrow-text-2d-total-gpu-bytes';
const TEXT_GPU_EXPANSION_ID = 'arrow-text-2d-text-gpu-expansion';
const GPU_STYLE_VECTOR_BYTES_ID = 'arrow-text-2d-gpu-style-vector-bytes';
const STYLE_GPU_EXPANSION_ID = 'arrow-text-2d-style-gpu-expansion';
const DECK_ATTRIBUTE_SIZE_ID = 'arrow-text-2d-deck-attribute-size';
const DECK_GPU_EXPANSION_ID = 'arrow-text-2d-deck-gpu-expansion';
const PICKED_LABEL_ID = 'arrow-text-2d-picked-label';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-text-2d-streaming-batch-status-row';
const STREAMING_BATCH_SPINNER_ID = 'arrow-text-2d-streaming-batch-spinner';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-text-2d-streaming-batch-status-label';

export type ArrowText2DControlPanelRowCountKind =
  | '100k'
  | '500k'
  | '1m'
  | '100k-stream'
  | '500k-stream'
  | '1m-stream';
export type ArrowText2DControlPanelSourceKind = 'utf8' | 'dictionary';
export type ArrowText2DControlPanelColorKind = 'string-colors' | 'character-colors';

export type ArrowText2DControlPanelState = {
  rowCountKind: ArrowText2DControlPanelRowCountKind;
  sourceKind: ArrowText2DControlPanelSourceKind;
  colorKind: ArrowText2DControlPanelColorKind;
  modelKind: ArrowTextLayerModel;
  animate: boolean;
  clippingEnabled: boolean;
  colorEnabled: boolean;
  sizeEnabled: boolean;
  angleEnabled: boolean;
};

export type ArrowText2DControlPanelMetrics = {
  arrowVectorBytes: string;
  styleArrowBytes: string;
  arrowVectorBuildTime: string;
  cpuGenerationTime: string;
  totalGpuBytes: string;
  textGpuExpansion: string;
  gpuStyleVectorBytes: string;
  styleGpuExpansion: string;
  deckAttributeSize: string;
  deckGpuExpansion: string;
};

export type ArrowText2DControlPanelHandlers = {
  onRowCountChange: (rowCountKind: ArrowText2DControlPanelRowCountKind) => void | Promise<void>;
  onSourceChange: (sourceKind: ArrowText2DControlPanelSourceKind) => void | Promise<void>;
  onColorColumnChange: (colorKind: ArrowText2DControlPanelColorKind) => void | Promise<void>;
  onModelChange: (modelKind: ArrowTextLayerModel) => void;
  onAnimateChange: (enabled: boolean) => void;
  onClippingChange: (enabled: boolean) => void;
  onColorChange: (enabled: boolean) => void;
  onSizeChange: (enabled: boolean) => void;
  onAngleChange: (enabled: boolean) => void;
};

export type ArrowText2DControlPanelOptions = {
  device: Device;
  initialState: ArrowText2DControlPanelState;
  handlers: ArrowText2DControlPanelHandlers;
};

export type ArrowText2DControlPanelHtmlProps = {
  streamingBatchCount: number;
  deckCharacterAttributeBytesPerGlyph: number;
};

export class ArrowText2DControlPanel {
  private readonly device: Device;
  private readonly handlers: ArrowText2DControlPanelHandlers;
  private state: ArrowText2DControlPanelState;
  private animateToggle: HTMLInputElement | null = null;
  private clippingToggle: HTMLInputElement | null = null;
  private colorToggle: HTMLInputElement | null = null;
  private sizeToggle: HTMLInputElement | null = null;
  private angleToggle: HTMLInputElement | null = null;
  private modelSelector: HTMLSelectElement | null = null;
  private rowCountSelector: HTMLSelectElement | null = null;
  private sourceSelector: HTMLSelectElement | null = null;
  private textColorSelector: HTMLSelectElement | null = null;
  private arrowVectorBytesLabel: HTMLElement | null = null;
  private styleArrowBytesLabel: HTMLElement | null = null;
  private arrowVectorBuildTimeLabel: HTMLElement | null = null;
  private cpuGenerationTimeLabel: HTMLElement | null = null;
  private totalGpuBytesLabel: HTMLElement | null = null;
  private textGpuExpansionLabel: HTMLElement | null = null;
  private gpuStyleVectorBytesLabel: HTMLElement | null = null;
  private styleGpuExpansionLabel: HTMLElement | null = null;
  private deckAttributeSizeLabel: HTMLElement | null = null;
  private deckGpuExpansionLabel: HTMLElement | null = null;
  private pickedLabel: HTMLElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchSpinner: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({device, initialState, handlers}: ArrowText2DControlPanelOptions) {
    this.device = device;
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    this.animateToggle = document.getElementById(ANIMATE_TOGGLE_ID) as HTMLInputElement | null;
    this.clippingToggle = document.getElementById(CLIPPING_TOGGLE_ID) as HTMLInputElement | null;
    this.colorToggle = document.getElementById(COLOR_TOGGLE_ID) as HTMLInputElement | null;
    this.sizeToggle = document.getElementById(SIZE_TOGGLE_ID) as HTMLInputElement | null;
    this.angleToggle = document.getElementById(ANGLE_TOGGLE_ID) as HTMLInputElement | null;
    this.modelSelector = document.getElementById(MODEL_SELECTOR_ID) as HTMLSelectElement | null;
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    this.textColorSelector = document.getElementById(
      TEXT_COLOR_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.arrowVectorBytesLabel = document.getElementById(ARROW_VECTOR_BYTES_ID);
    this.styleArrowBytesLabel = document.getElementById(STYLE_ARROW_BYTES_ID);
    this.arrowVectorBuildTimeLabel = document.getElementById(ARROW_VECTOR_BUILD_TIME_ID);
    this.cpuGenerationTimeLabel = document.getElementById(CPU_GENERATION_TIME_ID);
    this.totalGpuBytesLabel = document.getElementById(TOTAL_GPU_BYTES_ID);
    this.textGpuExpansionLabel = document.getElementById(TEXT_GPU_EXPANSION_ID);
    this.gpuStyleVectorBytesLabel = document.getElementById(GPU_STYLE_VECTOR_BYTES_ID);
    this.styleGpuExpansionLabel = document.getElementById(STYLE_GPU_EXPANSION_ID);
    this.deckAttributeSizeLabel = document.getElementById(DECK_ATTRIBUTE_SIZE_ID);
    this.deckGpuExpansionLabel = document.getElementById(DECK_GPU_EXPANSION_ID);
    this.pickedLabel = document.getElementById(PICKED_LABEL_ID);
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchSpinner = document.getElementById(STREAMING_BATCH_SPINNER_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);

    this.syncControls(this.state);
    this.animateToggle?.addEventListener('change', this.handleAnimateToggle);
    this.clippingToggle?.addEventListener('change', this.handleClippingToggle);
    this.colorToggle?.addEventListener('change', this.handleColorToggle);
    this.sizeToggle?.addEventListener('change', this.handleSizeToggle);
    this.angleToggle?.addEventListener('change', this.handleAngleToggle);
    this.modelSelector?.addEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.addEventListener('change', this.handleRowCountSelection);
    this.sourceSelector?.addEventListener('change', this.handleSourceSelection);
    this.textColorSelector?.addEventListener('change', this.handleTextColorSelection);
  }

  destroy(): void {
    this.animateToggle?.removeEventListener('change', this.handleAnimateToggle);
    this.clippingToggle?.removeEventListener('change', this.handleClippingToggle);
    this.colorToggle?.removeEventListener('change', this.handleColorToggle);
    this.sizeToggle?.removeEventListener('change', this.handleSizeToggle);
    this.angleToggle?.removeEventListener('change', this.handleAngleToggle);
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountSelection);
    this.sourceSelector?.removeEventListener('change', this.handleSourceSelection);
    this.textColorSelector?.removeEventListener('change', this.handleTextColorSelection);
  }

  syncControls(state: Partial<ArrowText2DControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.rowCountSelector) {
      this.rowCountSelector.value = this.state.rowCountKind;
    }
    if (this.sourceSelector) {
      this.sourceSelector.value = this.state.sourceKind;
    }
    if (this.textColorSelector) {
      this.textColorSelector.value = this.state.colorKind;
    }
    if (this.modelSelector) {
      this.modelSelector.value = this.state.modelKind;
    }
    if (this.animateToggle) {
      this.animateToggle.checked = this.state.animate;
    }
    if (this.clippingToggle) {
      this.clippingToggle.checked = this.state.clippingEnabled;
    }
    if (this.colorToggle) {
      this.colorToggle.checked = this.state.colorEnabled;
    }
    if (this.sizeToggle) {
      this.sizeToggle.checked = this.state.sizeEnabled;
    }
    if (this.angleToggle) {
      this.angleToggle.checked = this.state.angleEnabled;
    }
    this.updateSelectorAvailability();
  }

  setMetricValues(metrics: ArrowText2DControlPanelMetrics): void {
    setTextContent(this.arrowVectorBytesLabel, metrics.arrowVectorBytes);
    setTextContent(this.styleArrowBytesLabel, metrics.styleArrowBytes);
    setTextContent(this.arrowVectorBuildTimeLabel, metrics.arrowVectorBuildTime);
    setTextContent(this.cpuGenerationTimeLabel, metrics.cpuGenerationTime);
    setTextContent(this.totalGpuBytesLabel, metrics.totalGpuBytes);
    setTextContent(this.textGpuExpansionLabel, metrics.textGpuExpansion);
    setTextContent(this.gpuStyleVectorBytesLabel, metrics.gpuStyleVectorBytes);
    setTextContent(this.styleGpuExpansionLabel, metrics.styleGpuExpansion);
    setTextContent(this.deckAttributeSizeLabel, metrics.deckAttributeSize);
    setTextContent(this.deckGpuExpansionLabel, metrics.deckGpuExpansion);
  }

  setPickedLabel(label: string): void {
    setTextContent(this.pickedLabel, label);
  }

  setStreamingBatchStatus(loadedBatchCount: number | null, streamingBatchCount: number): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchSpinner ||
      !this.streamingBatchStatusLabel
    ) {
      return;
    }

    if (loadedBatchCount === null) {
      this.streamingBatchStatusRow.style.display = 'none';
      this.streamingBatchStatusLabel.textContent = `Loaded 0 of ${streamingBatchCount} batches`;
      this.streamingBatchSpinner.style.visibility = 'visible';
      return;
    }

    const safeLoadedBatchCount = Math.min(
      streamingBatchCount,
      Math.max(0, Math.trunc(loadedBatchCount))
    );
    this.streamingBatchStatusRow.style.display = 'flex';
    this.streamingBatchStatusLabel.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
    this.streamingBatchSpinner.style.visibility =
      safeLoadedBatchCount < streamingBatchCount ? 'visible' : 'hidden';
  }

  private readonly handleRowCountSelection = (): void => {
    const rowCountKind = this.rowCountSelector?.value;
    if (isArrowText2DControlPanelRowCountKind(rowCountKind)) {
      void this.handlers.onRowCountChange(rowCountKind);
    }
  };

  private readonly handleSourceSelection = (): void => {
    const sourceKind = this.sourceSelector?.value;
    if (isArrowText2DControlPanelSourceKind(sourceKind)) {
      void this.handlers.onSourceChange(sourceKind);
    }
  };

  private readonly handleTextColorSelection = (): void => {
    const colorKind = this.textColorSelector?.value;
    if (isArrowText2DControlPanelColorKind(colorKind)) {
      void this.handlers.onColorColumnChange(colorKind);
    }
  };

  private readonly handleModelSelection = (): void => {
    const modelKind = this.modelSelector?.value;
    if (isArrowTextLayerModel(modelKind)) {
      this.handlers.onModelChange(modelKind);
    }
  };

  private readonly handleAnimateToggle = (): void => {
    this.handlers.onAnimateChange(Boolean(this.animateToggle?.checked));
  };

  private readonly handleClippingToggle = (): void => {
    this.handlers.onClippingChange(Boolean(this.clippingToggle?.checked));
  };

  private readonly handleColorToggle = (): void => {
    this.handlers.onColorChange(Boolean(this.colorToggle?.checked));
  };

  private readonly handleSizeToggle = (): void => {
    this.handlers.onSizeChange(Boolean(this.sizeToggle?.checked));
  };

  private readonly handleAngleToggle = (): void => {
    this.handlers.onAngleChange(Boolean(this.angleToggle?.checked));
  };

  private updateSelectorAvailability(): void {
    const isStreamingTable = this.state.rowCountKind.endsWith('-stream');
    if (this.rowCountSelector) {
      for (const option of Array.from(this.rowCountSelector.options)) {
        option.disabled =
          option.value.endsWith('-stream') && this.state.colorKind === 'character-colors';
      }
    }
    if (this.textColorSelector) {
      for (const option of Array.from(this.textColorSelector.options)) {
        option.disabled = option.value === 'character-colors' && isStreamingTable;
      }
    }
    if (!this.modelSelector) {
      return;
    }
    for (const option of Array.from(this.modelSelector.options)) {
      const modelKind = option.value;
      option.disabled =
        (modelKind !== 'attribute' &&
          modelKind !== 'auto' &&
          (this.device.type !== 'webgpu' || this.state.colorKind === 'character-colors')) ||
        (modelKind === 'dictionary' && this.state.sourceKind !== 'dictionary');
      if (modelKind === 'auto') {
        option.textContent = `auto (${getAutoTextModelLabel(this.device, this.state)})`;
      }
    }
    this.modelSelector.disabled = false;
  }
}

export function makeArrowText2DControlPanelHtml({
  streamingBatchCount,
  deckCharacterAttributeBytesPerGlyph
}: ArrowText2DControlPanelHtmlProps): string {
  return `\
  <p>
  Renders <code>arrow.Vector&lt;Utf8&gt;</code> and <code>arrow.Vector&lt;Dictionary&lt;Utf8&gt;&gt;</code>, 30 characters / row.
  </p>
  <style>
    @keyframes arrow-text-2d-streaming-spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
  <div style="min-height: 920px; max-height: calc(100vh - 72px); overflow: visible; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Table</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
        <select id="${ROW_COUNT_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="100k">100K rows</option>
          <option value="500k">500K rows</option>
          <option value="1m">1M rows</option>
          <option value="100k-stream">100K rows streamed</option>
          <option value="500k-stream">500K rows streamed</option>
          <option value="1m-stream">1M rows streamed</option>
        </select>
        <label for="${SOURCE_SELECTOR_ID}">Text</label>
        <select id="${SOURCE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="utf8">Utf8 - Utf8</option>
          <option value="dictionary">Dictionary - Dictionary&lt;Utf8&gt;</option>
        </select>
        <label for="${TEXT_COLOR_SELECTOR_ID}">Colors</label>
        <select id="${TEXT_COLOR_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="string-colors">Row - FixedSizeList&lt;Uint8, 4&gt;</option>
          <option value="character-colors">Character - List&lt;FixedSizeList&lt;Uint8, 4&gt;&gt;</option>
        </select>
        <label for="${MODEL_SELECTOR_ID}">Model</label>
        <select id="${MODEL_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="attribute">attribute</option>
          <option value="storage">storage</option>
          <option value="dictionary">dictionary</option>
          <option value="auto">auto</option>
        </select>
      </div>
    </section>
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Props</h3>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 18px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ANIMATE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input id="${ANIMATE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Animate</span>
        </label>
        <label for="${CLIPPING_TOGGLE_ID}" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input id="${CLIPPING_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Clip</span>
        </label>
        <label for="${COLOR_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input id="${COLOR_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Color</span>
        </label>
        <label for="${SIZE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input id="${SIZE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Size</span>
        </label>
        <label for="${ANGLE_TOGGLE_ID}" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input id="${ANGLE_TOGGLE_ID}" type="checkbox" checked style="width: 18px; height: 18px; margin: 0; accent-color: #2563eb;" />
          <span>Angle</span>
        </label>
      </div>
      <div id="${STREAMING_BATCH_STATUS_ROW_ID}" style="display: none; align-items: center; gap: 10px; margin-top: 12px; color: #334155; font-size: 13px; line-height: 1.4;">
        <span id="${STREAMING_BATCH_SPINNER_ID}" aria-hidden="true" style="width: 14px; height: 14px; flex: 0 0 14px; border: 2px solid rgba(148, 163, 184, 0.5); border-top-color: #2563eb; border-radius: 50%; animation: arrow-text-2d-streaming-spin 0.9s linear infinite;"></span>
        <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite">Loaded 0 of ${streamingBatchCount} batches</span>
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
            <th style="width: 16%; padding: 8px 8px 6px; text-align: right; font-weight: 700; white-space: nowrap;">expansion</th>
            <th style="width: 20%; padding: 8px 0 6px 8px; text-align: right; font-weight: 700; white-space: nowrap;">prep time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">text</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${ARROW_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TEXT_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums; white-space: pre-line;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${CPU_GENERATION_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">styles</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${GPU_STYLE_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${STYLE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${ARROW_VECTOR_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">deck.gl</th>
            <td style="padding: 6px 8px; text-align: right;">-</td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_ATTRIBUTE_SIZE_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${DECK_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
        </tbody>
      </table>
      <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; color: #334155; font-size: 13px; line-height: 1.4;">
        <span>Picked Arrow row</span>
        <strong id="${PICKED_LABEL_ID}" style="max-width: 220px; overflow-wrap: anywhere; color: #0f172a; font-variant-numeric: tabular-nums;">Hover text</strong>
      </div>
      <details style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
        <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">Scope notes</summary>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
          <thead>
            <tr style="border-top: 1px solid rgba(208, 215, 222, 0.9); border-bottom: 1px solid rgba(208, 215, 222, 0.9); color: #0f172a;">
              <th style="padding: 8px 0; text-align: left; font-weight: 700;">Not implemented yet</th>
              <th style="padding: 8px 0; text-align: left; font-weight: 700;">Current Arrow renderer scope</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
              <td style="padding: 7px 0;">Multiline layout and wrapping</td>
              <td style="padding: 7px 0;">One-line labels only</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
              <td style="padding: 7px 0;">Per-label size, angle, and pixel offset</td>
              <td style="padding: 7px 0;">Shared visual styling in the demo shader</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
              <td style="padding: 7px 0;">Storage-backed per-character colors</td>
              <td style="padding: 7px 0;">Attribute model expands row and character colors to glyph colors</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);">
              <td style="padding: 7px 0;">Content alignment modes</td>
              <td style="padding: 7px 0;">Packed i16x4 clip rectangles; no scroll alignment yet</td>
            </tr>
            <tr>
              <td style="padding: 7px 0;">Text backgrounds and outlines</td>
              <td style="padding: 7px 0;">Atlas-backed glyph rendering only</td>
            </tr>
          </tbody>
        </table>
      </details>
    </section>
  </div>
  `;
}

function isArrowText2DControlPanelRowCountKind(
  value: string | undefined
): value is ArrowText2DControlPanelRowCountKind {
  return (
    value === '100k' ||
    value === '500k' ||
    value === '1m' ||
    value === '100k-stream' ||
    value === '500k-stream' ||
    value === '1m-stream'
  );
}

function isArrowText2DControlPanelSourceKind(
  value: string | undefined
): value is ArrowText2DControlPanelSourceKind {
  return value === 'utf8' || value === 'dictionary';
}

function isArrowText2DControlPanelColorKind(
  value: string | undefined
): value is ArrowText2DControlPanelColorKind {
  return value === 'string-colors' || value === 'character-colors';
}

function isArrowTextLayerModel(value: string | undefined): value is ArrowTextLayerModel {
  return value === 'attribute' || value === 'storage' || value === 'dictionary' || value === 'auto';
}

function getAutoTextModelLabel(
  device: Device,
  state: Pick<ArrowText2DControlPanelState, 'sourceKind' | 'colorKind'>
): string {
  if (device.type !== 'webgpu' || state.colorKind === 'character-colors') {
    return 'attribute';
  }
  return state.sourceKind === 'dictionary' ? 'dictionary' : 'storage';
}

function setTextContent(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
