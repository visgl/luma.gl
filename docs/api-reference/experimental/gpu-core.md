# GPU Core

[Overview](https://luma.gl/docs/api-reference/experimental/gpu-core.md)[Tutorial](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md)[Cookbook](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md)[Concepts](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md)

From v10ExperimentalWebGPU required

## Overview[​](#overview "Direct link to Overview")

GPU Core is the experimental WebGPU dataflow and scheduling layer in `@luma.gl/gpgpu/gpu-core`. Applications and reusable contributors declare resources, compute/copy/render nodes, dependencies, conditions, and work estimates. A compiled graph allocates compatible transient resources, orders read/write hazards (resource conflicts), and records work into a caller-owned command encoder.

GPU Core does not own command submission or the application frame loop. This makes it suitable for GPU-resident workflows that combine analysis, culling, indirect rendering, and bounded readback without synchronizing the source dataset through JavaScript.

### The small WebGPU leap behind GPU Core[​](#the-small-webgpu-leap-behind-gpu-core "Direct link to The small WebGPU leap behind GPU Core")

note

For a WebGL developer, the architecture can look more exotic than it is. A handful of WebGPU capabilities supply the missing links:

* **Compute shaders and storage buffers** let one stage produce general-purpose data that another stage consumes without encoding the data as textures or returning it to JavaScript.
* **GPU-writable indirect draw and dispatch arguments** let a later stage consume a GPU-produced count without waiting for a CPU readback.
* **Explicit resource uses and command encoding** make the reads, writes, and execution boundaries concrete enough for GPU Core to derive hazards, allocations, and a reusable schedule.

WebGL can approximate individual pieces with textures or transform feedback. What it lacks is the straightforward, general chain from compute-produced data to data-dependent compute and rendering.

```
GPU-resident source data

        ↓

selection and transformation

        ↓

scan, compaction, sorting, or aggregation

        ↓

bounded output and indirect commands

        ↓

rendering, picking, or small readback
```

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use GPU Core when an application needs several GPU operations to share resources and execute as one repeatable plan. It is especially useful when intermediate data should remain GPU-resident, output sizes are bounded but data-dependent, later work consumes indirect counts, or work must be conditional, measured, or spread across frames.

Prefer direct luma.gl commands for a small fixed pass sequence that does not benefit from shared allocation, hazard analysis, work planning, or graph inspection.

## Choose a learning path[​](#choose-a-learning-path "Direct link to Choose a learning path")

You do not need to read the complete API reference before building a graph. Start with the path closest to the problem you are solving; each one is deliberately three short stops.

New to GPU compute**I know WebGL, not compute**

1. [The WebGPU leap](#the-small-webgpu-leap-behind-gpu-core)
2. [First graph](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md)
3. [GPU Core cookbook](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md)

Raw WebGPU experience**I already record compute passes**

1. [Responsibility map](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md#translate-familiar-webgpu-concepts)
2. [Execution model](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md)
3. [Command graph API](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md)

Application pipeline**I need GPU-resident visualization**

1. [Selection recipe](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md#select-compact-and-render)
2. [Indirect drawing](https://luma.gl/docs/api-reference/experimental/gpu-core/draw-command-buffer.md)
3. [Frustum example](https://luma.gl/examples/experimental/gpu-frustum-culling)

Data analysis**I need dataframe-style operations**

1. [Aggregation recipe](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md#aggregate-a-selection)
2. [GPU Dataframe overview](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md)
3. [GPU Dataframe operations](https://luma.gl/docs/api-reference/experimental/gpu-dataframe-operations.md)

Reusable operation**I want to contribute a subgraph**

1. [Composition levels](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md#composition-levels)
2. [Contributor recipe](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md#package-a-reusable-operation)
3. [Extension contracts](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md#extension-libraries)

Diagnosis**I need to explain cost or failure**

1. [Instrumentation](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md#instrumentation-and-autotuning)
2. [Graph inspector](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md#gpucommandgraphinspector)
3. [Validation](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md#capacity-validation-and-failure-behavior)

## Live example[​](#live-example "Direct link to Live example")

This small interactive pipeline exposes the intermediate values normally kept inside GPU buffers. Click source rows, then inspect how mask, exclusive scan, stable scatter, and an indirect draw fit together.

* Demonstrates

  mask · scan · stable compaction · indirect drawing

* Input

  Eight source rows with editable visibility flags

* GPU output

  Packed source IDs and one indirect draw record

* CPU readback

  None

* Execution

  Deterministic teaching model; production topology compiles once

* Compatibility

  Conceptual model plus WebGPU production APIs

[Open full page](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md)[View source](https://github.com/visgl/luma.gl/tree/master/website/src/components/docs/gpu-core-pipeline-tutorial.tsx)[Inspect graph](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md#interactive-compiler-anatomy)

Interactive dataflow

### From a sparse decision to one indirect draw

Select source rows, then follow the GPU-resident values through mask, exclusive scan, stable scatter, and the final indirect command.

Reset selection

1Source→2Mask→3Scan→4Scatter→5Indirect draw

Operation**Application compute node or GPUMask**

One flag per source row records a keep or discard decision. Click a source value to change this stage.

Publishes**one canonical 0/1 flag per source row**

**Source value**Click to keep or discard

\#

<!-- -->

0**8**#

<!-- -->

1**3**#

<!-- -->

2**5**#

<!-- -->

3**2**#

<!-- -->

4**9**#

<!-- -->

5**1**#

<!-- -->

6**6**#

<!-- -->

7**4**

**Keep mask**0 discards · 1 keeps

10101001

**Exclusive scan**selected rows before this row

01122333

**Packed output**4 valid rows

\#

<!-- -->

08#

<!-- -->

25#

<!-- -->

49#

<!-- -->

74····

vertexCount**6**

instanceCount**4**GPU-written

firstVertex**0**

firstInstance**0**

`drawIndirect(buffer, 0)`

[Continue with the complete tutorial and WebGPU comparison →](https://luma.gl/docs/api-reference/experimental/gpu-core/tutorial.md)

## Quick start[​](#quick-start "Direct link to Quick start")

```
import {GPUCommandGraph, GPUScan} from '@luma.gl/gpgpu/gpu-core';



const graph = new GPUCommandGraph(device, {id: 'prefix-sum'});

const input = graph.importBuffer(

  {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},

  inputBuffer

);

const output = graph.importBuffer(

  {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},

  outputBuffer

);

const values = graph.createDataView(input, {format: 'uint32', length});

const prefixes = graph.createDataView(output, {format: 'uint32', length});



new GPUScan({id: 'scan', input: values, output: prefixes}).addToGraph(graph);



const compiledGraph = graph.compile();

const commandEncoder = device.createCommandEncoder();

compiledGraph.encode(commandEncoder, {parameters: undefined});

device.submit(commandEncoder.finish());
```

Contributors add resources and nodes but do not compile or submit the graph. The application retains control of synchronization, frame pacing, readback, cancellation, and publication.

## Core concepts and data model[​](#core-concepts-and-data-model "Direct link to Core concepts and data model")

* **Logical resources** describe buffers, textures, views, ownership, and intended uses.
* **Nodes** declare compute, copy, or render work plus every resource range they read or write.
* **Contributors** add reusable operations without taking over graph lifecycle.
* **Compilation** derives hazards, execution order, physical allocation, and diagnostics.
* **Encoding** records the immutable compiled plan using current parameters and imported resources.
* **Bounded outputs** combine fixed-capacity storage with counts or indirect command records.

See [Execution and composition](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md) for resource ownership, hazard scheduling, conditions, resumable execution, budgeting, instrumentation, and autotuning. See [`GPUCommandGraph`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md) for the construction, compilation, and encoding API. The [GPU Core cookbook](https://luma.gl/docs/api-reference/experimental/gpu-core/recipes.md) maps common application outcomes to the operations that compose them.

## GPU Core feature card[​](#gpu-core-feature-card "Direct link to GPU Core feature card")

| Capability                     | What it enables                                                                                       | Public surface                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Declarative graph**          | One schedule for GPU preparation, analysis, indirect drawing, and picking                             | `GPUCommandGraph` and graph contributors         |
| **Composable primitives**      | Masks, scans, sorting, traversal, BVHs, binning, reductions, histograms, FFTs, picking, and readback  | `GPU*` contributors from `@luma.gl/experimental` |
| **GPU-driven output**          | Bounded counts, compacted IDs, and indirect commands without source-data readback                     | `GPUScan`, `GPUCompaction`, `DrawCommandBuffer`  |
| **Batch-preserving execution** | Ordered `GPUVector` chunks without silently repacking a dataset                                       | `GraphVectorView` and chunk-aware contributors   |
| **Conditional execution**      | CPU-known work can be omitted and GPU-known empty work can resolve through indirect dispatch          | CPU predicates and GPU indirect conditions       |
| **Multi-frame execution**      | Large immutable plans can advance in bounded resumable steps                                          | `planExecution()` and resumable execution        |
| **Adaptive budgets**           | Measured queue time can tune bounded step sizes                                                       | `GPUCommandGraphExecutionBudgetController`       |
| **Kernel autotuning**          | Equivalent supported kernels can be selected per adapter and workload                                 | `GPUCommandGraphAutotuner`                       |
| **Instrumentation**            | Encode time, GPU timing, work estimates, allocations, dispatches, draws, and custom counters          | `GPUCommandGraphInspector` and timing reports    |
| **Hazard scheduling**          | RAW, WAR, and WAW dependencies derive from resource uses                                              | Compiled schedule diagnostics                    |
| **Transient reuse**            | Compatible resources share allocations when lifetimes do not overlap                                  | Allocation plan and reuse statistics             |
| **Validation**                 | Binding aliases, device limits, unsupported features, and incomplete estimates fail before submission | Compilation and preflight reports                |
| **Explicit ownership**         | Applications retain submission, readback cadence, cancellation, and UI publication                    | Compile-and-encode lifecycle                     |

## Examples[​](#examples "Direct link to Examples")

* [GPU Sort](https://luma.gl/examples/experimental/gpu-sort) compares graph-native segmented and unsegmented GPU sorting while reporting the selected execution path and measured throughput.
* [GPU Trace Viewer](https://luma.gl/examples/experimental/gpu-trace-viewer) combines hierarchy, selection, indexing, aggregation, dependency traversal, picking, and indirect rendering while preserving canonical span identity.
* [GPU Data Analysis](https://luma.gl/examples/experimental/gpu-data-analysis) composes reductions, histograms, filtered aggregations, and grid bins.
* [GPU Frustum Culling](https://luma.gl/examples/experimental/gpu-frustum-culling) compacts visible scene instances and writes an indirect draw count.

## Operations and API index[​](#operations-and-api-index "Direct link to Operations and API index")

| Family                    | Operations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Graph execution           | [`GPUCommandGraph`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-command-graph.md), `CompiledGPUCommandGraph`, `GPUCommandGraphExecution`, `GPUCommandGraphExecutionBudgetController`, `GPUCommandGraphAutotuner`, `GPUCommandGraphInspector`, `GraphExternalTextureHandle`, [`GPUTextureHistory`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-texture-history.md), [`GPUReadbackRing`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md), [`DrawCommandBuffer`](https://luma.gl/docs/api-reference/experimental/gpu-core/draw-command-buffer.md)                                                                                                                                                                                                     |
| Selection and compaction  | [`GPUScan`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scan.md), [`GPUGallopingSearch`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-galloping-search.md), [`GPUCompaction`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-compaction.md), `GPUIndexedRangeCompaction`, `GPUPartitionedIndexedRangeCompaction`, `GPUChunkedIndexedScatter`, `GPUTextSelection`, [`GPUMask`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-mask.md), [`GPUVisibilityWorkflow`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md), [`GPUVirtualGeometrySelection`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection.md)                                                                     |
| Hierarchies and traversal | [`GPUHierarchyLayout`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-hierarchy-layout.md), [`GPUGraphTraversal`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-graph-traversal.md), [`GPUAncestorProjection`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-ancestor-projection.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Sorting and aggregation   | [`GPUSort`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-sort.md), `GPUBatchSort`, [`GPUSegmentedSort`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-sort.md), [`GPUFFT2D`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft2d.md), [`GPUReduction`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-reduction.md), [`GPUHistogram`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-histogram.md), [`GPUGroupAggregation`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)                                                                                                                                                                                                                  |
| Spatial indexing          | [`GPUGridBinning`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-binning.md), [`GPUGridAggregation`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation.md), [`GPUGridIndex`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-index.md), [`GPUGridIndexQuery`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-grid-index-query.md), [`GPUPointSpatialFilter`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-point-spatial-filter.md), [`GPUBVH`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-bvh.md), [`GPUSegmentedBVH`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-bvh.md), [`GPUBVHQuery`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-bvh-query.md) |
| GPU scenes                | [`GPUScene`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scene.md), [scene adapters](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scene-adapters.md), [draw generation](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation.md), [resource groups](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-scene-resource-groups.md), [`GPUIndexPickingTarget`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-index-picking-target.md)                                                                                                                                                                                                                                                                                          |
| Hash indexes and joins    | [`GPUHashIndex`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-hash-index.md), [`GPUBatchHashIndex`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-batch-hash-index.md), [`GPUHashJoin`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-hash-join.md), [`GPUBatchHashJoin`](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-batch-hash-join.md)                                                                                                                                                                                                                                                                                                                                                                                                            |

Trace-domain algorithms are indexed from the [`@luma.gl/experimental/gpu-trace` overview](https://luma.gl/docs/api-reference/experimental/gpu-trace.md).

## Limits and compatibility[​](#limits-and-compatibility "Direct link to Limits and compatibility")

* GPU Core is experimental and requires WebGPU.
* Compiled graph topology and capacities are immutable; parameters and compatible imports may vary.
* Capacity-dependent outputs report truncation or incomplete results instead of reallocating.
* Device features and limits are checked during construction, compilation, or explicit preflight.
* Readback and queue submission remain explicit application responsibilities.

## Related modules[​](#related-modules "Direct link to Related modules")

* [`@luma.gl/experimental/gpu-trace`](https://luma.gl/docs/api-reference/experimental/gpu-trace.md) adds trace semantics.
* [GPU Graph](https://luma.gl/docs/api-reference/experimental/gpu-graph.md) provides graph-data analytics.
* [GPU Raster](https://luma.gl/docs/api-reference/experimental/gpu-raster.md) provides raster and field operations.
* [GPU Dataframe](https://luma.gl/docs/api-reference/experimental/gpu-dataframe.md) provides dataframe-style GPU analysis.
* [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/docs/api-reference/gpgpu/gpu-data.md) defines Arrow-independent GPU data containers.
