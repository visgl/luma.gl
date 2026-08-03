import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUScene

<GPUPrimitivesDocsTabs active="scene" />

## Overview

`GPUScene` owns or borrows a flat, fixed-capacity GPU database for renderable objects. Each record
has a stable application ID, bounds, transform, draw-group reference, geometry reference, and
indirect-command slot. The same storage can therefore connect visibility, spatial queries,
picking, and later GPU draw generation without rebuilding a CPU-selected draw list each frame.

The class is deliberately a storage contract, not a scene graph. A game-engine hierarchy, a table,
a simulation, or a map tile system may all populate the records, but none becomes the canonical
source model. This separation makes the expensive GPU path reusable while applications retain
their own hierarchy, lifecycle, and presentation policy.

## Concepts

### Stable identity is separate from record position

`id` is the durable application identity used by picking and selection. A record's array position
is only its current storage slot. Keeping those concepts separate is essential once later update
and compaction workflows move records: references can continue to name an object even when its
physical location changes. `0xffffffff` is reserved as the invalid reference and cannot be an
object ID.

Initial records occupy a dense active prefix. `flags` marks those records active, while the state
buffer publishes `count`, `activeCount`, and `overflow` as separate `uint32` graph views. After a
removal, `count` is the physical high-water mark and may include holes; `activeCount` is the exact
number of live records. Consumers therefore combine the prefix with `flags` until compaction makes
the two counts equal again.

Pre-populated borrowed records may declare an explicit `activeCount` below their physical
`recordCount`. Newly allocated empty storage cannot claim a positive record count, and bounds or
transform values must remain finite after conversion to the stored `float32` representation.

### Mutation is transactional and measurable

`mutate()` accepts removals, patches, insertions, and optional compaction as one transaction. The
complete transaction is validated before CPU metadata or GPU buffers change. Removals run first,
patches retain the same stable IDs, and insertions reuse the lowest available slots. IDs may appear
in only one operation within a transaction, which keeps replacement and ordering semantics
unambiguous.

Fixed capacity is a normal result, not an implicit reallocation. Insertions fill the available
slots in input order, `overflowCount` reports the uninserted suffix, and the state buffer's
`overflow` value becomes one. Every result also reports `writeCount` and `uploadedByteLength`, so an
application can decide when fragmented small writes cost more than compaction.

`compact()` and `mutate({compact: true})` retain active records in prior slot order and return every
`{id, from, to}` move. Stable IDs and group, geometry, and command references remain unchanged.
Compaction uploads at most the former active prefix and clears its unused suffix; a dense no-op
compaction uploads no record bytes.

These operations use explicit WebGPU queue writes. They do not submit command buffers or read GPU
data back. This is the CPU-authored update path for scene graphs and streaming producers; later
GPU-authored draw selection consumes the same resident records without requiring CPU filtering.

### One fixed record connects several workflows

Every record is 128 bytes:

| Byte offset | Field | Purpose |
| ---: | --- | --- |
| 0 | object ID and flags | Stable identity and participation state |
| 8 | group and geometry IDs | Renderer-owned resource references |
| 16 | command slot | Destination for later indirect-command generation |
| 32 | minimum bounds | `float32x4`; XYZ contains the caller-defined minimum |
| 48 | maximum bounds | `float32x4`; XYZ contains the caller-defined maximum |
| 64 | transform | Four column-major `float32x4` columns |

The padding is intentional. Every vector field is 16-byte aligned for storage-buffer access, and
the interleaved layout can be imported into `GPUCommandGraph` as typed, strided field views without
repacking. Bounds are useful to frustum and spatial filtering; stable IDs feed picking and
selection; group, geometry, and command references let a renderer attach its own resources without
putting pipelines or materials into the core scene record.

The bounds' coordinate space is caller policy. Applications may upload world-space bounds ready
for queries, or object-space bounds that a later workflow transforms; the storage layer does not
apply a transform or silently reinterpret them.

### References do not imply ownership

