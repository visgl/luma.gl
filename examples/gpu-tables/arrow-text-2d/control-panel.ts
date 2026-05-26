// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {ArrowTextLayerProps} from './arrow-text-layer';

type TextModelKind = NonNullable<ArrowTextLayerProps['model']>;

const ANIMATE_TOGGLE_ID = 'arrow-text-2d-animate';
const MODEL_SELECTOR_ID = 'arrow-text-2d-model';
const ROW_COUNT_SELECTOR_ID = 'arrow-text-2d-row-count';
const SOURCE_SELECTOR_ID = 'arrow-text-2d-source';
const TEXT_COLOR_SELECTOR_ID = 'arrow-text-2d-color-column';
const TEXT_SIZE_SELECTOR_ID = 'arrow-text-2d-size-column';
const TEXT_ANGLE_SELECTOR_ID = 'arrow-text-2d-angle-column';
const TEXT_CLIP_RECTS_SELECTOR_ID = 'arrow-text-2d-clip-rect-column';
const ARROW_VECTOR_BYTES_ID = 'arrow-text-2d-arrow-vector-bytes';
const STYLE_ARROW_BYTES_ID = 'arrow-text-2d-style-arrow-bytes';
const ARROW_VECTOR_BUILD_TIME_ID = 'arrow-text-2d-arrow-vector-build-time';
const CPU_GENERATION_TIME_ID = 'arrow-text-2d-cpu-generation-time';
const TOTAL_GPU_BYTES_ID = 'arrow-text-2d-total-gpu-bytes';
const TEXT_GPU_EXPANSION_ID = 'arrow-text-2d-text-gpu-expansion';
const GPU_STYLE_VECTOR_BYTES_ID = 'arrow-text-2d-gpu-style-vector-bytes';
const STYLE_GPU_EXPANSION_ID = 'arrow-text-2d-style-gpu-expansion';
const COMPUTE_GPU_BYTES_ID = 'arrow-text-2d-compute-gpu-bytes';
const COMPUTE_GPU_EXPANSION_ID = 'arrow-text-2d-compute-gpu-expansion';
const TOTAL_ARROW_BYTES_ID = 'arrow-text-2d-total-arrow-bytes';
const TOTAL_LUMA_GPU_BYTES_ID = 'arrow-text-2d-total-luma-gpu-bytes';
const TOTAL_LUMA_GPU_EXPANSION_ID = 'arrow-text-2d-total-luma-gpu-expansion';
const TOTAL_BUILD_TIME_ID = 'arrow-text-2d-total-build-time';
const DECK_ATTRIBUTE_SIZE_ID = 'arrow-text-2d-deck-attribute-size';
const DECK_GPU_EXPANSION_ID = 'arrow-text-2d-deck-gpu-expansion';
const PICKED_LABEL_ID = 'arrow-text-2d-picked-label';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-text-2d-streaming-batch-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-text-2d-streaming-batch-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-text-2d-streaming-batch-status-label';

export type ArrowText2DControlPanelRowCountKind =
  | '10k'
  | '100k'
  | '1m'
  | '10k-stream'
  | '100k-stream'
  | '1m-stream';
export type ArrowText2DControlPanelSourceKind = 'utf8' | 'dictionary';
export type ArrowText2DControlPanelColorKind = 'constant' | 'string-colors' | 'character-colors';
export type ArrowText2DControlPanelSizeKind = 'constant' | 'row-sizes';
export type ArrowText2DControlPanelAngleKind = 'constant' | 'row-angles';
export type ArrowText2DControlPanelClipRectsKind = 'none' | 'row-clip-rects';

export type ArrowText2DControlPanelState = {
  rowCountKind: ArrowText2DControlPanelRowCountKind;
  sourceKind: ArrowText2DControlPanelSourceKind;
  colorKind: ArrowText2DControlPanelColorKind;
  sizeKind: ArrowText2DControlPanelSizeKind;
  angleKind: ArrowText2DControlPanelAngleKind;
  clipRectsKind: ArrowText2DControlPanelClipRectsKind;
  modelKind: TextModelKind;
  animate: boolean;
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
  computeGpuBytes: string;
  computeGpuExpansion: string;
  totalArrowBytes: string;
  totalLumaGpuBytes: string;
  totalLumaGpuExpansion: string;
  totalBuildTime: string;
  deckAttributeSize: string;
  deckGpuExpansion: string;
};

