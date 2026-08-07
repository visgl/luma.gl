import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {LuGraphBenchmark} from '@site/src/components/docs/lugraph-benchmark';
import {LuGraphExplorerExample} from '@site/src/examples';

# luGraph: GPU-Resident Graph Analytics

<ExperimentalDocsTabs active="lugraph" />

## Overview

A graph answers questions that individual table rows cannot: which accounts share a transaction,
which services depend on a failed service, which people are two introductions apart, which tightly
connected groups exist inside a wider network, and which pages matter because other important
pages link to them. Vertices represent those entities; edges represent their relationships.

`@luma.gl/experimental/lugraph` answers these questions directly on a browser WebGPU device. It
describes caller-owned GPU edge columns, builds reusable compressed adjacency, and publishes vertex
degrees, shortest-path neighborhoods, weakly connected groups, densely connected communities,
PageRank importance, and progressive two-dimensional graph layouts into caller-owned GPU buffers.
Layout can evaluate every repulsive interaction exactly or explicitly approximate distant groups
through a caller-owned uniform grid. Every operation composes with the existing `GPUCommandGraph`.

This is an experimental, headless graph analytics API, not a graph database, visualization
framework, file importer, or general-purpose dataframe. Applications decide how data reaches the
GPU, which results they render, when commands are submitted, and whether anything is read back.

## Explore a live GPU graph

**What do graph relationships, vertex influence, connected groups, and neighborhood searches look
like when they feed a real interactive application?**

The [interactive luGraph explorer](/examples/experimental/lugraph-explorer) answers that question
with a deterministic 128-vertex network. Four intentionally generated source groups contain
important hubs, a bridge between the first two groups, and one completely isolated vertex. This
small, deliberately interpretable network makes it possible to see how adjacency, degree,
PageRank, weak components, bounded shortest paths, and exact force-directed layout work together.

<LuGraphExplorerExample embedded embeddedHeight={680} />

The graph inspector opens automatically and lets you compare four real GPU-backed color modes:

- **Weak components** identify entities that can reach each other when edge direction is ignored.
  The two source groups joined by a bridge have the same color; disconnected groups and the
  isolated vertex remain separate. These are weak components, not community-detection output.
- **Vertex degree** exposes direct relationship counts and identifies immediately connected hubs.
- **PageRank importance** identifies influence received from other important vertices, which can
  differ substantially from raw relationship count.
- **Neighborhood distance** shows how many bounded, unweighted hops separate each reachable vertex
  from the current selection.

Node size can independently reflect normalized PageRank, vertex degree, or a uniform radius. Click
a node to inspect its stable source identifier and highlighted neighborhood; adjust neighborhood
depth to follow more unweighted hops. Toggle the original edge batches, pause or resume the exact
layout, drag a node to pin it, release pins, or reset deterministic initial positions. Hold Shift
while dragging to pan and scroll to zoom. An accessible legend and live status explain the current
graph; adapter, frame-rate, and GPU-allocation details report actual available runtime information,
not invented GPU execution times.

The example builds forward and reverse compressed adjacency, vertex degree, weak components, and
normalized PageRank on the GPU. Each frame updates bounded breadth-first selection and progresses
the exact force layout. The same caller-owned position buffer is simultaneously writable storage
and a render vertex attribute. Node and picking shaders consume the actual PageRank and degree
buffers, while edge models draw their original aligned source batches without concatenating the
intentionally empty middle batch. Analytics, simulation, and ordinary rendering do not read graph
data back to JavaScript; explicitly requested integer picking reads only one compact **8-byte**
selected-vertex result.

Use this demonstration to understand how GPU-resident graph outputs can directly support a social
network, dependency map, fraud investigation, or other relationship visualization. It is a
WebGPU-only educational example, not a large-graph performance benchmark: its exact layout costs
`O(V² + E)` per force iteration and intentionally uses only 128 vertices.

### Use luGraph from deck.gl without copying graph buffers

**Question: How can an existing deck.gl application explore a graph without converting GPU
relationships, analytics, or moving node positions into JavaScript objects?**

The optional [luGraph + deck.gl network explorer](/examples/deck/lugraph-explorer) answers that
question with the reusable `LuGraphDeckEffect`, `LuGraphNodeLayer`, and `LuGraphEdgeLayer`
implementations from the existing private `@deck.gl-community/arrow-layers` adapter package, an
`OrthographicView`, and deck.gl's existing interaction and asynchronous WebGPU picking systems.
Use it when a social-network, service-dependency, fraud-investigation, or citation visualization
already uses deck.gl and needs GPU graph results to become directly drawable attributes.

