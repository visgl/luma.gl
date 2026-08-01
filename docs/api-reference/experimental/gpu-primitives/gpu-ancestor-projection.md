import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUAncestorProjection

<GPUPrimitivesDocsTabs active="ancestor-projection" />

## Overview

`GPUAncestorProjection` reconnects filtered graph nodes to their nearest visible canonical
parents. This lets dependency lines remain meaningful when intermediate spans disappear under
duration, status, runtime, or topology filters.

## Concepts

Projection is different from traversal: it follows each node's one canonical parent chain until it
finds a visible source ID. The output remains source-aligned, so renderers can replace a hidden
endpoint without renumbering the original graph. A depth bound and invalid sentinel make cycles,
missing parents, and malformed chains deterministic GPU data rather than CPU-side exceptions.

```ts
import {GPUAncestorProjection} from '@luma.gl/experimental';

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
