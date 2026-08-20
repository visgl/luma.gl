import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {ClientOnlyLiveExample} from '@site/src/components/docs/client-only-live-example';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {GPUTracePipelineWalkthrough} from '@site/src/components/docs/gpu-trace-pipeline-walkthrough';
import {GPUTraceViewerExample} from '@site/src/examples';

# GPU Trace

<ExperimentalDocsTabs active="gpu-trace" />

## Overview

`@luma.gl/experimental/gpu-trace` is an optional GPU-native execution-trace module. It owns canonical
span schemas, process/thread relationships, hierarchy parents, dependency links, filtering
policies, linked-span focus, and trace-specific timeline picking without adding those concepts to
the generic command graph or flat GPU scene API.

## When to use it

Use GPU Trace when an application needs to navigate a distributed system trace, inspect a browser
performance recording, understand a GPU capture, explore a build-system schedule, or analyze a
scientific workflow with both hierarchical ownership and explicit cross-task dependencies. Source
data remains GPU-resident while time windows, expansion state, selected spans, and visibility
change interactively.

## Examples

### How the viewer works

Before loading the full dataset, step through the bounded GPU-resident selection pipeline. Each
stage highlights the output consumed by the next stage and dims unrelated marks.

<GPUTracePipelineWalkthrough />

### Full trace explorer

The trace viewer below is the primary interactive tour. It combines the GPU-resident temporal
index, semantic zoom, hierarchy, dependency routing, picking, labels, interval analytics, and graph
telemetry in one composition. Ordinary wheel gestures continue scrolling this documentation page;
hold Ctrl or ⌘ while scrolling over the example to zoom its timeline.

<GPUExampleCard
  demonstrates={['temporal indexing', 'semantic LOD', 'dependency routing', 'picking', 'live analytics']}
  input="4M spans and 4M dependencies by default; chunk-preserving generation"
  gpuOutput="Visible span IDs, edge candidates, labels, analytics, and indirect commands"
  cpuReadback="Only bounded picking, chart, validation, and telemetry results"
  execution="Invalidation-driven rendering with resumable global analysis"
  compatibility="Desktop MAX WebGPU; 25M is an explicit hardware-qualified preset"
  fullPageHref="/examples/experimental/gpu-trace-viewer"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-viewer"
  inspectorHref="/examples/experimental/gpu-trace-viewer?panel=graph"
  presets={[
    {label: 'Small', href: '/examples/experimental/gpu-trace-viewer?spans=250000&dependencies=250000'},
    {label: 'Representative', href: '/examples/experimental/gpu-trace-viewer?spans=4000000&dependencies=4000000'},
    {label: 'Stress', href: '/examples/experimental/gpu-trace-viewer?spans=25000000&dependencies=25000000'}
  ]}
/>

<ClientOnlyLiveExample>
  <GPUTraceViewerExample embedded />
</ClientOnlyLiveExample>

## gpu-trace feature card

