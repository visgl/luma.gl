import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUHierarchyLayout

<GPUPrimitivesDocsTabs active="hierarchy-layout" />

## Overview

`GPUHierarchyLayout` converts parent and child expansion flags into effective row heights and
exclusive GPU-scanned positions. It supports interactive process/thread collapse without
rebuilding source data or render commands.

## Concepts

A hierarchical list can be laid out as a flat sequence when every child row publishes an effective
height. Expanded rows keep their configured height; collapsed parents replace their child group
with one summary height and zero out the remaining children. An exclusive scan turns those heights
into stable row offsets. Updating expansion flags therefore changes layout entirely on the GPU
without changing source identity.

```ts
import {GPUHierarchyLayout} from '@luma.gl/experimental';

new GPUHierarchyLayout({
  id: 'process-thread-layout',
  parentStates: processExpansionFlags,
  childStates: threadExpansionFlags,
  heights: threadHeights,
  offsets: threadOffsets,
  childrenPerParent: 4,
  expandedChildHeight: 4,
  collapsedChildHeight: 1,
  collapsedParentHeight: 1
}).addToGraph(graph);
```

Inputs and outputs may be packed `GraphDataView<'uint32'>` values or ordered
`GraphVectorView<'uint32'>` partitions. A nonzero state is expanded; a zero state is collapsed.

- Expanded parents publish one height for each child.
- Expanded children use `expandedChildHeight`.
- Collapsed children use `collapsedChildHeight`.
- A collapsed parent publishes `collapsedParentHeight` through its first child; its other children
  publish zero.
- `GPUScan` converts the effective child heights into stable exclusive row offsets.

`childStates.length` must equal `parentStates.length * childrenPerParent`. Both output lengths
must equal the child count. Vector heights and offsets preserve the exact child-state chunk
topology; parent partitions may use different boundaries.

### Partitioned hierarchy identity

Partition boundaries are storage and update boundaries, not hierarchy boundaries. Cumulative row
counts assign every parent and child one stable global ID. When a child chunk crosses a parent
chunk boundary, `GPUHierarchyLayout` emits an explicit pass for each intersecting range and uses
the global child ID to select its parent. It never concatenates or repacks either vector.

This matters for streamed or incrementally replaced batches: an application can replace one
parent or child allocation while preserving source identity and output partitions. Empty chunks
retain their position. The exclusive scan carries layout offsets across child chunks, so the
result is identical to laying out one explicitly packed sequence.

Heights and offsets are caller-owned and cannot alias each other or their input buffers.

Expansion states can be updated between graph encodings. The operation allocates only graph-owned
scan scratch and does not submit, repack, or read back data.
