# GPU Graph topology

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md)[Topology](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-topology.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-traversal.md)[Connectivity](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-connectivity.md)[Metrics](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-metrics.md)[Layouts](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-layouts.md)

## Describe existing relationships with GPUGraph[​](#describe-existing-relationships-with-gpugraph "Direct link to Describe existing relationships with GPUGraph")

**Question: Which existing GPU columns describe the people, accounts, services, or documents in this network?**

`GPUGraph` is the ownership-preserving entry point. Construct it when an application already has aligned `GPUVector<'uint32'>` source and target identifiers and knows how many vertices exist, including isolated vertices that never appear in an edge.

```
import {GPUGraph} from '@luma.gl/gpgpu/gpu-graph';



const graph = new GPUGraph({

  vertexCount,

  sourceVertices,

  targetVertices,

  edgeWeights,

  edgeIds,

  nodeAttributes,

  directed: true

});
```

The graph borrows its vectors; it does not allocate a graph buffer, copy or concatenate chunks, submit commands, or take ownership of source allocations. Source and target chunks must have the same ordered lengths. Optional stable edge identifiers and `float32` edge weights follow the same source partitions, while optional vertex and edge property tables retain their existing metadata.

Use this lightweight representation when existing GPU tables or render inputs already describe a network. It is a description, not an upload helper: first create or adapt your GPU vectors through the application or the appropriate data adapter.

## Build reusable adjacency with GPUGraphTopology[​](#build-reusable-adjacency-with-gpugraphtopology "Direct link to Build reusable adjacency with GPUGraphTopology")

**Question: Given a particular vertex, which other vertices does it connect to?**

An edge list answers “what are all relationships?” but repeatedly scanning every edge to discover one vertex's neighbors is expensive. `GPUGraphTopology` builds compressed sparse row (CSR) adjacency once so later operations can find each vertex's neighbor interval from adjacent offsets.

For example, a transaction list might contain millions of transfers while an investigator wants only the accounts directly connected to account 42. Its CSR offset interval identifies that account's neighbors without asking each later analysis to rescan the entire edge list.

```
import {GPUGraphTopology} from '@luma.gl/gpgpu/gpu-graph';



const topology = new GPUGraphTopology({

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

Every shown output is an existing, caller-owned, single-chunk `GPUVector<'uint32'>`. Offsets have `vertexCount + 1` rows; neighbors and edge identifiers have equal explicit capacities; `count`, `overflow`, and `invalidEdgeCount` each have one row. When the source graph supplies edge weights, each configured adjacency also requires a matching `float32` edge-weight output.

Build reverse adjacency when a directed graph needs incoming-degree queries, incoming or bidirectional breadth-first search, weak-neighborhood community, core-number, or local-clustering analysis, or PageRank. Directed weak components use forward adjacency alone, as do outgoing weighted shortest paths. Modularity reads original edge columns directly and needs no adjacency. Undirected graphs use one symmetric forward adjacency and must not provide reverse adjacency.

Invalid endpoints are excluded and counted. `count` reports the complete number of accepted adjacency entries even if neighbor capacity is insufficient; `overflow` makes truncation explicit. Neighbor order within each vertex is intentionally unspecified.

## Count relationships with GPUGraphDegree[​](#count-relationships-with-gpugraphdegree "Direct link to Count relationships with GPUGraphDegree")

**Question: How many direct relationships does each vertex have?**

`GPUGraphDegree` answers the simplest structural question: how many outgoing or incoming relationships does each vertex have? Use it to identify network hubs, size junction markers, detect isolated accounts, or find unusually connected infrastructure and dependency nodes.

```
import {GPUGraphDegree} from '@luma.gl/gpgpu/gpu-graph';



const degree = new GPUGraphDegree({

  topology,

  output: outgoingDegrees,

  direction: 'outgoing'

});
```

Its caller-owned output has one packed `uint32` row per vertex. Outgoing degree is the default; incoming degree on a directed graph requires reverse adjacency. Duplicate edges count individually, and an undirected self-loop counts once.

Degrees come from complete CSR offsets rather than the capacity-bounded neighbor list, so they remain exact even when the corresponding adjacency reports neighbor overflow. Degree is useful when raw connectivity is the question; it does not account for whether a vertex's neighbors are themselves important.

## Related pages[​](#related-pages "Direct link to Related pages")

* [GPU Graph overview](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md)
* [GPU Graph operations index](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md)
* [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)