`groupId`, `geometryId`, and `commandSlot` default to `GPU_SCENE_INVALID_REFERENCE`. They are
application-defined keys, not handles owned or destroyed by `GPUScene`. In particular, a command
slot names where a later workflow may write; this tranche does not allocate or encode indirect
draw commands. That explicit boundary avoids coupling scene storage to one renderer or table
package.

### Capacity and ownership are visible

Capacity is fixed when the scene is constructed. The `stats` property reports record and state
allocation sizes before submission, and `getRecordByteOffset()` provides validated slot addressing.
The default constructor owns its two buffers. Supplying `buffers` borrows them unless
`ownsBuffers: true` is explicit. An ownership object such as `{records: false, state: true}` may
adopt the buffers independently, which lets a table adapter borrow record storage while owning its
small state block. Borrowed buffers must have storage, copy-source, and copy-destination usage and
enough bytes for the declared capacity.

This first contract never grows storage implicitly. A caller can size for a known maximum or create
a replacement scene deliberately when capacity changes, keeping allocation and lifetime costs
visible.

CPU-authored mutation requires known initial records. A scene created from opaque, pre-populated
borrowed buffers exposes `mutable === false`: its storage and graph views remain usable, but
`mutate()` and `compact()` reject because the class cannot safely infer stable IDs or holes without
readback. Supplying matching `records` when adopting buffers keeps mutation available.

### Graph integration remains submission-neutral

`importToGraph()` imports the record and state buffers and returns typed field views. It does not
add passes, compile the graph, create a command encoder, or submit work. Algorithms can consume
only the views they need, and the application's existing frame graph remains responsible for
ordering and submission.

## Usage

```ts
const scene = new GPUScene(device, {
  capacity: 10_000,
  records: [
    {
      id: 42,
      bounds: {minimum: [-1, -1, -1], maximum: [1, 1, 1]},
      geometryId: 7,
      commandSlot: 0
    }
  ]
});

const graph = new GPUCommandGraph(device);
const sceneView = scene.importToGraph(graph);

const mutation = scene.mutate({
  update: [{id: 42, geometryId: 8}],
  insert: [{id: 43, bounds: {minimum: [2, -1, -1], maximum: [4, 1, 1]}}]
});

if (mutation.overflowCount > 0) {
  // Create a deliberately larger replacement scene at an application-defined boundary.
}

// Compose sceneView.boundsMinimum, sceneView.boundsMaximum, and
// sceneView.objectIds with visibility, spatial, picking, or draw workflows.
```

## Constructor

```ts
new GPUScene(device: Device, props: GPUSceneProps)
```

Important properties include `capacity`, optional initial `records`, optional borrowed `buffers`,
and boolean or per-buffer `ownsBuffers`. When borrowed buffers are already populated, `recordCount`
declares their active prefix.

## Methods

### `importToGraph(graph, id?)`

Returns record/state buffer handles plus typed graph views for every public field.

### `getRecordByteOffset(recordIndex)`

Returns the byte offset of a validated capacity slot.

### `getRecordIndex(id)`

Returns the current physical slot for a stable ID when CPU record metadata is known.

### `mutate(mutation)`

Atomically validates and applies `insert`, `update`, `remove`, and optional `compact` operations.
The result identifies affected IDs and moves and reports overflow and exact queue-write cost.

### `compact()`

Stable-compacts active records and returns the same mutation result shape.

### `destroy()`

Destroys owned buffers and leaves borrowed buffers untouched. Calling it repeatedly is safe.

## Current scope

`GPUScene` now implements the Phase 6.1a storage and 6.1b CPU-authored mutation contracts. The
[scene adapters](/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters) add explicit
CPU-hierarchy and zero-copy preserved-table boundaries without changing this core storage model.
[`GPUSceneDrawGeneration`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation)
publishes active, visible rows into deterministic indirect-command slots, while
[`GPUSceneResourceGroups`](/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups)
classifies those commands into explicit renderer-owned binding windows. GPU-authored record
mutation and visibility policy remain graph workflows rather than hidden behavior inside the
storage owner.
