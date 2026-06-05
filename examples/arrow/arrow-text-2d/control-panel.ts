// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';
import type {ArrowTextRendererProps} from './arrow-text-renderer';
import {supportsVertexStorageBuffers} from '../utils/device-limits';

type TextModelKind = NonNullable<ArrowTextRendererProps['model']>;

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
const STORAGE_TEXT_VERTEX_STORAGE_BUFFER_COUNT = 8;
const DICTIONARY_TEXT_VERTEX_STORAGE_BUFFER_COUNT = 10;

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
  onRefresh: () => void;
};

export type ArrowText2DControlPanelHtmlProps = {
  streamingBatchCount: number;
  deckCharacterAttributeBytesPerGlyph: number;
};

export class ArrowText2DControlPanel {
  private readonly device: Device;
  private readonly handlers: ArrowText2DControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowText2DControlPanelState;
  private metrics: ArrowText2DControlPanelMetrics | null = null;
  private pickedLabel = 'Hover text';
  private loadedBatchCount: number | null = null;
  private streamingBatchCount = 0;
  private rootElement: HTMLElement | null = null;

  constructor({device, initialState, handlers, onRefresh}: ArrowText2DControlPanelOptions) {
    this.device = device;
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-text-2d-settings',
      schema: makeArrowText2DSettingsSchema(device, initialState),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makePanel(htmlProps: ArrowText2DControlPanelHtmlProps): Panel {
    return new ColumnPanel({
      id: 'arrow-text-2d-controls',
      title: 'Controls',
      panels: [
        this.settingsPanel.makePanel(),
        makeHtmlCustomPanel({
          id: 'arrow-text-2d-status',
          title: 'Metrics',
          html: makeArrowText2DControlPanelHtml(htmlProps),
          onRender: rootElement => {
            this.rootElement = rootElement;
            this.render();
            return () => {
              if (this.rootElement === rootElement) {
                this.rootElement = null;
              }
            };
          }
        })
      ]
    });
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
    this.rootElement = null;
  }

  syncControls(state: Partial<ArrowText2DControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(
      makeArrowText2DSettingsSchema(this.device, this.state),
      this.state
    );
    this.onRefresh();
  }

  setMetricValues(metrics: ArrowText2DControlPanelMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
  }

  setPickedLabel(label: string): void {
    this.pickedLabel = label;
    setTextContent(this.rootElement, PICKED_LABEL_ID, label);
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
    this.state = settings as ArrowText2DControlPanelState;
    const rowCountKind = getChangedSetting(changedSettings, 'rowCountKind')?.nextValue;
    if (isArrowText2DControlPanelRowCountKind(rowCountKind)) {
      void this.handlers.onRowCountChange(rowCountKind);
    }
    const sourceKind = getChangedSetting(changedSettings, 'sourceKind')?.nextValue;
    if (isArrowText2DControlPanelSourceKind(sourceKind)) {
      void this.handlers.onSourceChange(sourceKind);
    }
    const colorKind = getChangedSetting(changedSettings, 'colorKind')?.nextValue;
    if (isArrowText2DControlPanelColorKind(colorKind)) {
      void this.handlers.onColorColumnChange(colorKind);
    }
    const sizeKind = getChangedSetting(changedSettings, 'sizeKind')?.nextValue;
    if (isArrowText2DControlPanelSizeKind(sizeKind)) {
      void this.handlers.onSizeColumnChange(sizeKind);
    }
    const angleKind = getChangedSetting(changedSettings, 'angleKind')?.nextValue;
    if (isArrowText2DControlPanelAngleKind(angleKind)) {
      void this.handlers.onAngleColumnChange(angleKind);
    }
    const clipRectsKind = getChangedSetting(changedSettings, 'clipRectsKind')?.nextValue;
    if (isArrowText2DControlPanelClipRectsKind(clipRectsKind)) {
      void this.handlers.onClipRectsColumnChange(clipRectsKind);
    }
    const modelKind = getChangedSetting(changedSettings, 'modelKind')?.nextValue;
    if (isTextModelKind(modelKind)) {
      this.handlers.onModelChange(modelKind);
    }
    const animate = getChangedSetting(changedSettings, 'animate')?.nextValue;
    if (typeof animate === 'boolean') {
      this.handlers.onAnimateChange(animate);
    }
  };

  private render(): void {
    setTextContent(this.rootElement, PICKED_LABEL_ID, this.pickedLabel);
    renderStreamingBatchStatus(this.rootElement, this.loadedBatchCount, this.streamingBatchCount);
    this.renderMetrics();
  }

  private renderMetrics(): void {
    if (!this.metrics) {
      return;
    }
    const metricsById: Record<string, string> = {
      [ARROW_VECTOR_BYTES_ID]: this.metrics.arrowVectorBytes,
      [STYLE_ARROW_BYTES_ID]: this.metrics.styleArrowBytes,
      [ARROW_VECTOR_BUILD_TIME_ID]: this.metrics.arrowVectorBuildTime,
      [CPU_GENERATION_TIME_ID]: this.metrics.cpuGenerationTime,
      [TOTAL_GPU_BYTES_ID]: this.metrics.totalGpuBytes,
      [TEXT_GPU_EXPANSION_ID]: this.metrics.textGpuExpansion,
      [GPU_STYLE_VECTOR_BYTES_ID]: this.metrics.gpuStyleVectorBytes,
      [STYLE_GPU_EXPANSION_ID]: this.metrics.styleGpuExpansion,
      [COMPUTE_GPU_BYTES_ID]: this.metrics.computeGpuBytes,
      [COMPUTE_GPU_EXPANSION_ID]: this.metrics.computeGpuExpansion,
      [TOTAL_ARROW_BYTES_ID]: this.metrics.totalArrowBytes,
      [TOTAL_LUMA_GPU_BYTES_ID]: this.metrics.totalLumaGpuBytes,
      [TOTAL_LUMA_GPU_EXPANSION_ID]: this.metrics.totalLumaGpuExpansion,
      [TOTAL_BUILD_TIME_ID]: this.metrics.totalBuildTime,
      [DECK_ATTRIBUTE_SIZE_ID]: this.metrics.deckAttributeSize,
      [DECK_GPU_EXPANSION_ID]: this.metrics.deckGpuExpansion
    };
    for (const [id, value] of Object.entries(metricsById)) {
      setTextContent(this.rootElement, id, value);
    }
  }
}

export function makeArrowText2DSettingsSchema(
  device: Device,
  state: ArrowText2DControlPanelState
): SettingsSchema {
  const supportsStorageText = supportsVertexStorageBuffers(
    device,
    STORAGE_TEXT_VERTEX_STORAGE_BUFFER_COUNT
  );
  const supportsDictionaryText = supportsVertexStorageBuffers(
    device,
    DICTIONARY_TEXT_VERTEX_STORAGE_BUFFER_COUNT
  );
  return {
    title: 'Settings',
    sections: [
      {
        id: 'data',
        name: 'Data',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'rowCountKind',
            label: 'Rows',
            type: 'select',
            persist: 'none',
            options: [
              {label: '10K, 30 chars per row', value: '10k-stream'},
              {label: '100K, 30 chars per row', value: '100k-stream'},
              {label: '1M, 30 chars per row', value: '1m-stream'}
            ]
          },
          {
            name: 'sourceKind',
            label: 'Text',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Strings - Utf8', value: 'utf8'},
              {label: 'Dictionary strings - Dictionary<Utf8>', value: 'dictionary'}
            ]
          },
          {
            name: 'colorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row - FixedSizeList<Uint8, 4>', value: 'string-colors'},
              {label: 'Character - List<FixedSizeList<Uint8, 4>>', value: 'character-colors'}
            ]
          },
          {
            name: 'sizeKind',
            label: 'Sizes',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row - Float32', value: 'row-sizes'}
            ]
          },
          {
            name: 'angleKind',
            label: 'Angles',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row - Float32', value: 'row-angles'}
            ]
          },
          {
            name: 'clipRectsKind',
            label: 'Clip Rects',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              {label: 'Row - FixedSizeList<Int16, 4>', value: 'row-clip-rects'}
            ]
          }
        ]
      },
      {
        id: 'props',
        name: 'Props',
        initiallyCollapsed: false,
        settings: [{name: 'animate', label: 'Animate', type: 'boolean', persist: 'none'}]
      },
      {
        id: 'renderer',
        name: 'Renderer',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'modelKind',
            label: 'Model',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'attribute', value: 'attribute'},
              ...(state.colorKind === 'character-colors' || !supportsStorageText
                ? []
                : [{label: 'storage', value: 'storage'}]),
              ...(state.colorKind === 'character-colors' ||
              state.sourceKind !== 'dictionary' ||
              !supportsDictionaryText
                ? []
                : [{label: 'dictionary', value: 'dictionary'}]),
              {label: `auto (${getAutoTextModelLabel(device, state)})`, value: 'auto'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowText2DControlPanelHtml({
  streamingBatchCount,
  deckCharacterAttributeBytesPerGlyph
}: ArrowText2DControlPanelHtmlProps): string {
  return `\
  <p>Renders Arrow strings and dictionary strings, 30 characters per row.</p>
  ${makeStatusRow('Batches', makeProgressBar(streamingBatchCount))}
  ${makeStatusRow('Picked', `<strong id="${PICKED_LABEL_ID}">Hover text</strong>`)}
  <table style="width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 12px;">
    <tbody>
      ${makeMetricTableRow('total', TOTAL_ARROW_BYTES_ID, TOTAL_LUMA_GPU_BYTES_ID, TOTAL_LUMA_GPU_EXPANSION_ID, TOTAL_BUILD_TIME_ID)}
      ${makeMetricTableRow('text', ARROW_VECTOR_BYTES_ID, TOTAL_GPU_BYTES_ID, TEXT_GPU_EXPANSION_ID, CPU_GENERATION_TIME_ID)}
      ${makeMetricTableRow('styles', STYLE_ARROW_BYTES_ID, GPU_STYLE_VECTOR_BYTES_ID, STYLE_GPU_EXPANSION_ID, ARROW_VECTOR_BUILD_TIME_ID)}
      ${makeMetricTableRow('compute', null, COMPUTE_GPU_BYTES_ID, COMPUTE_GPU_EXPANSION_ID, null)}
      ${makeMetricTableRow('deck.gl', null, DECK_ATTRIBUTE_SIZE_ID, DECK_GPU_EXPANSION_ID, null)}
    </tbody>
  </table>
  <p style="margin-bottom: 0; color: #64748b; font-size: 12px;">deck.gl estimate: ${deckCharacterAttributeBytesPerGlyph} bytes per glyph.</p>
  `;
}

function makeProgressBar(streamingBatchCount: number): string {
  return `<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="${streamingBatchCount}" aria-valuenow="0" style="display: none; position: relative; height: 24px; overflow: hidden; border: 1px solid #bfdbfe; border-radius: 6px; background: #dbeafe;"><span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #2563eb;"></span><span id="${STREAMING_BATCH_STATUS_LABEL_ID}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700;">Loaded 0 of ${streamingBatchCount} batches</span></div>`;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function makeMetricTableRow(
  label: string,
  arrowId: string | null,
  gpuId: string,
  expansionId: string,
  timeId: string | null
): string {
  return `<tr><th style="text-align: left; padding: 4px 6px 4px 0;">${label}</th><td style="text-align: right;">${arrowId ? `<strong id="${arrowId}">Measuring...</strong>` : '-'}</td><td style="text-align: right;"><strong id="${gpuId}">Measuring...</strong></td><td style="text-align: right;"><strong id="${expansionId}">-</strong></td><td style="text-align: right;">${timeId ? `<strong id="${timeId}">Measuring...</strong>` : '-'}</td></tr>`;
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
  const safeLoadedBatchCount = Math.min(streamingBatchCount, Math.max(0, Math.trunc(loadedBatchCount)));
  statusRow.style.display = 'block';
  statusRow.setAttribute('aria-valuenow', String(safeLoadedBatchCount));
  statusRow.setAttribute('aria-valuemax', String(streamingBatchCount));
  fill.style.width = `${getStreamingBatchProgressPercent(safeLoadedBatchCount, streamingBatchCount)}%`;
  label.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
}

function setTextContent(rootElement: HTMLElement | null, id: string, value: string): void {
  const element = getElement(rootElement, id);
  if (element) {
    element.textContent = value;
  }
}

function getElement(rootElement: HTMLElement | null, id: string): HTMLElement | null {
  return rootElement?.querySelector<HTMLElement>(`#${id}`) ?? null;
}

function isArrowText2DControlPanelRowCountKind(
  value: unknown
): value is ArrowText2DControlPanelRowCountKind {
  return value === '10k-stream' || value === '100k-stream' || value === '1m-stream';
}

function isArrowText2DControlPanelSourceKind(
  value: unknown
): value is ArrowText2DControlPanelSourceKind {
  return value === 'utf8' || value === 'dictionary';
}

function isArrowText2DControlPanelColorKind(
  value: unknown
): value is ArrowText2DControlPanelColorKind {
  return value === 'constant' || value === 'string-colors' || value === 'character-colors';
}

function isArrowText2DControlPanelSizeKind(
  value: unknown
): value is ArrowText2DControlPanelSizeKind {
  return value === 'constant' || value === 'row-sizes';
}

function isArrowText2DControlPanelAngleKind(
  value: unknown
): value is ArrowText2DControlPanelAngleKind {
  return value === 'constant' || value === 'row-angles';
}

function isArrowText2DControlPanelClipRectsKind(
  value: unknown
): value is ArrowText2DControlPanelClipRectsKind {
  return value === 'none' || value === 'row-clip-rects';
}

function isTextModelKind(value: unknown): value is TextModelKind {
  return value === 'attribute' || value === 'storage' || value === 'dictionary' || value === 'auto';
}

function getAutoTextModelLabel(
  device: Device,
  state: Pick<ArrowText2DControlPanelState, 'sourceKind' | 'colorKind'>
): string {
  if (state.colorKind === 'character-colors') {
    return 'attribute';
  }
  if (
    state.sourceKind === 'dictionary' &&
    supportsVertexStorageBuffers(device, DICTIONARY_TEXT_VERTEX_STORAGE_BUFFER_COUNT)
  ) {
    return 'dictionary';
  }
  if (supportsVertexStorageBuffers(device, STORAGE_TEXT_VERTEX_STORAGE_BUFFER_COUNT)) {
    return 'storage';
  }
  return 'attribute';
}

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  return streamingBatchCount <= 0 ? 0 : (loadedBatchCount / streamingBatchCount) * 100;
}
