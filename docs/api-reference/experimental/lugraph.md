import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# luGraph: GPU-Resident Graph Analytics

<ExperimentalDocsTabs active="lugraph" />

## Overview

A graph answers questions that individual table rows cannot: which accounts share a transaction,
which services depend on a failed service, which people are two introductions apart, and which
pages matter because other important pages link to them. Vertices represent those entities; edges
represent their relationships.

`@luma.gl/experimental/lugraph` answers these questions directly on a browser WebGPU device. It
describes caller-owned GPU edge columns, builds reusable compressed adjacency, and publishes vertex
degrees, shortest-path neighborhoods, weakly connected groups, and PageRank importance into
caller-owned GPU buffers. Every operation composes with the existing `GPUCommandGraph`.

This is an experimental, headless graph analytics API, not a graph database, visualization
framework, file importer, or general-purpose dataframe. Applications decide how data reaches the
GPU, which results they render, when commands are submitted, and whether anything is read back.

## Why keep a graph on the GPU?

A CPU application can certainly traverse a graph. The problem appears when its relationship data
already lives on the GPU: copying every edge to JavaScript, rebuilding an object graph, running an
analysis, and uploading the answer again interrupts both compute and rendering.

luGraph keeps the complete intermediate pipeline on one WebGPU device:

```text
Existing GPU edge columns
    -> compressed adjacency
    -> degree / shortest paths / weak components / PageRank
    -> caller-owned GPU result columns
```

The original source and target chunks keep their identities, including empty batches. Adjacency and
analytic outputs remain normal GPU vectors that later compute or application rendering can consume.
Changing a GPU-resident search control and re-encoding an existing compiled graph does not require
materializing a new JavaScript edge list.

GPU execution is not automatically faster for every graph. A small, CPU-resident, one-off analysis
may be simpler on the CPU because GPU upload, pipeline compilation, command submission, and explicit
readback have real costs. luGraph is most useful when graph data or downstream consumers are already
GPU-resident and several operations reuse the same topology.

## When should I use luGraph?

Use luGraph for browser applications that already own typed GPU relationship columns and need to
combine graph analytics with further GPU work:

- **Social and communication networks:** count contacts, highlight friends within a bounded number
  of introductions, group disconnected networks, and rank influential accounts.
- **Software and service dependencies:** follow incoming or outgoing dependency chains, find
  isolated dependency islands, and identify packages that many important packages depend on.
- **Transaction and fraud investigations:** follow transfers around a selected account, identify
  connected groups of counterparties, and prioritize structurally important entities.
- **Transport and infrastructure maps:** inspect junction degree, unweighted hop reachability,
  disconnected subnetworks, and relationship-driven importance across a network.
- **Knowledge and citation graphs:** follow citation links, identify connected collections, and
  rank documents by incoming influence rather than raw citation count alone.

Choose another tool when the application needs weighted shortest paths, a graph query language,
automatic CPU fallback, distributed execution, or compatibility with a CUDA or Python graph API.
luGraph currently operates on one browser WebGPU device and intentionally does not provide those
features.

## Choose the right graph operation

| Operation | Question it answers | GPU result | Typical bounded work |
| --- | --- | --- | --- |
| `LuGraph` | Which GPU columns describe the graph? | Borrowed graph metadata and original chunks | Metadata only; no GPU dispatch |
| `LuGraphTopology` | Which vertices are adjacent? | Forward and optional reverse compressed adjacency | `O(V + E)` |
| `LuGraphDegree` | How many relationships touch each vertex in one direction? | One `uint32` degree per vertex | `O(V)` after adjacency exists |
| `LuGraphBreadthFirstSearch` | Which vertices are within a chosen number of unweighted hops? | Distances, deterministic predecessors, and an optional selection mask | At most `O(D × (V + E))` for `D` compiled hops |
| `LuGraphConnectedComponents` | Which vertices belong to the same weakly connected group? | One `uint32` component identifier per vertex | At most `O(K × (V + E))` for `K` bounded iterations |
| `LuGraphPageRank` | Which vertices receive influence from other important vertices? | One normalized `float32` score per vertex | `O(K × (V + E))` for `K` iterations |

