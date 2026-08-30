// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TraceFeatureCard = {
  capability: string;
  outcome: string;
  surface: string;
};

export const GPU_CORE_FEATURE_CARDS: readonly TraceFeatureCard[] = [
  {
    capability: 'Declarative GPU graph',
    outcome: 'Compiles compute, copy, render, picking, and analysis into one scheduled workflow.',
    surface: 'GPUCommandGraph nodes + contributors'
  },
  {
    capability: 'Hazard scheduling',
    outcome:
      'Orders RAW, WAR, and WAW resource dependencies from declared buffer and texture uses.',
    surface: 'Compiled schedule diagnostics'
  },
  {
    capability: 'Aliasing validation',
    outcome: 'Rejects incompatible overlapping writable bindings before commands reach WebGPU.',
    surface: 'Compile-time node/resource errors'
  },
  {
    capability: 'Transient reuse',
    outcome: 'Aliases compatible scratch resources whose scheduled lifetimes do not overlap.',
    surface: 'Logical/physical allocation plan'
  },
  {
    capability: 'Batch-preserving execution',
    outcome: 'Processes ordered GPUVector chunks without silently repacking the complete dataset.',
    surface: 'GraphVectorView contributors'
  },
  {
    capability: 'Conditional execution',
    outcome:
      'Skips CPU-known work or consumes GPU-written zero-work indirect dispatches without readback.',
    surface: 'CPU predicates + GPU conditions'
  },
  {
    capability: 'Spread across frames',
    outcome:
      'Executes immutable compiled plans in bounded resumable steps for expensive global work.',
    surface: 'planExecution()'
  },
  {
    capability: 'Multidimensional budgets',
    outcome:
      'Bounds invocations, bytes, dispatches, draws, and step priority instead of row count alone.',
    surface: 'Execution budget + preflight'
  },
  {
    capability: 'Adaptive budgets',
    outcome:
      'Learns safe step sizes from queue timing while preserving explicit minimum and maximum bounds.',
    surface: 'ExecutionBudgetController'
  },
  {
    capability: 'Adapter-local kernels',
    outcome:
      'Explores equivalent kernels and persists measured choices by adapter and workload bucket.',
    surface: 'Autotuner + scan variants'
  },
  {
    capability: 'GPU-driven output',
    outcome:
      'Publishes compacted IDs, bounded counts, and indirect commands without CPU synchronization.',
    surface: 'Scan, compaction, indirect draw'
  },
  {
    capability: 'Primitive library',
    outcome:
      'Composes scans, sorting, traversal, BVHs, reductions, histograms, FFTs, picking, and readback.',
    surface: '@luma.gl/experimental GPU* APIs'
  },
  {
    capability: 'Contributor composition',
    outcome:
      'Lets reusable subsystems add graph work without taking over compilation or submission.',
    surface: 'GPUCommandGraphContributor'
  },
  {
    capability: 'Static preflight',
    outcome:
      'Reports unsupported features, oversized bindings, incomplete estimates, and invalid contracts.',
    surface: 'preflight() reports'
  },
  {
    capability: 'Deep instrumentation',
    outcome:
      'Separates encode time, GPU timing, candidates, upper bounds, allocations, dispatches, and draws.',
    surface: 'GPUCommandGraphInspector'
  },
  {
    capability: 'Reusable panels',
    outcome:
      'Shows schedules, full node names, percentiles, conditions, counters, and allocation plans.',
    surface: 'Inspector panel component'
  },
  {
    capability: 'Explicit ownership',
    outcome:
      'Keeps submission, lifetime, cancellation, readback cadence, and publication with the application.',
    surface: 'Caller-owned graph lifecycle'
  }
];