The effect first encodes forward and reverse adjacency, normalized PageRank, and weak components.
Later frames encode bounded neighborhood selection and exact force-directed layout into
deck.gl's own command encoder; deck.gl remains responsible for queue submission. The writable layout
allocation is also the node layer's `float32x2` instance vertex attribute. PageRank scores,
component labels, hop distances, and the selection mask remain GPU storage inputs; each nonempty
original edge partition gets its own edge layer,
without concatenation, buffer copies, or per-frame graph readback.

The deterministic example fixture is uploaded once. Selecting, pinning, dragging, and changing
neighborhood depth write only the necessary interaction controls or coordinates; they do not
download graph columns. An explicitly requested native deck.gl pick returns the selected original
vertex identifier to JavaScript. Its implementation and transfer size belong to deck.gl; it is
separate from the native explorer's custom **8-byte** integer-picking path above. The example uses
exact `O(V² + E)` layout, not the optional spatial approximation, and does not promise large-graph
throughput.

The reusable graph effect, node and edge layers, and graph integration's deck.gl imports live in
the existing private `@deck.gl-community/arrow-layers` adapter. The website-only example consumes
those exported symbols without importing `@deck.gl/core` or adding an example package; neither
`@luma.gl/experimental` nor its optional graph entry point depends on or imports deck.gl.

## Measure real CPU and WebGPU graph workloads

**Question: Does this graph workflow benefit from GPU execution on my actual browser, and what do
setup, command submission, and approximate layout really cost?**

A network diagram can demonstrate an algorithm without explaining its cost. This opt-in benchmark
runs independent CPU implementations and the actual WebGPU graph operations against identical,
deterministic source edges, stable vertex identifiers, and initial coordinates. Use it to compare
different graph structures, understand why a small CPU-resident task may be faster on the CPU, and
decide whether reusing GPU-resident adjacency or approximating distant layout forces suits a real
application.

<LuGraphBenchmark />

Select a graph family and 32, 64, 128, or 256 vertices, then explicitly start the benchmark.
No benchmark GPU work runs during page rendering or hydration. A WebGPU-capable browser, supported
adapter, and secure origin are required; unavailable hardware never produces simulated measurements.

### Choose a graph that resembles your application

- **Sparse:** a mostly connected ring with occasional shortcuts, similar to infrastructure routes
  or simple dependency chains.
- **Dense:** every distinct pair has a directed edge, producing `V × (V - 1)` edges and exposing
  workloads dominated by adjacency and relationship count.
- **Scale-free:** preferential attachment creates a few influential hubs, resembling citation,
  social, and package-dependency networks.
- **Disconnected:** multiple independent groups plus an isolated vertex exercise unreachable
  searches and weak-component labeling.
- **High-degree hub:** one central vertex connects to many neighbors, testing uneven relationship
  distributions such as a heavily depended-on service.

The original source and target edges retain three ordered batches, including an intentionally empty
middle batch. Each family runs six genuine GPU algorithms and independent CPU references:
compressed adjacency, breadth-first neighborhood search, weak components, PageRank, exact force
layout, and explicitly approximate uniform-grid force layout. These bounded demonstrations are not
million-vertex benchmarks; dense graphs and exact force layout can require quadratic work.

### Read each timing without hiding its costs

The **CPU median** measures the independent CPU algorithm. **CPU encode** measures the separate CPU
work of recording the GPU command graph. **Fenced GPU median** begins at command submission and
stops only after an explicit completion fence confirms that the real GPU workload completed; it
does not include the separately reported CPU encoding. The displayed GPU-versus-CPU ratio compares
only those two algorithm medians and therefore excludes encoding, initial upload, graph
compilation, and correctness readback. Include those phases when judging one-off or end-to-end
workflows.

The panel performs one warmup and three measured iterations. Its median is an observed sample, not
a statistically robust cross-device result; the programmatic API additionally reports observed
minimum, median, 95th-percentile, and maximum values. Hardware GPU timestamps appear only when the
active adapter genuinely exposes timestamp queries. Queue synchronization, browser overhead, and
hardware execution describe different costs, so a timestamp is not a substitute for fenced
end-to-end submission time.

