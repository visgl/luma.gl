import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {GPUTraceSceneExample} from '@site/src/examples';

# GPUTraceInteraction

<GPUPrimitivesDocsTabs active="trace-interaction" />

## Overview

`GPUTraceInteraction` turns a canonical
[`GPUTraceScene`](/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene) into an
interactive, GPU-resident trace exploration pipeline. One caller-owned command graph combines
process/thread expansion, scanned row layout, temporal filtering, classification masks,
bidirectional dependency focus, ancestor projection, stable visibility compaction, and indirect
scene draw generation.

Import this trace-specific workflow from
[`@luma.gl/experimental/lutrace`](/docs/api-reference/experimental/lutrace). Its generic hierarchy,
traversal, visibility, command-graph, and indirect-rendering building blocks remain independent
of the trace domain.

The motivating problem is that interactive trace controls change much more frequently than the
trace itself. Panning through a distributed execution timeline, collapsing a noisy process,
isolating a selected span's upstream dependencies, or hiding low-duration runtime events should
update small GPU-resident control buffers instead of scanning millions of JavaScript span objects,
reading visibility back to the CPU, rebuilding draw lists, or recompiling graph topology.

Representative uses include service latency investigations, browser performance recordings, GPU
capture timelines, build-system scheduling views, and scientific workflows with both hierarchical
ownership and cross-process dependency edges.

<GPUTraceSceneExample embedded />

## Concepts

### One compiled graph, many interaction states

The workflow composes existing independent primitives in a fixed order:

1. [`GPUHierarchyLayout`](/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout)
   converts process/thread expansion states into effective thread heights and scanned offsets.
2. [`GPUGraphTraversal`](/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal)
   expands selected canonical span rows over bounded incoming, outgoing, or combined dependency
   edges.
3. A fixed-contract trace policy evaluates time, duration, classification, hierarchy, and optional
   linked-span focus into one source-aligned visibility mask.
4. [`GPUVisibilityWorkflow`](/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow)
   compacts stable canonical row IDs and publishes an exact visible count.
5. [`GPUAncestorProjection`](/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection)
   maps each hidden span to its nearest still-visible canonical parent.
6. [`GPUSceneDrawGeneration`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation)
   updates explicit renderer-authored indirect draw slots.

The application owns graph compilation, encoding, submission, and any deliberate readback. None
of the interaction stages uploads source spans again or chooses draw commands on the CPU.

In the embedded example, scrolling updates only a three-value temporal window, checkboxes update
process/thread and classification buffers, and clicking performs a GPU visibility-aware pick.
Enabling linked-span focus changes policy and selection inputs without recompiling the graph.
Per-group counts are sampled only as optional diagnostics; draw visibility is consumed directly
from stable GPU-written indirect command slots.

Scene-generated draw slots require the WebGPU `indirect-first-instance` feature. The live example
therefore selects the maximum-feature WebGPU device explicitly instead of assuming that an
otherwise functional core-only adapter supports source-indexed indirect rendering.

### Hierarchy collapse keeps representative lanes

Processes own `threadsPerProcess` consecutive globally numbered threads. Each thread owns
`lanesPerThread` consecutive original lanes. Expanded threads contribute their complete lane
height; collapsed threads retain their first lane. A collapsed process retains only the first lane
of its first thread, while its remaining threads contribute zero height.

The caller receives both effective thread heights and exclusive scanned offsets, so rendering can
position every remaining row without rewriting canonical span ownership. A process/thread mapping
that violates the declared contiguous topology is treated as invisible rather than silently
assigning a span to the wrong process.

This is useful when a process contains hundreds of runtime spans: its collapsed representative
remains stable while the following processes shift upward automatically.

### Time and classification controls remain small GPU buffers

`timeWindow` is a packed three-element `float32` view:

| Index | Meaning |
| --- | --- |
| 0 | Inclusive visible-window minimum |
| 1 | Inclusive visible-window maximum |
| 2 | Minimum accepted span duration |

A span participates when its `[start, start + duration]` interval intersects the current window
and its duration meets the minimum. An inverted or invalid window produces an empty result.

`policy` is a packed three-element `uint32` view:

| Index | Meaning |
| --- | --- |
| 0 | Classification bits that must all be present |
| 1 | Classification bits that must all be absent |
| 2 | Nonzero enables dependency-focused filtering |

For example, a service viewer can require an error bit while excluding instrumentation-only spans,
then adjust its duration threshold without changing the command graph.

### Linked-span focus preserves canonical identity

`selectedSpans` contains canonical source-row indices, `selectedCount` determines how many are
currently active, and `focusDepth` selects a runtime hop count up to `maxFocusDepth`. The default
`both` direction considers incoming and outgoing dependency adjacency.

The traversal publishes `reachedSpans`; the trace policy intersects that reachability with normal
time, classification, and hierarchy visibility only when focus is enabled and at least one seed
exists. With no active seed, enabling focus does not unexpectedly erase the entire trace.

This makes it possible to click a slow storage operation and progressively reveal the network and
compute work that preceded it while keeping original span identity stable across all views.

### Ancestor projection keeps hidden endpoints meaningful

Collapsing a process or excluding a classification can hide a span that is still the endpoint of a
dependency. `projectedAncestors` maps visible rows to themselves and hidden rows to their nearest
visible parent, with a bounded ancestry walk and the standard invalid sentinel for unresolved
chains.

Applications can therefore route an edge to the visible process/thread representative instead of
dropping the dependency or reconstructing hierarchy relationships on the CPU.

### Stable compacted rows and indirect draws remain separate

`visibleSpans` contains compacted canonical row indices in source order, while `visibleMask` stays
aligned to the fixed scene capacity. `visibleCount` reports the exact compacted result. The
downstream draw workflow independently clears and republishes explicit command slots, retaining
its existing required-count, published-count, overflow, and `indirect-first-instance` contracts.

This distinction lets one application use compacted rows for labels or picking while another
replays stable resource-grouped indirect draws from the same interaction state.

## Usage

```ts
import {GPUTraceInteraction} from '@luma.gl/experimental/lutrace';

const source = trace.importToGraph(graph);

new GPUTraceInteraction({
  trace: source,
  timeWindow,
  policy,
  processStates,
  threadStates,
  selectedSpans,
  selectedCount,
  focusDepth,
  threadHeights,
  threadOffsets,
  reachedSpans,
  visibleMask,
  visibleSpans,
  visibleCount,
  projectedAncestors,
  draw: {commands, requiredCount, publishedCount, overflow},
  threadsPerProcess: 4,
  lanesPerThread: 4,
  maxFocusDepth: 3
}).addToGraph(graph);

const compiled = graph.compile();

// Later interaction updates write small caller-owned buffers and reuse the same graph.
timeWindowBuffer.write(Float32Array.from([120, 260, 0.5]));
processStatesBuffer.write(nextProcessStates);
selectedCountBuffer.write(Uint32Array.from([1]));
```

## Current scope

This implements roadmap tranche T.2 for one canonical packed trace scene and a fixed regular
process/thread/lane hierarchy. The T.3 scene-backed explorer adds GPU visibility-aware picking,
renderer-owned resource groups, indirect rendering, and graph inspection as application-owned
composition. Arbitrary sparse ownership layouts and cross-partition scene storage remain separate
consumer-defined follow-up contracts.
