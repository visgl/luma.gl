# GPU Graph operations reference

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-graph.md)[Operations](https://luma.gl/docs/api-reference/experimental/gpu-graph-operations.md)[Topology](https://luma.gl/docs/api-reference/experimental/gpu-graph-topology.md)[Traversal](https://luma.gl/docs/api-reference/experimental/gpu-graph-traversal.md)[Connectivity](https://luma.gl/docs/api-reference/experimental/gpu-graph-connectivity.md)[Metrics](https://luma.gl/docs/api-reference/experimental/gpu-graph-metrics.md)[Layouts](https://luma.gl/docs/api-reference/experimental/gpu-graph-layouts.md)

## Overview[​](#overview "Direct link to Overview")

A graph answers questions that individual table rows cannot: which accounts share a transaction, which services depend on a failed service, which people are two introductions apart, which tightly connected groups exist inside a wider network, which route has the lowest actual travel cost, how closely somebody's friends know one another, which network members form a durable structural backbone, whether a proposed community grouping is actually meaningful, how to improve that grouping, and which pages matter because other important pages link to them. Vertices represent those entities; edges represent their relationships.

`@luma.gl/gpgpu/gpu-graph` answers these questions directly on a browser WebGPU device. It describes caller-owned GPU edge columns, builds reusable compressed adjacency, and publishes vertex degrees, unweighted shortest-path neighborhoods, weighted least-cost routes, weakly connected groups, densely connected communities, per-vertex local clustering, structural core numbers, community modularity scores, explicitly improved community assignments, PageRank importance, and progressive two-dimensional graph layouts into caller-owned GPU buffers. Layout can evaluate every repulsive interaction exactly or explicitly approximate distant groups through a caller-owned uniform grid. Every operation composes with the existing `GPUCommandGraph`.

This is an experimental, headless graph analytics API, not a graph database, visualization framework, file importer, or general-purpose dataframe. Applications decide how data reaches the GPU, which results they render, when commands are submitted, and whether anything is read back.

## Explore a live GPU graph[​](#explore-a-live-gpu-graph "Direct link to Explore a live GPU graph")

**What do graph relationships, vertex influence, connected groups, and neighborhood searches look like when they feed a real interactive application?**

The [interactive GPU Graph explorer](https://luma.gl/examples/experimental/gpu-graph-explorer) answers that question with a deterministic, genuinely resizable network. It opens with **1,024 vertices**, then lets you choose any of fourteen actual graph populations from **128 to 1,048,576 vertices**. The largest setting contains **1,048,576 real GPU-resident vertices and 2,097,343 original directed edges**; these are complete source relationships, not a small graph duplicated or multiplied for display. Four intentionally generated source groups contain important hubs, a bridge between the first two groups, and one isolated vertex, making both small and large versions interpretable.

### GPU Graph Interactive Graph Explorer

GPU-native topology, analytics, selection, and progressive force layout

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-graph-explorer)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

The graph inspector opens automatically and lets you compare five real GPU-backed color modes:

* **Label-propagation communities** distinguish tightly connected local groups using deterministic, bounded majority votes. A narrow bridge can preserve two different communities even when both groups belong to the same connected component; a fixed iteration budget does not prove convergence.
* **Weak components** identify entities that can reach each other when edge direction is ignored. The two source groups joined by a bridge have the same color; disconnected groups and the isolated vertex remain separate. This mode describes connectivity, not the separate community-detection labels.
* **Vertex degree** exposes direct relationship counts and identifies immediately connected hubs.
* **PageRank importance** identifies influence received from other important vertices, which can differ substantially from raw relationship count.
* **Neighborhood distance** shows how many bounded, unweighted hops separate each reachable vertex from the current selection.

Node size can independently reflect normalized PageRank, vertex degree, or a uniform radius. Use the graph-size slider to rebuild actual resident graph data, and select automatic, exact, flat-grid spatial, or sampled layout. Click a node to inspect its stable source identifier and highlighted neighborhood; adjust neighborhood depth to follow more unweighted hops. Toggle visible edges, pause or resume the selected layout, drag a node to pin it, release pins, or reset deterministic initial positions. Hold Shift while dragging to pan and scroll to zoom.

The example builds forward and reverse compressed adjacency, vertex degree, weak components, label-propagation communities, and normalized PageRank on the GPU. Breadth-first selection updates when its root or depth changes; progressive layout advances the existing caller-owned position buffer, which is simultaneously writable storage and a render vertex attribute. Node and picking shaders consume the actual community, component, PageRank, and degree buffers. Original source edge batches, including the intentionally empty middle batch, are never concatenated or repacked. Weighted shortest paths and local clustering are separate reusable graph operations and benchmark workloads. Core decomposition, modularity scoring, and modularity optimization are additional reusable operations beyond the benchmark; the existing example does not claim to expose any of them as explorer controls.

Automatic layout selects distinct, honestly bounded GPU workloads:

* **Exact layout through 512 vertices:** every pairwise repulsive interaction is evaluated, costing `O(V² + E)` per iteration.
* **Flat-grid spatial layout from 1,024 to 8,192 vertices:** nearby interactions remain exact while sufficiently distant cells use the optional uniform-grid approximation and its explicit, caller-owned GPU index.
* **Sampled layout from 16,384 vertices:** every actual vertex evaluates all incident edges plus four deterministically selected repulsion samples, costing `O(E + 4V)` per iteration. It is a separate, explicitly approximate application helper, not exact all-pairs layout, flat-grid layout, Barnes–Hut, or ForceAtlas2.

At **65,536 vertices** and above, every original vertex remains visible as one real GPU point. Only rendered edge detail is limited to **65,536 edges**; all **2,097,343 original edges** at the largest setting remain resident in their source batches and adjacency. The inspector distinguishes the complete graph population from displayed edge detail, reports the actual adapter, frame rate, measured CPU command-encoding time, and GPU resource ownership, and does not invent GPU execution times or convergence. CPU encoding is never mislabeled as a GPU measurement.

Adjacency construction, degree, and one breadth-first traversal use `O(V + E)` work; bounded PageRank and weak components use `O(K × (V + E))`, while label propagation uses `O(K × sum(degree²))`. The quadratic workload avoided at scale is exact all-pairs force layout, not an unavoidable property of graph analytics. Large-graph iteration budgets are deliberately bounded and do not certify convergence or clustering quality.

Use this demonstration to understand how GPU-resident graph outputs can directly support a social network, dependency map, fraud investigation, or other relationship visualization while making real rendering and approximation tradeoffs explicit. Analytics, simulation, and ordinary rendering never read graph columns back to JavaScript; explicitly requested integer picking reads only one compact **8-byte** selected-vertex result.

### Use GPU Graph from deck.gl without copying graph buffers[​](#use-gpu-graph-from-deckgl-without-copying-graph-buffers "Direct link to Use GPU Graph from deck.gl without copying graph buffers")

**Question: How can an existing deck.gl application explore a graph without converting GPU relationships, analytics, or moving node positions into JavaScript objects?**

The optional [GPU Graph + deck.gl network explorer](https://luma.gl/examples/deck/gpu-graph-explorer) answers that question with the reusable `GPUGraphDeckEffect`, `GPUGraphNodeLayer`, and `GPUGraphEdgeLayer` implementations from the existing private `@deck.gl-community/arrow-layers` adapter package, an `OrthographicView`, and deck.gl's existing interaction and asynchronous WebGPU picking systems. Use it when a social-network, service-dependency, fraud-investigation, or citation visualization already uses deck.gl and needs GPU graph results to become directly drawable attributes.

The effect first encodes forward and reverse adjacency, vertex degree, normalized PageRank, weak components, and deterministic label-propagation communities. Later frames encode actual exact, flat-grid spatial, or sampled force layout into deck.gl's own command encoder; bounded neighborhood selection reruns only when interaction changes it. deck.gl remains responsible for queue submission. The writable layout allocation is also the node layer's `float32x2` instance vertex attribute. PageRank scores, degree counts, component and community labels, hop distances, and the selection mask remain GPU storage inputs; each nonempty original edge partition gets its own edge layer, without concatenation, buffer copies, or per-frame graph readback.

The deterministic example fixture is uploaded once for each selected graph size. Resizing replaces its resident allocations and rebinds stable node and edge layers to their new buffers. Selecting, pinning, dragging, and changing neighborhood depth write only the necessary interaction controls or coordinates; they do not download graph columns. Every actual vertex remains rendered, including all **1,048,576 vertices** in point mode; only displayed original edges are capped. An explicitly requested native deck.gl pick returns the selected original vertex identifier to JavaScript. Its implementation and transfer size belong to deck.gl; it is separate from the native explorer's custom **8-byte** integer-picking path above.

The reusable graph effect, node and edge layers, and graph integration's deck.gl imports live in the existing private `@deck.gl-community/arrow-layers` adapter. The website-only example consumes those exported symbols without importing `@deck.gl/core` or adding an example package; neither `@luma.gl/experimental` nor its optional graph entry point depends on or imports deck.gl. The example supplies its sampled-layout helper to the private effect as an injected callback, so the package never imports example code or claims that the helper is a new production graph operation.

## Measure real CPU and WebGPU graph workloads[​](#measure-real-cpu-and-webgpu-graph-workloads "Direct link to Measure real CPU and WebGPU graph workloads")

**Question: Does this graph workflow benefit from GPU execution on my actual browser, and what do setup, command submission, and approximate layout really cost?**

A network diagram can demonstrate an algorithm without explaining its cost. This opt-in benchmark runs independent CPU implementations and the actual WebGPU graph operations against identical, deterministic source edges, stable vertex identifiers, and initial coordinates. Use it to compare different graph structures, understand why a small CPU-resident task may be faster on the CPU, and decide whether reusing GPU-resident adjacency or approximating distant layout forces suits a real application.

This local demonstration includes the six graph-analysis workloads standardized by the<!-- --> [Graph Data Council](https://ldbcouncil.org/) <!-- -->in its<!-- --> [Graphalytics benchmark](https://ldbcouncil.org/benchmarks/graphalytics/). Its small synthetic datasets and local CPU checks are not an official benchmark submission, certification, or cross-platform performance claim.

Graph datasetScale-free (scale-free)Vertices128

### Live CPU versus WebGPU graph analytics

Run the same weighted graph through real CPU and GPU adjacency, neighborhood search, shortest paths, weak components, communities, local clustering, PageRank, and two force layouts.

Run graph benchmark on this device

Select a graph family and 32, 64, 128, or 256 vertices, then explicitly start the benchmark. No benchmark GPU work runs during page rendering or hydration. A WebGPU-capable browser, supported adapter, and secure origin are required; unavailable hardware never produces simulated measurements.

### Choose a graph that resembles your application[​](#choose-a-graph-that-resembles-your-application "Direct link to Choose a graph that resembles your application")

* **Sparse:** a mostly connected ring with occasional shortcuts, similar to infrastructure routes or simple dependency chains.
* **Dense:** every distinct pair has a directed edge, producing `V × (V - 1)` edges and exposing workloads dominated by adjacency and relationship count.
* **Scale-free:** preferential attachment creates a few influential hubs, resembling citation, social, and package-dependency networks.
* **Disconnected:** multiple independent groups plus an isolated vertex exercise unreachable searches and weak-component labeling.
* **High-degree hub:** one central vertex connects to many neighbors, testing uneven relationship distributions such as a heavily depended-on service.

The original source, target, and deterministic nonnegative edge-weight columns retain three aligned ordered batches, including an intentionally empty middle batch. Each family runs nine genuine GPU algorithms and independent CPU references: compressed adjacency, breadth-first neighborhood search, weighted single-source shortest paths, weak components, label-propagation communities, local clustering coefficients, PageRank, exact force layout, and explicitly approximate uniform-grid force layout. The six Graphalytics workload families are represented, alongside adjacency construction and two visualization-oriented layouts. These bounded demonstrations are not million-vertex benchmarks; dense graphs, local triangle counting, and exact force layout can require much more work than sparse traversal. Structural core decomposition, partition modularity, and modularity optimization extend the reusable graph API beyond these six standardized families and nine measured paths; they are not silently counted as additional benchmark results.

### Read each timing without hiding its costs[​](#read-each-timing-without-hiding-its-costs "Direct link to Read each timing without hiding its costs")

The **CPU median** measures the independent CPU algorithm. **CPU encode** measures the separate CPU work of recording the GPU command graph. **Fenced GPU median** begins at command submission and stops only after an explicit completion fence confirms that the real GPU workload completed; it does not include the separately reported CPU encoding. The displayed GPU-versus-CPU ratio compares only those two algorithm medians and therefore excludes encoding, initial upload, graph compilation, and correctness readback. Include those phases when judging one-off or end-to-end workflows.

The panel performs one warmup and three measured iterations. Its median is an observed sample, not a statistically robust cross-device result; the programmatic API additionally reports observed minimum, median, 95th-percentile, and maximum values. Hardware GPU timestamps appear only when the active adapter genuinely exposes timestamp queries. Queue synchronization, browser overhead, and hardware execution describe different costs, so a timestamp is not a substitute for fenced end-to-end submission time.

Source upload, initial command-graph compilation, explicit correctness readback, and an independently fenced spatial-grid rebuild are reported as separate phases. The accelerated layout measurement still includes the grid rebuild required by each actual iteration; the standalone grid result merely makes that cost visible. Working-memory columns distinguish imported buffers from transient graph storage, while caller-owned spatial-index bytes are reported independently.

Every GPU result must match its independently computed CPU reference before timings are published. Weighted shortest paths are checked against an independent CPU least-cost calculation, local clustering against independently counted neighbor triangles, and community labels against the same bounded deterministic voting rules. The spatial path is checked against a CPU implementation of the same approximation; its coordinate error is measured against the exact force reference. Weak components report their actual GPU convergence flag, and PageRank reports its final GPU L1 residual. A fixed iteration budget does not imply convergence or early termination. Results apply only to this graph, browser, and adapter; they never promise a speedup, generalize across devices, establish official benchmark certification, or describe the approximation as Barnes–Hut or ForceAtlas2.

### Run the same benchmark programmatically[​](#run-the-same-benchmark-programmatically "Direct link to Run the same benchmark programmatically")

Benchmark helpers live behind an optional nested entry point so ordinary graph applications do not import benchmark-only datasets, CPU references, or measurement code:

```
import {

  makeGPUGraphBenchmarkDataset,

  runGPUGraphBenchmark

} from '@luma.gl/gpgpu/gpu-graph/benchmarks';



const dataset = makeGPUGraphBenchmarkDataset({kind: 'scale-free', vertexCount: 128, seed: 42});

const report = await runGPUGraphBenchmark(device, {

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

The dataset helper returns fresh, caller-owned CPU arrays; the benchmark independently generates its identical seeded input, explicitly uploads and validates real GPU results, and releases its own temporary allocations after reporting. Neither helper changes production graph ownership or adds an automatic CPU execution fallback to the graph API.

## Why keep a graph on the GPU?[​](#why-keep-a-graph-on-the-gpu "Direct link to Why keep a graph on the GPU?")

A CPU application can certainly traverse a graph. The problem appears when its relationship data already lives on the GPU: copying every edge to JavaScript, rebuilding an object graph, running an analysis, and uploading the answer again interrupts both compute and rendering.

GPU Graph keeps the complete intermediate pipeline on one WebGPU device:

```
Existing GPU edge columns

    -> compressed adjacency

    -> degree / core numbers / weighted paths / local clustering / communities / PageRank

    -> partition modularity / improved communities / renderable force-layout positions

    -> caller-owned GPU result columns and directly renderable positions
```

The original source and target chunks keep their identities, including empty batches. Adjacency and analytic outputs remain normal GPU vectors that later compute or application rendering can consume. Changing a GPU-resident search control and re-encoding an existing compiled graph does not require materializing a new JavaScript edge list.

GPU execution is not automatically faster for every graph. A small, CPU-resident, one-off analysis may be simpler on the CPU because GPU upload, pipeline compilation, command submission, and explicit readback have real costs. GPU Graph is most useful when graph data or downstream consumers are already GPU-resident and several operations reuse the same topology.

## When should I use GPU Graph?[​](#when-should-i-use-gpu-graph "Direct link to When should I use GPU Graph?")

Use GPU Graph for browser applications that already own typed GPU relationship columns and need to combine graph analytics with further GPU work:

* **Social and communication networks:** count contacts, highlight friends within a bounded number of introductions, distinguish friend circles within connected networks, measure whether each person's friends also know one another, identify mutually supported network cores, compare and explicitly improve proposed community partitions, group disconnected networks, rank influential accounts, and arrange connected people into a readable map.
* **Software and service dependencies:** follow incoming or outgoing dependency chains, find isolated dependency islands, reveal tightly linked ownership groups, identify unusually closed service clusters, and compare dependency paths by latency, risk, or recovery cost.
* **Transaction and fraud investigations:** follow transfers around a selected account, identify coordinated clusters inside a larger connected group of counterparties, distinguish locally interlinked transaction rings from simple hubs, expose resilient fraud-ring backbones, compare whether suggested groups retain more transaction weight than expected, and prioritize structurally important entities.
* **Transport and infrastructure maps:** inspect junction degree, compare routes by nonnegative travel time or distance, distinguish cheapest routes from fewest transfers, and find disconnected subnetworks and relationship-driven importance across a network.
* **Knowledge and citation graphs:** follow citation links, identify connected collections, and rank documents by incoming influence rather than raw citation count alone.

Choose another tool when the application needs negative-weight routing, all-pairs shortest paths, a graph query language, automatic CPU fallback, distributed execution, or compatibility with a CUDA or Python graph API. Exact force-directed layout also becomes expensive on very large graphs because it evaluates every pair of vertices. An optional spatial layout can exchange some far-field accuracy for fewer force calculations, but it does not guarantee subquadratic complexity or make arbitrary graph sizes interactive. Local triangle enumeration can likewise become expensive around high-degree hubs. GPU Graph operates on one browser WebGPU device and does not provide the other unsupported features above.

## What does complete Graphalytics workload coverage mean?[​](#what-does-complete-graphalytics-workload-coverage-mean "Direct link to What does complete Graphalytics workload coverage mean?")

The [Graph Data Council (GDC)](https://ldbcouncil.org/) is a nonprofit graph-data community that defines reproducible graph benchmarks and contributes to graph standards. Before 2025 it was called the **Linked Data Benchmark Council (LDBC)**; its established benchmark suite still retains the LDBC name. Its [LDBC Graphalytics benchmark](https://ldbcouncil.org/benchmarks/graphalytics/) compares graph-analysis platforms using clearly defined algorithms, reference datasets, expected outputs, and published execution rules.

The council's [six official Graphalytics algorithm families](https://ldbcouncil.org/benchmarks/graphalytics/algorithms/) cover **breadth-first search (BFS)**, **single-source shortest paths (SSSP)**, **weakly connected components (WCC)**, **community detection by label propagation (CDLP)**, **local clustering coefficient (LCC)**, and **PageRank (PR)**. GPU Graph supplies an actual browser-GPU contributor for each. This is useful because the same resident adjacency can answer reachability, least-cost routing, connectivity, community, neighborhood-density, and influence questions without a CPU round trip between operations. Its core decomposition and modularity scoring add useful graph analysis **beyond** those six standardized workload families; bounded modularity optimization also belongs outside the standard. None is an additional Graphalytics workload.

To understand what a formal comparison additionally requires, consult the council's [real and synthetic reference datasets](https://ldbcouncil.org/benchmarks/graphalytics/datasets/), [open-source Graphalytics driver](https://github.com/ldbc/ldbc_graphalytics), [benchmark specification and algorithm definitions](https://github.com/ldbc/ldbc_graphalytics_docs), and [competition and validation rules](https://ldbcouncil.org/benchmarks/graphalytics/rules/). The published datasets include small directed and undirected reference fixtures as well as much larger real and synthetic graphs; vertex and edge data are also available in Parquet format. Formal benchmark comparisons require the prescribed datasets and reference outputs, documented algorithm and hardware configurations, repeated runs, and organizer review and reproducibility. The rules permit single-node, GPU-based, and partial implementations, so browser WebGPU can meaningfully join the same technical conversation without becoming an official result by default.

Workload-family coverage is not a claim of official Graphalytics certification, identical reference configuration, distributed execution, comparable published scores, or performance parity with another framework. Each operation retains its actual WebGPU contracts: routing accepts nonnegative single-precision weights, label propagation is a bounded deterministic heuristic, clustering counts distinct directed weak-neighborhood closures, and fixed iteration budgets do not automatically prove convergence. The embedded local benchmark uses its own deterministic graph families and CPU references; it is not the official driver, an audited submission, or a published Graphalytics score. Use it to inspect real bounded CPU/GPU runs on your own device.

## Choose the right graph operation[​](#choose-the-right-graph-operation "Direct link to Choose the right graph operation")

| Operation                            | Question it answers                                                                        | GPU result                                                                         | Typical bounded work                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GPUGraph`                           | Which GPU columns describe the graph?                                                      | Borrowed graph metadata and original chunks                                        | Metadata only; no GPU dispatch                                         |
| `GPUGraphTopology`                   | Which vertices are adjacent?                                                               | Forward and optional reverse compressed adjacency                                  | `O(V + E)`                                                             |
| `GPUGraphDegree`                     | How many relationships touch each vertex in one direction?                                 | One `uint32` degree per vertex                                                     | `O(V)` after adjacency exists                                          |
| `GPUGraphCoreNumber`                 | Which vertices remain inside increasingly cohesive network backbones?                      | One `uint32` core number per vertex and an optional maximum                        | At most `O(K × sum(degree² × log(degree + 1)))` for `K` bounded rounds |
| `GPUGraphLocalClusteringCoefficient` | How closely are each vertex's neighbors connected to one another?                          | One `float32` coefficient and optional triangle count per vertex                   | At most `O(sum(degree³))` with unsorted adjacency                      |
| `GPUGraphBreadthFirstSearch`         | Which vertices are within a chosen number of unweighted hops?                              | Distances, deterministic predecessors, and an optional selection mask              | At most `O(D × (V + E))` for `D` compiled hops                         |
| `GPUGraphSingleSourceShortestPath`   | Which routes have the lowest nonnegative total edge cost from a selected source?           | One `float32` distance and deterministic predecessor per vertex                    | At most `O(K × (V + E))` for `K` bounded relaxations                   |
| `GPUGraphConnectedComponents`        | Which vertices belong to the same weakly connected group?                                  | One `uint32` component identifier per vertex                                       | At most `O(K × (V + E))` for `K` bounded iterations                    |
| `GPUGraphLabelPropagation`           | Which densely connected communities exist inside a connected network?                      | One deterministic `uint32` community label per vertex                              | At most `O(K × sum(degree²))` for `K` bounded iterations               |
| `GPUGraphModularityOptimization`     | Which single-vertex community moves can improve a weighted partition?                      | Improved `uint32` labels, a real `float32` modularity score, and optional statuses | At most `O(K × (V + E + sum(degree²)))` for `K` bounded rounds         |
| `GPUGraphModularity`                 | Does an existing partition contain more internal relationship weight than chance predicts? | One `float32` partition-quality score and optional per-community contributions     | `O(V + E)`                                                             |
| `GPUGraphPageRank`                   | Which vertices receive influence from other important vertices?                            | One normalized `float32` score per vertex                                          | `O(K × (V + E))` for `K` iterations                                    |
| `GPUGraphForceLayout`                | How can related vertices be positioned as a readable network?                              | Directly renderable `float32x2` positions and persistent velocities                | `O(V² + E)` per exact force iteration                                  |
| `GPUGraphSpatialForceLayout`         | Can distant graph regions be approximated while nearby relationships remain exact?         | The existing renderable layout positions plus explicit uniform-grid diagnostics    | `Θ(V × G + P + E)` per spatial force iteration                         |

`V` is the graph's explicit vertex count, `E` is its source-edge count, `G` is the uniform-grid cell count, `P` counts individual interactions in near or insufficiently distant cells, and `sum(degree²)` and `sum(degree³)` add the squared and cubed weak-neighbor counts of every vertex. Undirected adjacency contains both directions for ordinary edges; an undirected self-loop appears once.

## Operation families[​](#operation-families "Direct link to Operation families")

| Family                                                                                                    | Use it for                                                  |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Topology](https://luma.gl/docs/api-reference/experimental/gpu-graph-topology.md)                         | Edge views, compressed adjacency, and degree counts.        |
| [Traversal and pathfinding](https://luma.gl/docs/api-reference/experimental/gpu-graph-traversal.md)       | Unweighted neighborhoods and weighted routes.               |
| [Connectivity and communities](https://luma.gl/docs/api-reference/experimental/gpu-graph-connectivity.md) | Components, community discovery, optimization, and quality. |
| [Metrics and ranking](https://luma.gl/docs/api-reference/experimental/gpu-graph-metrics.md)               | Core numbers, clustering, and PageRank.                     |
| [Layouts](https://luma.gl/docs/api-reference/experimental/gpu-graph-layouts.md)                           | Exact and accelerated progressive spatial layouts.          |

## Attribution and licensing[​](#attribution-and-licensing "Direct link to Attribution and licensing")

GPU Graph is inspired by [NVIDIA RAPIDS cuGraph](https://github.com/rapidsai/cugraph) and the NVIDIA and RAPIDS contributors advancing GPU graph analytics. cuGraph is distributed under the [Apache License 2.0](https://github.com/rapidsai/cugraph/blob/main/LICENSE).

GPU Graph is an independently written, [MIT-licensed](https://github.com/visgl/luma.gl/blob/master/LICENSE) vis.gl implementation for browser-native WebGPU. It does not copy or translate cuGraph source code or CUDA implementations. It does not claim CUDA or cuGraph API compatibility, feature parity, NVIDIA affiliation, or NVIDIA endorsement.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Graph overview](https://luma.gl/docs/api-reference/experimental/gpu-graph.md)
* [GPU Core overview](https://luma.gl/docs/api-reference/experimental/gpu-core.md)
* [Graph explorer example](https://luma.gl/examples/experimental/gpu-graph-explorer)
