# GPUHierarchyLayout

[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-ancestor-projection.md)

## Overview[​](#overview "Direct link to Overview")

`GPUHierarchyLayout` converts parent and child expansion flags into effective row heights and exclusive GPU-scanned positions. It supports interactive process/thread collapse without rebuilding source data or render commands.

The live trace viewer demonstrates the motivating interaction directly: collapsing a process retains one representative row, collapsing a thread retains its first lane, and later rows move into place through GPU-scanned offsets. The underlying source spans and their stable identities never move.

### GPU Hierarchical Trace Viewer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-viewer)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Turn hierarchy expansion state into effective row heights and stable vertical offsets.                        |
| **Reads / writes**       | Reads parent/child expansion flags and row heights; writes effective heights and exclusive positions.         |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Exact source-aligned heights and positions for the compiled hierarchy.                                        |
| **Expected work**        | Hierarchy flag propagation plus a linear scan.                                                                |
| **Chunks**               | Preserves declared views and source identity; it does not implicitly concatenate or repack chunks.            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | hierarchy + expansion flags → GPUHierarchyLayout → renderer lanes and picking.                                |

**Cost**Source row count and hierarchy propagation depth.

**Common mistake**Do not rebuild source rows when only expansion control state changed.

## Concepts[​](#concepts "Direct link to Concepts")

A hierarchical list can be laid out as a flat sequence when every child row publishes an effective height. Expanded rows keep their configured height; collapsed parents replace their child group with one summary height and zero out the remaining children. An exclusive scan turns those heights into stable row offsets. Updating expansion flags therefore changes layout entirely on the GPU without changing source identity.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

This layout fits large, regularly grouped views whose expansion state changes more often than their source data: process/thread lanes, grouped timelines, layer panels, and batched diagnostic rows. The resulting heights and offsets can drive rendering and picking in the same frame without asking the CPU to rebuild a visible-row array after every expand or collapse interaction.

The current contract assumes a fixed `childrenPerParent` and one parent level. Use a CPU layout or a more general hierarchy algorithm for arbitrary-depth trees, variable child ranges, text measurement, or constraints that depend on sibling content. The primitive computes scalar row placement; it does not choose styling or animation.

```
import {GPUHierarchyLayout} from '@luma.gl/gpgpu/gpu-core';



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

Inputs and outputs may be packed `GraphDataView<'uint32'>` values or ordered `GraphVectorView<'uint32'>` partitions. A nonzero state is expanded; a zero state is collapsed.

* Expanded parents publish one height for each child.
* Expanded children use `expandedChildHeight`.
* Collapsed children use `collapsedChildHeight`.
* A collapsed parent publishes `collapsedParentHeight` through its first child; its other children publish zero.
* `GPUScan` converts the effective child heights into stable exclusive row offsets.

`childStates.length` must equal `parentStates.length * childrenPerParent`. Both output lengths must equal the child count. Vector heights and offsets preserve the exact child-state chunk topology; parent partitions may use different boundaries.

### Partitioned hierarchy identity[​](#partitioned-hierarchy-identity "Direct link to Partitioned hierarchy identity")

Partition boundaries are storage and update boundaries, not hierarchy boundaries. Cumulative row counts assign every parent and child one stable global ID. When a child chunk crosses a parent chunk boundary, `GPUHierarchyLayout` emits an explicit pass for each intersecting range and uses the global child ID to select its parent. It never concatenates or repacks either vector.

This matters for streamed or incrementally replaced batches: an application can replace one parent or child allocation while preserving source identity and output partitions. Empty chunks retain their position. The exclusive scan carries layout offsets across child chunks, so the result is identical to laying out one explicitly packed sequence.

Heights and offsets are caller-owned and cannot alias each other or their input buffers.

Expansion states can be updated between graph encodings. The operation allocates only graph-owned scan scratch and does not submit, repack, or read back data.
