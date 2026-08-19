---
title: GPU Graph traversal and pathfinding
description: Breadth-first neighborhoods and nonnegative weighted shortest paths on GPU-resident graphs.
---

import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# GPU Graph traversal and pathfinding

<ExperimentalDocsTabs active="gpu-graph-traversal" />

## Follow unweighted paths with GPUGraphBreadthFirstSearch

**Question: Which entities can I reach within a chosen number of hops, and what shortest path gets
me there?**

`GPUGraphBreadthFirstSearch` expands outward from one or more selected vertices and records the
shortest unweighted hop count to every reachable vertex. Use it to highlight a selected account's
neighborhood, follow a service's dependencies, or explain how two entities connect.

For example, searching two hops from an account finds both its direct counterparties and the
counterparties of those counterparties. Choose breadth-first search over degree when the question
depends on indirect relationships; choose it over connected components when distance, direction,
or a particular starting vertex matters.

```ts
import {GPUGraphBreadthFirstSearch} from '@luma.gl/experimental/gpu-graph';

const search = new GPUGraphBreadthFirstSearch({
  topology,
  seeds: selectedVertexIds,
  distances: hopDistances,
  predecessors: pathParents,
  mask: neighborhoodMask,
  direction: 'both',
  maxDepth: 6,
  activeDepth
});
```

`outgoing` follows source-to-target relationships; `incoming` follows their reverse; `both` combines
them. Directed incoming and bidirectional searches require reverse adjacency. `maxDepth` bounds the
number of compiled passes, while an optional one-row GPU `activeDepth` can lower the active search
depth between encodings without rebuilding the command graph. An optional GPU `seedCount` similarly
limits which existing seed rows are active.

Reached roots have distance zero. Unreachable vertices and root predecessors contain `0xffffffff`;
equal-length parent ties select the numerically lowest stable vertex identifier. Invalid seeds are
ignored, duplicate seeds are harmless, and the optional mask publishes zero or one per vertex.
This is an unweighted shortest-path operation, not a weighted route or travel-time solver.

## Find least-cost routes with GPUGraphSingleSourceShortestPath

**Question: Which route from my starting vertex costs the least when each connection has its own
travel time, distance, latency, or other nonnegative price?**

The route with the fewest steps is not necessarily the cheapest. Suppose a direct train takes
40 minutes, while two connecting trains take 10 minutes each: breadth-first search chooses the
one-hop direct train, but the least-cost route takes the two connections and arrives in 20 minutes.
`GPUGraphSingleSourceShortestPath` computes that minimum accumulated nonnegative edge weight from one
selected starting vertex to every reachable destination without moving graph columns to the CPU.

Use it for travel-time maps, delivery networks, communication latency, transaction fees, or
service-dependency recovery costs. Choose breadth-first search when every edge has the same cost
and only the number of hops matters; choose weighted shortest paths when the actual sum of edge
weights can change which route wins. This operation computes routes from **one** selected source;
it does not implement all-pairs routing, negative-weight paths, or A* geographic search.

```ts
import {GPUGraphSingleSourceShortestPath} from '@luma.gl/experimental/gpu-graph';

const shortestPaths = new GPUGraphSingleSourceShortestPath({
  topology,
  sourceVertex: selectedVertex,
  distances: routeCosts,
  predecessors: routeParents,
  direction: 'outgoing',
  maxIterations: 64,
  converged: shortestPathsConverged,
  invalidWeightCount
});

shortestPaths.addToGraph(workflow);
```

`distances` is a caller-owned, packed `GPUVector<'float32'>` with exactly one row per vertex;
`predecessors` is a separate, caller-owned, packed `GPUVector<'uint32'>` with the same row count.
An unreachable vertex has distance positive infinity (`+Infinity`), not a large finite placeholder,
and predecessor `0xffffffff`. The starting vertex has distance zero and predecessor `0xffffffff`.
When two routes have the same total cost, the one with fewer hops wins; if their costs and hop
counts also tie, the numerically lowest stable predecessor identifier wins. Zero-weight edges are
valid. Distances are ordinary single-precision values, not `float64` or floating-point atomics.

Weighted graphs must preserve their aligned source `GPUVector<'float32'>` edge-weight chunks and
matching `float32` weights in every configured CSR direction. A graph without an edge-weight
column is valid: every edge then costs one, allowing the same operation to run without fabricating
a new weight column. Negative weights, `NaN`, positive infinity, and negative infinity are invalid.
If any original edge with valid endpoints has an invalid weight, routing fails closed: all
distances become `+Infinity`, all predecessors become `0xffffffff`, and an optional one-row
`invalidWeightCount` records the number of invalid **source edges**, not duplicate entries in
forward and reverse adjacency. Edges whose endpoints are already invalid are excluded by topology
and do not contribute to this weight count.

`outgoing` follows source-to-target relationships; `incoming` follows reverse relationships;
`both` admits either direction. Directed `incoming` or `both` routing requires reverse CSR;
directed `outgoing` routing requires forward CSR only. Undirected graphs reuse symmetric forward
adjacency. If any selected adjacency overflowed, all distances again become `+Infinity`, all
predecessors become `0xffffffff`, and an optional convergence status is zero.

The contributor uses bounded Bellman–Ford-style synchronized relaxation, not a CPU Dijkstra queue.
`maxIterations` can range from `0` through `1024`; its default is
`min(max(vertexCount - 1, 0), 1024)`. The optional caller-owned one-row
`GPUVector<'uint32'>` `converged` indicates whether the final compiled relaxation reached a fixed
point. A zero-round budget initializes only the selected root. `sourceVertex` must identify an
existing vertex; an empty graph permits the value zero and has no distance rows. A limited budget
may publish partially relaxed routes without proving shortest-path completion; there is no
automatic early termination or implicit CPU synchronization. With `K` compiled relaxation rounds,
work is bounded by `O(K × (V + E))`, with `O(V)` graph-owned scratch.

## Related pages

- [GPU Graph overview](/docs/api-reference/experimental/gpu-graph)
- [GPU Graph operations index](/docs/api-reference/experimental/gpu-graph-operations)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
