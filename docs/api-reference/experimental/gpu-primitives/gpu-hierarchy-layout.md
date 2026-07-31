import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUHierarchyLayout

<GPUPrimitivesDocsTabs active="hierarchy-layout" />

`GPUHierarchyLayout` converts parent and child expansion flags into effective row heights and
exclusive GPU-scanned positions. It supports interactive process/thread collapse without
rebuilding source data or render commands.

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

All input and output views are packed `GraphDataView<'uint32'>` values. A nonzero state is
expanded; a zero state is collapsed.

- Expanded parents publish one height for each child.
- Expanded children use `expandedChildHeight`.
- Collapsed children use `collapsedChildHeight`.
- A collapsed parent publishes `collapsedParentHeight` through its first child; its other children
  publish zero.
- `GPUScan` converts the effective child heights into stable exclusive row offsets.

`childStates.length` must equal `parentStates.length * childrenPerParent`. Both output lengths
must equal the child count. Heights and offsets are caller-owned and cannot alias each other or
their input buffers.

Expansion states can be updated between graph encodings. The operation allocates only graph-owned
scan scratch and does not submit, repack, or read back data.
