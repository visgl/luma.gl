# @luma.gl/experimental/gpu-trace

See [How gpu-trace scales execution traces](https://luma.gl/docs/api-reference/experimental/gpu-trace-algorithms)
for the package's end-to-end data flow, algorithm choices, current cost model, and pixel-mipmap
architecture.

## Overview

`gpu-trace` provides optional GPU-resident execution-trace models, interactive timeline policies,
and trace-aware picking. It builds on the generic experimental command graph and scene primitives
without adding spans, processes, threads, or dependency links to their public APIs.

```ts
import {GPUCommandGraph} from '@luma.gl/experimental/gpu-core';
import {
  GPUTraceAggregation,
  GPUTraceAnalyticsOutputLayout,
  GPUTraceAnomalyScoring,
  GPUTraceComparison,
  GPUTraceCriticalPath,
  GPUTraceInteraction,
  GPUTraceLaneIndexBuilder,
  GPUTracePixelMipmap,
  GPUTraceScene,
  GPUTraceTemporalIndex,
  GPUTraceTimeBuckets,
  getGPUTracePickingShader
} from '@luma.gl/experimental/gpu-trace';
```

## Concepts

### Trace topology remains domain-specific

`GPUTraceScene` stores canonical span identity, timing, process/thread ownership, hierarchy
parents, explicit source partitions, dependency links, and bidirectional adjacency in GPU buffers.
It projects those rows into an ordinary `GPUScene` instead of adding trace-specific fields to the
generic renderer.

Use it for distributed service timelines, browser performance recordings, build-system schedules,
GPU captures, or scientific workflows whose operations need both hierarchy and cross-process
dependency relationships.

### Interaction policies reuse generic graph primitives

`GPUTraceInteraction` composes process/thread expansion, row layout, time and classification
filters, linked-span focus, visible-ancestor projection, stable compaction, and indirect scene
draws. Its control buffers remain caller-owned, so applications can change policies and encode the
same compiled graph without rebuilding CPU span lists or submitting work implicitly.

Generic hierarchy layout, graph traversal, visibility, scene storage, renderer resource groups,
and command scheduling remain available from `@luma.gl/experimental`.

### Trace picking preserves canonical identity

`getGPUTracePickingShader(spanCount, lanesPerThread)` produces a bounded compute shader that tests
only visible canonical spans against a requested timeline coordinate. It applies GPU-scanned
thread offsets, respects the caller's process/thread lane topology, and atomically publishes the
lowest matching source-row identity.

This helper is trace-specific; general-purpose picking targets, readback ownership, graph
encoding, and command submission remain outside the `gpu-trace` module.

The generated shader uses five group-zero storage bindings: packed canonical spans, scanned
thread offsets, the final visibility mask, a `{time, lane, enabled, padding}` request, and an atomic
result initialized to `0xffffffff`. Matching visible spans atomically publish their lowest
canonical source-row index, which can feed dependency selection without translating through a
compacted display position.

### Use cases and composition boundaries

- Service latency investigations: focus a slow request's upstream and downstream dependencies.
- Browser or GPU captures: collapse noisy processes while preserving stable operation identity.
- Build-system schedules: filter short tasks and inspect cross-worker critical-path relationships.
- Scientific workflows: retain explicit batch boundaries and cross-stage dependency topology.

Applications own command graphs, queue submission, rendering policy, interaction controls, and
readback. `GPUTraceScene` owns only its uploaded trace and projected scene allocations;
`GPUTraceInteraction` borrows caller-owned graph views and registers reusable passes.

### GPU-resident aggregation

`GPUTraceAggregation` groups canonical spans by lane, renderer group, process, thread, or
classification and publishes counts or duration statistics into caller-owned graph views. A caller
may also provide a custom dense key column for operation dictionaries or application-specific
service identities. Passing `GPUTraceInteraction.visibleMask` as the selection makes filtering,
hierarchy collapse, and dependency focus update the aggregation without a CPU span list or graph
recompilation. Results remain GPU-resident unless the application explicitly samples them.

`GPUTraceTimeBuckets` adds interval-aware time aggregation: every span contributes an occupancy
count and only its clipped overlap duration to each equal-width trace-time bucket it intersects.
This supports utilization strips and active-time summaries without expanding spans on the CPU.
It accepts the same chunked canonical columns and optional source-aligned selections.

`GPUTraceAnalyticsOutputLayout` packs named count and duration series into one caller-owned result
buffer. It exposes typed graph views and decodes the same named series after an explicitly requested
compact readback, avoiding duplicated byte-offset arithmetic across applications and chart UIs.

### Trace-time candidate index

`GPUTraceTemporalIndex` queries immutable per-batch time, lane, duration, and renderer-group summaries.
It publishes source-ordered candidate batches plus a narrower exact-rendering selection into
caller-owned graph views. Density rendering, wide-span exceptions, labels, dependencies, and
picking can therefore consume the same stable candidate set without CPU readback or separate
visibility decisions.

The application supplies source-preserving leaf summaries plus optional persistent hierarchy
levels over bounded contiguous leaf ranges. At wide zoom levels the GPU scans a selected coarse
level, stably compacts matching nodes, and expands them back into canonical leaf batch IDs. A
separate leaf query keeps individually recognizable wide spans exact. Only the small query buffer
changes with the viewport; downstream rendering and interaction passes keep consuming the same
ordinary graph views at every level.

`GPUTraceTemporalIndexBuilder` constructs those hierarchy summaries on the GPU from packed leaf
records. Stable range/group topology is initialized once, while one dirty word per bounded source
partition supports initial construction and incremental streaming updates. Rebuilding a partition
updates every persistent resolution level that covers it, reports invalid ranges or group
boundaries through a GPU validation word, and clears the processed dirty mask without readback.

### Pixel-bounded semantic zoom

`GPUTraceLaneIndexBuilder` creates a persistent secondary index ordered by lane/depth, start time,
and canonical span ID. It composes two stable GPU radix sorts, a lane histogram, and a prefix scan;
the canonical source table remains untouched. Invalid timing, duration, lane, or overlap contracts
are reported through a validation word. The construction graph can be advanced over multiple
frames and its outputs retained for interactive queries.

`GPUTracePixelMipmap` generates regular trace-time boundaries, resolves their lower bounds with
the generic `GPUGallopingSearch`, and selects the longest non-overlapping span intersecting each
lane/pixel cell. Output size is bounded by lanes times viewport width rather than total trace size.
The canonical span ID survives every stage, so aggregate rendering, picking, and exact-detail
handoff can share identity.

For chunked traces, `rowOrder` can be a compact lane/time-sorted index over strided start,
duration, and ID fields in the original span records. This avoids duplicating those source columns
and keeps each search binding within the source chunk's device-limit envelope.

An optional source-row `selectionMask` applies status, duration, service, focus, and other filters
before the longest-span winner is chosen. This prevents a filtered span from occupying a pixel and
then disappearing after selection. Filter-aware queries use the compact disjoint-scan path.

Callers can add a persistent `GPUTraceRangeMaximumIndexBuilder` tree for logarithmic longest-span
queries, or omit it to use lower-memory disjoint linear scans. Both modes explicitly compare the
span immediately before each pixel boundary so a sufficiently wide span remains visible after
aggregation begins.

### GPU causal paths

`GPUTraceCriticalPath` resolves canonical parent chains with logarithmic pointer-jumping passes.
It publishes each span's root, hop count, inclusive path duration, distance from the winning path,
validated predecessor, and an exact mask for the longest stable-ID path. Invalid parents,
non-finite durations, cycles, numeric overflow, and a bounded path-mask walk are reported through a
compact GPU summary rather than producing plausible but corrupt causal results. This first contract
is exact for a canonical parent forest; multi-parent DAG preparation and CPM slack remain a
separate extension rather than being hidden behind parent selection.

Critical-path passes publish static invocation bounds, and `maximumRowsPerPass` can opt into finer
graph nodes. A compiled analysis can therefore run through `createExecution()` over several
submissions while preserving dependency order and exposing progress between frames.

### GPU peer anomaly scoring

`GPUTraceAnomalyScoring` compares chunked canonical durations and error states with explicit dense
peer baselines. Callers choose slow-only or two-sided duration deviation, independent duration and
error weights, and the anomaly threshold. Per-span scores and masks remain GPU-resident while a
four-word summary reports the anomaly count, stable maximum, and validation flags. Baselines can
come from another trace or deployment cohort, so the primitive does not embed product-specific
grouping or scoring semantics.

Scoring and its summary reductions use the same resumable scheduling contract. Applications can
cancel between graph steps and publish the results only after the final summary is complete.
The advanced trace viewer copies the completed source-aligned mask into lazy per-source-chunk
render buffers. Exact, representative, and wide-span rendering can therefore distinguish anomalous
rows without downloading scores or allocating the overlay until an analysis is requested.

### GPU baseline comparison

`GPUTraceComparison` compares compact, dictionary-aligned current and baseline summaries. It
publishes count, mean-duration, duration-ratio, and error-rate deltas plus an explicit weighted
regression score and mask. Operating on group summaries keeps comparison storage bounded for
25M-span traces; renderers and filters map the results through the same dense operation IDs.
Comparison and per-span anomaly scoring are separate contributors that can be composed into one
command graph and share baseline columns without coupling their policies.

See the [gpu-trace API reference](https://luma.gl/docs/api-reference/experimental/gpu-trace) for
complete usage examples and the live trace explorer.