Source upload, initial command-graph compilation, explicit correctness readback, and an
independently fenced spatial-grid rebuild are reported as separate phases. The accelerated layout
measurement still includes the grid rebuild required by each actual iteration; the standalone
grid result merely makes that cost visible. Working-memory columns distinguish imported buffers
from transient graph storage, while caller-owned spatial-index bytes are reported independently.

Every GPU result must match its independently computed CPU reference before timings are published.
The spatial path is checked against a CPU implementation of the same approximation; its additional
coordinate error is measured against the exact force reference. Weak components report their actual
GPU convergence flag, and PageRank reports its final GPU L1 residual. A fixed iteration budget does
not imply convergence or early termination. Results apply only to this graph, browser, and
adapter; they never promise a speedup, generalize across devices, or describe the approximation
as Barnes–Hut or ForceAtlas2.

### Run the same benchmark programmatically

Benchmark helpers live behind an optional nested entry point so ordinary graph applications do not
import benchmark-only datasets, CPU references, or measurement code:

```ts
import {
  makeLuGraphBenchmarkDataset,
  runLuGraphBenchmark
} from '@luma.gl/experimental/lugraph/benchmarks';

const dataset = makeLuGraphBenchmarkDataset({kind: 'scale-free', vertexCount: 128, seed: 42});
const report = await runLuGraphBenchmark(device, {
  kind: dataset.kind,
  vertexCount: dataset.vertexCount,
  seed: 42,
  warmupIterations: 1,
  measuredIterations: 3,
  pageRankIterations: 20,
  forceIterations: 1,
  maxDepth: 6,
  theta: 0.6,
  gridSize: [8, 8]
});
```

The dataset helper returns fresh, caller-owned CPU arrays; the benchmark independently generates
its identical seeded input, explicitly uploads and validates real GPU results, and releases its
own temporary allocations after reporting. Neither helper changes production graph ownership or
adds an automatic CPU execution fallback to the graph API.

## Why keep a graph on the GPU?

A CPU application can certainly traverse a graph. The problem appears when its relationship data
already lives on the GPU: copying every edge to JavaScript, rebuilding an object graph, running an
analysis, and uploading the answer again interrupts both compute and rendering.

luGraph keeps the complete intermediate pipeline on one WebGPU device:

