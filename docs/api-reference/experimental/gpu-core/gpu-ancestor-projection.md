import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';
import {GPUTraceSceneExample} from '@site/src/examples';

# GPUAncestorProjection

<GPUCoreDocsTabs active="ancestor-projection" />

## Overview

`GPUAncestorProjection` reconnects filtered graph nodes to their nearest visible canonical
parents. This lets dependency lines remain meaningful when intermediate spans disappear under
duration, status, runtime, or topology filters.

In the live trace explorer, collapsing a process or excluding a classification can hide an
operation that remains the endpoint of a dependency. Ancestor projection gives the renderer a
visible canonical representative while preserving the hidden operation's original source identity.

<GPUTraceSceneExample embedded />

<GPUOperationContract operation="gpu-ancestor-projection" />

## Concepts

Projection is different from traversal: it follows each node's one canonical parent chain until it
finds a visible source ID. The output remains source-aligned, so renderers can replace a hidden
endpoint without renumbering the original graph. A depth bound and invalid sentinel make cycles,
missing parents, and malformed chains deterministic GPU data rather than CPU-side exceptions.

### When to use it

Ancestor projection is useful whenever filtering can hide structural intermediates but relationships
should remain legible. A dependency viewer can reconnect an edge from a hidden operation to its
visible service or process; an outline can attach annotations to the nearest expanded row; and a
scene hierarchy can redirect a hidden object's relationship to its visible group. Because IDs stay
source-aligned, picking and inspection can still recover the original endpoint.

Use [`GPUGraphTraversal`](./gpu-graph-traversal) instead when the question is which nodes are
reachable through arbitrary edges. Projection follows exactly one parent chain per row and finds a
representative; it does not select a neighborhood or rewrite the graph.

```ts
import {GPUAncestorProjection} from '@luma.gl/gpgpu/gpu-core';

new GPUAncestorProjection({
  id: 'visible-parent-projection',
  parents: canonicalParentIds,
  visibility: visibleSpanMask,
  output: visibleAncestorIds,
  maxDepth: 32
}).addToGraph(graph);
```

All three views are packed `GraphDataView<'uint32'>` values with identical logical row counts.
For each source node:

- A visible node projects to its own stable source index.
- A hidden node projects to its nearest visible canonical parent.
- Missing, invalid, cyclic, or depth-exhausted ancestry resolves to `0xffffffff` by default.
- `invalidValue` can supply a different `uint32` sentinel.

`maxDepth` bounds the number of hidden parent links followed per source row. This makes malformed
or cyclic inputs safe without CPU-side graph inspection. It must be a `uint32` because it is
compiled into the WGSL projection bound. The writable output cannot alias either source view.

Projection preserves canonical source IDs; it does not rewrite dependency records, repack span
buffers, submit GPU work, or read results back. Render and dependency-visibility shaders can use
the projected indices directly while retaining original edge identity for picking and inspection.
