# @luma.gl/experimental/lugraph

## Overview

`@luma.gl/experimental/lugraph` analyzes connected data directly on a browser WebGPU device. Its
optional, headless graph model preserves existing source and target vertex columns, stable edge
identifiers, optional properties, and original GPU vector chunks without uploading or copying them.

Reusable compressed adjacency supports vertex-degree queries, bounded breadth-first shortest paths,
nonnegative weighted single-source routes, weakly connected components,
deterministic label-propagation communities, local clustering coefficients, normalized PageRank
with dangling-vertex redistribution, and progressive exact force-directed layout with directly
renderable GPU positions. An optional `LuGraphSpatialForceLayout` can approximate distant
uniform-grid cells while keeping nearby forces exact; it preserves the same positions, explicit
bounds, caller-owned indexing buffers, and observable overflow status. These operations contribute
work to a caller-owned `GPUCommandGraph`; applications retain ownership of their buffers,
rendering, command submission, and any explicitly requested result readback.

## When to use luGraph

Use luGraph to explore relationships that already live on the GPU: inspect social connections,
trace service dependencies, investigate transaction networks, or rank linked documents without
copying every intermediate result back to JavaScript. Choose
`LuGraphSingleSourceShortestPath` when edges represent actual nonnegative travel times, distances,
latencies, or transaction costs and the cheapest route matters more than the fewest hops. Choose
`LuGraphLocalClusteringCoefficient` when a vertex's neighbor count alone cannot distinguish a
tightly connected friend circle or transaction ring from a loose hub.

Weakly connected components find disconnected
islands; `LuGraphLabelPropagation` can expose friend circles, related service groups, or
coordinated accounts inside a connected island. Its deterministic, bounded majority-vote heuristic
is not Louvain or Leiden, does not optimize modularity, and does not guarantee convergence. Local
clustering instead measures each immediate neighborhood's distinct directed closure relationships;
it does not assign a global community. Weighted routing uses existing `float32` edge weights, not
negative-weight or all-pairs shortest-path algorithms.

Together, breadth-first search, weighted single-source shortest paths, weakly connected
components, label propagation, local clustering, and PageRank cover the six **Graphalytics workload
families**. This means those analysis types have real browser-GPU implementations; it does not
claim official benchmark certification, matching reference settings, distributed execution,
published performance scores, or feature parity with another graph system.

## Weighted routes and local neighborhoods

`LuGraphSingleSourceShortestPath` follows outgoing, incoming, or bidirectional relationships from
one chosen vertex. Existing nonnegative `float32` edge weights determine route cost; missing
weights mean every relationship costs one. Unreachable vertices receive `+Infinity`, equal-cost
routes choose fewer hops and then the lowest stable predecessor, and invalid or negative weights
fail closed. Bounded synchronized relaxation and an optional GPU convergence flag keep the actual
iteration budget visible; they do not imply automatic convergence or support negative weights.

`LuGraphLocalClusteringCoefficient` asks whether each vertex's distinct incoming-or-outgoing
neighbors also connect to one another. Directed graphs count distinct directed links among those
neighbors, so reciprocal links count twice; undirected graphs count unique incident triangles.
Self-loops and duplicate edges do not inflate the result. The caller receives one `float32`
coefficient per vertex and can optionally request `uint32` directed-closure or triangle counts.
Unsorted CSR makes exact neighbor matching up to `O(sum(degree³))`, so dense hubs need careful
measurement.

Exact layout suits smaller graphs and accuracy-sensitive workflows; the optional
flat-grid approximation suits applications that can trade some far-field accuracy for fewer
individual force calculations. It is not Barnes–Hut, ForceAtlas2, or a guaranteed subquadratic
layout.

The native and deck.gl graph explorers additionally demonstrate an application-owned,
constant-sample force contributor for graphs with up to 1,048,576 real vertices and 2,097,343
resident directed edges. It evaluates every original edge plus four deterministic repulsion
samples per vertex, retains every rendered vertex, and limits only visible edge detail. This
explicitly approximate `O(E + 4V)` showcase strategy is not a public graph algorithm, an exact
all-pairs solver, or a promise of device-independent frame rates.

See the [luGraph graph analytics guide](/docs/api-reference/experimental/lugraph) for when to use
each operation, complete GPU-resident composition examples, and ownership and capacity contracts.

## Attribution and licensing

The graph data model is inspired by [NVIDIA RAPIDS cuGraph](https://github.com/rapidsai/cugraph)
and the NVIDIA and RAPIDS contributors advancing GPU graph analytics. cuGraph is distributed under
the [Apache License 2.0](https://github.com/rapidsai/cugraph/blob/main/LICENSE).

This module is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU; it does not copy or translate cuGraph source code.
It does not claim CUDA or cuGraph API compatibility, feature parity, NVIDIA affiliation, or NVIDIA
endorsement.
