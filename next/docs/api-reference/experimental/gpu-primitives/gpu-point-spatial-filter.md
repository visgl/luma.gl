# GPUPointSpatialFilter

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUPointSpatialFilter` evaluates exact bounds or radius predicates over packed 2D or 3D points. It can scan every source row or refine a compact candidate list from `GPUGridIndexQuery`. Both paths write the same source-row-aligned mask, so visibility, selection, compaction, picking, and indirect drawing do not need separate indexed and unindexed implementations.

This primitive supplies the narrow phase that a grid deliberately does not. A grid knows which cells overlap a query; the filter knows whether each point is actually inside the bounds, circle, or sphere. Separating those jobs preserves exact results without teaching the index about every possible object representation.

## Concepts[​](#concepts "Direct link to Concepts")

### One predicate, two execution strategies[​](#one-predicate-two-execution-strategies "Direct link to One predicate, two execution strategies")

```
unindexed: all source rows ────────────────→ exact point predicate → source mask

indexed:   grid query → candidate row IDs → exact point predicate → source mask
```

The unindexed path is not merely a fallback. It is the correctness oracle and is often the faster choice for small data, broad queries, or data that changes so frequently that index construction cannot be amortized. The indexed path helps when queries are selective enough that testing a compact candidate set saves more work than building and querying the grid costs.

Because both paths publish the same mask contract, an application can select a strategy from measurements without changing its renderer or interaction code.

### What is exact[​](#what-is-exact "Direct link to What is exact")

| Kind     | Query layout                              | Exact rule                                       | Example use cases                                   |
| -------- | ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `bounds` | 2D: `[minX, minY, maxX, maxY]`; 3D adds Z | Every coordinate is inside the inclusive bounds  | Box selection, viewport points, simulation regions  |
| `radius` | Center followed by radius                 | Squared point distance is at most radius squared | Proximity, brush selection, influence neighborhoods |

Non-finite positions or query values, reversed bounds, and negative radii do not match. The filter handles points, not object extents: a circle intersecting a polygon or a box touching a sphere needs an application-specific exact predicate over that geometry.

### Candidate rows and stable identity[​](#candidate-rows-and-stable-identity "Direct link to Candidate rows and stable identity")

Candidate IDs are interpreted as source-row addresses because the filter uses them to load packed positions and set the corresponding mask row. This is intentionally narrower than `GPUGridIndexQuery`, whose stable IDs may be arbitrary. Use this refinement path when the index was built with generated row IDs. Applications with global or sparse IDs can keep a separate row-to-ID vector for final visibility output, or provide a domain-specific refinement pass.

The candidate `count` is clamped to candidate storage capacity before dispatch. Invalid row IDs are ignored rather than read. Candidate overflow is propagated, because an exact mask refined from a truncated broad phase is incomplete even if every stored candidate was tested successfully.

### Choosing the crossover[​](#choosing-the-crossover "Direct link to Choosing the crossover")

Do not infer the crossover from row count alone. Measure at least:

* index build or rebuild time and how many queries reuse it;
* cells touched and candidate count per query;
* exact predicate time for all rows versus candidates;
* grid storage, candidate storage, and source-mask memory;
* update rate and the percentage of points that change cells.

A useful first diagnostic is `candidateCount / positionCount`. A small ratio suggests that indexed refinement may help, but GPU dispatch overhead, cell density, and index amortization still determine the actual result. Performance guidance should report distributions across representative queries, not a universal threshold.

## Usage[​](#usage "Direct link to Usage")

```
const candidateMask = graph.createDataView(candidateMaskBuffer, {

  format: 'uint32',

  length: positions.length

});



new GPUPointSpatialFilter({

  positions,

  kind: 'radius',

  query: centerAndRadius,

  candidates: {

    ids: gridCandidates,

    count: gridCandidateCount,

    overflow: gridCandidateOverflow

  },

  outputMask: candidateMask,

  overflow: exactResultOverflow

}).addToGraph(graph);



new GPUVisibilityWorkflow({

  predicates: [

    {kind: 'bounds', mask: candidateMask},

    {kind: 'selection', mask: selectedRows}

  ],

  output: visibleIds,

  count: visibleCount

}).addToGraph(graph);
```

Omit `candidates` to dispatch the identical exact predicate over every source point. Query-buffer updates require no graph recompilation. The primitive clears its output mask and overflow word on every encoding; it does not submit, read back, compact, or allocate caller-visible results.