export type ArrowText2DControlPanelHandlers = {
  onRowCountChange: (rowCountKind: ArrowText2DControlPanelRowCountKind) => void | Promise<void>;
  onSourceChange: (sourceKind: ArrowText2DControlPanelSourceKind) => void | Promise<void>;
  onColorColumnChange: (colorKind: ArrowText2DControlPanelColorKind) => void | Promise<void>;
  onSizeColumnChange: (sizeKind: ArrowText2DControlPanelSizeKind) => void | Promise<void>;
  onAngleColumnChange: (angleKind: ArrowText2DControlPanelAngleKind) => void | Promise<void>;
  onClipRectsColumnChange: (
    clipRectsKind: ArrowText2DControlPanelClipRectsKind
  ) => void | Promise<void>;
  onModelChange: (modelKind: TextModelKind) => void;
  onAnimateChange: (enabled: boolean) => void;
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
  private modelSelector: HTMLSelectElement | null = null;
  private rowCountSelector: HTMLSelectElement | null = null;
  private sourceSelector: HTMLSelectElement | null = null;
  private textColorSelector: HTMLSelectElement | null = null;
  private textSizeSelector: HTMLSelectElement | null = null;
  private textAngleSelector: HTMLSelectElement | null = null;
  private textClipRectsSelector: HTMLSelectElement | null = null;
  private arrowVectorBytesLabel: HTMLElement | null = null;
  private styleArrowBytesLabel: HTMLElement | null = null;
  private arrowVectorBuildTimeLabel: HTMLElement | null = null;
  private cpuGenerationTimeLabel: HTMLElement | null = null;
  private totalGpuBytesLabel: HTMLElement | null = null;
  private textGpuExpansionLabel: HTMLElement | null = null;
  private gpuStyleVectorBytesLabel: HTMLElement | null = null;
  private styleGpuExpansionLabel: HTMLElement | null = null;
  private computeGpuBytesLabel: HTMLElement | null = null;
  private computeGpuExpansionLabel: HTMLElement | null = null;
  private totalArrowBytesLabel: HTMLElement | null = null;
  private totalLumaGpuBytesLabel: HTMLElement | null = null;
  private totalLumaGpuExpansionLabel: HTMLElement | null = null;
  private totalBuildTimeLabel: HTMLElement | null = null;
  private deckAttributeSizeLabel: HTMLElement | null = null;
  private deckGpuExpansionLabel: HTMLElement | null = null;
  private pickedLabel: HTMLElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({device, initialState, handlers}: ArrowText2DControlPanelOptions) {
    this.device = device;
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    this.animateToggle = document.getElementById(ANIMATE_TOGGLE_ID) as HTMLInputElement | null;
    this.modelSelector = document.getElementById(MODEL_SELECTOR_ID) as HTMLSelectElement | null;
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    this.textColorSelector = document.getElementById(
      TEXT_COLOR_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.textSizeSelector = document.getElementById(
      TEXT_SIZE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.textAngleSelector = document.getElementById(
      TEXT_ANGLE_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.textClipRectsSelector = document.getElementById(
      TEXT_CLIP_RECTS_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.arrowVectorBytesLabel = document.getElementById(ARROW_VECTOR_BYTES_ID);
    this.styleArrowBytesLabel = document.getElementById(STYLE_ARROW_BYTES_ID);
    this.arrowVectorBuildTimeLabel = document.getElementById(ARROW_VECTOR_BUILD_TIME_ID);
    this.cpuGenerationTimeLabel = document.getElementById(CPU_GENERATION_TIME_ID);
    this.totalGpuBytesLabel = document.getElementById(TOTAL_GPU_BYTES_ID);
    this.textGpuExpansionLabel = document.getElementById(TEXT_GPU_EXPANSION_ID);
    this.gpuStyleVectorBytesLabel = document.getElementById(GPU_STYLE_VECTOR_BYTES_ID);
    this.styleGpuExpansionLabel = document.getElementById(STYLE_GPU_EXPANSION_ID);
    this.computeGpuBytesLabel = document.getElementById(COMPUTE_GPU_BYTES_ID);
    this.computeGpuExpansionLabel = document.getElementById(COMPUTE_GPU_EXPANSION_ID);
    this.totalArrowBytesLabel = document.getElementById(TOTAL_ARROW_BYTES_ID);
    this.totalLumaGpuBytesLabel = document.getElementById(TOTAL_LUMA_GPU_BYTES_ID);
    this.totalLumaGpuExpansionLabel = document.getElementById(TOTAL_LUMA_GPU_EXPANSION_ID);
    this.totalBuildTimeLabel = document.getElementById(TOTAL_BUILD_TIME_ID);
    this.deckAttributeSizeLabel = document.getElementById(DECK_ATTRIBUTE_SIZE_ID);
    this.deckGpuExpansionLabel = document.getElementById(DECK_GPU_EXPANSION_ID);
    this.pickedLabel = document.getElementById(PICKED_LABEL_ID);
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);

    this.syncControls(this.state);
    this.animateToggle?.addEventListener('change', this.handleAnimateToggle);
    this.modelSelector?.addEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.addEventListener('change', this.handleRowCountSelection);
    this.sourceSelector?.addEventListener('change', this.handleSourceSelection);
    this.textColorSelector?.addEventListener('change', this.handleTextColorSelection);
    this.textSizeSelector?.addEventListener('change', this.handleTextSizeSelection);
    this.textAngleSelector?.addEventListener('change', this.handleTextAngleSelection);
    this.textClipRectsSelector?.addEventListener('change', this.handleTextClipRectsSelection);
  }

  destroy(): void {
    this.animateToggle?.removeEventListener('change', this.handleAnimateToggle);
    this.modelSelector?.removeEventListener('change', this.handleModelSelection);
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountSelection);
    this.sourceSelector?.removeEventListener('change', this.handleSourceSelection);
    this.textColorSelector?.removeEventListener('change', this.handleTextColorSelection);
    this.textSizeSelector?.removeEventListener('change', this.handleTextSizeSelection);
    this.textAngleSelector?.removeEventListener('change', this.handleTextAngleSelection);
    this.textClipRectsSelector?.removeEventListener('change', this.handleTextClipRectsSelection);
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
    if (this.textSizeSelector) {
      this.textSizeSelector.value = this.state.sizeKind;
    }
    if (this.textAngleSelector) {
      this.textAngleSelector.value = this.state.angleKind;
    }
    if (this.textClipRectsSelector) {
      this.textClipRectsSelector.value = this.state.clipRectsKind;
    }
    if (this.modelSelector) {
      this.modelSelector.value = this.state.modelKind;
    }
    if (this.animateToggle) {
      this.animateToggle.checked = this.state.animate;
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
    setTextContent(this.computeGpuBytesLabel, metrics.computeGpuBytes);
    setTextContent(this.computeGpuExpansionLabel, metrics.computeGpuExpansion);
    setTextContent(this.totalArrowBytesLabel, metrics.totalArrowBytes);
    setTextContent(this.totalLumaGpuBytesLabel, metrics.totalLumaGpuBytes);
    setTextContent(this.totalLumaGpuExpansionLabel, metrics.totalLumaGpuExpansion);
    setTextContent(this.totalBuildTimeLabel, metrics.totalBuildTime);
    setTextContent(this.deckAttributeSizeLabel, metrics.deckAttributeSize);
    setTextContent(this.deckGpuExpansionLabel, metrics.deckGpuExpansion);
  }

  setPickedLabel(label: string): void {
    setTextContent(this.pickedLabel, label);
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

  private readonly handleTextSizeSelection = (): void => {
    const sizeKind = this.textSizeSelector?.value;
    if (isArrowText2DControlPanelSizeKind(sizeKind)) {
      void this.handlers.onSizeColumnChange(sizeKind);
    }
  };

  private readonly handleTextAngleSelection = (): void => {
    const angleKind = this.textAngleSelector?.value;
    if (isArrowText2DControlPanelAngleKind(angleKind)) {
      void this.handlers.onAngleColumnChange(angleKind);
    }
  };

  private readonly handleTextClipRectsSelection = (): void => {
    const clipRectsKind = this.textClipRectsSelector?.value;
    if (isArrowText2DControlPanelClipRectsKind(clipRectsKind)) {
      void this.handlers.onClipRectsColumnChange(clipRectsKind);
    }
  };

  private readonly handleModelSelection = (): void => {
    const modelKind = this.modelSelector?.value;
    if (isTextModelKind(modelKind)) {
      this.handlers.onModelChange(modelKind);
    }
  };

  private readonly handleAnimateToggle = (): void => {
    this.handlers.onAnimateChange(Boolean(this.animateToggle?.checked));
  };

  private updateSelectorAvailability(): void {
    if (this.rowCountSelector) {
      for (const option of Array.from(this.rowCountSelector.options)) {
        option.disabled = false;
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
  Renders Arrow strings and dictionary strings, 30 characters / row.
  </p>
  <div style="max-height: calc(100vh - 72px); overflow-y: auto; overflow-x: hidden; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Table</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
        <select id="${ROW_COUNT_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="10k-stream">10K, 30 chars per row</option>
          <option value="100k-stream">100K, 30 chars per row</option>
          <option value="1m-stream">1M, 30 chars per row</option>
        </select>
        <span>Batches</span>
        <div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="${streamingBatchCount}" aria-valuenow="0" style="box-sizing: border-box; display: none; position: relative; width: 100%; min-width: 0; height: 34px; overflow: hidden; border: 1px solid rgba(37, 99, 235, 0.32); border-radius: 6px; background: #dbeafe; color: #0f172a; font-size: 13px; line-height: 1.4;">
          <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%); transition: width 220ms ease;"></span>
          <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 of ${streamingBatchCount} batches</span>
        </div>
        <label for="${SOURCE_SELECTOR_ID}">Text</label>
        <select id="${SOURCE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="utf8">Strings - Utf8</option>
          <option value="dictionary">Dictionary strings - Dictionary&lt;Utf8&gt;</option>
        </select>
        <label for="${TEXT_COLOR_SELECTOR_ID}">Colors</label>
        <select id="${TEXT_COLOR_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="constant">Constant</option>
          <option value="string-colors">Row - FixedSizeList&lt;Uint8, 4&gt;</option>
          <option value="character-colors">Character - List&lt;FixedSizeList&lt;Uint8, 4&gt;&gt;</option>
        </select>
        <label for="${TEXT_SIZE_SELECTOR_ID}">Sizes</label>
        <select id="${TEXT_SIZE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="constant">Constant</option>
          <option value="row-sizes">Row - Float32</option>
        </select>
        <label for="${TEXT_ANGLE_SELECTOR_ID}">Angles</label>
        <select id="${TEXT_ANGLE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="constant">Constant</option>
          <option value="row-angles">Row - Float32</option>
        </select>
        <label for="${TEXT_CLIP_RECTS_SELECTOR_ID}">Clip Rects</label>
        <select id="${TEXT_CLIP_RECTS_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="none">None</option>
          <option value="row-clip-rects">Row - FixedSizeList&lt;Int16, 4&gt;</option>
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
      </div>
    </section>
    <section style="overflow: visible; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Metrics</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${MODEL_SELECTOR_ID}">Model</label>
        <select id="${MODEL_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="attribute">attribute</option>
          <option value="storage">storage</option>
          <option value="dictionary">dictionary</option>
          <option value="auto">auto</option>
        </select>
      </div>
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
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_LUMA_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_LUMA_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${TOTAL_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
          </tr>
          <tr>
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">text</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${ARROW_VECTOR_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TOTAL_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${TEXT_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
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
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">compute</th>
            <td style="padding: 6px 8px; text-align: right;">-</td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${COMPUTE_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${COMPUTE_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;">-</td>
          </tr>
          <tr style="font-style: italic;">
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
  return value === '10k-stream' || value === '100k-stream' || value === '1m-stream';
}

function isArrowText2DControlPanelSourceKind(
  value: string | undefined
): value is ArrowText2DControlPanelSourceKind {
  return value === 'utf8' || value === 'dictionary';
}

function isArrowText2DControlPanelColorKind(
  value: string | undefined
): value is ArrowText2DControlPanelColorKind {
  return value === 'constant' || value === 'string-colors' || value === 'character-colors';
}

function isArrowText2DControlPanelSizeKind(
  value: string | undefined
): value is ArrowText2DControlPanelSizeKind {
  return value === 'constant' || value === 'row-sizes';
}

function isArrowText2DControlPanelAngleKind(
  value: string | undefined
): value is ArrowText2DControlPanelAngleKind {
  return value === 'constant' || value === 'row-angles';
}

function isArrowText2DControlPanelClipRectsKind(
  value: string | undefined
): value is ArrowText2DControlPanelClipRectsKind {
  return value === 'none' || value === 'row-clip-rects';
}

function isTextModelKind(value: string | undefined): value is TextModelKind {
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

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  if (streamingBatchCount <= 0) {
    return 0;
  }
  return (loadedBatchCount / streamingBatchCount) * 100;
}

function setTextContent(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
