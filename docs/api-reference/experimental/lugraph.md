import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';
import {LuGraphBenchmark} from '@site/src/components/docs/lugraph-benchmark';
import {LuGraphExplorerExample} from '@site/src/examples';

# luGraph: GPU-Resident Graph Analytics

<ExperimentalDocsTabs active="lugraph" />

## Overview

A graph answers questions that individual table rows cannot: which accounts share a transaction,
which services depend on a failed service, which people are two introductions apart, which tightly
connected groups exist inside a wider network, which route has the lowest actual travel cost, how
closely somebody's friends know one another, which network members form a durable structural
backbone, whether a proposed community grouping is actually meaningful, how to improve that
grouping, and which pages matter because other important pages link to them. Vertices represent
those entities; edges represent their relationships.

`@luma.gl/experimental/lugraph` answers these questions directly on a browser WebGPU device. It
describes caller-owned GPU edge columns, builds reusable compressed adjacency, and publishes vertex
degrees, unweighted shortest-path neighborhoods, weighted least-cost routes, weakly connected
groups, densely connected communities, per-vertex local clustering, structural core numbers,
community modularity scores, explicitly improved community assignments, PageRank importance, and
progressive two-dimensional graph layouts into caller-owned GPU buffers. Layout can evaluate every
repulsive interaction exactly or explicitly approximate distant groups through a caller-owned
uniform grid. Every operation composes with the existing `GPUCommandGraph`.

This is an experimental, headless graph analytics API, not a graph database, visualization
framework, file importer, or general-purpose dataframe. Applications decide how data reaches the
GPU, which results they render, when commands are submitted, and whether anything is read back.

## Explore a live GPU graph

**What do graph relationships, vertex influence, connected groups, and neighborhood searches look
like when they feed a real interactive application?**

The [interactive luGraph explorer](/examples/experimental/lugraph-explorer) answers that question
with a deterministic, genuinely resizable network. It opens with **1,024 vertices**, then lets you
choose any of fourteen actual graph populations from **128 to 1,048,576 vertices**. The largest
setting contains **1,048,576 real GPU-resident vertices and 2,097,343 original directed edges**;
these are complete source relationships, not a small graph duplicated or multiplied for display.
Four intentionally generated source groups contain important hubs, a bridge between the first two
groups, and one isolated vertex, making both small and large versions interpretable.

<LuGraphExplorerExample embedded embeddedHeight={680} />

The graph inspector opens automatically and lets you compare five real GPU-backed color modes:

- **Label-propagation communities** distinguish tightly connected local groups using deterministic,
  bounded majority votes. A narrow bridge can preserve two different communities even when both
  groups belong to the same connected component; a fixed iteration budget does not prove
  convergence.
- **Weak components** identify entities that can reach each other when edge direction is ignored.
  The two source groups joined by a bridge have the same color; disconnected groups and the
  isolated vertex remain separate. This mode describes connectivity, not the separate
  community-detection labels.
- **Vertex degree** exposes direct relationship counts and identifies immediately connected hubs.
- **PageRank importance** identifies influence received from other important vertices, which can
  differ substantially from raw relationship count.
- **Neighborhood distance** shows how many bounded, unweighted hops separate each reachable vertex
  from the current selection.

Node size can independently reflect normalized PageRank, vertex degree, or a uniform radius. Use
the graph-size slider to rebuild actual resident graph data, and select automatic, exact,
flat-grid spatial, or sampled layout. Click a node to inspect its stable source identifier and
highlighted neighborhood; adjust neighborhood depth to follow more unweighted hops. Toggle visible
edges, pause or resume the selected layout, drag a node to pin it, release pins, or reset
deterministic initial positions. Hold Shift while dragging to pan and scroll to zoom.

The example builds forward and reverse compressed adjacency, vertex degree, weak components,
label-propagation communities, and normalized PageRank on the GPU. Breadth-first selection updates
when its root or depth changes; progressive layout advances the existing caller-owned position
buffer, which is simultaneously writable storage and a render vertex attribute. Node and picking
shaders consume the actual community, component, PageRank, and degree buffers. Original source
edge batches, including the intentionally empty middle batch, are never concatenated or repacked.
Weighted shortest paths and local clustering are separate reusable graph operations and benchmark
workloads. Core decomposition, modularity scoring, and modularity optimization are additional
reusable operations beyond the benchmark; the existing example does not claim to expose any of
them as explorer controls.

Automatic layout selects distinct, honestly bounded GPU workloads:

- **Exact layout through 512 vertices:** every pairwise repulsive interaction is evaluated,
  costing `O(V² + E)` per iteration.
- **Flat-grid spatial layout from 1,024 to 8,192 vertices:** nearby interactions remain exact while
  sufficiently distant cells use the optional uniform-grid approximation and its explicit,
  caller-owned GPU index.
