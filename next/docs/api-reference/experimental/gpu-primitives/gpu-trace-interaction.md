# GPUTraceInteraction

[Foundation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Tables & joins](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Graphs](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Spatial](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Rendering](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)

[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUTraceInteraction` turns a canonical [`GPUTraceScene`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md) into an interactive, GPU-resident trace exploration pipeline. One caller-owned command graph combines process/thread expansion, scanned row layout, temporal filtering, classification masks, bidirectional dependency focus, ancestor projection, stable visibility compaction, and indirect scene draw generation.

Import this trace-specific workflow from [`@luma.gl/experimental/lutrace`](https://luma.gl/next/docs/api-reference/experimental/lutrace.md). Its generic hierarchy, traversal, visibility, command-graph, and indirect-rendering building blocks remain independent of the trace domain.

The motivating problem is that interactive trace controls change much more frequently than the trace itself. Panning through a distributed execution timeline, collapsing a noisy process, isolating a selected span's upstream dependencies, or hiding low-duration runtime events should update small GPU-resident control buffers instead of scanning millions of JavaScript span objects, reading visibility back to the CPU, rebuilding draw lists, or recompiling graph topology.

Representative uses include service latency investigations, browser performance recordings, GPU capture timelines, build-system scheduling views, and scientific workflows with both hierarchical ownership and cross-process dependency edges.

### GPU Scene Trace Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-scene)Info

InfoSource

```
// Loading source…
```

## Concepts[​](#concepts "Direct link to Concepts")

### One compiled graph, many interaction states[​](#one-compiled-graph-many-interaction-states "Direct link to One compiled graph, many interaction states")

The workflow composes existing independent primitives in a fixed order:

1. [`GPUHierarchyLayout`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md) converts process/thread expansion states into effective thread heights and scanned offsets.
2. [`GPUGraphTraversal`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md) expands selected canonical span rows over bounded incoming, outgoing, or combined dependency edges.
3. A fixed-contract trace policy evaluates time, duration, classification, hierarchy, and optional linked-span focus into one source-aligned visibility mask.
4. [`GPUVisibilityWorkflow`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md) compacts stable canonical row IDs and publishes an exact visible count.
5. [`GPUAncestorProjection`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md) maps each hidden span to its nearest still-visible canonical parent.
6. [`GPUSceneDrawGeneration`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md) updates explicit renderer-authored indirect draw slots.

The application owns graph compilation, encoding, submission, and any deliberate readback. None of the interaction stages uploads source spans again or chooses draw commands on the CPU.

In the embedded example, scrolling updates only a three-value temporal window, checkboxes update process/thread and classification buffers, and clicking performs a GPU visibility-aware pick. Enabling linked-span focus changes policy and selection inputs without recompiling the graph. Per-group counts are sampled only as optional diagnostics; draw visibility is consumed directly from stable GPU-written indirect command slots.

Scene-generated draw slots require the WebGPU `indirect-first-instance` feature. The live example therefore selects the maximum-feature WebGPU device explicitly instead of assuming that an otherwise functional core-only adapter supports source-indexed indirect rendering.

### Hierarchy collapse keeps representative lanes[​](#hierarchy-collapse-keeps-representative-lanes "Direct link to Hierarchy collapse keeps representative lanes")

Processes own `threadsPerProcess` consecutive globally numbered threads. Each thread owns `lanesPerThread` consecutive original lanes. Expanded threads contribute their complete lane height; collapsed threads retain their first lane. A collapsed process retains only the first lane of its first thread, while its remaining threads contribute zero height.

The caller receives both effective thread heights and exclusive scanned offsets, so rendering can position every remaining row without rewriting canonical span ownership. A process/thread mapping that violates the declared contiguous topology is treated as invisible rather than silently assigning a span to the wrong process.

This is useful when a process contains hundreds of runtime spans: its collapsed representative remains stable while the following processes shift upward automatically.

### Time and classification controls remain small GPU buffers[​](#time-and-classification-controls-remain-small-gpu-buffers "Direct link to Time and classification controls remain small GPU buffers")

`timeWindow` is a packed three-element `float32` view:

| Index | Meaning                          |
| ----- | -------------------------------- |
| 0     | Inclusive visible-window minimum |
| 1     | Inclusive visible-window maximum |
| 2     | Minimum accepted span duration   |

A span participates when its `[start, start + duration]` interval intersects the current window and its duration meets the minimum. An inverted or invalid window produces an empty result.

`policy` is a packed three-element `uint32` view:

| Index | Meaning                                      |
| ----- | -------------------------------------------- |
| 0     | Classification bits that must all be present |
| 1     | Classification bits that must all be absent  |
| 2     | Nonzero enables dependency-focused filtering |

For example, a service viewer can require an error bit while excluding instrumentation-only spans, then adjust its duration threshold without changing the command graph.

### Linked-span focus preserves canonical identity[​](#linked-span-focus-preserves-canonical-identity "Direct link to Linked-span focus preserves canonical identity")

`selectedSpans` contains canonical source-row indices, `selectedCount` determines how many are currently active, and `focusDepth` selects a runtime hop count up to `maxFocusDepth`. The default `both` direction considers incoming and outgoing dependency adjacency.

The traversal publishes `reachedSpans`; the trace policy intersects that reachability with normal time, classification, and hierarchy visibility only when focus is enabled and at least one seed exists. With no active seed, enabling focus does not unexpectedly erase the entire trace.

This makes it possible to click a slow storage operation and progressively reveal the network and compute work that preceded it while keeping original span identity stable across all views.

### Ancestor projection keeps hidden endpoints meaningful[​](#ancestor-projection-keeps-hidden-endpoints-meaningful "Direct link to Ancestor projection keeps hidden endpoints meaningful")

Collapsing a process or excluding a classification can hide a span that is still the endpoint of a dependency. `projectedAncestors` maps visible rows to themselves and hidden rows to their nearest visible parent, with a bounded ancestry walk and the standard invalid sentinel for unresolved chains.

Applications can therefore route an edge to the visible process/thread representative instead of dropping the dependency or reconstructing hierarchy relationships on the CPU.

### Stable compacted rows and indirect draws remain separate[​](#stable-compacted-rows-and-indirect-draws-remain-separate "Direct link to Stable compacted rows and indirect draws remain separate")

`visibleSpans` contains compacted canonical row indices in source order, while `visibleMask` stays aligned to the fixed scene capacity. `visibleCount` reports the exact compacted result. The downstream draw workflow independently clears and republishes explicit command slots, retaining its existing required-count, published-count, overflow, and `indirect-first-instance` contracts.

This distinction lets one application use compacted rows for labels or picking while another replays stable resource-grouped indirect draws from the same interaction state.

### Picking follows the same visible hierarchy[​](#picking-follows-the-same-visible-hierarchy "Direct link to Picking follows the same visible hierarchy")

[`getGPUTracePickingShader`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md) consumes `threadOffsets` and `visibleMask` directly. A click therefore resolves against the effective post-collapse row and current filtering policy instead of an outdated original lane. The returned value remains the canonical source row, so it can feed `selectedSpans` directly when linked-span focus should follow the current selection.

## Usage[​](#usage "Direct link to Usage")

```
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

## Current scope[​](#current-scope "Direct link to Current scope")

This implements roadmap tranche T.2 for one canonical packed trace scene and a fixed regular process/thread/lane hierarchy. The T.3 scene-backed explorer adds GPU visibility-aware picking, renderer-owned resource groups, indirect rendering, and graph inspection as application-owned composition. Arbitrary sparse ownership layouts and cross-partition scene storage remain separate consumer-defined follow-up contracts.