| Capability | What it enables | Concrete surface |
| --- | --- | --- |
| GPU-resident trace model | Keeps span, application-object, compacted-display, parent, and dependency identities distinct at millions of rows | `GPUTraceScene` and canonical record layouts |
| Batched storage | Retains source partitions and keeps every storage binding within adapter limits | Chunked span, dependency, and adjacency vectors |
| Lane hierarchy | Expands and collapses ownership lanes with stable layout, ancestor projection, and explicit visual gaps | `GPUTraceInteraction` and GPU-scanned lane offsets |
| Temporal candidates | Queries a persistent multi-resolution time/lane hierarchy shared by rendering, labels, dependencies, analytics, and picking | `GPUTraceTemporalIndex` |
| Semantic LOD | Switches among exact spans, representative one-pixel spans, density bins, and wide-span exceptions without changing canonical identity | Exact, representative, density, and wide-span graph views |
| Galloping search | Finds ordered time boundaries without linearly inspecting every canonical span for each pixel cell | `GPUGallopingSearch`-backed representative selection |
| Stable aggregation | Builds density summaries in trace coordinates so panning does not re-bin against a moving screen-space origin | Persistent temporal levels and time buckets |
| Dependency routing | Traverses bounded incoming/outgoing CSR, projects hidden endpoints, tests line/view intersection, and bundles dense corridors | Forward/reverse adjacency and dependency graph passes |
| Edge admission | Brings relationships in gradually under stable zoom-scaled budgets instead of blotting out the trace | Candidate batches, stable hashing, and display budgets |
| Span and edge picking | Resolves both mark types into one target, preserves source IDs, and highlights the hovered object in shaders | Raster and analytical picking modes |
| Clipped dictionary labels | Shares repeated text, admits labels only when glyphs fit, and avoids expanding off-screen strings | Dictionary text rendering and GPU label compaction |
| Interval analytics | Analyzes the viewport, a measured rectangle/time interval, or an explicitly confirmed full trace | `GPUTraceAggregation`, `GPUTraceTimeBuckets`, histograms |
| Cross-filtered summaries | Produces counts, duration statistics, error rates, duration distributions, and time profiles from the same GPU selection | GPU-resident result buffers plus compact chart readback |
| Critical paths | Finds exact cycle-safe parent critical paths today and exposes the masks and diagnostics needed by focus/render workflows | `GPUTraceCriticalPath` |
| Comparison and anomalies | Aligns operation dictionaries, compares current and baseline groups, scores regressions, and renders lazy chunked GPU masks without CPU row materialization | `GPUTraceComparison`, `GPUTraceAnomalyScoring` |
| Progressive analysis | Spreads expensive index, full-trace, critical-path, and comparison work across frame-budgeted graph steps | Resumable plans with coherent generation publication |
| Visible validation | Surfaces overflow, invalid topology, binding limits, preflight estimates, and graph failures in the side panel | Validation buffers, preflight cards, and GPU Core inspector |
| Idle rendering | Renders only for view/data changes, picking, readback publication, or intentional animation | Invalidation-driven trace viewer loop |
| 25M span capacity posture | Preflights large span/dependency selections, chunks storage, bounds per-frame work, and reports memory before committing | Dataset preflight and Desktop MAX device contract |

`gpu-trace` owns the trace semantics in this table. Scheduling, budgeting, conditions, aliasing,
instrumentation, and kernel selection remain generic GPU Core capabilities and can be reused by
non-trace workloads.

## Concepts

For an end-to-end explanation of the data structures, execution stages, cost model, and the
boundary between package algorithms and example-specific rendering policy, see
[How gpu-trace scales execution traces](/docs/api-reference/experimental/gpu-trace-algorithms).

### A trace is an application domain, not a command-graph feature

The generic [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-core/gpu-command-graph)
knows about buffers, textures, compute passes, render passes, hazards, and encoding. It does not
need processes, threads, spans, or dependency edges to schedule a particle simulation, culling
renderer, image filter, or GPU analytics pipeline.

`gpu-trace` depends on those reusable scheduling and rendering primitives, but the generic primitives
do not depend on `gpu-trace`. Applications that never display execution timelines therefore do not
import trace-domain schemas or interaction policies.

## Quick start

```ts
import {GPUCommandGraph} from '@luma.gl/experimental/gpu-core';
import {
  GPUTraceAggregation,
  GPUTraceCriticalPath,
  GPUTraceComparison,
  GPUTraceInteraction,
  GPUTraceScene,
  GPUTraceTemporalIndex,
  GPUTraceTimeBuckets,
  getGPUTracePickingShader
} from '@luma.gl/experimental/gpu-trace';
```

### Canonical spans and dependency links have stable identities

[`GPUTraceScene`](/docs/api-reference/experimental/gpu-trace/scene) accepts packed
eight-word span records and four-word dependency links. Span records describe time, duration, lane,
render group, process, thread, stable object identity, and classification bits. Separate parent
references represent structural nesting, while incoming and outgoing adjacency represent arbitrary
cross-process dependencies.

