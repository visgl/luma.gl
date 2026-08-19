// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {FillPatternType} from '../../fill-pattern-shader-plugin';
import {
  TRACE_COLLAPSED_STATE,
  TRACE_DURATION_FILTER_MAXIMUM,
  TRACE_GROUPS,
  TRACE_PROCESS_COUNT,
  TRACE_THREADS_PER_PROCESS,
  type TraceDependencyRouting,
  type TraceOverviewMode
} from './trace-data';
import {getTracePanelStyleMarkup} from './trace-panel';
import {DENSITY_PATTERN_OPTIONS, formatCount, formatSI} from './trace-format';

export type TraceRenderingControlsState = {
  overviewMode: TraceOverviewMode;
  dependencyRouting: TraceDependencyRouting;
  dependencyDisplayBudget: number;
  dependencyDisplayBudgetOptions: readonly number[];
  densityPattern: FillPatternType;
  autoScroll: boolean;
  labelsEnabled: boolean;
  minimapEnabled: boolean;
  lodFadeEnabled: boolean;
  anomalyOverlayEnabled: boolean;
  anomalyOverlayAvailable: boolean;
};

export function getTraceRenderingControlsHtml(state: TraceRenderingControlsState): string {
  return `<section class="trace-section" data-rendering-controls>
    <div class="trace-section-header"><span class="trace-section-title">Rendering</span><span class="trace-section-note">semantic zoom + display policy</span></div>
    <div class="trace-control-stack">
      <label>Overview rendering <select data-overview-mode><option value="auto"${state.overviewMode === 'auto' ? ' selected' : ''}>Auto · representatives then density</option><option value="representative"${state.overviewMode === 'representative' ? ' selected' : ''}>Representative spans · 1 per lane/pixel</option><option value="density"${state.overviewMode === 'density' ? ' selected' : ''}>Density aggregation</option></select></label>
      <label>Dependency routing <select data-dependency-routing><option value="auto"${state.dependencyRouting === 'auto' ? ' selected' : ''}>Auto · bundle dense views</option><option value="exact"${state.dependencyRouting === 'exact' ? ' selected' : ''}>Exact straight lines</option><option value="bundled"${state.dependencyRouting === 'bundled' ? ' selected' : ''}>Bundled corridors</option></select></label>
    </div>
    <div class="trace-control-grid" style="margin-top:7px">
      <label>Dependency detail <select data-dependency-display-budget>${state.dependencyDisplayBudgetOptions
        .map(
          value =>
            `<option value="${value}"${value === state.dependencyDisplayBudget ? ' selected' : ''}>${value === 512 ? 'Sparse' : value === 2048 ? 'Balanced' : 'Dense'} · ${formatSI(value)} lines</option>`
        )
        .join('')}</select></label>
      <label>Aggregate pattern <select data-density-pattern>${DENSITY_PATTERN_OPTIONS.map(
        option =>
          `<option value="${option.value}"${option.value === state.densityPattern ? ' selected' : ''}>${option.label}</option>`
      ).join('')}</select></label>
    </div>
    <div class="trace-check-row" style="margin-top:7px"><label><input type="checkbox" data-auto-scroll${state.autoScroll ? ' checked' : ''}> Auto-scroll</label><label><input type="checkbox" data-labels${state.labelsEnabled ? ' checked' : ''}> Span labels</label><label><input type="checkbox" data-minimap${state.minimapEnabled ? ' checked' : ''}> Trace minimap</label><label><input type="checkbox" data-lod-fade${state.lodFadeEnabled ? ' checked' : ''}> Smooth LOD transition</label><label><input type="checkbox" data-anomaly-overlay${state.anomalyOverlayEnabled ? ' checked' : ''}${state.anomalyOverlayAvailable ? '' : ' disabled'}> Per-span anomalies</label></div>
    <div class="trace-actions" style="margin-top:7px"><button type="button" data-reset>Reset detail</button><button type="button" data-fit-trace>Fit trace</button></div>
    <div data-overview-comparison></div>
  </section>`;
}

export function getTraceAdvancedInteractionControlsHtml(pickingMode: 'raster' | 'compute'): string {
  return `<section class="trace-section" data-advanced-interaction-controls>
    <div class="trace-section-header"><span class="trace-section-title">Advanced interaction</span><span class="trace-section-note">implementation diagnostics</span></div>
    <div class="trace-control-stack">
      <label>Picking implementation <select data-picking-mode><option value="raster"${pickingMode === 'raster' ? ' selected' : ''}>Framebuffer ID · fastest</option><option value="compute"${pickingMode === 'compute' ? ' selected' : ''}>Analytical · 6 px tolerance</option></select></label>
    </div>
    <div class="trace-context-line">Framebuffer picking renders spans and dependencies into one shared ID target. Analytical picking runs a compute query and retains a wider line tolerance.</div>
    <div class="trace-section-header trace-analysis-subheader"><span class="trace-section-title">Learned analysis budgets</span><span class="trace-section-note">8 ms queue target</span></div>
    <div class="trace-detail-grid" data-planner-budgets></div>
  </section>`;
}

