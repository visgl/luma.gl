// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
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
import type {
  ArrowLineRendererMode,
  ArrowLineRendererModel,
  ArrowLineRendererTimeColumn
} from './arrow-line-renderer';
import {supportsVertexStorageBuffers} from '../utils/device-limits';

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
  measureSweepEnabled: boolean;
  widthsEnabled: boolean;
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
  rowLabels: ArrowLineControlPanelRowLabels;
  deckPathAttributeBytesPerSegment: number;
  initialState: ArrowLineControlPanelState;
  handlers: ArrowLineControlPanelHandlers;
  onRefresh: () => void;
};

export class ArrowLineControlPanel {
  private readonly device: Device;
  private readonly rowLabels: ArrowLineControlPanelRowLabels;
  private readonly deckPathAttributeBytesPerSegment: number;
  private readonly handlers: ArrowLineControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowLineControlPanelState;
  private metrics: ArrowLineControlPanelMetrics | null = null;
  private loadedBatchCount: number | null = null;
  private streamingBatchCount = 0;
  private rootElement: HTMLElement | null = null;

  constructor({
    device,
    rowLabels,
    deckPathAttributeBytesPerSegment,
    initialState,
    handlers,
    onRefresh
  }: ArrowLineControlPanelOptions) {
    this.device = device;
    this.rowLabels = rowLabels;
    this.deckPathAttributeBytesPerSegment = deckPathAttributeBytesPerSegment;
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-lines-settings',
      schema: makeArrowLineSettingsSchema(device, rowLabels, initialState),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-lines-description',
      title: 'Description',
      html: makeArrowLineControlPanelHtml({
        rowLabels: this.rowLabels,
        deckPathAttributeBytesPerSegment: this.deckPathAttributeBytesPerSegment
      }),
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

  syncControls(state: Partial<ArrowLineControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(
      makeArrowLineSettingsSchema(this.device, this.rowLabels, this.state),
      this.state
    );
    this.onRefresh();
  }

  setMetricValues(metrics: ArrowLineControlPanelMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
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
    this.state = settings as ArrowLineControlPanelState;
    const rowCountKind = getChangedSetting(changedSettings, 'rowCountKind')?.nextValue;
    if (isArrowLineControlPanelRowCountKind(rowCountKind)) {
      void this.handlers.onRowCountChange(rowCountKind);
    }
    const mode = getChangedSetting(changedSettings, 'mode')?.nextValue;
    if (isArrowLineControlPanelMode(mode)) {
      void this.handlers.onModeChange(mode);
    }
    const coordinateKind = getChangedSetting(changedSettings, 'coordinateKind')?.nextValue;
    if (isArrowLineControlPanelCoordinateKind(coordinateKind)) {
      void this.handlers.onCoordinateChange(coordinateKind);
    }
    const colorKind = getChangedSetting(changedSettings, 'colorKind')?.nextValue;
    if (isArrowLineControlPanelColorKind(colorKind)) {
      void this.handlers.onColorChange(colorKind);
    }
    const timeKind = getChangedSetting(changedSettings, 'timeKind')?.nextValue;
    if (isArrowLineControlPanelTimeKind(timeKind)) {
      void this.handlers.onTimeChange(timeKind);
    }
    const modelKind = getChangedSetting(changedSettings, 'modelKind')?.nextValue;
    if (isArrowLineRendererModel(modelKind)) {
      void this.handlers.onModelChange(modelKind);
    }
    const measureSweepEnabled = getChangedSetting(
      changedSettings,
      'measureSweepEnabled'
    )?.nextValue;
    if (typeof measureSweepEnabled === 'boolean') {
      this.handlers.onMeasureSweepChange(measureSweepEnabled);
    }
    const widthsEnabled = getChangedSetting(changedSettings, 'widthsEnabled')?.nextValue;
    if (typeof widthsEnabled === 'boolean') {
      this.handlers.onWidthChange(widthsEnabled);
    }
    const capKind = getChangedSetting(changedSettings, 'capKind')?.nextValue;
    if (isArrowLineControlPanelCapKind(capKind)) {
      this.handlers.onCapChange(capKind);
    }
    const jointKind = getChangedSetting(changedSettings, 'jointKind')?.nextValue;
    if (isArrowLineControlPanelJointKind(jointKind)) {
      this.handlers.onJointChange(jointKind);
    }
    const miterLimit = getChangedSetting(changedSettings, 'miterLimit')?.nextValue;
    if (typeof miterLimit === 'number') {
      this.handlers.onMiterLimitChange(miterLimit);
    }
  };

  private render(): void {
    renderStreamingBatchStatus(this.rootElement, this.loadedBatchCount, this.streamingBatchCount);
    this.renderMetrics();
  }

  private renderMetrics(): void {
    if (!this.metrics) {
      return;
    }
    const metricsById: Record<string, string> = {
      [PATH_COUNT_ID]: this.metrics.pathCount,
      [SEGMENT_COUNT_ID]: this.metrics.segmentCount,
      [PATH_ARROW_BYTES_ID]: this.metrics.pathArrowBytes,
      [PATH_GPU_BYTES_ID]: this.metrics.pathGpuBytes,
      [PATH_GPU_EXPANSION_ID]: this.metrics.pathGpuExpansion,
      [PATH_PREP_TIME_ID]: this.metrics.pathPrepTime,
      [STYLE_ARROW_BYTES_ID]: this.metrics.styleArrowBytes,
      [STYLE_GPU_BYTES_ID]: this.metrics.styleGpuBytes,
      [STYLE_GPU_EXPANSION_ID]: this.metrics.styleGpuExpansion,
      [STYLE_BUILD_TIME_ID]: this.metrics.styleBuildTime,
      [COMPUTE_GPU_BYTES_ID]: this.metrics.computeGpuBytes,
      [COMPUTE_GPU_EXPANSION_ID]: this.metrics.computeGpuExpansion,
      [TOTAL_ARROW_BYTES_ID]: this.metrics.totalArrowBytes,
      [TOTAL_GPU_BYTES_ID]: this.metrics.totalGpuBytes,
      [TOTAL_GPU_EXPANSION_ID]: this.metrics.totalGpuExpansion,
      [DECK_GPU_BYTES_ID]: this.metrics.deckGpuBytes,
      [DECK_GPU_EXPANSION_ID]: this.metrics.deckGpuExpansion
    };
    for (const [id, value] of Object.entries(metricsById)) {
      setMetricText(this.rootElement, id, value);
    }
  }
}

export function makeArrowLineSettingsSchema(
  device: Device,
  rowLabels: ArrowLineControlPanelRowLabels,
  state: ArrowLineControlPanelState
): SettingsSchema {
  const supportsStoragePath = supportsVertexStorageBuffers(
    device,
    STORAGE_PATH_VERTEX_STORAGE_BUFFER_COUNT
  );
  const supportsTripsPath = supportsVertexStorageBuffers(
    device,
    TRIPS_PATH_VERTEX_STORAGE_BUFFER_COUNT
  );
  const isPolygonMode = state.mode === 'polygons';
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
              {label: rowLabels['240-stream'], value: '240-stream'},
              {label: rowLabels['2400-stream'], value: '2400-stream'}
            ]
          },
          {
            name: 'mode',
            label: 'Mode',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Lines', value: 'lines'},
              {label: 'Polygon outlines', value: 'polygons'}
            ]
          },
          {
            name: 'coordinateKind',
            label: 'Lines',
            type: 'select',
            persist: 'none',
            options: isPolygonMode
              ? [{label: 'DenseUnion - Polygon/MultiPolygon outlines', value: 'dense-union'}]
              : [
                  {label: 'Float32 - List<FixedSizeList<Float32, 4>>', value: 'float32'},
                  {label: 'Float64 - List<FixedSizeList<Float64, 4>>', value: 'float64'},
                  {
                    label: 'DenseUnion - LineString/MultiLineString',
                    value: 'dense-union'
                  }
                ]
          },
          {
            name: 'colorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              {label: 'Row - FixedSizeList<Uint8, 4>', value: 'row-colors'},
              ...(isPolygonMode
                ? []
                : [{label: 'Vertex - List<FixedSizeList<Uint8, 4>>', value: 'vertex-colors'}])
            ]
          },
          {
            name: 'timeKind',
            label: 'Time',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              ...(isPolygonMode ? [] : [{label: 'M coordinate - XYZM', value: 'xyzm'}]),
              ...(isPolygonMode || !supportsTripsPath
                ? []
                : [{label: 'timestamp - List<TimestampMillisecond>', value: 'timestamps'}])
            ]
          }
        ]
      },
      {
        id: 'props',
        name: 'Props',
        initiallyCollapsed: false,
        settings: [
          {name: 'measureSweepEnabled', label: 'Animate', type: 'boolean', persist: 'none'},
          {name: 'widthsEnabled', label: 'Width', type: 'boolean', persist: 'none'},
          {
            name: 'capKind',
            label: 'Caps',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Square', value: 'square'},
              {label: 'Round', value: 'round'}
            ]
          },
          {
            name: 'jointKind',
            label: 'Joins',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Miter', value: 'miter'},
              {label: 'Round', value: 'round'}
            ]
          },
          ...(state.jointKind === 'miter'
            ? [
                {
                  name: 'miterLimit',
                  label: 'Miter',
                  type: 'number' as const,
                  persist: 'none' as const,
                  min: 1,
                  max: 8,
                  step: 0.25
                }
              ]
            : [])
        ]
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
              ...(state.timeKind === 'timestamps'
                ? []
                : [{label: 'Attributes', value: 'attribute'}]),
              ...(supportsStoragePath && state.timeKind !== 'timestamps'
                ? [{label: 'Storage', value: 'storage'}]
                : []),
              ...(supportsTripsPath && state.timeKind === 'timestamps' && !isPolygonMode
                ? [{label: 'Trips', value: 'trips'}]
                : []),
              {label: `Auto (${getAutoPathModelLabel(device, state.timeKind)})`, value: 'auto'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowLineControlPanelHtml({
  deckPathAttributeBytesPerSegment
}: ArrowLineControlPanelProps): string {
  return `\
  <p>Renders Arrow line rows through <code>ArrowLineRenderer</code>, including DenseUnion line strings and polygon outlines.</p>
  ${makeStatusRow('Batches', makeProgressBar())}
  ${makeMetricRow('Arrow line rows', PATH_COUNT_ID)}
  ${makeMetricRow('Generated segment rows', SEGMENT_COUNT_ID)}
  <table style="width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 12px;">
    <tbody>
      ${makeMetricTableRow('total', TOTAL_ARROW_BYTES_ID, TOTAL_GPU_BYTES_ID, TOTAL_GPU_EXPANSION_ID, null)}
      ${makeMetricTableRow('lines + time', PATH_ARROW_BYTES_ID, PATH_GPU_BYTES_ID, PATH_GPU_EXPANSION_ID, PATH_PREP_TIME_ID)}
      ${makeMetricTableRow('styles', STYLE_ARROW_BYTES_ID, STYLE_GPU_BYTES_ID, STYLE_GPU_EXPANSION_ID, STYLE_BUILD_TIME_ID)}
      ${makeMetricTableRow('compute', null, COMPUTE_GPU_BYTES_ID, COMPUTE_GPU_EXPANSION_ID, null)}
      ${makeMetricTableRow('deck.gl', null, DECK_GPU_BYTES_ID, DECK_GPU_EXPANSION_ID, null)}
    </tbody>
  </table>
  <p style="margin-bottom: 0; color: #64748b; font-size: 12px;">deck.gl estimate: ${deckPathAttributeBytesPerSegment} bytes per generated segment.</p>
  `;
}

function makeProgressBar(): string {
  return `<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="display: none; position: relative; height: 24px; overflow: hidden; border: 1px solid #bfdbfe; border-radius: 6px; background: #dbeafe;"><span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #2563eb;"></span><span id="${STREAMING_BATCH_STATUS_LABEL_ID}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700;">Loaded 0 batches</span></div>`;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px;"><span>${label}</span><strong id="${id}">Measuring...</strong></div>`;
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
  const safeLoadedBatchCount = Math.min(
    streamingBatchCount,
    Math.max(0, Math.trunc(loadedBatchCount))
  );
  statusRow.style.display = 'block';
  statusRow.setAttribute('aria-valuenow', String(safeLoadedBatchCount));
  statusRow.setAttribute('aria-valuemax', String(streamingBatchCount));
  fill.style.width = `${getStreamingBatchProgressPercent(safeLoadedBatchCount, streamingBatchCount)}%`;
  label.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
}

function setMetricText(rootElement: HTMLElement | null, id: string, value: string): void {
  const element = getElement(rootElement, id);
  if (element) {
    element.textContent = value;
  }
}

function getElement(rootElement: HTMLElement | null, id: string): HTMLElement | null {
  return rootElement?.querySelector<HTMLElement>(`#${id}`) ?? null;
}

function isArrowLineControlPanelRowCountKind(
  value: unknown
): value is ArrowLineControlPanelRowCountKind {
  return value === '240-stream' || value === '2400-stream';
}

function isArrowLineControlPanelMode(value: unknown): value is ArrowLineControlPanelMode {
  return value === 'lines' || value === 'polygons';
}

function isArrowLineControlPanelCoordinateKind(
  value: unknown
): value is ArrowLineControlPanelCoordinateKind {
  return value === 'float32' || value === 'float64' || value === 'dense-union';
}

function isArrowLineControlPanelColorKind(value: unknown): value is ArrowLineControlPanelColorKind {
  return value === 'none' || value === 'row-colors' || value === 'vertex-colors';
}

function isArrowLineControlPanelTimeKind(value: unknown): value is ArrowLineControlPanelTimeKind {
  return value === 'none' || value === 'xyzm' || value === 'timestamps';
}

function isArrowLineControlPanelCapKind(value: unknown): value is ArrowLineControlPanelCapKind {
  return value === 'square' || value === 'round';
}

function isArrowLineControlPanelJointKind(value: unknown): value is ArrowLineControlPanelJointKind {
  return value === 'miter' || value === 'round';
}

function isArrowLineRendererModel(value: unknown): value is ArrowLineRendererModel {
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
    return 'Attributes';
  }
  return timeKind === 'timestamps' ? 'Trips' : 'Storage';
}
