// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPU_DATA_ANALYSIS_STYLES, GPU_DATA_ANALYSIS_TEMPLATE} from './app-shell';
import type {GPUDataFrameBenchmarkResult} from './gpu-dataframe-benchmark';

export const APP_ID = 'gpu-data-analysis-app';

export const STYLE_ID = 'gpu-data-analysis-style';

export type ExampleElements = {
  bins: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  grid: HTMLSelectElement;
  groupFilter: HTMLSelectElement;
  groups: HTMLElement;
  heatmap: HTMLElement;
  histogram: HTMLElement;
  gpuDataFrameAdjustment: HTMLInputElement;
  gpuDataFrameExecution: HTMLElement;
  gpuDataFrameExpression: HTMLElement;
  gpuDataFrameMultiplier: HTMLSelectElement;
  gpuDataFramePreview: HTMLElement;
  gpuDataFrameRate: HTMLElement;
  gpuDataFrameResult: HTMLElement;
  gpuDataFrameRun: HTMLButtonElement;
  gpuDataFrameSelected: HTMLElement;
  gpuDataFrameThreshold: HTMLInputElement;
  gpuDataFrameBenchmark: HTMLButtonElement;
  gpuDataFrameBenchmarkIterations: HTMLSelectElement;
  gpuDataFrameBenchmarkResults: HTMLElement;
  gpuDataFrameBenchmarkRows: HTMLSelectElement;
  gpuDataFrameBenchmarkStatus: HTMLElement;
  nodes: HTMLElement;
  reuse: HTMLElement;
  run: HTMLButtonElement;
  status: HTMLElement;
  validation: HTMLElement;
};

export function getElements(root: HTMLElement): ExampleElements {
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing GPU data-analysis element ${selector}`);
    return element;
  };
  return {
    bins: get('[data-bins]'),
    compileTime: get('[data-compile-time]'),
    dataset: get('[data-dataset]'),
    grid: get('[data-grid]'),
    groupFilter: get('[data-group-filter]'),
    groups: get('[data-groups]'),
    heatmap: get('[data-heatmap]'),
    histogram: get('[data-histogram]'),
    gpuDataFrameAdjustment: get('[data-gpu-dataframe-adjustment]'),
    gpuDataFrameExecution: get('[data-gpu-dataframe-execution]'),
    gpuDataFrameExpression: get('[data-gpu-dataframe-expression]'),
    gpuDataFrameMultiplier: get('[data-gpu-dataframe-multiplier]'),
    gpuDataFramePreview: get('[data-gpu-dataframe-preview]'),
    gpuDataFrameRate: get('[data-gpu-dataframe-rate]'),
    gpuDataFrameResult: get('[data-gpu-dataframe-result]'),
    gpuDataFrameRun: get('[data-gpu-dataframe-run]'),
    gpuDataFrameSelected: get('[data-gpu-dataframe-selected]'),
    gpuDataFrameThreshold: get('[data-gpu-dataframe-threshold]'),
    gpuDataFrameBenchmark: get('[data-gpu-dataframe-benchmark]'),
    gpuDataFrameBenchmarkIterations: get('[data-gpu-dataframe-benchmark-iterations]'),
    gpuDataFrameBenchmarkResults: get('[data-gpu-dataframe-benchmark-phases]'),
    gpuDataFrameBenchmarkRows: get('[data-gpu-dataframe-benchmark-rows]'),
    gpuDataFrameBenchmarkStatus: get('[data-gpu-dataframe-benchmark-status]'),
    nodes: get('[data-nodes]'),
    reuse: get('[data-reuse]'),
    run: get('[data-run]'),
    status: get('[data-status]'),
    validation: get('[data-validation]')
  };
}

export function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GPU_DATA_ANALYSIS_STYLES;
  document.head.appendChild(style);
}

export function renderGPUDataFrameBenchmark(
  elements: ExampleElements,
  result: GPUDataFrameBenchmarkResult,
  history: readonly GPUDataFrameBenchmarkResult[]
): void {
  const timingRows = [
    ['upload', 'Arrow upload', result.timings.uploadMilliseconds],
    ['compile', 'Graph compilation', result.timings.compileMilliseconds],
    ['index', 'Standalone hash-index build', result.timings.indexMilliseconds],
    ['execution', 'Fenced WebGPU execution', result.timings.executionMilliseconds],
    ['readback', 'Bounded result readback', result.timings.readbackMilliseconds],
    ['cpu', 'Equivalent CPU reference', result.timings.cpuMilliseconds]
  ] as const;
  const phaseTable = `<table><thead><tr><th scope="col">Phase</th><th scope="col">Milliseconds</th></tr></thead><tbody>${timingRows
    .map(
      ([phase, label, milliseconds]) =>
        `<tr data-gpu-dataframe-phase="${phase}"><th scope="row">${label}</th><td>${milliseconds.toFixed(2)}</td></tr>`
    )
    .join('')}</tbody></table>`;
  const workloadRows = Object.entries(result.workloads)
    .map(
      ([name, workload]) =>
        `<tr data-gpu-dataframe-workload="${name}"><th scope="row">${name}</th><td>${workload.cpuMilliseconds.toFixed(2)}</td><td>${workload.gpuMilliseconds.toFixed(2)}</td><td>${formatBenchmarkThroughput(workload.gpuRowsPerSecond)}</td><td>${workload.speedup.toFixed(2)}×</td></tr>`
    )
    .join('');
  const crossover = [...history]
    .sort((left, right) => left.rowCount - right.rowCount)
    .find(
      measurement => measurement.timings.cpuMilliseconds > measurement.timings.executionMilliseconds
    );
  const crossoverMessage = crossover
    ? `Measured end-to-end GPU crossover: ${crossover.rowCount.toLocaleString()} rows.`
    : 'No GPU crossover observed yet; compare larger datasets on this device.';
  elements.gpuDataFrameBenchmarkResults.innerHTML = `${phaseTable}
    <p class="workload-title">MEDIAN OPERATION COMPARISONS</p>
    <p class="workload-metadata">${result.measurement.warmupIterations} warmup · ${result.measurement.iterations} measured sample${result.measurement.iterations === 1 ? '' : 's'} · GPU durations include completion fences</p>
    <table class="workload-table"><thead><tr><th scope="col">Operation</th><th scope="col">CPU ms</th><th scope="col">GPU ms</th><th scope="col">GPU rows/s</th><th scope="col">GPU speedup</th></tr></thead><tbody>${workloadRows}</tbody></table>
    <p class="benchmark-crossover" data-gpu-dataframe-crossover>${crossoverMessage}</p>`;
  const validated = Object.values(result.validation).every(Boolean);
  elements.gpuDataFrameBenchmarkResults.dataset.state = validated ? 'ok' : 'error';
  elements.gpuDataFrameBenchmarkResults.dataset.validated = String(validated);
  elements.gpuDataFrameBenchmarkStatus.textContent = validated
    ? `${result.rowCount.toLocaleString()} Arrow rows · batches ${result.batchRowCounts.join(' / ')} · filter, grouping, sorting, and joins match the CPU reference · ${result.readbackBytes.toLocaleString()} summary bytes read`
    : 'GPU dataframe results did not match their equivalent CPU reference.';
}

export function formatBenchmarkThroughput(rowsPerSecond: number): string {
  if (rowsPerSecond >= 1_000_000) return `${(rowsPerSecond / 1_000_000).toFixed(2)}M`;
  if (rowsPerSecond >= 1_000) return `${(rowsPerSecond / 1_000).toFixed(1)}K`;
  return rowsPerSecond.toFixed(0);
}

export function mountGPUDataAnalysisShell(): HTMLElement {
  const root = document.getElementById(APP_ID);
  if (!root) throw new Error(`GPU data-analysis example requires #${APP_ID}`);
  ensureStyles();
  root.innerHTML = GPU_DATA_ANALYSIS_TEMPLATE;
  return root;
}

