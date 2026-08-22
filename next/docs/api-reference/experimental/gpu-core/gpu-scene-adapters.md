# GPUScene adapters

[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-resource-groups.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-index-picking-target.md)

## Overview[​](#overview "Direct link to Overview")

The `GPUScene` adapters let two very different application models populate the same flat GPU draw database without making either model canonical:

* `makeGPUSceneFromCPUScene()` traverses an application-owned hierarchy and asks a callback for ordinary `GPUSceneRecord` values. The resulting scene retains CPU identity metadata and supports transactional mutation.
* `makeGPUScenePartitionsFromGPUTable()` borrows already-interleaved scene records from every preserved `GPUTable` batch. It returns ordered scene partitions without reading, concatenating, or repacking rows.

This distinction matters because CPU scene graphs and GPU tables have opposite strengths. A scene graph naturally owns hierarchy, lifecycle, and incremental edits. A table naturally owns columns, streaming batches, and GPU-resident data. Both can feed the same visibility, picking, spatial, and draw-generation contracts once they agree on the flat record at the boundary.

### GPU Scene Graph Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-scene-graph)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a glance

| Question                 | Answer                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Problem**              | Populate one flat GPUScene contract from CPU hierarchies or GPU-native table sources.           |
| **Reads / writes**       | Reads adapter-specific source records; writes canonical GPUScene records and identity metadata. |
| **Ownership**            | Adapters preserve caller ownership rules and make any transferred storage explicit.             |
| **Output contract**      | A GPUScene with stable canonical record and application identities.                             |
| **Expected work**        | Adapter-specific upload or graph transformation over source records.                            |
| **Chunks**               | GPU-native adapters preserve source partitions where the scene contract permits them.           |
| **Conditions / budgets** | Population is explicit; scene rendering and submission remain separate.                         |
| **Neighborhood**         | application hierarchy or GPU table → scene adapter → GPUScene workflows.                        |

**Cost**Avoid repeated CPU traversal and upload when source topology is unchanged.

**Common mistake**Do not make one adapter’s hierarchy or table model canonical for all scenes.

## Concepts[​](#concepts "Direct link to Concepts")

### An adapter is a boundary, not a new source model[​](#an-adapter-is-a-boundary-not-a-new-source-model "Direct link to An adapter is a boundary, not a new source model")

The CPU adapter does not prescribe a node class, transform hierarchy, material system, or child container. `roots`, `getChildren`, and `getRecord` describe only how to visit the caller's model and produce the fields required by `GPUScene`. Grouping nodes may return `null` while their descendants continue to be visited.

Traversal is stable preorder. A repeated node identity is visited once, which bounds cycles and shared subgraphs without encoding parent pointers in the flat result. The callback receives the parent, depth, visited-source index, and next emitted-record index so applications can resolve their own inherited state before returning a record.

The output is an ordinary mutable `GPUScene`. Stable IDs, bounds, transforms, group references, geometry references, and command slots have exactly the same meaning as records supplied directly to the constructor.

In the embedded explorer, three application-owned grouping branches contain ordinary renderable leaves. Grouping nodes deliberately return `null`; leaf records retain stable application IDs that differ from their physical slots. The resulting flat scene feeds the same visibility, picking, indirect-draw, and renderer-resource-group primitives as the trace explorer without importing its hierarchy or domain concepts into `GPUScene`.

### Zero-copy table adaptation requires a physical agreement[​](#zero-copy-table-adaptation-requires-a-physical-agreement "Direct link to Zero-copy table adaptation requires a physical agreement")

A columnar table cannot become one interleaved `GPUScene` record buffer for free. Pretending otherwise would hide a transpose, allocation, command submission, and lifetime boundary inside a convenience function. The table adapter therefore accepts only batches that already expose the canonical 128-byte interleaved layout:

| Role                              | Format      | Record byte offset |
| --------------------------------- | ----------- | ------------------ |
| `objectId`                        | `uint32`    | 0                  |
| `flags`                           | `uint32`    | 4                  |
| `groupId`                         | `uint32`    | 8                  |
| `geometryId`                      | `uint32`    | 12                 |
| `commandSlot`                     | `uint32`    | 16                 |
| `boundsMinimum` / `boundsMaximum` | `float32x4` | 32 / 48            |
| `transform0` … `transform3`       | `float32x4` | 64 / 80 / 96 / 112 |