```text
Existing GPU edge columns
    -> compressed adjacency
    -> degree / shortest paths / weak components / communities / PageRank / force layout
    -> caller-owned GPU result columns and directly renderable positions
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
  of introductions, distinguish friend circles within connected networks, group disconnected
  networks, rank influential accounts, and arrange connected people into a readable map.
- **Software and service dependencies:** follow incoming or outgoing dependency chains, find
  isolated dependency islands, reveal tightly linked ownership groups, and identify packages that
  many important packages depend on.
- **Transaction and fraud investigations:** follow transfers around a selected account, identify
  coordinated clusters inside a larger connected group of counterparties, and prioritize
  structurally important entities.
- **Transport and infrastructure maps:** inspect junction degree, unweighted hop reachability,
  disconnected subnetworks, and relationship-driven importance across a network.
- **Knowledge and citation graphs:** follow citation links, identify connected collections, and
  rank documents by incoming influence rather than raw citation count alone.

Choose another tool when the application needs weighted shortest paths, a graph query language,
automatic CPU fallback, distributed execution, or compatibility with a CUDA or Python graph API.
Exact force-directed layout also becomes expensive on very large graphs because it evaluates every
pair of vertices. An optional spatial layout can exchange some far-field accuracy for fewer
individual repulsion calculations, but its flat grid does not guarantee subquadratic complexity or
make arbitrary graph sizes interactive. luGraph operates on one browser WebGPU device and does not
provide the other unsupported features above.

## Choose the right graph operation

| Operation | Question it answers | GPU result | Typical bounded work |
| --- | --- | --- | --- |
| `LuGraph` | Which GPU columns describe the graph? | Borrowed graph metadata and original chunks | Metadata only; no GPU dispatch |
| `LuGraphTopology` | Which vertices are adjacent? | Forward and optional reverse compressed adjacency | `O(V + E)` |
| `LuGraphDegree` | How many relationships touch each vertex in one direction? | One `uint32` degree per vertex | `O(V)` after adjacency exists |
| `LuGraphBreadthFirstSearch` | Which vertices are within a chosen number of unweighted hops? | Distances, deterministic predecessors, and an optional selection mask | At most `O(D × (V + E))` for `D` compiled hops |
| `LuGraphConnectedComponents` | Which vertices belong to the same weakly connected group? | One `uint32` component identifier per vertex | At most `O(K × (V + E))` for `K` bounded iterations |
| `LuGraphLabelPropagation` | Which densely connected communities exist inside a connected network? | One deterministic `uint32` community label per vertex | At most `O(K × sum(degree²))` for `K` bounded iterations |
| `LuGraphPageRank` | Which vertices receive influence from other important vertices? | One normalized `float32` score per vertex | `O(K × (V + E))` for `K` iterations |
| `LuGraphForceLayout` | How can related vertices be positioned as a readable network? | Directly renderable `float32x2` positions and persistent velocities | `O(V² + E)` per exact force iteration |
| `LuGraphSpatialForceLayout` | Can distant graph regions be approximated while nearby relationships remain exact? | The existing renderable layout positions plus explicit uniform-grid diagnostics | `Θ(V × G + P + E)` per spatial force iteration |

`V` is the graph's explicit vertex count, `E` is its source-edge count, `G` is the uniform-grid
cell count, `P` counts individual interactions in near or insufficiently distant cells, and
`sum(degree²)` adds the squared weak-neighbor count of every vertex. Undirected adjacency contains
both directions for ordinary edges; an undirected self-loop appears once.

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

## Discover densely connected communities with LuGraphLabelPropagation

**Question: Which vertices form closely connected communities inside a network that is otherwise
connected?**

`LuGraphLabelPropagation` groups vertices by the labels most common in their immediate
neighborhood. Use it to reveal circles of friends within a social network, identify related
transaction accounts within a larger fraud investigation, separate service ownership groups inside
a connected dependency graph, or color locally cohesive regions of a citation network.

A connected component answers whether any path links two vertices. Community detection asks a
different question: are these vertices more strongly connected to one another than to the rest of
the same network? Imagine two teams whose members interact frequently within their own team but
share only one relationship across teams. That single bridge makes the whole network one weakly
connected component, while label propagation can still give each team a different community label.
Use weak components to find disconnected islands; use community labels to inspect local structure
within an island.

```ts
import {LuGraphLabelPropagation} from '@luma.gl/experimental/lugraph';

const communities = new LuGraphLabelPropagation({
  topology,
  output: communityIds,
  iterations: 32,
  converged: communitiesConverged
});
```

Every vertex begins with its stable vertex identifier as its label. Each synchronous round reads
the preceding round's complete label snapshot and selects the most frequent label among one self
vote and all incoming or outgoing neighbor occurrences. Equal vote counts choose the numerically
lowest label, so the result does not depend on unspecified adjacency ordering. Self-loops add no
extra self votes; duplicate edges and reciprocal directed edges vote independently. Existing edge
weights are preserved by topology but ignored by this unweighted majority vote.

Directed graphs require both forward and reverse adjacency to include every weak neighbor.
Undirected graphs reuse symmetric forward adjacency without reverse CSR. `output` is a
caller-owned, packed `GPUVector<'uint32'>` containing exactly one community label per vertex;
the optional `converged` output is a separate, caller-owned one-row `GPUVector<'uint32'>`.
Neither allocation may physically alias graph inputs, adjacency storage, or another writable
output.

The default is `32` synchronous rounds; applications can explicitly choose an integer from `1`
through `1024`. Every declared round is encoded without CPU synchronization, automatic readback,
or early termination. `converged` becomes one only when the final round changes no labels; zero
means that the chosen budget did not establish a fixed point. Some graphs can oscillate between
label assignments, so a bounded round count never guarantees convergence. An empty graph reports
convergence, and an isolated vertex retains its own identifier.

If required forward or reverse adjacency overflows, all output labels become `0xffffffff` and
`converged` becomes zero rather than publishing partial communities. The worst-case work is
`O(sum(degree²))` per round because counting support for each candidate can rescan a vertex's
neighborhood; a high-degree hub can therefore be disproportionately expensive. This deterministic
label-propagation heuristic is not Louvain or Leiden, does not optimize modularity, and does not
guarantee objectively correct communities or a particular clustering quality.

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

## Reveal relationships with LuGraphForceLayout

**Question: How can I position connected entities so the structure of their relationships becomes
visible?**

`LuGraphForceLayout` progressively assigns two-dimensional positions to graph vertices. Imagine
every vertex pushing away from every other vertex while each edge acts like a spring pulling its
two endpoints together. Over successive frames, tightly connected entities move closer together,
unrelated vertices spread apart, and a gentle pull toward the origin keeps the network in view.

Use it to arrange a social graph so overlapping circles of friends become easier to inspect, map
service dependencies around their most connected systems, expose connected counterparties in a
transaction investigation, or turn a citation list into a navigable document network. Unlike
degree, connected components, and PageRank, which answer numerical questions about a vertex, force
layout answers where an application can draw that vertex. Your application still owns its
renderer, colors, labels, and interaction design.

```ts
import {LuGraphForceLayout} from '@luma.gl/experimental/lugraph';

