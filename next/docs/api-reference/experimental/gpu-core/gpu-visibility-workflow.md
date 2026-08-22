# GPUVisibilityWorkflow

[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scan.md)[Galloping Search](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-galloping-search.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection.md)

## Overview[​](#overview "Direct link to Overview")

`GPUVisibilityWorkflow` is a renderer-independent command-graph fragment that intersects source-aligned visibility masks, stably compacts visible source IDs, and publishes the visible count. The count can point directly at an indirect draw command, so neither filtering nor drawing requires CPU readback.

## At a glance

| Question                 | Answer                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Problem**              | Turn visibility decisions into one mask, stable ID list, and draw-ready count.                    |
| **Reads / writes**       | Reads predicate masks and optional source IDs; writes mask, packed IDs, and count.                |
| **Ownership**            | Inputs, outputs, and count are caller-owned; identity, scan, and compaction scratch are internal. |
| **Output contract**      | Bounded stable IDs; only the GPU-written count prefix is valid.                                   |
| **Expected work**        | Mask intersection, optional identity generation, hierarchical scan, and stable scatter.           |
| **Chunks**               | Matching vector chunks are preserved as one logical sequence.                                     |
| **Conditions / budgets** | Contributed nodes may share a branch condition; no custom resumable plan is exposed.              |
| **Neighborhood**         | time, bounds, LOD, and selection masks → GPUVisibilityWorkflow → indirect consumer.               |

**Cost**All candidate rows are masked and compacted; bound candidates before this workflow when possible.

**Common mistake**Do not rebuild source IDs on the CPU when canonical GPU identity is already available.

## Concepts[​](#concepts "Direct link to Concepts")

A predicate answers one visibility question per source row; the workflow combines those answers into one canonical mask and materializes the accepted identities. Stable compaction preserves source order, and the GPU-resident count defines the valid prefix of the output. Renderers consume that fixed contract without knowing whether rows were rejected by time, bounds, LOD, selection, or a combination of them.

Use the workflow when several renderers or examples should share the same fixed visibility plumbing. Time-window filtering in a timeline, frustum culling in a 3D view, LOD selection for map tiles, and linked-selection filtering can all produce masks independently and receive the same stable IDs plus indirect count. This keeps renderer-specific shaders focused on producing predicates and consuming identities.

Use `GPUMask` and `GPUCompaction` directly when an application needs different boolean semantics, custom outputs, or only one of those stages. The workflow intentionally does not accept arbitrary WGSL callbacks: fixed predicate-mask contracts remain easier to compose, validate, and reuse.

```
import {GPUVisibilityWorkflow} from '@luma.gl/gpgpu/gpu-core';



const count = graph.importGPUData(

  'visible-object-count',

  drawCommands.getInstanceCountData(0)

);



new GPUVisibilityWorkflow({

  id: 'visible-objects',

  predicates: [

    {kind: 'time-range', mask: timeRangeMask},

    {kind: 'bounds', mask: boundsMask},

    {kind: 'lod', mask: lodMask},

    {kind: 'selection', mask: selectionMask}

  ],

  outputMask: visibleMask,

  output: visibleIds,

  count

}).addToGraph(graph);
```

The workflow owns mask intersection, identity generation, scan, stable scatter, and count publication. Applications remain responsible for producing predicate masks. This fixed contract lets a time filter, frustum test, LOD rule, or selection kernel share the same downstream workflow without embedding renderer state or application WGSL in the API.

## Predicates[​](#predicates "Direct link to Predicates")

Each predicate has a semantic `kind` and a packed `uint32` mask. A zero rejects the corresponding source row; any nonzero value accepts it. All predicates are intersected. The supported semantic roles are:

* `'time-range'`
* `'bounds'`
* `'lod'`
* `'selection'`

A producer that fuses several tests into one mask can provide an array of kinds, such as `{kind: ['time-range', 'bounds', 'lod'], mask}`. Kinds describe the fixed contract for diagnostics and workflow composition; they do not inject shader callbacks.

When `outputMask` is provided, the workflow writes the canonical composed mask as `0` or `1`. This allows hierarchy projection or another algorithm to consume the exact visibility decision.

## Stable identity and output[​](#stable-identity-and-output "Direct link to Stable identity and output")

By default, the workflow generates consecutive source IDs beginning at zero. Set `firstSourceIndex` when the input represents a slice of a larger stable identity space:

```
new GPUVisibilityWorkflow({

  predicates: [{kind: 'selection', mask: groupMask}],

  output: groupVisibleIds,

  count: groupInstanceCount,

  firstSourceIndex: group.firstRow

}).addToGraph(graph);
```

Alternatively, supply `sourceIds` to compact an explicit ID vector. `sourceIds` and `firstSourceIndex` are mutually exclusive. Selected IDs preserve source order.

`count` is one packed `uint32` row. It may be ordinary storage or a borrowed `DrawCommandBuffer` count field. Updating predicate data and encoding the compiled graph again updates the output IDs and count without recompiling the graph.

## Chunked vectors[​](#chunked-vectors "Direct link to Chunked vectors")

Predicates, source IDs, output masks, and outputs may all be atomic `GraphDataView<'uint32'>` values or all be `GraphVectorView<'uint32'>` values. Vector inputs must have identical ordered chunk topology. The workflow preserves chunk boundaries, generates IDs in the global logical order, and reports one vector-wide count; it never concatenates or repacks the caller-owned buffers.

Output capacity must cover every source row. All views must belong to the target graph, and generated IDs must fit in `uint32`.

## Current consumers[​](#current-consumers "Direct link to Current consumers")

The hierarchical trace viewer combines time-range, viewport, LOD, and focused-selection masks, then routes the workflow's stable IDs and counts into grouped indirect draws. The frustum-culling example supplies a bounds mask and consumes the same output contract for indexed indirect rendering. Neither consumer owns scan or compaction plumbing.

Application-defined WGSL predicate callbacks remain deferred until these fixed mask contracts demonstrate which extension points are necessary.
