// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowPolygonRendererMetrics} from '@luma.gl/arrow';
import {
  POLYGON_DATASETS,
  type ArrowPolygonColorKind,
  type ArrowPolygonRowCountKind,
  type ArrowPolygonSourceKind
} from './arrow-polygon-data';

const ROW_COUNT_SELECTOR_ID = 'arrow-polygon-row-count-selector';
const SOURCE_SELECTOR_ID = 'arrow-polygon-source';
const COLOR_SELECTOR_ID = 'arrow-polygon-colors';
const PICKED_ROW_ID = 'arrow-polygon-picked-row';
const ROW_COUNT_ID = 'arrow-polygon-row-count';
const POLYGON_COUNT_ID = 'arrow-polygon-polygon-count';
const DIMENSION_ID = 'arrow-polygon-dimension';
const TOTAL_ARROW_BYTES_ID = 'arrow-polygon-total-arrow-bytes';
const TOTAL_GPU_BYTES_ID = 'arrow-polygon-total-gpu-bytes';
const TOTAL_GPU_EXPANSION_ID = 'arrow-polygon-total-gpu-expansion';
const TOTAL_BUILD_TIME_ID = 'arrow-polygon-total-build-time';
const POLYGON_ARROW_BYTES_ID = 'arrow-polygon-polygon-arrow-bytes';
const GENERATED_GEOMETRY_GPU_BYTES_ID = 'arrow-polygon-generated-geometry-gpu-bytes';
const POLYGON_GPU_EXPANSION_ID = 'arrow-polygon-gpu-expansion';
const POLYGON_BUILD_TIME_ID = 'arrow-polygon-build-time';
const STYLING_ARROW_BYTES_ID = 'arrow-polygon-styling-arrow-bytes';
const STYLING_GPU_BYTES_ID = 'arrow-polygon-styling-gpu-bytes';
const STYLING_GPU_EXPANSION_ID = 'arrow-polygon-styling-gpu-expansion';
const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-polygon-streaming-batch-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-polygon-streaming-batch-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-polygon-streaming-batch-status-label';

export type ArrowPolygonControlPanelProps = {
  initialState: {
    rowCountKind: ArrowPolygonRowCountKind;
    sourceKind: ArrowPolygonSourceKind;
    colorKind: ArrowPolygonColorKind;
  };
  handlers: {
    onRowCountKindChange: (rowCountKind: ArrowPolygonRowCountKind) => void | Promise<void>;
    onSourceKindChange: (sourceKind: ArrowPolygonSourceKind) => void;
    onColorKindChange: (colorKind: ArrowPolygonColorKind) => void;
  };
};

export class ArrowPolygonControlPanel {
  private readonly props: ArrowPolygonControlPanelProps;
  private rowCountSelector: HTMLSelectElement | null = null;
  private sourceSelector: HTMLSelectElement | null = null;
  private colorSelector: HTMLSelectElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor(props: ArrowPolygonControlPanelProps) {
    this.props = props;
  }

  initialize(): void {
    this.rowCountSelector = document.getElementById(
      ROW_COUNT_SELECTOR_ID
    ) as HTMLSelectElement | null;
    this.sourceSelector = document.getElementById(SOURCE_SELECTOR_ID) as HTMLSelectElement | null;
    this.colorSelector = document.getElementById(COLOR_SELECTOR_ID) as HTMLSelectElement | null;
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
    this.rowCountSelector?.addEventListener('change', this.handleRowCountChange);
    this.sourceSelector?.addEventListener('change', this.handleSourceChange);
    this.colorSelector?.addEventListener('change', this.handleColorChange);
    this.syncControls(this.props.initialState);
  }

  destroy(): void {
    this.rowCountSelector?.removeEventListener('change', this.handleRowCountChange);
    this.sourceSelector?.removeEventListener('change', this.handleSourceChange);
    this.colorSelector?.removeEventListener('change', this.handleColorChange);
  }