const layout = new LuGraphForceLayout({
  topology,
  positions: nodePositions,
  velocities: nodeVelocities,
  pinned: pinnedVertices,
  reset: resetRequested,
  seed: 42,
  iterationsPerFrame: 4,
  repulsion: 1,
  attraction: 0.1,
  gravity: 0.01,
  damping: 0.9,
  maxVelocity: 1,
  timeStep: 1
});
```

`positions` and `velocities` are distinct, caller-owned, packed `GPUVector<'float32x2'>` values
with one row per vertex. The physical position buffer must have both `Buffer.STORAGE` and
`Buffer.VERTEX` usage: compute updates the exact same allocation that an application can bind as a
render vertex attribute. Velocity storage requires `Buffer.STORAGE`. There is no intermediate
position copy, CPU coordinate readback, or graph-owned layout scratch buffer.

Every exact iteration evaluates repulsion against all other vertices, equal-strength attraction
over every incident edge, gravity toward the origin, velocity damping, and a configurable maximum
speed. The force pass finishes for every vertex before a separate integration pass writes the next
positions. This globally ordered separation keeps the old position field stable during force
evaluation without requiring floating-point atomics.

Edges pull both endpoints together even when the source graph is directed, so directed layout
requires both forward and reverse adjacency. Undirected layout reuses symmetric forward adjacency.
Existing edge weights are preserved by topology but intentionally ignored by this unweighted
spring model; a duplicate edge contributes another spring and a self-loop adds no displacement.

Set a vertex's optional `uint32` `pinned` row to any nonzero value to preserve its current position
and clear its velocity. This supports dragging a node into place, holding a selected account
steady, or anchoring known reference vertices while their neighbors continue to settle.

Writing a nonzero value to the optional one-row `uint32` `reset` vector requests deterministic
initialization from `seed` and clears existing velocities. Pinned coordinates remain unchanged,
and the GPU consumes the reset request by clearing it. Subsequent encodings warm-start from the
current positions and velocities instead of restarting the simulation on every frame.

The defaults are `seed: 0`, `iterationsPerFrame: 4`, `repulsion: 1`, `attraction: 0.1`,
`gravity: 0.01`, `damping: 0.9`, `maxVelocity: 1`, and `timeStep: 1`. Increase the per-frame step
count when visual responsiveness matters more than frame cost; lower it when other GPU work needs
the same frame budget. If required forward or reverse adjacency overflows, the layout preserves
every existing position and clears all velocities rather than drawing a misleading partial graph.

Each force step performs exact `O(V² + E)` work: doubling the vertex count roughly quadruples the
all-pairs repulsion. Choose this layout for graph sizes where exact pairwise interactions fit the
available frame budget, especially when the result is consumed directly by GPU rendering. Avoid
it for very large networks, already meaningful geographic coordinates, or applications requiring
weighted springs. This implementation does not approximate pairwise interactions and does not
claim to implement ForceAtlas2 or Barnes–Hut.

## Approximate distant forces with LuGraphSpatialForceLayout

**Question: How can I make a larger relationship map easier to explore when exact repulsion spends
too much time comparing every individual vertex?**

`LuGraphSpatialForceLayout` adds an explicitly approximate, opt-in execution path around an existing
`LuGraphForceLayout`. Imagine looking across a city: nearby pedestrians need individual attention,
but a distant crowd can often be treated as one group at its average position. The spatial layout
divides the current drawing area into a regular grid, calculates nearby forces exactly, and
represents sufficiently distant occupied cells by their population and center of mass.

Use it when an interactive dependency map, social network, transaction investigation, or citation
visualization already owns GPU-resident graph data and can trade a bounded amount of visual
accuracy for fewer individual far-field calculations. Keep the exact layout when every pairwise
force must be reproducible, the network is small enough that index construction costs more than
it saves, vertices are too concentrated to benefit from grouping, or meaningful fixed coordinates
should not be replaced by a force-directed arrangement.

```ts
import {
  LuGraphForceLayout,
  LuGraphSpatialForceLayout
} from '@luma.gl/experimental/lugraph';

