// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CustomPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {Fragment, h, render} from 'preact';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  POINT_DATASETS,
  POINT_TRAIL_LENGTH_MILLISECONDS,
  type ArrowPointColorKind,
  type ArrowPointRadiusKind,
  type ArrowPointRowCountKind,
  type ArrowPointSourceKind,
  type ArrowPointTimeKind
} from './arrow-point-generator';
import type {ArrowPointRendererMetrics} from './arrow-point-renderer';
import type {PointModelMode} from './point-model';

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
  radiusKind: ArrowPointRadiusKind;
  modelMode: PointModelMode;
  animate: boolean;
};

export type ArrowPointControlPanelProps = {
  initialState: ArrowPointControlPanelState;
  handlers: {
    onRowCountKindChange: (rowCountKind: ArrowPointRowCountKind) => void | Promise<void>;
    onSourceKindChange: (sourceKind: ArrowPointSourceKind) => void;
    onTimeKindChange: (timeKind: ArrowPointTimeKind) => void;
    onColorKindChange: (colorKind: ArrowPointColorKind) => void;
    onRadiusKindChange: (radiusKind: ArrowPointRadiusKind) => void;
    onModelModeChange: (modelMode: PointModelMode) => void;
    onAnimateChange: (enabled: boolean) => void;
  };
  onRefresh: () => void;
  supportsStorage: boolean;
};

type ArrowPointPanelLabels = {
  currentTimeLabel: string;
  loadedBatchCount: number | null;
  batchCount: number;
};