- **Sampled layout from 16,384 vertices:** every actual vertex evaluates all incident edges plus
  four deterministically selected repulsion samples, costing `O(E + 4V)` per iteration. It is a
  separate, explicitly approximate application helper, not exact all-pairs layout, flat-grid
  layout, Barnes–Hut, or ForceAtlas2.

At **65,536 vertices** and above, every original vertex remains visible as one real GPU point.
Only rendered edge detail is limited to **65,536 edges**; all **2,097,343 original edges** at the
largest setting remain resident in their source batches and adjacency. The inspector distinguishes
the complete graph population from displayed edge detail, reports the actual adapter, frame rate,
measured CPU command-encoding time, and GPU resource ownership, and does not invent GPU execution
times or convergence. CPU encoding is never mislabeled as a GPU measurement.

Adjacency construction, degree, and one breadth-first traversal use `O(V + E)` work; bounded
PageRank and weak components use `O(K × (V + E))`, while label propagation uses
`O(K × sum(degree²))`. The quadratic workload avoided at scale is exact all-pairs force layout,
not an unavoidable property of graph analytics. Large-graph iteration budgets are deliberately
bounded and do not certify convergence or clustering quality.

Use this demonstration to understand how GPU-resident graph outputs can directly support a social
network, dependency map, fraud investigation, or other relationship visualization while making
real rendering and approximation tradeoffs explicit. Analytics, simulation, and ordinary rendering
never read graph columns back to JavaScript; explicitly requested integer picking reads only one
compact **8-byte** selected-vertex result.

### Use luGraph from deck.gl without copying graph buffers

**Question: How can an existing deck.gl application explore a graph without converting GPU
relationships, analytics, or moving node positions into JavaScript objects?**

The optional [luGraph + deck.gl network explorer](/examples/deck/lugraph-explorer) answers that
question with the reusable `LuGraphDeckEffect`, `LuGraphNodeLayer`, and `LuGraphEdgeLayer`
implementations from the existing private `@deck.gl-community/arrow-layers` adapter package, an
`OrthographicView`, and deck.gl's existing interaction and asynchronous WebGPU picking systems.
Use it when a social-network, service-dependency, fraud-investigation, or citation visualization
already uses deck.gl and needs GPU graph results to become directly drawable attributes.

The effect first encodes forward and reverse adjacency, vertex degree, normalized PageRank, weak
components, and deterministic label-propagation communities. Later frames encode actual exact,
flat-grid spatial, or sampled force layout into deck.gl's own command encoder; bounded
neighborhood selection reruns only when interaction changes it. deck.gl remains responsible for
queue submission. The writable layout allocation is also the node layer's `float32x2` instance
vertex attribute. PageRank scores, degree counts, component and community labels, hop distances,
and the selection mask remain GPU storage inputs; each nonempty original edge partition gets its
own edge layer, without concatenation, buffer copies, or per-frame graph readback.

The deterministic example fixture is uploaded once for each selected graph size. Resizing replaces
its resident allocations and rebinds stable node and edge layers to their new buffers. Selecting,
pinning, dragging, and changing neighborhood depth write only the necessary interaction controls or
coordinates; they do not download graph columns. Every actual vertex remains rendered, including
all **1,048,576 vertices** in point mode; only displayed original edges are capped. An explicitly
requested native deck.gl pick returns the selected original vertex identifier to JavaScript. Its
implementation and transfer size belong to deck.gl; it is
separate from the native explorer's custom **8-byte** integer-picking path above.

The reusable graph effect, node and edge layers, and graph integration's deck.gl imports live in
the existing private `@deck.gl-community/arrow-layers` adapter. The website-only example consumes
those exported symbols without importing `@deck.gl/core` or adding an example package; neither
`@luma.gl/experimental` nor its optional graph entry point depends on or imports deck.gl. The
example supplies its sampled-layout helper to the private effect as an injected callback, so the
package never imports example code or claims that the helper is a new production graph operation.

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

The original source, target, and deterministic nonnegative edge-weight columns retain three aligned
ordered batches, including an intentionally empty middle batch. Each family runs nine genuine GPU
algorithms and independent CPU references: compressed adjacency, breadth-first neighborhood
search, weighted single-source shortest paths, weak components, label-propagation communities,
local clustering coefficients, PageRank, exact force layout, and explicitly approximate
uniform-grid force layout. The six Graphalytics workload families are represented, alongside
adjacency construction and two visualization-oriented layouts. These bounded demonstrations are not
million-vertex benchmarks; dense graphs, local triangle counting, and exact force layout can
require much more work than sparse traversal. Structural core decomposition, partition modularity,
and modularity optimization extend the reusable graph API beyond these six standardized families
and nine measured paths; they are not silently counted as additional benchmark results.

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
Weighted shortest paths are checked against an independent CPU least-cost calculation, local
clustering against independently counted neighbor triangles, and community labels against the same
bounded deterministic voting rules. The spatial path is checked against a CPU implementation of
the same approximation; its coordinate error is measured against the exact force reference.
Weak components report their actual
GPU convergence flag, and PageRank reports its final GPU L1 residual. A fixed iteration budget does
not imply convergence or early termination. Results apply only to this graph, browser, and
adapter; they never promise a speedup, generalize across devices, establish official benchmark
certification, or describe the approximation as Barnes–Hut or ForceAtlas2.

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
    -> degree / core numbers / weighted paths / local clustering / communities / PageRank
    -> partition modularity / improved communities / renderable force-layout positions
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
  of introductions, distinguish friend circles within connected networks, measure whether each
  person's friends also know one another, identify mutually supported network cores, compare and
  explicitly improve proposed community partitions, group disconnected networks, rank influential
  accounts, and arrange connected people into a readable map.