The module exports `GPU_TRACE_SPAN_RECORD_WORD_LENGTH` and `GPU_TRACE_LINK_RECORD_WORD_LENGTH` so
producers, demonstration datasets, and consumers agree on one canonical memory layout. Empty and
uneven source partitions remain visible; a compacted display position never replaces the stable
canonical row or application object ID.

Each trace span also projects into a normal
[`GPUScene`](/docs/api-reference/experimental/gpu-core/gpu-scene) record. Generic visibility,
renderer-owned resource groups, and indirect draw commands can therefore render a trace without
adding trace-specific fields to the scene database.

For example, a distributed request can retain canonical row `417`, application object ID `9021`,
and compacted visible position `12` simultaneously. Dependencies and picking resolve row `417`;
application inspection resolves object `9021`; a compacted label pass consumes position `12`.
Treating these identities as interchangeable would attach selections or dependency endpoints to
the wrong operation whenever filtering changes.

### Interactive policies change control state, not graph topology

[`GPUTraceInteraction`](/docs/api-reference/experimental/gpu-trace/interaction)
combines reusable graph operations into a fixed trace workflow:

1. Process and thread expansion determine visible timeline lanes.
2. A scanned hierarchy layout updates effective row offsets.
3. Time, minimum-duration, and classification policies reject irrelevant spans.
4. Selected spans expand over bounded incoming, outgoing, or bidirectional dependency links.
5. Hidden children project onto their nearest visible ancestors.
6. Stable compaction and scene draw generation publish GPU-resident indirect commands.

Panning, collapsing a thread, focusing on a critical path, or changing an error filter updates
small caller-owned GPU control buffers. The application re-encodes its existing compiled graph;
it does not rebuild a JavaScript span list, perform CPU draw selection, or hand submission
ownership to `gpu-trace`.

The smaller [GPU Scene Trace Explorer](/examples/experimental/gpu-trace-scene) demonstrates the
same hierarchy, dependency traversal, stable row identity, and picking contracts through
`GPUTraceScene`. Keeping that secondary composition on its own page avoids initializing two live
GPU trace applications inside one documentation article.

### Trace picking is separate from generic picking infrastructure

[`getGPUTracePickingShader`](/docs/api-reference/experimental/gpu-trace/picking)
produces a compute shader for a timeline coordinate. It considers only spans marked visible by the
current interaction policy, reconstructs effective display lanes from GPU-scanned thread offsets,
and atomically publishes the lowest matching canonical source-row identity.

```ts
const pickingSource = getGPUTracePickingShader(trace.stats.spanCount, lanesPerThread);
```

Applications still own the pick request, result buffer, command graph, readback, and highlighting.
General-purpose picking targets remain available separately; this helper adds only the
trace-specific time/lane interpretation.

### Choose the right level of composition

| Requirement | Recommended API | Reason |
| --- | --- | --- |
| Schedule arbitrary compute and render passes | `GPUCommandGraph` | No trace assumptions or domain-specific schemas |
| Upload canonical spans, ownership, hierarchy, and dependencies | `GPUTraceScene` | Preserves source identity and projects into a generic `GPUScene` |
| Apply reusable timeline controls without rebuilding graph topology | `GPUTraceInteraction` | Composes hierarchy, focus, visibility, ancestors, and indirect drawing |
| Query stable batches for the current time window and semantic zoom | `GPUTraceTemporalIndex` | Selects persistent hierarchy levels and publishes shared render, label, dependency, and picking candidates |
| Analyze the longest canonical parent path | `GPUTraceCriticalPath` | Resolves roots and cumulative durations in logarithmic passes, reports cycles, and publishes an exact selected-path mask |
| Compare current and baseline operation groups | `GPUTraceComparison` | Publishes compact aligned deltas, weighted regression scores, and a stable maximum without per-span comparison allocation |
| Aggregate trace dimensions or trace-time intervals | `GPUTraceAggregation`, `GPUTraceTimeBuckets` | Keeps analytical results GPU-resident and composable |
| Resolve a timeline coordinate to its visible canonical span | `getGPUTracePickingShader` | Understands trace timing, scanned lanes, and interaction visibility |
| Control queue submission, asynchronous readback, or UI state | Application-owned code | Keeps scheduling, resource lifetime, and presentation policies explicit |