export class ArrowPointControlPanel {
  private readonly handlers: ArrowPointControlPanelProps['handlers'];
  private readonly onRefresh: () => void;
  private readonly supportsStorage: boolean;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowPointControlPanelState;
  private metrics: ArrowPointRendererMetrics | null = null;
  private labels: ArrowPointPanelLabels = {
    currentTimeLabel: '-',
    loadedBatchCount: null,
    batchCount: 0
  };
  private rootElement: HTMLElement | null = null;
  private settingsRootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh, supportsStorage}: ArrowPointControlPanelProps) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.supportsStorage = supportsStorage;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-points-settings',
      schema: makeArrowPointSettingsSchema(initialState, supportsStorage),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-points-description',
      title: 'Description',
      html: makeArrowPointControlPanelHtml(),
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
    const settingsPanel = this.settingsPanel.makePanel();
    return new CustomPanel({
      id: 'arrow-points-settings-and-metrics',
      title: 'Settings',
      onRenderHTML: rootElement => {
        render(
          h(
            Fragment,
            {},
            settingsPanel.content,
            h('div', {
              style: {marginTop: '16px'},
              dangerouslySetInnerHTML: {__html: makeArrowPointMetricsHtml()}
            })
          ),
          rootElement
        );
        this.settingsRootElement = rootElement;
        this.renderMetrics();
        return () => {
          if (this.settingsRootElement === rootElement) {
            this.settingsRootElement = null;
          }
          render(null, rootElement);
        };
      }
    });
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
    this.rootElement = null;
    this.settingsRootElement = null;
  }

  syncControls(state: Partial<ArrowPointControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(
      makeArrowPointSettingsSchema(this.state, this.supportsStorage),
      this.state
    );
    this.onRefresh();
  }

  setMetrics(metrics: ArrowPointRendererMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
  }

  setCurrentTimeLabel(label: string): void {
    this.labels.currentTimeLabel = label;
    setLabel(this.rootElement, CURRENT_TIME_ID, label);
  }

  setStreamingBatchStatus(loadedBatchCount: number, batchCount: number): void {
    this.labels.loadedBatchCount = loadedBatchCount;
    this.labels.batchCount = batchCount;
    renderStreamingBatchStatus(this.rootElement, loadedBatchCount, batchCount);
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.state = settings as ArrowPointControlPanelState;
    const rowCountKind = getChangedSetting(changedSettings, 'rowCountKind')?.nextValue;
    if (isRowCountKind(rowCountKind)) {
      void this.handlers.onRowCountKindChange(rowCountKind);
    }
    const sourceKind = getChangedSetting(changedSettings, 'sourceKind')?.nextValue;
    if (isSourceKind(sourceKind)) {
      this.handlers.onSourceKindChange(sourceKind);
    }
    const timeKind = getChangedSetting(changedSettings, 'timeKind')?.nextValue;
    if (isTimeKind(timeKind)) {
      this.handlers.onTimeKindChange(timeKind);
    }
    const colorKind = getChangedSetting(changedSettings, 'colorKind')?.nextValue;
    if (isColorKind(colorKind)) {
      this.handlers.onColorKindChange(colorKind);
    }
    const radiusKind = getChangedSetting(changedSettings, 'radiusKind')?.nextValue;
    if (isRadiusKind(radiusKind)) {
      this.handlers.onRadiusKindChange(radiusKind);
    }
    const modelMode = getChangedSetting(changedSettings, 'modelMode')?.nextValue;
    if (modelMode === 'attributes' || modelMode === 'storage') {
      this.handlers.onModelModeChange(modelMode);
    }
    const animate = getChangedSetting(changedSettings, 'animate')?.nextValue;
    if (typeof animate === 'boolean') {
      this.handlers.onAnimateChange(animate);
    }
  };

  private render(): void {
    setLabel(this.rootElement, CURRENT_TIME_ID, this.labels.currentTimeLabel);
    if (this.labels.loadedBatchCount !== null) {
      renderStreamingBatchStatus(
        this.rootElement,
        this.labels.loadedBatchCount,
        this.labels.batchCount
      );
    }
    this.renderMetrics();
  }

  private renderMetrics(): void {
    if (!this.metrics) {
      return;
    }
    const totalArrowByteLength =
      this.metrics.pointArrowByteLength + this.metrics.stylingArrowByteLength;
    const totalGpuByteLength = this.metrics.pointGpuByteLength + this.metrics.stylingGpuByteLength;
    this.setMetricLabel(ROW_COUNT_ID, formatInteger(this.metrics.rowCount));
    this.setMetricLabel(DIMENSION_ID, `${this.metrics.sourceDimension}D`);
    this.setMetricLabel(TOTAL_ARROW_BYTES_ID, formatByteLength(totalArrowByteLength));
    this.setMetricLabel(TOTAL_GPU_BYTES_ID, formatByteLength(totalGpuByteLength));
    this.setMetricLabel(
      TOTAL_GPU_EXPANSION_ID,
      formatExpansionRatio(totalGpuByteLength, totalArrowByteLength)
    );
    this.setMetricLabel(TOTAL_BUILD_TIME_ID, formatTimeMs(this.metrics.conversionTimeMs));
    this.setMetricLabel(POINT_ARROW_BYTES_ID, formatByteLength(this.metrics.pointArrowByteLength));
    this.setMetricLabel(POINT_GPU_BYTES_ID, formatByteLength(this.metrics.pointGpuByteLength));
    this.setMetricLabel(
      POINT_GPU_EXPANSION_ID,
      formatExpansionRatio(this.metrics.pointGpuByteLength, this.metrics.pointArrowByteLength)
    );
    this.setMetricLabel(POINT_BUILD_TIME_ID, formatTimeMs(this.metrics.conversionTimeMs));
    this.setMetricLabel(
      STYLING_ARROW_BYTES_ID,
      formatByteLength(this.metrics.stylingArrowByteLength)
    );
    this.setMetricLabel(STYLING_GPU_BYTES_ID, formatByteLength(this.metrics.stylingGpuByteLength));
    this.setMetricLabel(
      STYLING_GPU_EXPANSION_ID,
      formatExpansionRatio(this.metrics.stylingGpuByteLength, this.metrics.stylingArrowByteLength)
    );
  }

  private setMetricLabel(id: string, value: string): void {
    setLabel(this.rootElement, id, value);
    setLabel(this.settingsRootElement, id, value);
  }
}

export function makeArrowPointSettingsSchema(
  state: ArrowPointControlPanelState,
  supportsStorage = true
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'data',
        name: 'Data',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'modelMode',
            label: 'GPU inputs',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Attributes', value: 'attributes'},
              ...(supportsStorage ? [{label: 'Storage buffers', value: 'storage'}] : [])
            ]
          },
          {
            name: 'rowCountKind',
            label: 'Rows',
            type: 'select',
            persist: 'none',
            options: [
              {label: POINT_DATASETS['10k-stream'].label, value: '10k-stream'},
              {label: POINT_DATASETS['100k-stream'].label, value: '100k-stream'}
            ]
          },
          {
            name: 'sourceKind',
            label: 'Points',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'FixedSizeList<Float32, 2> (XY)', value: 'xy'},
              {label: 'FixedSizeList<Float32, 3> (XYM)', value: 'xym'},
              {label: 'FixedSizeList<Float32, 4> (XYZM)', value: 'xyzm'},
              {label: 'DenseUnion Point XY/XYM/XYZM', value: 'dense-union'}
            ]
          },
          {
            name: 'timeKind',
            label: 'Time',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'None', value: 'none'},
              ...(state.sourceKind === 'xy' ? [] : [{label: 'M coordinate', value: 'm'}]),
              {label: 'TimestampMillisecond column', value: 'timestamp'}
            ]
          },
          {
            name: 'colorKind',
            label: 'Colors',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row - FixedSizeList<Uint8, 4>', value: 'row-colors'}
            ]
          },
          {
            name: 'radiusKind',
            label: 'Radii',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Constant', value: 'constant'},
              {label: 'Row - Float32', value: 'row-radii'}
            ]
          }
        ]
      },
      {
        id: 'animation',
        name: 'Animation',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'animate',
            label: 'Animate',
            type: 'boolean',
            persist: 'none'
          }
        ]
      }
    ]
  };
}