  syncControls(state: Partial<ArrowPolygonControlPanelProps['initialState']>): void {
    if (state.rowCountKind && this.rowCountSelector) {
      this.rowCountSelector.value = state.rowCountKind;
    }
    if (state.sourceKind && this.sourceSelector) {
      this.sourceSelector.value = state.sourceKind;
    }
    if (state.colorKind && this.colorSelector) {
      this.colorSelector.value = state.colorKind;
    }
  }

  setMetrics(metrics: ArrowPolygonRendererMetrics): void {
    const totalArrowByteLength = metrics.polygonArrowByteLength + metrics.stylingArrowByteLength;
    const totalGpuByteLength =
      metrics.generatedGeometryGpuByteLength + metrics.stylingGpuByteLength;
    setLabel(ROW_COUNT_ID, formatInteger(metrics.rowCount));
    setLabel(POLYGON_COUNT_ID, formatInteger(metrics.polygonCount));
    setLabel(DIMENSION_ID, `${metrics.sourceDimension}D`);
    setLabel(TOTAL_ARROW_BYTES_ID, formatByteLength(totalArrowByteLength));
    setLabel(TOTAL_GPU_BYTES_ID, formatByteLength(totalGpuByteLength));
    setLabel(
      TOTAL_GPU_EXPANSION_ID,
      formatExpansionRatio(totalGpuByteLength, totalArrowByteLength)
    );
    setLabel(TOTAL_BUILD_TIME_ID, formatTimeMs(metrics.tessellationTimeMs));
    setLabel(POLYGON_ARROW_BYTES_ID, formatByteLength(metrics.polygonArrowByteLength));
    setLabel(
      GENERATED_GEOMETRY_GPU_BYTES_ID,
      formatByteLength(metrics.generatedGeometryGpuByteLength)
    );
    setLabel(
      POLYGON_GPU_EXPANSION_ID,
      formatExpansionRatio(metrics.generatedGeometryGpuByteLength, metrics.polygonArrowByteLength)
    );
    setLabel(POLYGON_BUILD_TIME_ID, formatTimeMs(metrics.tessellationTimeMs));
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

  private readonly handleColorChange = (): void => {
    const colorKind = this.colorSelector?.value;
    if (isColorKind(colorKind)) {
      this.props.handlers.onColorKindChange(colorKind);
    }
  };
}

export function makeArrowPolygonControlPanelHtml(): string {
  return `\
  <p>Earcuts Arrow polygon rows with holes, multipolygons, and geoarrow.geometry DenseUnion batches, or renders pre-tessellated triangle rows.</p>
  <div style="max-height: calc(100vh - 72px); overflow-y: auto; overflow-x: hidden; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Table</h3>
      <div style="display: grid; grid-template-columns: minmax(70px, auto) minmax(0, 1fr); align-items: center; gap: 10px 12px; color: #0f172a; font-size: 15px; font-weight: 600;">
        <label for="${ROW_COUNT_SELECTOR_ID}">Rows</label>
        <select id="${ROW_COUNT_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="10k-stream">${POLYGON_DATASETS['10k-stream'].label}</option>
          <option value="100k-stream">${POLYGON_DATASETS['100k-stream'].label}</option>
        </select>
        <span>Batches</span>
        <div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0" style="box-sizing: border-box; display: none; position: relative; width: 100%; min-width: 0; height: 34px; overflow: hidden; border: 1px solid rgba(37, 99, 235, 0.32); border-radius: 6px; background: #dbeafe; color: #0f172a; font-size: 13px; line-height: 1.4;">
          <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%); transition: width 220ms ease;"></span>
          <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 batches</span>
        </div>
        <span>Hover</span>
        <strong id="${PICKED_ROW_ID}" style="box-sizing: border-box; display: flex; align-items: center; min-width: 0; min-height: 34px; padding: 0 10px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 6px; background: rgba(248, 250, 252, 0.88); color: #0f172a; font-variant-numeric: tabular-nums;">Hover polygon</strong>
        <label for="${SOURCE_SELECTOR_ID}">Polygons</label>
        <select id="${SOURCE_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="polygon">Polygon - List&lt;List&lt;FixedSizeList&lt;Float32, 2&gt;&gt;&gt;</option>
          <option value="multipolygon">MultiPolygon - List&lt;List&lt;List&lt;FixedSizeList&lt;Float32, 2&gt;&gt;&gt;&gt;</option>
          <option value="tessellated">Tessellated - List&lt;FixedSizeList&lt;Float32, 2&gt;&gt;</option>
          <option value="dense-union">DenseUnion - geoarrow.geometry Polygon/MultiPolygon</option>
        </select>
        <label for="${COLOR_SELECTOR_ID}">Colors</label>
        <select id="${COLOR_SELECTOR_ID}" style="width: 100%; min-width: 0; min-height: 34px; border: 1px solid rgba(148, 163, 184, 0.8); border-radius: 6px; background: #ffffff; color: #0f172a; font: inherit;">
          <option value="constant">Constant</option>
          <option value="row-colors">Row - FixedSizeList&lt;Uint8, 4&gt;</option>
          <option value="vertex-colors">Vertex - nested FixedSizeList&lt;Uint8, 4&gt;</option>
        </select>
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
            <th style="padding: 6px 8px 6px 0; text-align: left; font-weight: 600;">polygons</th>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${POLYGON_ARROW_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${GENERATED_GEOMETRY_GPU_BYTES_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
            <td style="padding: 6px 8px; text-align: right;"><strong id="${POLYGON_GPU_EXPANSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">-</strong></td>
            <td style="padding: 6px 0 6px 8px; text-align: right;"><strong id="${POLYGON_BUILD_TIME_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Measuring...</strong></td>
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
      <div style="margin-top: 8px; color: #64748b; font-size: 12px; line-height: 1.4;">Rows <strong id="${ROW_COUNT_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">0</strong> · primitive polygons <strong id="${POLYGON_COUNT_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">0</strong> · source dimension <strong id="${DIMENSION_ID}" style="color: #0f172a; font-variant-numeric: tabular-nums;">0D</strong></div>
      <details style="margin-top: 14px; border-top: 1px solid rgba(208, 215, 222, 0.9); padding-top: 10px; color: #334155; font-size: 12px; line-height: 1.4;">
        <summary style="cursor: pointer; color: #0f172a; font-weight: 700;">What this example isolates</summary>
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
          <tbody>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">Input</td><td style="padding: 7px 0;">Polygon rows with holes, multipolygon rows, geoarrow.geometry DenseUnion rows, or pre-tessellated triangle vertices.</td></tr>
            <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">Tessellation</td><td style="padding: 7px 0;">The polygons GPU row includes generated positions, rowIndexes, and triangle indices.</td></tr>
            <tr><td style="padding: 7px 0; font-weight: 700;">Styling</td><td style="padding: 7px 0;">Constant, per-row, and per-vertex colors are expanded into table-backed polygon vertices.</td></tr>
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
  if (expansionFactor === null || !Number.isFinite(expansionFactor)) {
    return '-';
  }
  const precision = expansionFactor < 10 ? 1 : 0;
  return `${expansionFactor.toFixed(precision).replace(/\.0$/, '')}x`;
}

function formatTimeMs(timeMs: number): string {
  return timeMs > 0 ? `${timeMs.toFixed(1)}ms` : '-';
}

function formatMetricDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 2}).format(value);
}

function isSourceKind(value: unknown): value is ArrowPolygonSourceKind {
  return (
    value === 'polygon' ||
    value === 'multipolygon' ||
    value === 'tessellated' ||
    value === 'dense-union'
  );
}

function isRowCountKind(value: unknown): value is ArrowPolygonRowCountKind {
  return value === '10k-stream' || value === '100k-stream';
}

function isColorKind(value: unknown): value is ArrowPolygonColorKind {
  return value === 'constant' || value === 'row-colors' || value === 'vertex-colors';
}