export function getTraceDatasetControlsHtml(state: {
  capacityOptions: readonly number[];
  dependencyCapacityOptions: readonly number[];
  spanCapacity: number;
  dependencyCapacity: number;
  datasetStatus: string;
  focusDepth: number;
  maximumFocusDepth: number;
  statusNames: readonly string[];
}): string {
  const groupControls = TRACE_GROUPS.map(
    (name, index) => `<label><input type="checkbox" data-group="${index}" checked> ${name}</label>`
  ).join('');
  const statusControls = state.statusNames
    .map(
      (name, index) =>
        `<label><input type="checkbox" data-status="${index}" checked> ${name}</label>`
    )
    .join('');
  return `<section data-trace-dashboard>
    ${getTracePanelStyleMarkup()}
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Dataset</span><span class="trace-section-note">rebuilds GPU resources</span></div>
      <div class="trace-control-grid">
        <label>Spans <select data-span-capacity>${state.capacityOptions.map(value => `<option value="${value}"${value === state.spanCapacity ? ' selected' : ''}>${formatCount(value)}</option>`).join('')}</select></label>
        <label>Dependencies <select data-dependency-capacity>${state.dependencyCapacityOptions.map(value => `<option value="${value}"${value === state.dependencyCapacity ? ' selected' : ''}>${formatCount(value)}</option>`).join('')}</select></label>
      </div>
      <div class="trace-context-line"><span>Independent capacities</span><span>bounded GPU chunks</span><span>stable source IDs</span></div>
      <div class="trace-context-line" data-dataset-status>${state.datasetStatus}</div>
      <div class="trace-preflight" data-dataset-preflight hidden><span data-dataset-preflight-message></span><div class="trace-actions"><button type="button" data-confirm-dataset>Continue</button><button type="button" data-cancel-dataset>Cancel</button></div></div>
    </section>
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Span policy</span><span class="trace-section-note">composed on GPU</span></div>
      <div class="trace-check-grid">${groupControls}</div>
      <div class="trace-check-grid" style="margin-top:5px">${statusControls}</div>
      <div class="trace-control-stack" style="margin-top:7px"><label>Minimum duration <span data-duration-value>0.00 ms</span><input type="range" min="0" max="${TRACE_DURATION_FILTER_MAXIMUM}" step="0.01" value="0" data-duration></label></div>
      <div class="trace-check-grid" style="margin-top:6px"><label><input type="checkbox" data-hide-runtime> Hide runtime spans</label><label><input type="checkbox" data-errors-only> Errors only</label><label><input type="checkbox" data-hide-overlapping> Hide short overlaps</label><label><input type="checkbox" data-hide-similar-parents> Collapse parent chains</label></div>
    </section>
    <section class="trace-section">
      <div class="trace-section-header"><span class="trace-section-title">Dependency focus</span><span class="trace-section-note">bounded CSR traversal</span></div>
      <div class="trace-check-grid"><label><input type="checkbox" data-same-dependencies checked> Same-process edges</label><label><input type="checkbox" data-cross-dependencies checked> Cross-process edges</label><label><input type="checkbox" data-focus-only> Focused subgraph only</label></div>
      <div class="trace-control-stack" style="margin-top:6px"><label>Focus depth <span data-focus-depth-value>${state.focusDepth}</span><input type="range" min="0" max="${state.maximumFocusDepth}" step="1" value="${state.focusDepth}" data-focus-depth></label></div>
      <div class="trace-control-grid" style="margin-top:7px"><label>Source span <input type="number" min="0" value="0" data-source-span></label><div class="trace-actions" style="align-items:end"><button type="button" data-select-span>Focus</button><button type="button" data-clear-selection>Clear</button></div></div>
    </section>
  </section>`;
}

export function getTraceHierarchyControlsHtml(state: {
  processStates: Uint32Array;
  threadStates: Uint32Array;
}): string {
  const processes = Array.from({length: TRACE_PROCESS_COUNT}, (_, processIndex) => {
    const expanded = state.processStates[processIndex] !== TRACE_COLLAPSED_STATE;
    const threads = Array.from({length: TRACE_THREADS_PER_PROCESS}, (_, localThreadIndex) => {
      const threadIndex = processIndex * TRACE_THREADS_PER_PROCESS + localThreadIndex;
      const threadExpanded = state.threadStates[threadIndex] !== TRACE_COLLAPSED_STATE;
      return `<label style="font-size:11px"><input type="checkbox" data-thread="${threadIndex}"${threadExpanded ? ' checked' : ''}> T${localThreadIndex}</label>`;
    }).join('');
    return `<div class="trace-hierarchy-row"><label><input type="checkbox" data-process="${processIndex}"${expanded ? ' checked' : ''}> Process ${String(processIndex).padStart(2, '0')}</label><div class="trace-hierarchy-threads">${threads}</div></div>`;
  }).join('');
  return `<section data-trace-dashboard>${getTracePanelStyleMarkup()}<section class="trace-section"><div class="trace-section-header"><span class="trace-section-title">Hierarchy layout</span><span class="trace-section-note">process → thread → lane</span></div><div class="trace-actions"><button type="button" data-expand-all>Expand all</button><button type="button" data-collapse-all>Collapse all</button></div><div style="max-height:270px;overflow:auto;margin-top:5px">${processes}</div></section></section>`;
}
