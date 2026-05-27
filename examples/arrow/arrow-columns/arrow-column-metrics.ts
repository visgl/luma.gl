// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowColumnRendererMetrics} from './arrow-column-renderer';

export type ArrowColumnRendererFormattedMetrics = {
  sourceRows: string;
  aggregateRows: string;
  decodedCells: string;
  h3Resolution: string;
  timeBuckets: string;
  maxCount: string;
  gpuColumnBytes: string;
  arrowBuildTime: string;
  geometryDecodeTime: string;
};

export function formatArrowColumnRendererMetrics(
  metrics: ArrowColumnRendererMetrics
): ArrowColumnRendererFormattedMetrics {
  return {
    sourceRows: formatInteger(metrics.sourceRowCount),
    aggregateRows: formatInteger(metrics.aggregateRowCount),
    decodedCells: formatInteger(metrics.uniqueH3CellCount),
    h3Resolution: String(metrics.h3Resolution),
    timeBuckets: `${metrics.timeBucketCount} x ${formatDurationHours(metrics.timeBucketDurationMilliseconds)}`,
    maxCount: formatInteger(metrics.maxCount),
    gpuColumnBytes: formatBytes(metrics.gpuColumnBytes),
    arrowBuildTime: `${metrics.arrowBuildTimeMilliseconds.toFixed(1)} ms`,
    geometryDecodeTime: `${metrics.geometryDecodeTimeMilliseconds.toFixed(1)} ms`
  };
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KiB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
}

function formatDurationHours(milliseconds: number): string {
  const hours = milliseconds / (60 * 60 * 1000);
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}
