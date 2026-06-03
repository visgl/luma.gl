// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowColumnRendererFormattedMetrics} from './arrow-column-metrics';

const STATUS_ID = 'arrow-columns-status';
const SOURCE_ROWS_ID = 'arrow-columns-source-rows';
const AGGREGATE_ROWS_ID = 'arrow-columns-aggregate-rows';
const DECODED_CELLS_ID = 'arrow-columns-decoded-cells';
const H3_RESOLUTION_ID = 'arrow-columns-h3-resolution';
const TIME_BUCKETS_ID = 'arrow-columns-time-buckets';
const ACTIVE_BUCKET_ID = 'arrow-columns-active-bucket';
const MAX_COUNT_ID = 'arrow-columns-max-count';
const GPU_BYTES_ID = 'arrow-columns-gpu-bytes';
const ARROW_BUILD_TIME_ID = 'arrow-columns-arrow-build-time';
const GEOMETRY_DECODE_TIME_ID = 'arrow-columns-geometry-decode-time';

export class ArrowColumnRendererControlPanel {
  private statusLabel: HTMLElement | null = null;
  private sourceRowsLabel: HTMLElement | null = null;
  private aggregateRowsLabel: HTMLElement | null = null;
  private decodedCellsLabel: HTMLElement | null = null;
  private h3ResolutionLabel: HTMLElement | null = null;
  private timeBucketsLabel: HTMLElement | null = null;
  private activeBucketLabel: HTMLElement | null = null;
  private maxCountLabel: HTMLElement | null = null;
  private gpuBytesLabel: HTMLElement | null = null;
  private arrowBuildTimeLabel: HTMLElement | null = null;
  private geometryDecodeTimeLabel: HTMLElement | null = null;

  initialize(): void {
    this.statusLabel ??= document.getElementById(STATUS_ID);
    this.sourceRowsLabel ??= document.getElementById(SOURCE_ROWS_ID);
    this.aggregateRowsLabel ??= document.getElementById(AGGREGATE_ROWS_ID);
    this.decodedCellsLabel ??= document.getElementById(DECODED_CELLS_ID);
    this.h3ResolutionLabel ??= document.getElementById(H3_RESOLUTION_ID);
    this.timeBucketsLabel ??= document.getElementById(TIME_BUCKETS_ID);
    this.activeBucketLabel ??= document.getElementById(ACTIVE_BUCKET_ID);
    this.maxCountLabel ??= document.getElementById(MAX_COUNT_ID);
    this.gpuBytesLabel ??= document.getElementById(GPU_BYTES_ID);
    this.arrowBuildTimeLabel ??= document.getElementById(ARROW_BUILD_TIME_ID);
    this.geometryDecodeTimeLabel ??= document.getElementById(GEOMETRY_DECODE_TIME_ID);
  }

  destroy(): void {
    this.statusLabel = null;
    this.sourceRowsLabel = null;
    this.aggregateRowsLabel = null;
    this.decodedCellsLabel = null;
    this.h3ResolutionLabel = null;
    this.timeBucketsLabel = null;
    this.activeBucketLabel = null;
    this.maxCountLabel = null;
    this.gpuBytesLabel = null;
    this.arrowBuildTimeLabel = null;
    this.geometryDecodeTimeLabel = null;
  }

  setStatus(status: string): void {
    setText(this.statusLabel, status);
  }

  setActiveTimeBucket(activeTimeBucket: string): void {
    setText(this.activeBucketLabel, activeTimeBucket);
  }

  setMetrics(metrics: ArrowColumnRendererFormattedMetrics): void {
    setText(this.sourceRowsLabel, metrics.sourceRows);
    setText(this.aggregateRowsLabel, metrics.aggregateRows);
    setText(this.decodedCellsLabel, metrics.decodedCells);
    setText(this.h3ResolutionLabel, metrics.h3Resolution);
    setText(this.timeBucketsLabel, metrics.timeBuckets);
    setText(this.maxCountLabel, metrics.maxCount);
    setText(this.gpuBytesLabel, metrics.gpuColumnBytes);
    setText(this.arrowBuildTimeLabel, metrics.arrowBuildTime);
    setText(this.geometryDecodeTimeLabel, metrics.geometryDecodeTime);
  }
}

export function makeArrowColumnRendererControlPanelHtml(): string {
  return `\
  <div style="min-width: 300px; max-width: 430px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 8px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <h3 style="margin: 0 0 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em;">Arrow H3 Columns</h3>
    ${makeMetricRow('Status', STATUS_ID)}
    ${makeMetricRow('Source CSV rows', SOURCE_ROWS_ID)}
    ${makeMetricRow('Arrow aggregate rows', AGGREGATE_ROWS_ID)}
    ${makeMetricRow('Decoded H3 cells', DECODED_CELLS_ID)}
    ${makeMetricRow('H3 resolution', H3_RESOLUTION_ID)}
    ${makeMetricRow('Temporal buckets', TIME_BUCKETS_ID)}
    ${makeMetricRow('Active bucket', ACTIVE_BUCKET_ID)}
    ${makeMetricRow('Max bucket count', MAX_COUNT_ID)}
    ${makeMetricRow('GPU column bytes', GPU_BYTES_ID)}
    ${makeMetricRow('Fetch + Arrow build', ARROW_BUILD_TIME_ID)}
    ${makeMetricRow('GPU H3 decode', GEOMETRY_DECODE_TIME_ID)}
  </div>
  `;
}

function makeMetricRow(label: string, id: string): string {
  return `<div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;"><span>${label}</span><strong id="${id}" style="font-variant-numeric: tabular-nums; text-align: right;">-</strong></div>`;
}

function setText(element: HTMLElement | null, value: string): void {
  if (element) {
    element.textContent = value;
  }
}