const layout = new LuGraphForceLayout({
  topology,
  positions: nodePositions,
  velocities: nodeVelocities,
  pinned: pinnedVertices,
  reset: resetRequested,
  iterationsPerFrame: 4
});

const spatialLayout = new LuGraphSpatialForceLayout({
  layout,
  gridSize: [32, 32],
  bounds: [-4, -4, 4, 4],
  theta: 0.6,
  nearCellRadius: 1,
  cellOffsets: spatialCellOffsets,
  vertexIds: spatialVertexIds,
  cellCenters: spatialCellCenters,
  count: indexedVertexCount,
  overflow: spatialIndexOverflow
});

spatialLayout.addToGraph(workflow);
```

Add either `layout` or `spatialLayout` to a workflow, not both: the spatial contributor advances
the same base positions and velocities itself. Existing directed and undirected spring behavior,
deterministic resets, pinned vertices, velocity limits, progressive warm starts, and directly
renderable position buffers remain intact. Directed attraction still requires reverse adjacency;
existing edge-weight columns remain intentionally unused by the unweighted spring model.

### Accuracy and spatial controls

The source vertex's own cell and every cell within `nearCellRadius` use exact, individual vertex
interactions. This neighborhood is a square measured in grid cells: the default radius `1` covers
the source cell and up to eight surrounding cells. Other occupied cells are approximated only when
`cellDiagonal / distanceToCellCenter < theta`; cells that fail that test still contribute all of
their individual interactions. No distant vertex is silently dropped.

The default `theta: 0.6` controls the speed-versus-accuracy tradeoff. Larger values accept more
distant cell approximations and can increase layout error; smaller values require a cell to be
farther away before its population-weighted center of mass can represent its contents. Set
`theta: 0` to disable every approximation and recover exact all-pairs repulsion while retaining
the explicit grid rebuild and cell-scan overhead. Increasing `nearCellRadius` expands the exact
neighborhood and can also prevent approximation across the entire grid.

This implementation is a **flat uniform-grid monopole approximation**, not hierarchical
Barnes–Hut, ForceAtlas2, an adaptive tree, or a claim of million-vertex throughput. It computes
cell centers from grouped vertex identifiers without floating-point atomics.

### Bounds, buffers, and failure behavior

`gridSize: [columns, rows]` creates `G = columns × rows` equally sized cells inside the explicit,
inclusive `bounds: [minimumX, minimumY, maximumX, maximumY]`. The application supplies five
packed, single-chunk GPU vectors with physically distinct buffer allocations:

- `cellOffsets`: `GPUVector<'uint32'>` with exactly `G + 1` rows.
- `vertexIds`: `GPUVector<'uint32'>` with caller-selected indexing capacity; allow at least `V`
  rows to accept every vertex without overflow.
- `cellCenters`: `GPUVector<'float32x2'>` with exactly `G` rows.
- `count`: a one-row `GPUVector<'uint32'>` reporting accepted in-domain vertices.
- `overflow`: a one-row `GPUVector<'uint32'>` signaling insufficient `vertexIds` capacity.

The GPU rebuilds these caller-owned buffers on every spatial force iteration because vertices can
cross cell boundaries as the layout moves. Choose bounds that include every current coordinate,
deterministic reset positions in `[-1, 1]`, and sufficient room for future movement. Bounds do not
expand automatically; a vertex outside the domain makes `count` smaller than `vertexCount` even
when indexing capacity is sufficient.

If any vertex is outside the bounds, the index overflows, or required forward/reverse adjacency
overflows, the spatial step fails closed: it preserves every existing position and clears all
velocities. Counts and overflow flags remain explicit GPU-resident outputs until an application
deliberately reads them back. Caller-owned layout and grid allocations are never destroyed or
silently replaced.

### Cost and when acceleration helps

Every vertex still scans every grid cell, even empty cells. With `V` vertices, `G` cells, `P`
individual near-field or rejected-far-field interactions, and `E` edges, each iteration performs
`Θ(V × G + P + E)` work plus one grid rebuild and uses `Θ(V + G)` caller-owned grid storage.
A sensible grid can reduce the number of individual interactions when vertices are distributed
across well-separated regions, but an oversized grid wastes scans and a crowded grid cell
restores pairwise work. The worst case can return to `Θ(V² + E)`; a grid with more cells than
vertices can be even more expensive. Measure the application's actual graph distribution,
index-rebuild cost, accuracy, and frame budget before choosing this path.

## Compose one GPU-resident workflow

All graph contributors add work to the same caller-owned `GPUCommandGraph`. The following example
assumes that the source columns, packed result vectors, spatial index buffers, and one-row status
vectors already exist on the same WebGPU device:

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  LuGraph,
  LuGraphBreadthFirstSearch,
  LuGraphConnectedComponents,
  LuGraphDegree,
  LuGraphForceLayout,
  LuGraphLabelPropagation,
  LuGraphPageRank,
  LuGraphSpatialForceLayout,
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
new LuGraphLabelPropagation({
  topology,
  output: communityIds,
  iterations: 32,
  converged: communitiesConverged
}).addToGraph(workflow);
new LuGraphPageRank({
  topology,
  output: importanceScores,
  damping: 0.85,
  iterations: 40,
  residual: finalRankChange
}).addToGraph(workflow);
const layout = new LuGraphForceLayout({
  topology,
  positions: nodePositions,
  velocities: nodeVelocities,
  pinned: pinnedVertices,
  reset: resetRequested,
  iterationsPerFrame: 4
});
new LuGraphSpatialForceLayout({
  layout,
  gridSize: [32, 32],
  bounds: [-4, -4, 4, 4],
  theta: 0.6,
  nearCellRadius: 1,
  cellOffsets: spatialCellOffsets,
  vertexIds: spatialVertexIds,
  cellCenters: spatialCellCenters,
  count: indexedVertexCount,
  overflow: spatialIndexOverflow
}).addToGraph(workflow);

const compiled = workflow.compile();
const encoder = device.createCommandEncoder({id: 'analyze-network'});
compiled.encode(encoder, {parameters: undefined});
device.submit(encoder.finish());
```

