// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraphAutotuningProfile} from '@luma.gl/gpgpu/gpu-core';
import {FillPattern, type FillPatternType} from '../../fill-pattern-shader-plugin';

const TRACE_AUTOTUNING_PROFILE_KEY_PREFIX = 'luma-gpu-trace-autotuning-v1';
const SI_COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1
});

export const DENSITY_PATTERN_OPTIONS: Array<{label: string; value: FillPatternType}> = [
  {label: 'Diagonal dashes', value: FillPattern.hash45},
  {label: 'Reverse diagonal dashes', value: FillPattern.hash135},
  {label: 'Vertical dashes', value: FillPattern.hash90},
  {label: 'Horizontal dashes', value: FillPattern.hash0},
  {label: 'Grid', value: FillPattern.checker0},
  {label: 'Diamond grid', value: FillPattern.checker45},
  {label: 'Dots', value: FillPattern.dotgrid},
  {label: 'Diagonal dots', value: FillPattern.dotgrid45},
  {label: 'Solid', value: FillPattern.none}
];

const TRACE_METRIC_EXPLANATIONS: Readonly<Record<string, string>> = {
  'GPU FPS':
    'Frames completed per second using sampled GPU frame time. Rendering sleeps while the view is unchanged.',
  'Shader invocations':
    'A conservative upper bound derived from graph workload annotations. Fragment shader work is not included.',
  'Draw calls': 'Indirect render commands submitted by one trace graph frame.',
  'Compute dispatches':
    'Compute passes submitted by one trace graph frame, including culling, compaction, and analysis.',
  'Trace spans': 'Canonical source spans currently resident on the GPU.',
  Dependencies: 'Canonical source-to-destination span relationships currently resident on the GPU.',
  'Persistent GPU': 'Total long-lived GPU buffer allocation owned by this trace dataset.',
  'Graph compile':
    'How many render graphs have been compiled and the duration of the latest compilation.',
  'Span chunks':
    'Bounded canonical span buffers. Chunking keeps every storage binding within adapter limits.',
  'Dependency chunks': 'Bounded dependency buffers processed under a per-frame batch budget.',
  'Adjacency chunks':
    'Bounded CSR adjacency buffers containing outgoing and incoming neighbor lists. Chunking keeps traversal bindings within adapter limits.',
  'Focus frontier': 'Maximum number of span IDs retained at each dependency traversal step.',
  'Device contract':
    'Whether the selected dataset fits the adapter limits after bounded allocation checks.',
  'Exact spans': 'Canonical span rectangles that survived view culling and compaction.',
  'Overview output':
    'Maximum rendered overview cells for the active representation. Representative mode is bounded to one canonical span per lane and pixel column.',
  'Overview frame':
    'Queue completion time sampled separately for exact, density, and representative rendering. The value shows p50 / p95.',
  'Label glyphs': 'Dictionary glyph instances that fit inside visible exact spans.',
  'Visible edges': 'Dependency lines admitted by the zoom-scaled display budget.',
  'Span batches':
    'Temporal span batches selected by the time/lane index versus all resident batches.',
  'Edge batches':
    'Dependency batches admitted for this frame versus all resident dependency batches.',
  'CPU encode': 'CPU time spent encoding the compiled command graph for the latest frame.',
  Picking: 'The active framebuffer or analytical hit-testing path.',
  'Trace LOD': 'The active exact, representative, or density semantic-zoom representation.',
  'Layout lanes': 'Visible hierarchy height after process/thread expansion and visual gaps.',
  'Focus traversal': 'Whether bounded CSR traversal completed without overflowing its frontier.',
  'Transient reuse':
    'Share of logical scratch allocation aliased onto reusable physical GPU buffers.',
  'Matched spans': 'Spans intersecting the active analysis interval after GPU filtering.',
  'Span duration': 'Total duration contributed by spans intersecting the active analysis interval.',
  'Error rate': 'Share of matching spans classified as errors.',
  'Chart buckets': 'Small GPU-produced duration and trace-time summaries downloaded for charts.',
  'CPU readback': 'Analytical bytes copied to JavaScript; the source trace remains GPU-resident.'
};

export function setBit(mask: number, bitIndex: number, enabled: boolean): number {
  return enabled ? mask | (1 << bitIndex) : mask & ~(1 << bitIndex);
}

export function setMaskFlag(mask: number, flag: number, enabled: boolean): number {
  return enabled ? mask | flag : mask & ~flag;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getMaximumValueIndex(values: readonly number[]): number {
  let maximumIndex = 0;
  for (let index = 1; index < values.length; index++) {
    if (values[index] > values[maximumIndex]) maximumIndex = index;
  }
  return maximumIndex;
}

export function makeMetricCard(
  label: string,
  value: string,
  detail: string,
  exactValue = value
): string {
  const explanation = `${TRACE_METRIC_EXPLANATIONS[label] ?? `${label} reports ${detail}.`} Current value: ${exactValue}.`;
  const escapedExplanation = escapeAttribute(explanation);
  return `<article class="trace-metric-card" tabindex="0" aria-label="${escapedExplanation}" data-tooltip="${escapedExplanation}">
    <span class="trace-metric-label">${label}</span>
    <strong class="trace-metric-value">${value}</strong>
    <span class="trace-metric-detail">${detail}</span>
  </article>`;
}

export function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function getDensityPatternLabel(pattern: FillPatternType): string {
  return DENSITY_PATTERN_OPTIONS.find(option => option.value === pattern)?.label ?? 'Solid';
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatSI(value: number): string {
  return SI_COUNT_FORMATTER.format(value);
}

export function formatBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / (1024 * 1024)).toFixed(1)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`;
}

export function formatTraceDuration(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)} s`
    : `${value.toFixed(1)} ms`;
}

export function formatDurationRange(minimum: number, maximum: number): string {
  const formatValue = (value: number): string =>
    value < 1 ? value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') : String(value);
  return `${formatValue(minimum)}–${formatValue(maximum)} ms`;
}

export function formatCriticalPathValidation(flags: number): string {
  if (flags === 0) return 'validated';
  return [
    flags & 1 ? 'invalid parent' : '',
    flags & 2 ? 'invalid duration' : '',
    flags & 4 ? 'cycle excluded' : '',
    flags & 8 ? 'path limit reached' : '',
    flags & 16 ? 'numeric overflow' : ''
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatAnomalyValidation(flags: number): string {
  if (flags === 0) return 'validated';
  return [
    flags & 1 ? 'invalid peer group' : '',
    flags & 2 ? 'invalid duration' : '',
    flags & 4 ? 'invalid baseline' : '',
    flags & 8 ? 'numeric overflow' : ''
  ]
    .filter(Boolean)
    .join(', ');
}

export function loadTraceAutotuningProfile(
  adapterKey: string
): GPUCommandGraphAutotuningProfile | undefined {
  try {
    const value = globalThis.localStorage?.getItem(getTraceAutotuningStorageKey(adapterKey));
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

export function storeTraceAutotuningProfile(profile: GPUCommandGraphAutotuningProfile): void {
  try {
    globalThis.localStorage?.setItem(
      getTraceAutotuningStorageKey(profile.adapter.key),
      JSON.stringify(profile)
    );
  } catch {
    // Calibration persistence is optional; rendering and in-memory learning continue unchanged.
  }
}

function getTraceAutotuningStorageKey(adapterKey: string): string {
  let hash = 2166136261;
  for (let index = 0; index < adapterKey.length; index++) {
    hash ^= adapterKey.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${TRACE_AUTOTUNING_PROFILE_KEY_PREFIX}-${(hash >>> 0).toString(16)}`;
}