export const GROUP_LABELS = ['Northwest', 'Northeast', 'Southwest', 'Southeast'];

export function renderHistogram(
  element: HTMLElement,
  counts: number[],
  cumulativeCounts: number[],
  edges?: readonly number[]
): void {
  const maximum = Math.max(...counts, 1);
  element.innerHTML = counts
    .map((count, index) => {
      const interval = edges
        ? ` · [${edges[index]}, ${edges[index + 1]}${index === counts.length - 1 ? ']' : ')'}`
        : '';
      return `<i style="height:${Math.max(2, (count / maximum) * 100)}%" title="${count} rows · ${cumulativeCounts[index]} cumulative${interval}"></i>`;
    })
    .join('');
}

export function renderGrid(
  element: HTMLElement,
  counts: number[],
  weightSums: number[],
  weightMinimums: number[],
  weightMaximums: number[],
  weightMeans: number[],
  cumulativeCounts: number[],
  width: number
): void {
  const maximum = Math.max(...counts, 1);
  element.style.gridTemplateColumns = `repeat(${width},1fr)`;
  element.innerHTML = counts
    .map(
      (count, index) =>
        `<i style="opacity:${0.08 + (count / maximum) * 0.92}" title="${count} rows · sum ${formatStatistic(weightSums[index])} · mean ${formatStatistic(weightMeans[index])} · range [${formatStatistic(weightMinimums[index])}, ${formatStatistic(weightMaximums[index])}] · ${cumulativeCounts[index]} row cumulative"></i>`
    )
    .join('');
}

export function renderGroups(element: HTMLElement, counts: number[], means: number[]): void {
  const maximum = Math.max(...counts, 1);
  element.innerHTML = counts
    .map(
      (count, index) =>
        `<div title="${count.toLocaleString()} selected rows · mean ${formatStatistic(means[index])}"><span>${GROUP_LABELS[index]}</span><i style="width:${(count / maximum) * 100}%"></i><strong>${count.toLocaleString()} · μ ${formatStatistic(means[index])}</strong></div>`
    )
    .join('');
}

export function formatStatistic(value: number): string {
  return Number.isNaN(value) ? 'empty' : value.toFixed(3);
}
