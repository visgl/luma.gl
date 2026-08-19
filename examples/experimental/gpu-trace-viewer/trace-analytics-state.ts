// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TraceAnalysisScope = 'trace' | 'viewport' | 'interval';

export type TraceAggregationFilterState = {
  scope: TraceAnalysisScope;
  enabledMask: number;
  statusMask: number;
  activeFilterMask: number;
  minimumDuration: number;
};

/** Returns a stable cache identity for every input that changes an aggregation result or path. */
export function getTraceAggregationFilterSignature(state: TraceAggregationFilterState): string {
  return [
    state.scope,
    state.enabledMask,
    state.statusMask,
    state.activeFilterMask,
    state.minimumDuration
  ].join(':');
}

export function getTraceAnalysisWindow(options: {
  scope: TraceAnalysisScope;
  traceDuration: number;
  viewport: readonly [number, number];
  measured: readonly [number, number];
}): readonly [number, number] {
  if (options.scope === 'trace') return [0, options.traceDuration];
  return options.scope === 'viewport' ? options.viewport : options.measured;
}
