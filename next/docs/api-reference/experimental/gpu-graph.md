# GPU Graph

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md)[Operations](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md)[Topology](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-topology.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-traversal.md)[Connectivity](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-connectivity.md)[Metrics](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-metrics.md)[Layouts](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-layouts.md)

## Overview[​](#overview "Direct link to Overview")

`@luma.gl/gpgpu/gpu-graph` provides graph-data structures and algorithms that compose inside a caller-owned `GPUCommandGraph`. It keeps adjacency, traversal frontiers, scores, partitions, and layouts GPU-resident so analysis can feed another analysis or a renderer without downloading the graph through JavaScript.

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU Graph for repeated analytics over a graph already stored on the GPU, especially when results will drive filtering, styling, layout, or later graph operations. For a single small graph or an algorithm whose result is immediately needed on the CPU, a CPU graph library may be simpler.

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

import {GPUGraph, GPUGraphPageRank, GPUGraphTopology} from '@luma.gl/gpgpu/gpu-graph';



const graph = new GPUCommandGraph({device, id: 'graph-analysis'});

const topology = new GPUGraphTopology({device, graph, edges, vertexCount});

const pageRank = new GPUGraphPageRank({device, graph, topology});



pageRank.addPasses();

const compiledGraph = graph.compile();
```

The application compiles, encodes, submits, and decides whether a bounded result should be read back. Operations contribute nodes and graph views only.

## Core concepts and data model[​](#core-concepts-and-data-model "Direct link to Core concepts and data model")

* `GPUGraph` describes canonical vertex and edge identity.
* `GPUGraphTopology` builds reusable adjacency views for algorithms that need neighbors.
* Algorithms publish ordinary graph buffers and bounded status so their outputs compose.
* Iterative operations expose capacity, convergence, and incomplete-result behavior explicitly.
* Weighted, directed, and undirected semantics are operation-specific and documented in the operations reference.

## Explore a live graph[​](#explore-a-live-graph "Direct link to Explore a live graph")

* Demonstrates

  topology · GPU analytics · selection · progressive layout

* Input

  A canonical vertex/edge graph with GPU-resident adjacency

* GPU output

  Scores, selections, layout positions, and renderable graph views

* CPU readback

  Only compact inspector and status results

* Execution

  Reusable graph with progressive layout updates

* Compatibility

  WebGPU

[Open full page](https://luma.gl/next/examples/experimental/gpu-graph-explorer)[View source](https://github.com/visgl/luma.gl/tree/master/examples/experimental/gpu-graph-explorer)[Inspect graph](https://luma.gl/next/examples/experimental/gpu-graph-explorer?panel=graph)

Loading interactive example…

## Operations and API index[​](#operations-and-api-index "Direct link to Operations and API index")

| Family                       | Operations                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Graph and topology           | `GPUGraph`, `GPUGraphTopology`, `GPUGraphDegree`                                                                  |
| Traversal and paths          | `GPUGraphBreadthFirstSearch`, `GPUGraphSingleSourceShortestPath`                                                  |
| Connectivity and communities | `GPUGraphConnectedComponents`, `GPUGraphCoreNumber`, `GPUGraphLabelPropagation`, `GPUGraphModularityOptimization` |
| Metrics and ranking          | `GPUGraphLocalClusteringCoefficient`, `GPUGraphModularity`, `GPUGraphPageRank`                                    |
| Layout                       | `GPUGraphForceLayout`, `GPUGraphSpatialForceLayout`                                                               |

The [operations reference](https://luma.gl/next/docs/api-reference/experimental/gpu-graph-operations.md) documents usage, buffers, execution, capacity, validation, and performance for each family.

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* GPU Graph is experimental and WebGPU-only.
* Algorithms use fixed compiled capacities and report convergence or incomplete work explicitly.
* The caller owns source buffers, submission, readback, and cancellation.
* Algorithm support for weights, directionality, self-edges, and parallel edges is documented per operation.

## Related modules[​](#related-modules "Direct link to Related modules")

* [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md) provides scheduling and generic GPU operations.
* [GPU Dataframe](https://luma.gl/next/docs/api-reference/experimental/gpu-dataframe.md) analyzes columnar records rather than graph topology.
* [GPU Trace](https://luma.gl/next/docs/api-reference/experimental/gpu-trace.md) adds trace-specific dependency and hierarchy semantics.