export function makeArrowPointControlPanelHtml(): string {
  return `\
  <p>Renders Arrow point columns as instanced circle impostors with optional measure or timestamp animation.</p>
  ${makeStatusRow('Batches', makeProgressBar())}
  ${makeStatusRow('Clock', `<strong id="${CURRENT_TIME_ID}">-</strong>`)}
  ${makeArrowPointMetricsHtml()}
  `;
}

function makeArrowPointMetricsHtml(): string {
  return `\
  <table style="width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 12px;">
    <thead>
      <tr><th style="text-align: left; padding: 4px 6px 4px 0;">Data</th><th style="text-align: right;">Arrow</th><th style="text-align: right;">GPU</th><th style="text-align: right;">Expansion</th><th style="text-align: right;">Build</th></tr>
    </thead>
    <tbody>
      ${makeMetricTableRow('total', TOTAL_ARROW_BYTES_ID, TOTAL_GPU_BYTES_ID, TOTAL_GPU_EXPANSION_ID, TOTAL_BUILD_TIME_ID)}
      ${makeMetricTableRow('points', POINT_ARROW_BYTES_ID, POINT_GPU_BYTES_ID, POINT_GPU_EXPANSION_ID, POINT_BUILD_TIME_ID)}
      ${makeMetricTableRow('styles', STYLING_ARROW_BYTES_ID, STYLING_GPU_BYTES_ID, STYLING_GPU_EXPANSION_ID, null)}
    </tbody>
  </table>
  <p style="margin-bottom: 0; color: #64748b; font-size: 12px;">Rows <strong id="${ROW_COUNT_ID}">0</strong> · source dimension <strong id="${DIMENSION_ID}">0D</strong> · trail ${formatInteger(POINT_TRAIL_LENGTH_MILLISECONDS)} ms</p>
  `;
}

function makeProgressBar(): string {
  return `<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="display: none; position: relative; height: 24px; overflow: hidden; border: 1px solid #bfdbfe; border-radius: 6px; background: #dbeafe;"><span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #2563eb;"></span><span id="${STREAMING_BATCH_STATUS_LABEL_ID}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700;">Loaded 0 batches</span></div>`;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function makeMetricTableRow(
  label: string,
  arrowId: string,
  gpuId: string,
  expansionId: string,
  timeId: string | null
): string {
  return `<tr><th style="text-align: left; padding: 4px 6px 4px 0;">${label}</th><td style="text-align: right;"><strong id="${arrowId}">Measuring...</strong></td><td style="text-align: right;"><strong id="${gpuId}">Measuring...</strong></td><td style="text-align: right;"><strong id="${expansionId}">-</strong></td><td style="text-align: right;">${timeId ? `<strong id="${timeId}">Measuring...</strong>` : '-'}</td></tr>`;
}

function renderStreamingBatchStatus(
  rootElement: HTMLElement | null,
  loadedBatchCount: number,
  batchCount: number
): void {
  const statusRow = getElement(rootElement, STREAMING_BATCH_STATUS_ROW_ID);
  const fill = getElement(rootElement, STREAMING_BATCH_FILL_ID);
  const label = getElement(rootElement, STREAMING_BATCH_STATUS_LABEL_ID);
  if (!statusRow || !fill || !label) {
    return;
  }
  statusRow.style.display = 'block';
  statusRow.setAttribute('aria-valuemax', `${batchCount}`);
  statusRow.setAttribute('aria-valuenow', `${loadedBatchCount}`);
  fill.style.width = `${batchCount > 0 ? (loadedBatchCount / batchCount) * 100 : 0}%`;
  label.textContent = `Loaded ${loadedBatchCount} of ${batchCount} batches`;
}

function setLabel(rootElement: HTMLElement | null, id: string, value: string): void {
  const element = getElement(rootElement, id);
  if (element) {
    element.textContent = value;
  }
}

function getElement(rootElement: HTMLElement | null, id: string): HTMLElement | null {
  return rootElement?.querySelector<HTMLElement>(`#${id}`) ?? null;
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
  return timeMs < 1 ? '<1 ms' : `${formatMetricDigits(timeMs)} ms`;
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

function isRadiusKind(value: unknown): value is ArrowPointRadiusKind {
  return value === 'constant' || value === 'row-radii';
}
