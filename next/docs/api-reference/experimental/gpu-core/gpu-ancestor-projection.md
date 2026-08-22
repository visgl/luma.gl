# GPUAncestorProjection

[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-ancestor-projection.md)

## Overview[​](#overview "Direct link to Overview")

`GPUAncestorProjection` reconnects filtered graph nodes to their nearest visible canonical parents. This lets dependency lines remain meaningful when intermediate spans disappear under duration, status, runtime, or topology filters.

In the live trace explorer, collapsing a process or excluding a classification can hide an operation that remains the endpoint of a dependency. Ancestor projection gives the renderer a visible canonical representative while preserving the hidden operation's original source identity.

### GPU Scene Trace Explorer

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-trace-scene)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Reconnect hidden graph endpoints to their nearest visible canonical ancestor.                                 |
| **Reads / writes**       | Reads parents and a visibility mask; writes projected ancestor IDs and validation status.                     |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | One source-aligned projected identity per node, plus bounded cycle/depth diagnostics.                         |
| **Expected work**        | Bounded pointer jumping over the configured maximum hierarchy depth.                                          |
| **Chunks**               | Preserves declared views and source identity; it does not implicitly concatenate or repack chunks.            |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | visibility mask + parent forest → GPUAncestorProjection → dependency routing or rendering.                    |

**Cost**Maximum hierarchy depth and source-row count determine the upper bound.

**Common mistake**Do not replace canonical identity with the projected display identity.

## Concepts[​](#concepts "Direct link to Concepts")

Projection is different from traversal: it follows each node's one canonical parent chain until it finds a visible source ID. The output remains source-aligned, so renderers can replace a hidden endpoint without renumbering the original graph. A depth bound and invalid sentinel make cycles, missing parents, and malformed chains deterministic GPU data rather than CPU-side exceptions.

### When to use it[​](#when-to-use-it "Direct link to When to use it")

Ancestor projection is useful whenever filtering can hide structural intermediates but relationships should remain legible. A dependency viewer can reconnect an edge from a hidden operation to its visible service or process; an outline can attach annotations to the nearest expanded row; and a scene hierarchy can redirect a hidden object's relationship to its visible group. Because IDs stay source-aligned, picking and inspection can still recover the original endpoint.

Use [`GPUGraphTraversal`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-graph-traversal.md) instead when the question is which nodes are reachable through arbitrary edges. Projection follows exactly one parent chain per row and finds a representative; it does not select a neighborhood or rewrite the graph.

```
import {GPUAncestorProjection} from '@luma.gl/gpgpu/gpu-core';



new GPUAncestorProjection({

  id: 'visible-parent-projection',

  parents: canonicalParentIds,

  visibility: visibleSpanMask,

  output: visibleAncestorIds,

  maxDepth: 32

}).addToGraph(graph);
```

All three views are packed `GraphDataView<'uint32'>` values with identical logical row counts. For each source node:

* A visible node projects to its own stable source index.
* A hidden node projects to its nearest visible canonical parent.
* Missing, invalid, cyclic, or depth-exhausted ancestry resolves to `0xffffffff` by default.
* `invalidValue` can supply a different `uint32` sentinel.

`maxDepth` bounds the number of hidden parent links followed per source row. This makes malformed or cyclic inputs safe without CPU-side graph inspection. It must be a `uint32` because it is compiled into the WGSL projection bound. The writable output cannot alias either source view.

Projection preserves canonical source IDs; it does not rewrite dependency records, repack span buffers, submit GPU work, or read results back. Render and dependency-visibility shaders can use the projected indices directly while retaining original edge identity for picking and inspection.