`V` is the graph's explicit vertex count and `E` is its source-edge count. Undirected adjacency
contains both directions for ordinary edges; an undirected self-loop appears once.

## Describe existing relationships with LuGraph

**Question: Which existing GPU columns describe the people, accounts, services, or documents in
this network?**

`LuGraph` is the ownership-preserving entry point. Construct it when an application already has
aligned `GPUVector<'uint32'>` source and target identifiers and knows how many vertices exist,
including isolated vertices that never appear in an edge.

```ts
import {LuGraph} from '@luma.gl/experimental/lugraph';

const graph = new LuGraph({
  vertexCount,
  sourceVertices,
  targetVertices,
  edgeIds,
  nodeAttributes,
  directed: true
});
```

The graph borrows its vectors; it does not allocate a graph buffer, copy or concatenate chunks,
submit commands, or take ownership of source allocations. Source and target chunks must have the
same ordered lengths. Optional stable edge identifiers and `float32` edge weights follow the same
source partitions, while optional vertex and edge property tables retain their existing metadata.

Use this lightweight representation when existing GPU tables or render inputs already describe a
network. It is a description, not an upload helper: first create or adapt your GPU vectors through
the application or the appropriate data adapter.

## Build reusable adjacency with LuGraphTopology

**Question: Given a particular vertex, which other vertices does it connect to?**

An edge list answers “what are all relationships?” but repeatedly scanning every edge to discover
one vertex's neighbors is expensive. `LuGraphTopology` builds compressed sparse row (CSR) adjacency
once so later operations can find each vertex's neighbor interval from adjacent offsets.

For example, a transaction list might contain millions of transfers while an investigator wants
only the accounts directly connected to account 42. Its CSR offset interval identifies that
account's neighbors without asking each later analysis to rescan the entire edge list.

```ts
import {LuGraphTopology} from '@luma.gl/experimental/lugraph';

const topology = new LuGraphTopology({
  graph,
  forward: {
    offsets: outgoingOffsets,
    neighbors: outgoingNeighbors,
    edgeIds: outgoingEdgeIds,
    count: outgoingCount,
    overflow: outgoingOverflow
  },
  reverse: {
    offsets: incomingOffsets,
    neighbors: incomingNeighbors,
    edgeIds: incomingEdgeIds,
    count: incomingCount,
    overflow: incomingOverflow
  },
  invalidEdgeCount
});
```

Every shown output is an existing, caller-owned, single-chunk `GPUVector<'uint32'>`. Offsets have
`vertexCount + 1` rows; neighbors and edge identifiers have equal explicit capacities; `count`,
`overflow`, and `invalidEdgeCount` each have one row. When the source graph supplies edge weights,
each configured adjacency also requires a matching `float32` edge-weight output.

Build reverse adjacency when a directed graph needs incoming-degree queries, incoming or
bidirectional breadth-first search, or PageRank. Directed weak components use forward adjacency
alone. Undirected graphs use one symmetric forward adjacency and must not provide reverse
adjacency.

Invalid endpoints are excluded and counted. `count` reports the complete number of accepted
adjacency entries even if neighbor capacity is insufficient; `overflow` makes truncation explicit.
Neighbor order within each vertex is intentionally unspecified.

## Count relationships with LuGraphDegree

**Question: How many direct relationships does each vertex have?**

`LuGraphDegree` answers the simplest structural question: how many outgoing or incoming
relationships does each vertex have? Use it to identify network hubs, size junction markers,
detect isolated accounts, or find unusually connected infrastructure and dependency nodes.

```ts
import {LuGraphDegree} from '@luma.gl/experimental/lugraph';

const degree = new LuGraphDegree({
  topology,
  output: outgoingDegrees,
  direction: 'outgoing'
});
```

Its caller-owned output has one packed `uint32` row per vertex. Outgoing degree is the default;
incoming degree on a directed graph requires reverse adjacency. Duplicate edges count individually,
and an undirected self-loop counts once.

