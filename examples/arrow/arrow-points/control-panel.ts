// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {Fragment, h} from 'preact';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExampleContentPanel,
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
import {
  DEFAULT_POINT_RENDERER_COLOR,
  DEFAULT_POINT_RENDERER_RADIUS,
  type ArrowPointRendererMetrics
} from './arrow-point-renderer';

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
    onAnimateChange: (enabled: boolean) => void;
  };
  onRefresh: () => void;
};

type ArrowPointPanelLabels = {
  currentTimeLabel: string;
  loadedBatchCount: number | null;
  batchCount: number;
};

type ArrowPointMetricsLocation = 'description' | 'settings';

export class ArrowPointControlPanel {
  private readonly handlers: ArrowPointControlPanelProps['handlers'];
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowPointControlPanelState;
  private metrics: ArrowPointRendererMetrics | null = null;
  private labels: ArrowPointPanelLabels = {
    currentTimeLabel: '-',
    loadedBatchCount: null,
    batchCount: 0
  };
  private descriptionRootElement: HTMLElement | null = null;
  private settingsMetricsRootElement: HTMLElement | null = null;

  constructor({initialState, handlers, onRefresh}: ArrowPointControlPanelProps) {
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-points-settings',
      schema: makeArrowPointSettingsSchema(initialState),
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
        this.descriptionRootElement = rootElement;
        this.render();
        return () => {
          if (this.descriptionRootElement === rootElement) {
            this.descriptionRootElement = null;
          }
        };
      }
    });
  }

  makeSettingsPanel(): Panel {
    const settingsPanel = this.settingsPanel.makePanel();
    const metricsPanel = makeHtmlCustomPanel({
      id: 'arrow-points-settings-metrics',
      title: 'Metrics',
      html: makeArrowPointMetricsHtml('settings'),
      onRender: rootElement => {
        this.settingsMetricsRootElement = rootElement;
        this.renderMetrics();
        return () => {
          if (this.settingsMetricsRootElement === rootElement) {
            this.settingsMetricsRootElement = null;
          }
        };
      }
    });
    return makeExampleContentPanel({
      id: 'arrow-points-settings-with-metrics',
      title: 'Settings',
      content: h(Fragment, {}, settingsPanel.content, metricsPanel.content)
    });
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
    this.descriptionRootElement = null;
    this.settingsMetricsRootElement = null;
  }

  syncControls(state: Partial<ArrowPointControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSchemaAndSettings(makeArrowPointSettingsSchema(this.state), this.state);
    this.onRefresh();
  }

  setMetrics(metrics: ArrowPointRendererMetrics): void {
    this.metrics = metrics;
    this.renderMetrics();
  }

  setCurrentTimeLabel(label: string): void {
    this.labels.currentTimeLabel = label;
    setLabel(this.descriptionRootElement, CURRENT_TIME_ID, label);
  }

  setStreamingBatchStatus(loadedBatchCount: number, batchCount: number): void {
    this.labels.loadedBatchCount = loadedBatchCount;
    this.labels.batchCount = batchCount;
    renderStreamingBatchStatus(this.descriptionRootElement, loadedBatchCount, batchCount);
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
    const animate = getChangedSetting(changedSettings, 'animate')?.nextValue;
    if (typeof animate === 'boolean') {
      this.handlers.onAnimateChange(animate);
    }
  };

  private render(): void {
    setLabel(this.descriptionRootElement, CURRENT_TIME_ID, this.labels.currentTimeLabel);
    if (this.labels.loadedBatchCount !== null) {
      renderStreamingBatchStatus(
        this.descriptionRootElement,
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
    for (const [rootElement, location] of [
      [this.descriptionRootElement, 'description'],
      [this.settingsMetricsRootElement, 'settings']
    ] as const) {
      setMetricLabel(rootElement, location, ROW_COUNT_ID, formatInteger(this.metrics.rowCount));
      setMetricLabel(rootElement, location, DIMENSION_ID, `${this.metrics.sourceDimension}D`);
      setMetricLabel(
        rootElement,
        location,
        TOTAL_ARROW_BYTES_ID,
        formatByteLength(totalArrowByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        TOTAL_GPU_BYTES_ID,
        formatByteLength(totalGpuByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        TOTAL_GPU_EXPANSION_ID,
        formatExpansionRatio(totalGpuByteLength, totalArrowByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        TOTAL_BUILD_TIME_ID,
        formatTimeMs(this.metrics.conversionTimeMs)
      );
      setMetricLabel(
        rootElement,
        location,
        POINT_ARROW_BYTES_ID,
        formatByteLength(this.metrics.pointArrowByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        POINT_GPU_BYTES_ID,
        formatByteLength(this.metrics.pointGpuByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        POINT_GPU_EXPANSION_ID,
        formatExpansionRatio(this.metrics.pointGpuByteLength, this.metrics.pointArrowByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        POINT_BUILD_TIME_ID,
        formatTimeMs(this.metrics.conversionTimeMs)
      );
      setMetricLabel(
        rootElement,
        location,
        STYLING_ARROW_BYTES_ID,
        formatByteLength(this.metrics.stylingArrowByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        STYLING_GPU_BYTES_ID,
        formatByteLength(this.metrics.stylingGpuByteLength)
      );
      setMetricLabel(
        rootElement,
        location,
        STYLING_GPU_EXPANSION_ID,
        formatExpansionRatio(this.metrics.stylingGpuByteLength, this.metrics.stylingArrowByteLength)
      );
    }
  }
}

export function makeArrowPointSettingsSchema(state: ArrowPointControlPanelState): SettingsSchema {
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
              {
                label: `Constant RGBA8 [${DEFAULT_POINT_RENDERER_COLOR.join(', ')}]`,
                value: 'constant'
              },
              {label: 'Row - FixedSizeList<Uint8, 4>', value: 'row-colors'}
            ]
          },
          {
            name: 'radiusKind',
            label: 'Radii',
            type: 'select',
            persist: 'none',
            options: [
              {
                label: `Constant Float32 ${DEFAULT_POINT_RENDERER_RADIUS}`,
                value: 'constant'
              },
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
  ${makeArrowPointMetricsHtml('description')}
  `;
}

function makeArrowPointMetricsHtml(location: ArrowPointMetricsLocation): string {
  return `\
  <table style="width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 12px;">
    <thead>
      <tr>
        ${makeMetricTableHeader('Category', 'left')}
        ${makeMetricTableHeader('Arrow', 'right')}
        ${makeMetricTableHeader('GPU', 'right')}
        ${makeMetricTableHeader('GPU / Arrow', 'right')}
        ${makeMetricTableHeader('Build', 'right')}
      </tr>
    </thead>
    <tbody>
      ${makeMetricTableRow(location, 'total', TOTAL_ARROW_BYTES_ID, TOTAL_GPU_BYTES_ID, TOTAL_GPU_EXPANSION_ID, TOTAL_BUILD_TIME_ID)}
      ${makeMetricTableRow(location, 'points', POINT_ARROW_BYTES_ID, POINT_GPU_BYTES_ID, POINT_GPU_EXPANSION_ID, POINT_BUILD_TIME_ID)}
      ${makeMetricTableRow(location, 'styles', STYLING_ARROW_BYTES_ID, STYLING_GPU_BYTES_ID, STYLING_GPU_EXPANSION_ID, null)}
    </tbody>
  </table>
  <p style="margin-bottom: 0; color: #64748b; font-size: 12px;">Rows <strong id="${getMetricElementId(location, ROW_COUNT_ID)}">0</strong> · source dimension <strong id="${getMetricElementId(location, DIMENSION_ID)}">0D</strong> · trail ${formatInteger(POINT_TRAIL_LENGTH_MILLISECONDS)} ms</p>
  `;
}

function makeProgressBar(): string {
  return `<div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="display: none; position: relative; height: 24px; overflow: hidden; border: 1px solid #bfdbfe; border-radius: 6px; background: #dbeafe;"><span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: #2563eb;"></span><span id="${STREAMING_BATCH_STATUS_LABEL_ID}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700;">Loaded 0 batches</span></div>`;
}

function makeStatusRow(label: string, valueHtml: string): string {
  return `<div style="display: grid; grid-template-columns: 62px 1fr; gap: 8px; align-items: center; margin-top: 8px;"><span>${label}</span>${valueHtml}</div>`;
}

function makeMetricTableHeader(label: string, textAlign: 'left' | 'right'): string {
  return `<th scope="col" style="padding: 0 0 4px 6px; text-align: ${textAlign}; color: #64748b; font-weight: 600;">${label}</th>`;
}

function makeMetricTableRow(
  location: ArrowPointMetricsLocation,
  label: string,
  arrowId: string,
  gpuId: string,
  expansionId: string,
  timeId: string | null
): string {
  return `<tr><th scope="row" style="text-align: left; padding: 4px 6px 4px 0;">${label}</th><td style="text-align: right;"><strong id="${getMetricElementId(location, arrowId)}">Measuring...</strong></td><td style="text-align: right;"><strong id="${getMetricElementId(location, gpuId)}">Measuring...</strong></td><td style="text-align: right;"><strong id="${getMetricElementId(location, expansionId)}">-</strong></td><td style="text-align: right;">${timeId ? `<strong id="${getMetricElementId(location, timeId)}">Measuring...</strong>` : '-'}</td></tr>`;
}

function setMetricLabel(
  rootElement: HTMLElement | null,
  location: ArrowPointMetricsLocation,
  id: string,
  value: string
): void {
  setLabel(rootElement, getMetricElementId(location, id), value);
}

function getMetricElementId(location: ArrowPointMetricsLocation, id: string): string {
  return `${id}-${location}`;
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