The embedded explorer uses the complete trace stack together. The standalone scene explorer shows
that applications can also compose the generic primitives directly when they need a smaller
rendering model or different interaction policy.

## Public API

| Export | Responsibility |
| --- | --- |
| `GPUTraceScene` | Canonical GPU-resident spans, process/thread ownership, parents, links, partitions, and generic scene projection |
| `GPUTraceInteraction` | Reusable GPU hierarchy, time filtering, classification, dependency focus, ancestor retention, visibility, and indirect draws |
| [`GPUTraceTemporalIndex`](/docs/api-reference/experimental/gpu-trace/temporal-index) | Persistent multi-level trace-time index with stable candidate batches shared by render and interaction passes |
| `GPUTraceTemporalIndexBuilder` | Builds persistent batch summaries and temporal levels without changing canonical span identity |
| `GPUTraceLaneIndexBuilder` | Builds lane-aware start/end indexes used by bounded viewport queries |
| `GPUTraceMipmapBoundaries` | Chooses stable trace-coordinate boundaries for multi-resolution summaries |
| `GPUTracePixelMipmap` | Selects representative pixel-scale spans while retaining wide exact spans |
| `GPUTraceRangeMaximumIndexBuilder` | Retains reusable range maxima for important-span selection |
| [`GPUTraceCriticalPath`](/docs/api-reference/experimental/gpu-trace/critical-path) | Cycle-safe parent-path durations, roots, hops, stable endpoint selection, and exact critical mask |
| [`GPUTraceAnomalyScoring`](/docs/api-reference/experimental/gpu-trace/anomaly-scoring) | Explicit peer-baseline duration and error scoring with GPU-resident scores, masks, and compact validation summary |
| [`GPUTraceComparison`](/docs/api-reference/experimental/gpu-trace/comparison) | Dictionary-aligned current/baseline group deltas and explicit regression scoring |
| [`GPUTraceAggregation`](/docs/api-reference/experimental/gpu-trace/aggregation) | GPU-resident grouping, duration statistics, and clipped trace-time buckets |
| `GPUTraceTimeBuckets` | Builds trace-time utilization and duration summaries for viewport, measured, or full-trace intervals |
| `GPUTraceAnalyticsOutputLayout` | Named, packed chart-result views and typed compact-readback decoding without duplicated byte-offset arithmetic |
| `GPU_TRACE_SPAN_RECORD_WORD_LENGTH` | Number of 32-bit words in one canonical trace span |
| `GPU_TRACE_LINK_RECORD_WORD_LENGTH` | Number of 32-bit words in one dependency record |
| [`getGPUTracePickingShader`](/docs/api-reference/experimental/gpu-trace/picking) | Capacity-bounded, visible-span-aware timeline picking shader |

Trace-specific classes, constants, helpers, and types are exported only from
`@luma.gl/experimental/gpu-trace`; they are intentionally absent from the root
`@luma.gl/experimental` namespace.

## Limits and compatibility

- gpu-trace is experimental and WebGPU-only.
- Canonical identity, capacities, source chunk boundaries, and output formats are fixed at graph
  compilation time.
- Full-trace analysis may require resumable execution and explicit user confirmation.
- Rendering policy, data ingestion, queue submission, readback cadence, and UI publication remain
  application responsibilities.

## Related modules

- [GPU Core](/docs/api-reference/experimental/gpu-core) owns generic scheduling, conditions,
  budgeting, validation, and instrumentation.
- [GPU Graph](./gpu-graph) provides general graph analytics without trace-specific semantics.
- [GPU Dataframe](./gpu-dataframe) provides columnar aggregation and comparison building blocks.