Degrees come from complete CSR offsets rather than the capacity-bounded neighbor list, so they
remain exact even when the corresponding adjacency reports neighbor overflow. Degree is useful
when raw connectivity is the question; it does not account for whether a vertex's neighbors are
themselves important.

## Follow unweighted paths with LuGraphBreadthFirstSearch

**Question: Which entities can I reach within a chosen number of hops, and what shortest path gets
me there?**

`LuGraphBreadthFirstSearch` expands outward from one or more selected vertices and records the
shortest unweighted hop count to every reachable vertex. Use it to highlight a selected account's
neighborhood, follow a service's dependencies, or explain how two entities connect.

For example, searching two hops from an account finds both its direct counterparties and the
counterparties of those counterparties. Choose breadth-first search over degree when the question
depends on indirect relationships; choose it over connected components when distance, direction,
or a particular starting vertex matters.

```ts
import {LuGraphBreadthFirstSearch} from '@luma.gl/experimental/lugraph';

const search = new LuGraphBreadthFirstSearch({
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

## Find disconnected groups with LuGraphConnectedComponents

**Question: Which vertices belong to the same connected island if edge direction is ignored?**

`LuGraphConnectedComponents` identifies vertices connected by any path when edge direction is
ignored. Use it to separate disconnected social networks, collect related transaction accounts,
find infrastructure islands, or detect independent dependency groups.

For example, two transfers `Ana -> Bo` and `Bo -> Cy` put all three accounts in the same group,
even though Cy has no outgoing transfer. An unrelated transfer `Dee -> Eli` forms a different
group. Choose weak components when group membership matters, not the distance from a selected
account or the direction in which influence flows.

```ts
import {LuGraphConnectedComponents} from '@luma.gl/experimental/lugraph';

const components = new LuGraphConnectedComponents({
  topology,
  output: componentIds,
  iterations: 32,
  converged: componentsConverged
});
```

Once propagation converges, every vertex in a weakly connected component receives that group's
lowest stable vertex identifier; an isolated vertex labels itself. Directed edges connect both
endpoints, so reverse adjacency is unnecessary.

The caller chooses a bounded iteration budget. The optional one-row `uint32` `converged` result is
one only when the final iteration reaches a fixed point; zero means convergence was not established
or the required adjacency overflowed. A connected component answers whether entities connect at
all; it does not claim to discover densely connected communities within one connected network.

## Rank incoming influence with LuGraphPageRank

**Question: Which vertices receive influence from other important vertices?**

`LuGraphPageRank` estimates vertex importance from the importance flowing through incoming
relationships. A citation from an influential paper or a dependency from an important package can
matter more than many links from otherwise disconnected vertices.

Use PageRank when raw degree is not enough: prioritize influential accounts, rank connected
documents, identify widely depended-on services, or choose salient vertices for application-owned
visualization. The metric is unweighted even when the source topology retains edge-weight columns.

In a directed graph, `paper A -> paper B` contributes influence from A to B. A paper cited by one
highly influential source can outrank a paper cited by several obscure sources. Degree would count
those citations without asking how influential their sources are; PageRank propagates that
additional context through the surrounding network.

```ts
import {LuGraphPageRank} from '@luma.gl/experimental/lugraph';

