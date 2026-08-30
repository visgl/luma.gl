// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPU_CORE_FEATURE_CARDS,
  GPU_TRACE_FEATURE_CARDS,
  getTraceFeatureCardsHtml
} from './trace-feature-cards';
import {getTracePanelStyleMarkup} from './trace-panel';

export type TraceDashboardProps = {
  datasetLoadPhase: string;
  datasetStatus: string;
  measuredTimeMinimum: number;
  measuredTimeMaximum: number;
  causalAnalysisStatus: string;
  anomalyAnalysisStatus: string;
  certificationStatus: string;
  renderingControls: string;
  filterControls: string;
  hierarchyControls: string;
  interactionControls: string;
};

/** Builds the sidebar document independently from trace lifecycle orchestration. */
export function getTraceDashboardHtml(props: TraceDashboardProps): string {
  return `<section data-trace-dashboard>
    ${getTracePanelStyleMarkup()}
    <div class="trace-hero">
      <span class="trace-eyebrow">25M-scale GPU Core trace lab</span>
      <strong>Millions of spans. One GPU-resident workflow.</strong>
      <p>Explore hierarchy, visibility, dependencies, semantic LOD, picking, and live analytics without downloading the trace to CPU / JavaScript.</p>
      <div class="trace-capability-list" aria-label="GPU trace capabilities">
        <span>temporal index</span><span>scan + scatter</span><span>CSR traversal</span><span>interval analytics</span><span>indirect draw</span>
      </div>
    </div>
    <div class="trace-load-banner" data-dataset-load-banner data-phase="${props.datasetLoadPhase}" role="status"${props.datasetLoadPhase === 'ready' ? ' hidden' : ''}>
      <span class="trace-load-spinner" aria-hidden="true"></span>
      <span data-dataset-load-message>${props.datasetStatus}</span>
    </div>
    <div class="trace-frame-metric-grid" data-frame-stats></div>
    <div class="trace-graph-diagnostic" data-graph-diagnostic role="alert" hidden></div>
    <nav class="trace-tabs" role="tablist" aria-label="Trace viewer controls">
      <button type="button" role="tab" aria-selected="true" data-trace-tab="overview">Overview</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="filters">Filters</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="hierarchy">Hierarchy</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="analysis">Analytics</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="causal">Causal</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="graph">GPU Core</button>
      <button type="button" role="tab" aria-selected="false" data-trace-tab="features">Features</button>
    </nav>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="overview">
      <div class="trace-metric-grid" data-capacity></div>
      <div class="trace-selection" data-selection></div>
      ${props.renderingControls}
      <section class="trace-showcase-card">
        <span class="trace-eyebrow">New · GPU aggregation workbench</span>
        <strong>Ask questions across the full trace, the viewport, or a measured interval.</strong>
        <p>GPU Core selects intersecting spans, groups and reduces them, builds duration and time histograms, then reads back only the compact results.</p>
        <button type="button" data-open-analysis>Explore live GPU analytics <span aria-hidden="true">→</span></button>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Live workload</span><span class="trace-section-note">sampled GPU output</span></div>
        <div data-stats></div>
      </section>
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="filters" hidden>
      ${props.filterControls}
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="hierarchy" hidden>
      ${props.hierarchyControls}
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="analysis" hidden>
      <div class="trace-analysis-hero">
        <div><span class="trace-live-dot"></span><span class="trace-eyebrow">GPU aggregation workbench</span></div>
        <strong>One interval mask feeds every analytical view.</strong>
        <p>The source columns remain chunked and GPU-resident. Only group totals and chart buckets cross back to the CPU.</p>
        <div class="trace-analysis-pipeline" aria-label="GPU analysis pipeline">
          <span><b>1</b> interval select</span><i>→</i><span><b>2</b> group reduce</span><i>→</i><span><b>3</b> histogram + time buckets</span><i>→</i><span><b>4</b> compact readback</span>
        </div>
      </div>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Analysis interval</span><span class="trace-section-note">cached by scope generation</span></div>
        <select data-analysis-scope class="trace-visually-hidden" aria-label="Analysis scope">
          <option value="trace">Entire trace</option>
          <option value="viewport" selected>Visible viewport</option>
          <option value="interval">Measured interval</option>
        </select>
        <div class="trace-scope-options">
          <button type="button" data-analysis-scope-option="trace" aria-pressed="false"><strong>Full trace</strong><span>global scan · preflighted</span></button>
          <button type="button" data-analysis-scope-option="viewport" aria-pressed="true"><strong>Viewport</strong><span>safe default · follows view</span></button>
          <button type="button" data-analysis-scope-option="interval" aria-pressed="false"><strong>Measured</strong><span>fixed comparison range</span></button>
        </div>
        <div class="trace-control-grid" style="margin-top:7px">
          <label>Start <input type="number" min="0" step="0.1" value="${props.measuredTimeMinimum}" data-analysis-start></label>
          <label>End <input type="number" min="0" step="0.1" value="${props.measuredTimeMaximum}" data-analysis-end></label>
        </div>
        <div class="trace-actions" style="margin-top:6px"><button type="button" data-capture-analysis-interval>Capture viewport as measured interval</button></div>
        <div class="trace-context-line">Shift-drag a rectangle on the trace to measure and analyze its time interval.</div>
        <div class="trace-context-line" data-analysis-window></div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">GPU dataset profile</span><span class="trace-section-note">count · total · mean duration</span></div>
        <div class="trace-analysis-summary" data-aggregation-summary></div>
        <div class="trace-group-profile" data-aggregations></div>
        <div class="trace-section-header trace-analysis-subheader"><span class="trace-section-title">Operation distribution</span><span class="trace-section-note">dictionary-aligned GPU counts</span></div>
        <div class="trace-status-profile" data-operation-aggregations></div>
        <div class="trace-section-header trace-analysis-subheader"><span class="trace-section-title">Status distribution</span><span class="trace-section-note">GPU grouped counts</span></div>
        <div class="trace-status-profile" data-status-aggregations></div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Duration distribution</span><span class="trace-section-note">click to filter minimum</span></div>
        <div class="trace-analysis-histogram" data-duration-histogram></div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Lane occupancy over time</span><span class="trace-section-note">GPU-derived · click a bucket to zoom</span></div>
        <div class="trace-utilization-chart" data-utilization></div>
      </section>
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="causal" hidden>
      <div class="trace-analysis-hero">
        <div><span class="trace-live-dot"></span><span class="trace-eyebrow">GPU causal analysis</span></div>
        <strong>Resolve the longest canonical parent path entirely on the GPU.</strong>
        <p>Pointer jumping resolves roots, cumulative duration, and hop counts in logarithmic passes. Invalid parents and cycles are surfaced explicitly.</p>
        <div class="trace-analysis-pipeline" aria-label="GPU critical path pipeline">
          <span><b>1</b> validate parents</span><i>→</i><span><b>2</b> pointer jump</span><i>→</i><span><b>3</b> select endpoint</span><i>→</i><span><b>4</b> mark path</span>
        </div>
      </div>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Canonical parent critical path</span><span class="trace-section-note">on demand · cached source buffers</span></div>
        <div class="trace-selection" data-causal-analysis>${props.causalAnalysisStatus}</div>
        <div class="trace-actions" style="margin-top:8px"><button type="button" data-run-critical-path>Run GPU critical-path analysis</button></div>
        <div class="trace-context-line">This analysis is exact for the hierarchy parent forest. Multi-parent dependency-DAG CPM and wait attribution build on the same output identities.</div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Baseline comparison + anomalies</span><span class="trace-section-note">one composed graph · on demand</span></div>
        <div class="trace-selection" data-anomaly-analysis>${props.anomalyAnalysisStatus}</div>
        <div class="trace-actions" style="margin-top:8px"><button type="button" data-run-anomaly-scoring>Compare cohort + score spans</button></div>
        <div class="trace-context-line">A compact generated reference cohort is aligned by operation dictionary ID. GPUTraceComparison publishes group deltas, then GPUTraceAnomalyScoring scores canonical spans against the same baseline in one command graph.</div>
      </section>
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="graph" hidden>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">25M reference validation</span><span class="trace-section-note">opt-in · 21 seconds · downloadable JSON</span></div>
        <div class="trace-selection" data-trace-certification>${props.certificationStatus}</div>
        <div class="trace-actions" style="margin-top:8px"><button type="button" data-run-trace-certification>Run validation</button><button type="button" data-cancel-trace-certification hidden>Cancel</button><button type="button" data-download-trace-certification hidden>Download report</button></div>
        <div class="trace-context-line">Requires an already loaded 25M-span / 25M-dependency dataset. The runner never changes dataset capacity or starts during normal page load.</div>
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">Command graph</span><span class="trace-section-note">CPU / GPU p50 and p95</span></div>
        <div data-command-graph-inspector></div>
      </section>
      ${props.interactionControls}
    </div>
    <div class="trace-tab-panel" role="tabpanel" data-trace-tab-panel="features" hidden>
      <div class="trace-analysis-hero trace-feature-hero">
        <div><span class="trace-live-dot"></span><span class="trace-eyebrow">Feature cards</span></div>
        <strong>One GPU graph runtime. A trace system designed for scale.</strong>
        <p>Every item below names the user-visible outcome and the concrete API or diagnostic that proves the capability exists.</p>
      </div>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">GPU Core</span><span class="trace-section-note">${GPU_CORE_FEATURE_CARDS.length} reusable capabilities</span></div>
        ${getTraceFeatureCardsHtml(GPU_CORE_FEATURE_CARDS, 'GPU Core')}
      </section>
      <section class="trace-section">
        <div class="trace-section-header"><span class="trace-section-title">GPU Trace</span><span class="trace-section-note">${GPU_TRACE_FEATURE_CARDS.length} trace capabilities</span></div>
        ${getTraceFeatureCardsHtml(GPU_TRACE_FEATURE_CARDS, 'GPU Trace')}
      </section>
    </div>
  </section>`;
}