Every mapped `GPUData` view in a nonempty batch must share one immutable `Buffer`, begin at its canonical field offset, and use a 128-byte stride. Column names may be remapped, but roles must be unique. A packed columnar layout, shifted subrange, separate field buffers, or replaceable `DynamicBuffer` is rejected rather than copied behind the caller's back.

This makes the cost model simple: adapting record storage costs zero bytes and submits no GPU work. Producers that currently own columnar fields may perform an explicit graph transform into the scene layout when that cost is worthwhile; that transformation remains visible and schedulable.

### Preserved batches become preserved scene partitions[​](#preserved-batches-become-preserved-scene-partitions "Direct link to Preserved batches become preserved scene partitions")

One table may contain several independently allocated record batches. A single `GPUScene` requires one contiguous record buffer, so the adapter returns one ordered partition per source batch instead of concatenating them. Each partition reports its source `batchIndex`, cumulative `firstRecord`, and `recordCount`.

Empty batches remain in the partition list with `scene: null`. Their stable position is useful for streaming windows, tiles, tenants, or incremental replacement, and later batches keep the same global record base they would have under conceptual concatenation. Nonempty batches expose an ordinary `GPUScene`, so downstream workflows can operate per partition without learning table types.

### Identity validity remains producer-owned[​](#identity-validity-remains-producer-owned "Direct link to Identity validity remains producer-owned")

The table path is deliberately opaque. It validates physical layout and capacity, but it does not read GPU rows back to check object-ID uniqueness, finite bounds, transforms, or active flags. The producer is responsible for writing valid scene records, including `GPU_SCENE_ACTIVE_FLAG` for active rows. GPU-authored validation can be composed explicitly when untrusted producers require it.

The producer must also provide one exact `activeCounts` entry per preserved batch. This metadata distinguishes the physical high-water mark from live records when a batch contains inactive holes; empty batches have an active count of zero. The adapter never guesses activity by reading or scanning the borrowed GPU records.

Because the adapter has no CPU copy of IDs or holes, table scenes expose `mutable === false`. CPU-authored `mutate()` and `compact()` reject; GPU workflows may still read their typed graph views. Replacing a table batch means creating a new adaptation for that allocation rather than leaving a scene pointed at a buffer that may move.

### Ownership follows the allocation that created it[​](#ownership-follows-the-allocation-that-created-it "Direct link to Ownership follows the allocation that created it")

Table record buffers remain owned by their `GPUData` and `GPUTable` lifecycle. Each nonempty scene borrows that record buffer and owns only a new 16-byte count, active-count, and overflow state block. `GPUScene` supports independent record/state ownership so `destroy()` releases the adapter's state without destroying table storage.

The adapter result's idempotent `destroy()` destroys all nonempty partition scenes. It must run before the table storage is destroyed or replaced. CPU-adapted scenes own both buffers normally.

## CPU hierarchy usage[​](#cpu-hierarchy-usage "Direct link to CPU hierarchy usage")

```
const scene = makeGPUSceneFromCPUScene(device, {

  roots: world.roots,

  getChildren: node => node.children,

  getRecord: node =>

    node.renderable

      ? {

          id: node.stableId,

          bounds: node.worldBounds,

          transform: node.worldTransform,

          groupId: node.pipelineGroup,

          geometryId: node.meshId

        }

      : null,

  capacity: 10_000

});
```

## GPU table usage[​](#gpu-table-usage "Direct link to GPU table usage")

```
const adapted = makeGPUScenePartitionsFromGPUTable(device, table, {

  activeCounts: producerActiveCounts,

  columns: {

    objectId: 'featureId',

    geometryId: 'meshId'

  }

});



for (const partition of adapted.partitions) {

  if (!partition.scene) continue;

  const sceneView = partition.scene.importToGraph(graph);

  // Compose sceneView with partition-local visibility and draw generation.

}



adapted.destroy();

table.destroy();
```

## Current scope[​](#current-scope "Direct link to Current scope")

These adapters complete the Phase 6.1c source-boundary contract. They do not transform columnar tables into interleaved records, infer world transforms, validate GPU-authored values, combine batch allocations, or generate draw commands. Those operations remain explicit producers or later graph workflows so their memory, submission, and identity costs stay observable.