- **Software and service dependencies:** follow incoming or outgoing dependency chains, find
  isolated dependency islands, reveal tightly linked ownership groups, identify unusually closed
  service clusters, and compare dependency paths by latency, risk, or recovery cost.
- **Transaction and fraud investigations:** follow transfers around a selected account, identify
  coordinated clusters inside a larger connected group of counterparties, distinguish locally
  interlinked transaction rings from simple hubs, expose resilient fraud-ring backbones, compare
  whether suggested groups retain more transaction weight than expected, and prioritize
  structurally important entities.
- **Transport and infrastructure maps:** inspect junction degree, compare routes by nonnegative
  travel time or distance, distinguish cheapest routes from fewest transfers, and find disconnected
  subnetworks and relationship-driven importance across a network.
- **Knowledge and citation graphs:** follow citation links, identify connected collections, and
  rank documents by incoming influence rather than raw citation count alone.

Choose another tool when the application needs negative-weight routing, all-pairs shortest paths,
a graph query language, automatic CPU fallback, distributed execution, or compatibility with a CUDA
or Python graph API. Exact force-directed layout also becomes expensive on very large graphs
because it evaluates every pair of vertices. An optional spatial layout can exchange some
far-field accuracy for fewer force calculations, but it does not guarantee subquadratic complexity
or make arbitrary graph sizes interactive. Local triangle enumeration can likewise become expensive
around high-degree hubs. luGraph operates on one browser WebGPU device and does not provide the
other unsupported features above.

## What does complete Graphalytics workload coverage mean?