const importance = new LuGraphPageRank({
  topology,
  output: importanceScores,
  damping: 0.85,
  iterations: 40,
  residual: finalRankChange
});
```

Directed graphs require reverse CSR so each vertex can gather incoming influence; undirected graphs
reuse their symmetric forward adjacency. Every fixed iteration redistributes probability from
dangling vertices with no outgoing edges, applies teleportation, and normalizes the published
`float32` scores so their total is approximately one.

The default damping is `0.85`: each iteration models an 85% chance of following an outgoing link
and a 15% chance of jumping to a uniformly chosen vertex. This prevents disconnected or cyclic
regions from permanently trapping all influence. A dangling vertex has no outgoing link to follow;
its influence is redistributed uniformly instead of disappearing from the probability vector.
The default bounded iteration count is `40`.

The optional one-row `float32` `residual` reports the final iteration's L1 score change: the sum of
absolute differences between the last two normalized score vectors. It is an observable error
signal, not an automatic convergence threshold, early-termination mechanism, or promise that a
fixed budget reached the stationary distribution. Reductions use portable WebGPU workgroups and
ordinary `float32` arithmetic, not floating-point atomics or native GPU `float64`.

## Compose one GPU-resident workflow

All graph contributors add work to the same caller-owned `GPUCommandGraph`. The following example
assumes that the source columns, packed result vectors, and one-row status vectors already exist
on the same WebGPU device:

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphBreadthFirstSearch,
  LuGraphConnectedComponents,
  LuGraphDegree,
  LuGraphPageRank,
  LuGraphTopology
} from '@luma.gl/experimental/lugraph';

const graph = new LuGraph({
  vertexCount,
  sourceVertices,
  targetVertices,
  directed: true
});

const topology = new LuGraphTopology({
  graph,
  forward: {
    offsets: outgoingOffsets,
    neighbors: outgoingNeighbors,
    edgeIds: outgoingEdgeIds,
    count: outgoingCount,
    overflow: outgoingOverflow
  },
  reverse: {
    offsets: incomingOffsets,
    neighbors: incomingNeighbors,
    edgeIds: incomingEdgeIds,
    count: incomingCount,
    overflow: incomingOverflow
  },
  invalidEdgeCount
});

const workflow = new GPUCommandGraph(device);

topology.addToGraph(workflow);
new LuGraphDegree({topology, output: outgoingDegrees}).addToGraph(workflow);
new LuGraphBreadthFirstSearch({
  topology,
  seeds: selectedVertexIds,
  distances: hopDistances,
  predecessors: pathParents,
  mask: neighborhoodMask,
  direction: 'both',
  maxDepth: 6
}).addToGraph(workflow);
new LuGraphConnectedComponents({
  topology,
  output: componentIds,
  iterations: 32,
  converged: componentsConverged
}).addToGraph(workflow);
new LuGraphPageRank({
  topology,
  output: importanceScores,
  damping: 0.85,
  iterations: 40,
  residual: finalRankChange
}).addToGraph(workflow);

const compiled = workflow.compile();
const encoder = device.createCommandEncoder({id: 'analyze-network'});
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

Constructors validate existing metadata; they do not upload graph data, submit commands, or read
results. `addToGraph()` declares GPU work, `compile()` resolves the workflow, and the application
explicitly encodes and submits it. Re-encoding rebuilds topology and recomputes the declared
results from the current source and control buffers.

## Ownership, capacity, and failure boundaries

- All original source vectors and output vectors are caller-owned. Contributors neither destroy
  them nor silently repack their existing chunks.
- Writable outputs require physically distinct GPU buffer allocations, including when a
  `DynamicBuffer` wrapper exposes the same underlying allocation through different views.
- Adjacency capacities and overflow statuses are explicit. Breadth-first search fails closed to
  unreachable distances, weak components publish `0xffffffff`, and PageRank publishes zero scores
  when a required neighbor list overflowed.
- Degree remains exact under neighbor overflow because its input is the complete CSR offset range.
- Fixed component and PageRank iteration budgets do not imply convergence. Their optional status
  and final-change outputs remain GPU-resident until an application explicitly requests readback.
- Work uses bounded WebGPU dispatch and portable storage bindings on one device. Original chunk
  preservation does not imply distributed or multi-GPU execution.
- The optional graph subpath does not supply automatic Arrow import, rendering, graph persistence,
  weighted shortest paths, or a CPU execution fallback.

See [GPU Primitives and Command Graphs](/docs/api-reference/experimental/gpu-primitives) for the
underlying scheduling, typed GPU vectors, resource ownership, and explicit submission model.

## Attribution and licensing

luGraph is inspired by [NVIDIA RAPIDS cuGraph](https://github.com/rapidsai/cugraph) and the NVIDIA
and RAPIDS contributors advancing GPU graph analytics. cuGraph is distributed under the
[Apache License 2.0](https://github.com/rapidsai/cugraph/blob/main/LICENSE).

This is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU; it does not copy or translate cuGraph source code.
It does not claim CUDA or cuGraph API compatibility, feature parity, NVIDIA affiliation, or NVIDIA
endorsement.