Constructors validate existing metadata; they do not upload graph data, submit commands, or read
results. `addToGraph()` declares GPU work, `compile()` resolves the workflow, and the application
explicitly encodes and submits it. Re-encoding rebuilds topology and recomputes the declared
results from the current source and control buffers while progressively advancing the existing
layout positions and velocities. Replace the spatial contributor with `layout.addToGraph(workflow)`
when exact all-pairs repulsion is the better fit.

## Ownership, capacity, and failure boundaries

- All original source vectors and output vectors are caller-owned. Contributors neither destroy
  them nor silently repack their existing chunks.
- Writable outputs require physically distinct GPU buffer allocations, including when a
  `DynamicBuffer` wrapper exposes the same underlying allocation through different views.
- Adjacency capacities and overflow statuses are explicit. Breadth-first search fails closed to
  unreachable distances, weak components and community detection publish `0xffffffff`, and
  PageRank publishes zero scores when a required neighbor list overflowed. Force layout preserves
  its existing positions and clears velocities on required adjacency overflow.
- Spatial layout also preserves positions and clears velocities when its accepted count excludes
  any out-of-domain vertex or its explicit vertex-ID capacity overflows.
- Degree remains exact under neighbor overflow because its input is the complete CSR offset range.
- Renderable layout positions require both `Buffer.STORAGE` and `Buffer.VERTEX` usage on their
  original caller-owned allocation; position readback or repacking is never implicit.
- Fixed component, community, and PageRank iteration budgets do not imply convergence. Their
  optional status and final-change outputs remain GPU-resident until an application explicitly
  requests readback.
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

luGraph is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE)
vis.gl implementation for browser-native WebGPU. It does not copy or translate cuGraph source code
or CUDA implementations. It does not claim CUDA or cuGraph API compatibility, feature parity,
NVIDIA affiliation, or NVIDIA endorsement.