The [Graph Data Council (GDC)](https://ldbcouncil.org/) is a nonprofit graph-data community that
defines reproducible graph benchmarks and contributes to graph standards. Before 2025 it was
called the **Linked Data Benchmark Council (LDBC)**; its established benchmark suite still retains
the LDBC name. Its [LDBC Graphalytics benchmark](https://ldbcouncil.org/benchmarks/graphalytics/)
compares graph-analysis platforms using clearly defined algorithms, reference datasets, expected
outputs, and published execution rules.

The council's [six official Graphalytics algorithm families](https://ldbcouncil.org/benchmarks/graphalytics/algorithms/)
cover **breadth-first search (BFS)**, **single-source shortest paths (SSSP)**,
**weakly connected components (WCC)**, **community detection by label propagation (CDLP)**,
**local clustering coefficient (LCC)**, and **PageRank (PR)**. luGraph supplies an actual
browser-GPU contributor for each. This is useful because the same resident adjacency can answer
reachability, least-cost routing, connectivity, community, neighborhood-density, and influence
questions without a CPU round trip between operations. Its core decomposition and modularity scoring
add useful graph analysis **beyond** those six standardized workload families; bounded modularity
optimization also belongs outside the standard. None is an additional Graphalytics workload.

To understand what a formal comparison additionally requires, consult the council's
[real and synthetic reference datasets](https://ldbcouncil.org/benchmarks/graphalytics/datasets/),
[open-source Graphalytics driver](https://github.com/ldbc/ldbc_graphalytics),
[benchmark specification and algorithm definitions](https://github.com/ldbc/ldbc_graphalytics_docs),
and [competition and validation rules](https://ldbcouncil.org/benchmarks/graphalytics/rules/).
The published datasets include small directed and undirected reference fixtures as well as much
larger real and synthetic graphs; vertex and edge data are also available in Parquet format.
Formal benchmark comparisons require the prescribed datasets and reference outputs, documented
algorithm and hardware configurations, repeated runs, and organizer review and reproducibility.
The rules permit single-node, GPU-based, and partial implementations, so browser WebGPU can
meaningfully join the same technical conversation without becoming an official result by default.

Workload-family coverage is not a claim of official Graphalytics certification, identical reference
configuration, distributed execution, comparable published scores, or performance parity with
another framework. Each operation retains its actual WebGPU contracts: routing accepts nonnegative
single-precision weights, label propagation is a bounded deterministic heuristic, clustering
counts distinct directed weak-neighborhood closures, and fixed iteration budgets do not
automatically prove convergence. The embedded local benchmark uses its own deterministic graph
families and CPU references; it is not the official driver, an audited submission, or a
published Graphalytics score. Use it to inspect real bounded CPU/GPU runs on your own device.

## Choose the right graph operation

| Operation | Question it answers | GPU result | Typical bounded work |
| --- | --- | --- | --- |
| `LuGraph` | Which GPU columns describe the graph? | Borrowed graph metadata and original chunks | Metadata only; no GPU dispatch |
| `LuGraphTopology` | Which vertices are adjacent? | Forward and optional reverse compressed adjacency | `O(V + E)` |
| `LuGraphDegree` | How many relationships touch each vertex in one direction? | One `uint32` degree per vertex | `O(V)` after adjacency exists |
| `LuGraphCoreNumber` | Which vertices remain inside increasingly cohesive network backbones? | One `uint32` core number per vertex and an optional maximum | At most `O(K × sum(degree² × log(degree + 1)))` for `K` bounded rounds |
| `LuGraphLocalClusteringCoefficient` | How closely are each vertex's neighbors connected to one another? | One `float32` coefficient and optional triangle count per vertex | At most `O(sum(degree³))` with unsorted adjacency |
| `LuGraphBreadthFirstSearch` | Which vertices are within a chosen number of unweighted hops? | Distances, deterministic predecessors, and an optional selection mask | At most `O(D × (V + E))` for `D` compiled hops |
| `LuGraphSingleSourceShortestPath` | Which routes have the lowest nonnegative total edge cost from a selected source? | One `float32` distance and deterministic predecessor per vertex | At most `O(K × (V + E))` for `K` bounded relaxations |
| `LuGraphConnectedComponents` | Which vertices belong to the same weakly connected group? | One `uint32` component identifier per vertex | At most `O(K × (V + E))` for `K` bounded iterations |
| `LuGraphLabelPropagation` | Which densely connected communities exist inside a connected network? | One deterministic `uint32` community label per vertex | At most `O(K × sum(degree²))` for `K` bounded iterations |
| `LuGraphModularityOptimization` | Which single-vertex community moves can improve a weighted partition? | Improved `uint32` labels, a real `float32` modularity score, and optional statuses | At most `O(K × (V + E + sum(degree²)))` for `K` bounded rounds |
| `LuGraphModularity` | Does an existing partition contain more internal relationship weight than chance predicts? | One `float32` partition-quality score and optional per-community contributions | `O(V + E)` |
| `LuGraphPageRank` | Which vertices receive influence from other important vertices? | One normalized `float32` score per vertex | `O(K × (V + E))` for `K` iterations |
| `LuGraphForceLayout` | How can related vertices be positioned as a readable network? | Directly renderable `float32x2` positions and persistent velocities | `O(V² + E)` per exact force iteration |
| `LuGraphSpatialForceLayout` | Can distant graph regions be approximated while nearby relationships remain exact? | The existing renderable layout positions plus explicit uniform-grid diagnostics | `Θ(V × G + P + E)` per spatial force iteration |

`V` is the graph's explicit vertex count, `E` is its source-edge count, `G` is the uniform-grid
cell count, `P` counts individual interactions in near or insufficiently distant cells, and
`sum(degree²)` and `sum(degree³)` add the squared and cubed weak-neighbor counts of every vertex.
Undirected adjacency contains both directions for ordinary edges; an undirected self-loop appears
once.

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
  edgeWeights,
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
    edgeWeights: outgoingEdgeWeights,
    count: outgoingCount,
    overflow: outgoingOverflow
  },
  reverse: {
    offsets: incomingOffsets,
    neighbors: incomingNeighbors,
    edgeIds: incomingEdgeIds,
    edgeWeights: incomingEdgeWeights,
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
bidirectional breadth-first search, weak-neighborhood community, core-number, or local-clustering
analysis, or PageRank. Directed weak components use forward adjacency alone, as do outgoing
weighted shortest paths. Modularity reads original edge columns directly and needs no adjacency.
Undirected graphs use one symmetric forward adjacency and must not provide reverse adjacency.

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

## Find durable network backbones with LuGraphCoreNumber

**Question: Which vertices stay connected to a mutually supportive group after peripheral
relationships disappear?**

`LuGraphCoreNumber` separates a genuinely cohesive network backbone from a vertex that merely has
many fragile spokes. A vertex belongs to the **k-core** when it remains in a largest subgraph where
every remaining vertex has at least `k` other remaining neighbors; its core number is the highest
such `k`. An isolated vertex has core number zero.

Consider a popular account with 100 followers who do not follow one another. Its degree is 100,
but the account and every follower have core number one: remove the leaves and no mutually
supporting dense group remains. A four-person clique instead has core number three for each
member. Use core decomposition to find resilient social backbones, tightly sustained fraud rings,
interdependent service groups, or the stable center of a citation network. Choose vertex degree
for immediate popularity, local clustering for connections among one vertex's neighbors, community
labels for a proposed group assignment, and core numbers for repeated structural support.

```ts
import {LuGraphCoreNumber} from '@luma.gl/experimental/lugraph';

const cores = new LuGraphCoreNumber({
  topology,
  output: coreNumbers,
  iterations: 32,
  converged: coresConverged,
  degeneracy: maximumCoreNumber
});

cores.addToGraph(workflow);
```

`output` is a caller-owned, packed `GPUVector<'uint32'>` with exactly one row per vertex. The
optional one-row `converged` output becomes one only when the final synchronized refinement proves
that no core estimate changed. The optional one-row `degeneracy` output receives the maximum
published core number, describing the deepest available graph core. When convergence is zero,
both the per-vertex values and the maximum are **upper bounds**, not proven exact answers.

The operation explicitly projects all relationships into a **simple undirected weak graph**. A
distinct incoming or outgoing neighbor counts once; reciprocal directed edges and parallel edges
do not increase support, self-loops do not make a vertex support itself, and edge weights do not
change structural core membership. This directed convention is not interchangeable with an
in-degree-plus-out-degree convention that counts reciprocal incidences separately. Directed
graphs require complete forward and reverse CSR; undirected graphs reuse symmetric forward CSR.

Each vertex starts at its distinct weak-neighbor degree. Every bounded round simultaneously
replaces that upper estimate with the H-index of its neighbors' preceding estimates: the largest
`k` for which at least `k` distinct neighbors still have estimates of at least `k`. The default is
`32` rounds; `iterations` may be any integer from `0` through `1024`. Zero rounds publish the
initial unique-neighbor degrees and conservatively leave convergence unproven unless the graph has
no edges. An empty graph has no core rows, convergence one, and optional degeneracy zero. There
is no automatic early termination, CPU synchronization, or implicit result readback.

If either required CSR neighbor allocation overflows, every core number and the optional
degeneracy become `0xffffffff`, and optional convergence becomes zero. For `K` configured rounds
and distinct weak degree `d`, unsorted CSR deduplication and H-index selection require worst-case
`O(K × sum(d² × log(d + 1)))` work. The implementation needs `O(V)` graph-owned scratch, plus an
optional bounded reduction workspace when reporting degeneracy; large hubs or insufficient round
budgets require explicit measurement rather than assumed convergence.

## Measure neighborhood density with LuGraphLocalClusteringCoefficient

**Question: Do this vertex's neighbors actually connect to one another, or do they only share the
same central contact?**

`LuGraphLocalClusteringCoefficient` distinguishes a tightly connected friend circle from a loose
hub. A person with ten friends does not necessarily belong to a close community: if those friends
also know one another, local clustering is high; if none of them connect, it is zero. Use the
coefficient to identify closed friendship circles, mutually connected transaction accounts,
strongly interlinked services, or citation neighborhoods with many shared relationships.

Choose degree when you only need the number of direct relationships, local clustering when the
relationships *among those neighbors* matter, and label propagation when you need one community
identifier describing a larger connected region. The coefficient describes each vertex's immediate
surroundings; it does not assign community membership or optimize a global clustering objective.

```ts
import {LuGraphLocalClusteringCoefficient} from '@luma.gl/experimental/lugraph';

const localClustering = new LuGraphLocalClusteringCoefficient({
  topology,
  output: clusteringCoefficients,
  triangles: incidentTriangleCounts
});

localClustering.addToGraph(workflow);
```

`output` is a caller-owned, packed `GPUVector<'float32'>` with exactly one row per vertex. The
optional `triangles` result is a separate, caller-owned, packed `GPUVector<'uint32'>` with one
row per vertex. Let `d` be the number of distinct incoming-or-outgoing neighbors. For a directed
graph, count every distinct **directed** edge between those neighbors as `C`; the coefficient is
`C / (d × (d - 1))`, and the optional `triangles` result contains that directed closure count `C`.
Reciprocal neighbor relationships count as two directed closures, while repeated copies of the
same directed edge count once. For an undirected graph, let `T` be the number of unique incident
triangles: its coefficient is `2 × T / (d × (d - 1))`, and the optional `triangles` result contains
`T`. A vertex with fewer than two distinct neighbors has coefficient and closure count zero.

The neighbor set is an undirected, or **weak**, neighborhood: either an incoming or outgoing edge
introduces the same neighbor. Its closure numerator still preserves direction for directed graphs;
the two directions of a reciprocal pair are not silently collapsed. Directed graphs therefore
require both forward and reverse CSR. Undirected graphs reuse their symmetric forward adjacency.
Self-loops never make a vertex its own neighbor, and duplicate edges never duplicate neighbors,
directed closures, or possible neighbor pairs. Edge weights do not change this structural
coefficient.

The contributor writes all results on the GPU without sorting adjacency, repacking edge columns,
allocating a graph-owned scratch buffer, submitting commands, or reading results back. If either
required adjacency overflows, or a closure count cannot fit in `uint32`, every affected
coefficient fails closed to zero; optional triangle counts become `0xffffffff`. Empty graphs have
no output rows. Because source adjacency is intentionally unsorted, exact neighbor deduplication
and membership scans can require `O(sum(degree³))` work across all vertices. Dense regions and
high-degree hubs can therefore be substantially more expensive than degree or traversal; this is
not a claim of constant-time triangle counting, weighted clustering, or global community
detection.

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

## Find least-cost routes with LuGraphSingleSourceShortestPath

**Question: Which route from my starting vertex costs the least when each connection has its own
travel time, distance, latency, or other nonnegative price?**

The route with the fewest steps is not necessarily the cheapest. Suppose a direct train takes
40 minutes, while two connecting trains take 10 minutes each: breadth-first search chooses the
one-hop direct train, but the least-cost route takes the two connections and arrives in 20 minutes.
`LuGraphSingleSourceShortestPath` computes that minimum accumulated nonnegative edge weight from one
selected starting vertex to every reachable destination without moving graph columns to the CPU.

Use it for travel-time maps, delivery networks, communication latency, transaction fees, or
service-dependency recovery costs. Choose breadth-first search when every edge has the same cost
and only the number of hops matters; choose weighted shortest paths when the actual sum of edge
weights can change which route wins. This operation computes routes from **one** selected source;
it does not implement all-pairs routing, negative-weight paths, or A* geographic search.

```ts
import {LuGraphSingleSourceShortestPath} from '@luma.gl/experimental/lugraph';

const shortestPaths = new LuGraphSingleSourceShortestPath({
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

## Improve weighted community partitions with LuGraphModularityOptimization

**Question: Which actual community reassignment improves a network's measurable partition quality,
rather than merely winning a neighborhood vote?**

`LuGraphModularityOptimization` improves an existing or automatically initialized community
partition by accepting the best strictly beneficial single-vertex move in each bounded round.
Use it when a social grouping should reflect actual interaction strength, a proposed fraud ring
should concentrate transaction weight, ownership boundaries should better match weighted service
dependencies, or a knowledge-graph partition needs an objective comparison before and after
refinement.

Three community questions are related but distinct. `LuGraphLabelPropagation` cheaply proposes
groups from unweighted neighborhood votes without optimizing their quality;
`LuGraphModularity` scores any caller-provided partition without changing it; and
`LuGraphModularityOptimization` actually changes group assignments when the same weighted
modularity objective improves. Start from separate communities when discovering structure, or
provide `initialCommunities` to refine labels supplied by a heuristic, application, or prior
analysis. The caller receives both the improved labels and the score of that exact final
partition.

```ts
import {LuGraphModularityOptimization} from '@luma.gl/experimental/lugraph';

const optimizedCommunities = new LuGraphModularityOptimization({
  topology,
  output: improvedCommunityIds,
  modularity: optimizedModularity,
  initialCommunities: proposedCommunityIds,
  resolution: 1,
  iterations: 32,
  minimumGain: 0,
  converged: optimizationConverged,
  valid: optimizationValid
});

optimizedCommunities.addToGraph(workflow);
```

`output` is a caller-owned, packed `GPUVector<'uint32'>` with exactly one community identifier per
vertex. The optional `initialCommunities` is a separate caller-owned, packed `uint32` vector with
the same number of rows; without it, every vertex initially belongs to its own stable-identifier
community. `modularity` is a separate caller-owned one-row `GPUVector<'float32'>` containing the
real final weighted partition score. The optional `converged` and `valid` results are physically
distinct caller-owned one-row `GPUVector<'uint32'>` status vectors.

The objective is the same Newman modularity used by `LuGraphModularity`. Directed graphs use
`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`; undirected graphs use
`Q = Σc [Lc / W - γ × (Kc / (2W))²]`. For every eligible vertex and neighboring candidate
community, the contributor evaluates
`ΔQ = Q(partition after moving the vertex) - Q(current partition)`. It accepts exactly **one**
globally best move per round, and only when `ΔQ` is strictly positive and strictly greater than
`minimumGain`. Tied gains choose the lowest stable vertex identifier, followed by the lowest
candidate community identifier. Evaluating an immutable prior partition and applying only one move
avoids simultaneous conflicting moves and never intentionally accepts a modularity regression.

`iterations` defaults to `32` and may be any integer from `0` through `1024`.
`minimumGain` defaults to zero and must be a finite, nonnegative value representable as `float32`.
`resolution` defaults to one and follows the same finite, nonnegative `float32` contract as the
standalone modularity scorer. Zero rounds preserve the caller's initial partition or the identity
assignment, publish its real modularity, and report convergence zero for a valid nonempty graph.
If a completed round finds no admissible positive-gain move, `converged` becomes one. If the
iteration budget ends immediately after an improving move, convergence remains zero: a bounded
improvement is not evidence that a local optimum has been reached.
A local fixed point is not necessarily the globally best partition.

Directed graphs require both forward and reverse CSR; undirected graphs reuse symmetric forward
CSR. Original nonnegative `float32` edge weights are preserved, and missing weights mean one.
Parallel source edges, reciprocal directed edges, and self-loops retain exactly the same weighted
multiplicity and degree-volume conventions as `LuGraphModularity`. Out-of-domain source endpoints
are ignored together with their weights; an invalid warm-start label, negative or nonfinite
accepted edge weight, zero valid total edge weight, floating-point accumulation overflow, or
overflow in required adjacency fails closed. Every output label then becomes `0xffffffff`, the
modularity score becomes zero, and optional validity and convergence become zero. An empty graph
has no label rows, score zero, validity zero, and convergence one if adjacency did not overflow.

The contributor encodes all bounded candidate evaluation, deterministic winner selection, label
updates, and final `LuGraphModularity` scoring into the caller-owned GPU command graph. It does
not submit work, read results back, or synchronize with the CPU. Worst-case work for `K` rounds is
`O(K × (V + E + sum(degree²)))`, with separate `O(V + E)` initialization and final scoring and
`O(V + E)` graph-owned packed scratch; high-degree hubs and large round budgets require explicit
measurement. This is **single-level Louvain-style local moving**, not the complete multilevel
Louvain algorithm, Leiden refinement, community coarsening, hierarchical aggregation, a global
optimality guarantee, or a seventh Graphalytics workload.

## Evaluate community quality with LuGraphModularity

**Question: Does an existing community grouping keep more relationship weight inside its groups
than a degree-matched random network would predict?**

`LuGraphModularity` scores a partition that the application already owns; it does not create or
improve that partition. Use it to compare rival social-network groupings, check whether a detected
fraud ring concentrates transaction weight, evaluate whether service ownership labels follow real
dependency structure, or monitor whether an evolving document grouping is more meaningful than
chance. Feed it labels from `LuGraphLabelPropagation`, `LuGraphModularityOptimization`, an
external clustering method, or any other caller-owned assignment.

A high positive score means the specified partition keeps more relationship weight within its
groups than the corresponding degree-preserving random baseline predicts; a score near zero
suggests little advantage over that baseline. A negative score means the partition keeps less
internal weight than expected. Scores depend on the graph and resolution parameter: they are not
universal quality percentages or proof that one partition is objectively correct.

```ts
import {LuGraphModularity} from '@luma.gl/experimental/lugraph';

const partitionQuality = new LuGraphModularity({
  graph,
  communities: communityIds,
  output: modularityScore,
  resolution: 1,
  communityContributions,
  valid: modularityValid
});

partitionQuality.addToGraph(workflow);
```

`communities` is a caller-owned, packed `GPUVector<'uint32'>` containing exactly one stable
community identifier per vertex. Every label must be in the range from zero through
`vertexCount - 1`. `output` is a separate caller-owned, packed one-row `GPUVector<'float32'>`.
The optional `communityContributions` result has one `float32` row per possible community label;
unused identifiers receive zero. The optional one-row `GPUVector<'uint32'>` `valid` distinguishes
a successfully evaluated partition from a zeroed failure result. Outputs may not physically alias
the graph's original buffers, community labels, or one another.

Let `W` be the total weight of all valid-endpoint original source edges and let `Lc` be the
internal original edge weight for community `c`. A missing weight column gives every edge weight
one. Directed graphs use the weighted directed modularity formula
`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`, where `Kout,c` and `Kin,c` are that community's
outgoing and incoming weighted volumes. Undirected graphs use
`Q = Σc [Lc / W - γ × (Kc / (2W))²]`, where `Kc` is the community's weighted degree volume. An
undirected self-loop contributes once to `W` and `Lc` but twice to `Kc`. Parallel source edges
and reciprocal directed source edges retain their original multiplicity; modularity deliberately
does not apply the simple-graph deduplication used by core numbers.

`resolution`, written `γ` above, defaults to one and must be a finite, nonnegative value that
remains finite as `float32`; it adjusts the degree-matched expectation without changing the input
partition. An invalid community identifier, a negative or nonfinite weight on an edge with valid
endpoints, an empty graph, total valid edge weight of zero, or floating-point accumulation
overflow publishes score zero, zero per-community contributions, and optional `valid` zero.
Edges with invalid endpoints are excluded entirely, including their weights. Existing source edge
batches remain separate, ordered, and borrowed; the operation reads them directly without
constructing or requiring forward or reverse CSR.

Weighted contributions, community volumes, and the final score use ordinary GPU `float32`
arithmetic; concurrent atomic accumulation can make the final low-order rounding vary across
execution orders or devices. Work is bounded by `O(V + E)`, with `O(V)` graph-owned community
volume scratch and bounded reduction storage. This contributor measures a supplied partition; it
is **not** Louvain, Leiden, automatic community optimization, hierarchical coarsening, or a
guarantee that label propagation converged.

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
fixed budget reached the stationary distribution. Reductions use subgroup additions when the
max-feature device exposes both required WebGPU capabilities, with a portable workgroup fallback.
Both paths use ordinary `float32` arithmetic, not floating-point atomics or native GPU `float64`.

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
  LuGraphCoreNumber,
  LuGraphDegree,
  LuGraphForceLayout,
  LuGraphLabelPropagation,
  LuGraphLocalClusteringCoefficient,
  LuGraphModularity,
  LuGraphModularityOptimization,
  LuGraphPageRank,
  LuGraphSingleSourceShortestPath,
  LuGraphSpatialForceLayout,
  LuGraphTopology
} from '@luma.gl/experimental/lugraph';

const graph = new LuGraph({
  vertexCount,
  sourceVertices,
  targetVertices,
  edgeWeights,
  directed: true
});

const topology = new LuGraphTopology({
  graph,
  forward: {
    offsets: outgoingOffsets,
    neighbors: outgoingNeighbors,
    edgeIds: outgoingEdgeIds,
    edgeWeights: outgoingEdgeWeights,
    count: outgoingCount,
    overflow: outgoingOverflow
  },
  reverse: {
    offsets: incomingOffsets,
    neighbors: incomingNeighbors,
    edgeIds: incomingEdgeIds,
    edgeWeights: incomingEdgeWeights,
    count: incomingCount,
    overflow: incomingOverflow
  },
  invalidEdgeCount
});

const workflow = new GPUCommandGraph(device);

topology.addToGraph(workflow);
new LuGraphDegree({topology, output: outgoingDegrees}).addToGraph(workflow);
new LuGraphCoreNumber({
  topology,
  output: coreNumbers,
  iterations: 32,
  converged: coresConverged,
  degeneracy: maximumCoreNumber
}).addToGraph(workflow);
new LuGraphLocalClusteringCoefficient({
  topology,
  output: clusteringCoefficients,
  triangles: incidentTriangleCounts
}).addToGraph(workflow);
new LuGraphBreadthFirstSearch({
  topology,
  seeds: selectedVertexIds,
  distances: hopDistances,
  predecessors: pathParents,
  mask: neighborhoodMask,
  direction: 'both',
  maxDepth: 6
}).addToGraph(workflow);
new LuGraphSingleSourceShortestPath({
  topology,
  sourceVertex: selectedVertex,
  distances: routeCosts,
  predecessors: routeParents,
  maxIterations: 64,
  converged: shortestPathsConverged,
  invalidWeightCount
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
new LuGraphModularityOptimization({
  topology,
  output: improvedCommunityIds,
  modularity: optimizedModularity,
  initialCommunities: communityIds,
  resolution: 1,
  iterations: 32,
  minimumGain: 0,
  converged: optimizationConverged,
  valid: optimizationValid
}).addToGraph(workflow);
new LuGraphModularity({
  graph,
  communities: improvedCommunityIds,
  output: modularityScore,
  resolution: 1,
  communityContributions,
  valid: modularityValid
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
  unreachable distances, weighted routing publishes `+Infinity` and `0xffffffff` predecessors,
  weak components, community detection, modularity optimization, and core numbers publish
  `0xffffffff`, local clustering publishes zero coefficients and optional `0xffffffff` triangle
  statuses, and PageRank publishes zero scores when a required neighbor list overflowed. Force
  layout preserves its existing positions and clears velocities on required adjacency overflow.
- Invalid negative or nonfinite edge weights also fail weighted routing closed; optional
  `invalidWeightCount` reports invalid original source edges without double-counting reverse CSR.
- Partition modularity reads original source edges independently of adjacency overflow; invalid
  labels, invalid accepted edge weights, or zero total weight publish zero score and validity.
- Modularity optimization additionally requires complete selected adjacency; invalid initial
  labels, accepted weights, or selected neighbor overflow publish invalid-label sentinels and
  clear its score, validity, and convergence.
- Spatial layout also preserves positions and clears velocities when its accepted count excludes
  any out-of-domain vertex or its explicit vertex-ID capacity overflows.
- Degree remains exact under neighbor overflow because its input is the complete CSR offset range.
- Renderable layout positions require both `Buffer.STORAGE` and `Buffer.VERTEX` usage on their
  original caller-owned allocation; position readback or repacking is never implicit.
- Fixed weighted-routing, component, community, modularity-optimization, core-number, and PageRank
  iteration budgets do not imply convergence. Their optional status, degeneracy, and final-change
  outputs remain GPU-resident until an application explicitly requests readback.
- Work uses bounded WebGPU dispatch and portable storage bindings on one device. Original chunk
  preservation does not imply distributed or multi-GPU execution.
- The optional graph subpath does not supply automatic Arrow import, rendering, graph persistence,
  negative-weight or all-pairs shortest paths, or a CPU execution fallback.

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
