# @luma.gl/experimental/lugraph

## Overview

`@luma.gl/experimental/lugraph` analyzes connected data directly on a browser WebGPU device. Its
optional, headless graph model preserves existing source and target vertex columns, stable edge
identifiers, optional properties, and original GPU vector chunks without uploading or copying them.

Reusable compressed adjacency supports vertex-degree queries, bounded breadth-first shortest paths,
nonnegative weighted single-source routes, weakly connected components,
deterministic label-propagation communities, local clustering coefficients, structural core
numbers, and normalized PageRank with dangling-vertex redistribution. Partition modularity scores
caller-owned community assignments directly against the original weighted source edges, while
bounded single-level optimization can improve those assignments one best-gain move at a time.
The progressive exact force-directed layout produces directly renderable GPU positions. An optional
`LuGraphSpatialForceLayout` can approximate distant
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

Choose `LuGraphCoreNumber` when you need to find a genuinely resilient network backbone: a star
hub with 100 unconnected followers has degree 100 but core number one, whereas each member of a
four-person clique has core number three. Choose `LuGraphModularity` when you already have
community labels and need to measure whether those groups retain more relationship weight than a
degree-matched random network would predict. It scores a proposed partition; it does not discover
or optimize communities. Choose `LuGraphModularityOptimization` when you actually need to improve
a starting partition, retain the best positive-gain move per bounded round, and publish both its
final labels and actual weighted modularity score.

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

## Graph Data Council and Graphalytics

The [Graph Data Council (GDC)](https://ldbcouncil.org/) maintains the
[LDBC Graphalytics benchmark](https://ldbcouncil.org/benchmarks/graphalytics/). Before 2025, the
nonprofit organization was named the **Linked Data Benchmark Council (LDBC)**; the benchmark
suite retains its established LDBC name. Its
[six graph-analysis algorithm families](https://ldbcouncil.org/benchmarks/graphalytics/algorithms/)
cover breadth-first search, weighted shortest paths, weak components, label-propagation
communities, local clustering, and PageRank.

The council also publishes
[real and synthetic reference datasets, including Parquet vertex and edge data](https://ldbcouncil.org/benchmarks/graphalytics/datasets/),
an [open-source benchmark driver](https://github.com/ldbc/ldbc_graphalytics), its
[algorithm specification and reference definitions](https://github.com/ldbc/ldbc_graphalytics_docs),
and [competition and validation rules](https://ldbcouncil.org/benchmarks/graphalytics/rules/).
Its rules allow single-node, GPU-based, and partial submissions, but formal results still require
the prescribed datasets, reference outputs, repeated runs, system disclosures, and reproducible
validation. luGraph's local CPU/WebGPU benchmark is not that official driver, an audited
submission, or a published Graphalytics score. Core numbers and modularity are additional
capabilities **beyond** the six Graphalytics workload families; modularity optimization likewise
extends beyond the standard and does not become a seventh official workload.

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

## Durable cores and community quality

`LuGraphCoreNumber` finds each vertex's highest supported `k` in the **simple undirected weak
graph**. Directed incoming and outgoing neighbors are united and deduplicated; reciprocal edges,
parallel edges, and self-loops never inflate the result, and edge weights are ignored. Directed
graphs require complete forward and reverse CSR. The caller supplies one `uint32` output per
vertex and can request one-row convergence and maximum-core, or degeneracy, outputs. Its default
32 synchronous refinement rounds can be set from zero through 1024; values are exact only when
convergence is established, otherwise both core numbers and degeneracy are upper bounds. Required
CSR overflow publishes `0xffffffff` outputs and zero convergence. Worst-case work with unordered
adjacency is `O(K × sum(degree² × log(degree + 1)))` over `K` rounds.

`LuGraphModularity` consumes existing `uint32` community identifiers and publishes one `float32`
partition-quality score, optionally including `float32` contributions per possible label and a
one-row validity result. It evaluates directed or undirected weighted original source edges in
`O(V + E)` work without building CSR; missing weights mean one. Unlike core decomposition,
parallel edges, reciprocal relationships, and self-loops retain their original multiplicity.
Invalid labels, negative or nonfinite accepted weights, zero total edge weight, and floating-point
accumulation overflow publish a zero score and zero validity. A finite nonnegative resolution
adjusts the degree-matched baseline; the default is one.
This is a community-quality measurement, not Louvain, Leiden, hierarchical coarsening, or
automatic modularity optimization.

`LuGraphModularityOptimization` improves identity-initialized or caller-supplied `uint32`
communities using the same directed or undirected weighted objective. Each bounded round selects
the single globally largest strictly positive modularity gain, breaking ties by the lowest vertex
identifier and then the lowest candidate community. Proposals include the lowest genuinely unused
community label, so over-merged warm starts can split even when their only edges are self-loops;
occupancy includes zero-degree isolates. It publishes improved labels, the actual one-row
`float32` modularity score, and optional convergence and validity statuses without CPU
synchronization. The default 32 rounds can be changed from zero through 1024; zero rounds score
the unchanged initial partition. Directed graphs require reverse CSR, original weights and edge
multiplicity are preserved, and invalid labels, invalid accepted weights, zero edge weight, or
adjacency overflow fail closed. Tie-breaking is stable for fixed computed gains, but unordered
atomic `float32` additions can alter near-tied gains, threshold decisions, labels, and scores
across GPU execution orders or adapters; weighted partitions can vary. This is
single-level Louvain-style local moving, not full multilevel Louvain, Leiden refinement, graph
coarsening, or a global optimum.

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
