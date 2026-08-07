# @luma.gl/experimental/lugraph

## Overview

`@luma.gl/experimental/lugraph` analyzes connected data directly on a browser WebGPU device. Its
optional, headless graph model preserves existing source and target vertex columns, stable edge
identifiers, optional properties, and original GPU vector chunks without uploading or copying them.

Reusable compressed adjacency supports vertex-degree queries, bounded breadth-first shortest paths,
weakly connected components, deterministic label-propagation communities, normalized PageRank with
dangling-vertex redistribution, and progressive exact force-directed layout with directly
renderable GPU positions. An optional `LuGraphSpatialForceLayout` can approximate distant
uniform-grid cells while keeping nearby forces exact; it preserves the same positions, explicit
bounds, caller-owned indexing buffers, and observable overflow status. These operations contribute
work to a caller-owned `GPUCommandGraph`; applications retain ownership of their buffers,
rendering, command submission, and any explicitly requested result readback.

## When to use luGraph

Use luGraph to explore relationships that already live on the GPU: inspect social connections,
trace service dependencies, investigate transaction networks, or rank linked documents without
copying every intermediate result back to JavaScript. Weakly connected components find disconnected
islands; `LuGraphLabelPropagation` can expose friend circles, related service groups, or coordinated
accounts inside a connected island. Its deterministic, bounded majority-vote heuristic is not
Louvain or Leiden, does not optimize modularity, and does not guarantee convergence.

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
