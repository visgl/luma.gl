// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoArrowRendererMetrics} from './geoarrow-renderer';

const SOURCE_ROWS_ID = 'arrow-geoarrow-source-rows';
const POINT_ROWS_ID = 'arrow-geoarrow-point-rows';
const LINE_ROWS_ID = 'arrow-geoarrow-line-rows';
const POLYGON_ROWS_ID = 'arrow-geoarrow-polygon-rows';
const SKIPPED_ROWS_ID = 'arrow-geoarrow-skipped-rows';
const PREPARATION_TIME_ID = 'arrow-geoarrow-preparation-time';
const ARROW_BYTES_ID = 'arrow-geoarrow-arrow-bytes';

export class GeoArrowControlPanel {
  private sourceRowsLabel: HTMLElement | null = null;
  private pointRowsLabel: HTMLElement | null = null;
  private lineRowsLabel: HTMLElement | null = null;
  private polygonRowsLabel: HTMLElement | null = null;
  private skippedRowsLabel: HTMLElement | null = null;
  private preparationTimeLabel: HTMLElement | null = null;
  private arrowBytesLabel: HTMLElement | null = null;

  initialize(): void {
    this.sourceRowsLabel = document.getElementById(SOURCE_ROWS_ID);
    this.pointRowsLabel = document.getElementById(POINT_ROWS_ID);
    this.lineRowsLabel = document.getElementById(LINE_ROWS_ID);
    this.polygonRowsLabel = document.getElementById(POLYGON_ROWS_ID);
    this.skippedRowsLabel = document.getElementById(SKIPPED_ROWS_ID);
    this.preparationTimeLabel = document.getElementById(PREPARATION_TIME_ID);
    this.arrowBytesLabel = document.getElementById(ARROW_BYTES_ID);
  }

  setMetrics(metrics: GeoArrowRendererMetrics, arrowByteLength: number): void {
    setText(this.sourceRowsLabel, metrics.sourceRowCount.toLocaleString());
    setText(this.pointRowsLabel, metrics.pointRowCount.toLocaleString());
    setText(this.lineRowsLabel, metrics.lineRowCount.toLocaleString());
    setText(this.polygonRowsLabel, metrics.polygonRowCount.toLocaleString());
    setText(this.skippedRowsLabel, metrics.skippedRowCount.toLocaleString());
    setText(this.preparationTimeLabel, `${metrics.preparationTimeMs.toFixed(1)} ms`);
    setText(this.arrowBytesLabel, formatBytes(arrowByteLength));
  }
}

export function makeGeoArrowControlPanelHtml(): string {
  return `\
  <p>Routes one GeoArrow-style DenseUnion geometry column through point, line, and polygon renderers.</p>
  <div style="max-height: calc(100vh - 72px); overflow-y: auto; overflow-x: hidden; position: relative; z-index: 2; margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <section style="overflow: visible; margin-bottom: 12px; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">DenseUnion</h3>
      ${makeMetricRow('Source rows', SOURCE_ROWS_ID)}
      ${makeMetricRow('Points', POINT_ROWS_ID)}
      ${makeMetricRow('Lines', LINE_ROWS_ID)}
      ${makeMetricRow('Polygons', POLYGON_ROWS_ID)}
      ${makeMetricRow('Skipped', SKIPPED_ROWS_ID)}
      ${makeMetricRow('Arrow bytes', ARROW_BYTES_ID)}
      ${makeMetricRow('Preparation', PREPARATION_TIME_ID)}
    </section>
    <section style="overflow: visible; padding: 12px; border: 1px solid rgba(203, 213, 225, 0.95); border-radius: 10px; background: rgba(255, 255, 255, 0.72);">
      <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Routing</h3>
      <table style="width: 100%; border-collapse: collapse; color: #334155; font-size: 12px; line-height: 1.4;">
        <tbody>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">Point</td><td style="padding: 7px 0;">filtered to FixedSizeList&lt;Float32, 2&gt; rows for ArrowPointRenderer</td></tr>
          <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.9);"><td style="padding: 7px 0; font-weight: 700;">LineString</td><td style="padding: 7px 0;">full DenseUnion passed to ArrowLineRenderer with mode="lines"</td></tr>
          <tr><td style="padding: 7px 0; font-weight: 700;">Polygon</td><td style="padding: 7px 0;">full DenseUnion passed to ArrowPolygonRenderer for filled tessellation</td></tr>
        </tbody>
      </table>
    </section>
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(226, 232, 240, 0.9); color: #334155; font-size: 13px; line-height: 1.4;"><span>${label}</span><strong id="${id}" style="color: #0f172a; font-variant-numeric: tabular-nums;">Preparing...</strong></div>`;
}

function setText(element: HTMLElement | null, text: string): void {
  if (element) {
    element.textContent = text;
  }
}

function formatBytes(byteLength: number): string {
  if (byteLength < 1024) {
    return `${byteLength.toLocaleString()} B`;
  }
  if (byteLength < 1024 * 1024) {
    return `${(byteLength / 1024).toFixed(1)} KiB`;
  }
  return `${(byteLength / (1024 * 1024)).toFixed(1)} MiB`;
}
