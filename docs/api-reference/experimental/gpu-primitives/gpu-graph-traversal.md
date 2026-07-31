import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUGraphTraversal

<GPUPrimitivesDocsTabs active="graph-traversal" />

`GPUGraphTraversal` performs bounded, GPU-resident breadth-first selection over compressed sparse
graph adjacency. It supports direct dependencies, incoming and outgoing neighborhoods, and
multi-hop focused subgraphs without synchronizing the CPU.

```ts
import {GPUGraphTraversal} from '@luma.gl/experimental';

new GPUGraphTraversal({
  id: 'focused-dependencies',
  offsets: outgoingOffsets,
  neighbors: outgoingNeighbors,
  reverseOffsets: incomingOffsets,
  reverseNeighbors: incomingNeighbors,
  seeds: selectedSpanIds,
  seedCount: activeSelectionCount,
  output: reachedSpanMask,
  maxDepth: 4,
  activeDepth: selectedTraversalDepth,
  direction: 'both'
}).addToGraph(graph);
```

All inputs are packed `GraphDataView<'uint32'>` values:

- `offsets` has `nodeCount + 1` entries; `neighbors` stores the forward CSR destinations.
- `reverseOffsets` and `reverseNeighbors` provide reverse CSR for `'incoming'` or `'both'`.
- `seeds` contains stable source-node IDs.
- Optional `seedCount` selects how many leading seeds are active.
- `output` has one row per graph node and receives a canonical reachability mask.
- `maxDepth` defines the number of compiled frontier-expansion stages and must not exceed 1024.
- Optional `activeDepth` changes the number of effective stages without recompiling the graph.

The seed nodes are included at depth zero. Out-of-range seed and neighbor IDs are ignored. Atomic
node claims make cycles, duplicate dependencies, shared descendants, and overlapping frontiers
safe.

Frontier scratch is created as graph-owned transient buffers. The output buffer must not alias
adjacency, seeds, or other traversal inputs. The operation neither submits commands nor reads
results back; its output can be composed with `GPUMask` and passed directly to `GPUCompaction`.