export const GPU_TRACE_FEATURE_CARDS: readonly TraceFeatureCard[] = [
  {
    capability: 'Canonical trace model',
    outcome:
      'Keeps span, display, parent, dependency, and application-object identities distinct at scale.',
    surface: 'GPUTraceScene'
  },
  {
    capability: 'Chunked trace storage',
    outcome:
      'Preserves source partitions while keeping every storage binding inside adapter limits.',
    surface: 'Span, dependency, and CSR vectors'
  },
  {
    capability: 'Process/thread hierarchy',
    outcome:
      'Expands and collapses lanes with stable ancestor projection and explicit visual gaps.',
    surface: 'GPUTraceInteraction'
  },
  {
    capability: 'Temporal candidates',
    outcome:
      'Shares a persistent multi-resolution time/lane hierarchy across all interaction paths.',
    surface: 'GPUTraceTemporalIndex'
  },
  {
    capability: 'Semantic LOD',
    outcome: 'Switches among exact spans, representatives, density, and wide-span exceptions.',
    surface: 'Exact + representative + density views'
  },
  {
    capability: 'Galloping search',
    outcome: 'Finds ordered time boundaries without inspecting every span for every pixel cell.',
    surface: 'GPUGallopingSearch'
  },
  {
    capability: 'Trace-stable aggregation',
    outcome:
      'Builds summaries in trace coordinates so panning does not re-bin against screen space.',
    surface: 'Temporal levels + time buckets'
  },
  {
    capability: 'Dependency routing',
    outcome:
      'Traverses CSR, projects hidden endpoints, intersects the view, and bundles dense corridors.',
    surface: 'Forward/reverse dependency passes'
  },
  {
    capability: 'Edge admission control',
    outcome: 'Introduces dependencies gradually under stable zoom-scaled budgets.',
    surface: 'Candidate batches + stable hashing'
  },
  {
    capability: 'Span + edge picking',
    outcome: 'Resolves both mark types into one highlighted target while preserving source IDs.',
    surface: 'Raster + analytical picking'
  },
  {
    capability: 'Dictionary labels',
    outcome: 'Shares repeated strings and admits glyphs only when the complete label fits.',
    surface: 'DictionaryTextRenderer + clipping'
  },
  {
    capability: 'Interval analytics',
    outcome: 'Analyzes the viewport, a measured range, or a confirmed full-trace interval.',
    surface: 'Aggregation + histograms + buckets'
  },
  {
    capability: 'Cross-filtered summaries',
    outcome:
      'Produces counts, duration statistics, errors, distributions, and time profiles together.',
    surface: 'GPU result buffer + compact readback'
  },
  {
    capability: 'Causal analysis',
    outcome: 'Finds cycle-safe parent critical paths and publishes reusable focus masks.',
    surface: 'GPUTraceCriticalPath'
  },
  {
    capability: 'Comparative intelligence',
    outcome:
      'Aligns cohorts, calculates deltas, scores regressions, and renders lazy chunked GPU anomaly masks.',
    surface: 'Comparison + anomaly scoring'
  },
  {
    capability: 'Progressive global work',
    outcome: 'Spreads index, full-trace, causal, and comparison algorithms across budgeted frames.',
    surface: 'Resumable graph plans'
  },
  {
    capability: 'Visible validation',
    outcome:
      'Surfaces overflow, topology, binding, capacity, and preflight failures in the product.',
    surface: 'Validation buffers + diagnostics'
  },
  {
    capability: 'Idle discipline',
    outcome: 'Renders only for view/data changes, picking, result publication, or animation.',
    surface: 'Invalidation-driven frame loop'
  },
  {
    capability: '25M span capacity posture',
    outcome:
      'Chunks storage, bounds frame work, and reports memory before committing large datasets.',
    surface: 'Desktop MAX capacity contract'
  }
];

export function getTraceFeatureCardsHtml(
  cards: readonly TraceFeatureCard[],
  subsystem: 'GPU Core' | 'GPU Trace'
): string {
  return `<div class="trace-feature-list" aria-label="${subsystem} feature cards">${cards
    .map(
      card => `<article class="trace-feature-card">
        <div><strong>${card.capability}</strong><span>${card.surface}</span></div>
        <p>${card.outcome}</p>
      </article>`
    )
    .join('')}</div>`;
}
