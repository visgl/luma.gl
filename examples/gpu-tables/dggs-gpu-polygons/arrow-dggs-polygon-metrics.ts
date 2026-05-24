// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowDggsPolygonLayerMetrics} from './arrow-dggs-polygon-layer';
import type {DggsGpuPolygonsControlPanelMetrics} from './control-panel';

export function formatDggsPolygonMetrics(
  metrics: ArrowDggsPolygonLayerMetrics
): DggsGpuPolygonsControlPanelMetrics {
  return {
    activeColumn: metrics.activeColumn,
    rowCount: formatInteger(metrics.rowCount),
    keyBytes: formatByteLength(metrics.keyBytes),
    pathBytes: formatByteLength(metrics.pathBytes),
    transientBytes: formatByteLength(metrics.transientBytes)
  };
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
  return `${formatMetricDigits(byteLength / 1000 ** 2)} MB`;
}

function formatMetricDigits(value: number): string {
  return new Intl.NumberFormat('en-US', {maximumSignificantDigits: 2}).format(value);
}
