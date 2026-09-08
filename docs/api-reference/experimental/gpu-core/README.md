import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUExampleCard} from '@site/src/components/docs/gpu-example-card';
import {GPUCorePipelineTutorial} from '@site/src/components/docs/gpu-core-pipeline-tutorial';

# GPU Core

<GPUCoreDocsTabs active="overview" />

<DocumentationBadges>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="webgpu">WebGPU required</DocumentationBadge>
</DocumentationBadges>

## Overview

GPU Core is the experimental WebGPU dataflow and scheduling layer in
`@luma.gl/gpgpu/gpu-core`.
Applications and reusable contributors declare resources, compute/copy/render nodes, dependencies,
conditions, and work estimates. A compiled graph allocates compatible transient resources, orders
read/write hazards (resource conflicts), and records work into a caller-owned command encoder.

GPU Core does not own command submission or the application frame loop. This makes it suitable for
GPU-resident workflows that combine analysis, culling, indirect rendering, and bounded readback
without synchronizing the source dataset through JavaScript.

### The small WebGPU leap behind GPU Core

:::note

For a WebGL developer, the architecture can look more exotic than it is. A handful of WebGPU
capabilities supply the missing links:

- **Compute shaders and storage buffers** let one stage produce general-purpose data that another
  stage consumes without encoding the data as textures or returning it to JavaScript.
- **GPU-writable indirect draw and dispatch arguments** let a later stage consume a GPU-produced
  count without waiting for a CPU readback.
- **Explicit resource uses and command encoding** make the reads, writes, and execution boundaries
  concrete enough for GPU Core to derive hazards, allocations, and a reusable schedule.

WebGL can approximate individual pieces with textures or transform feedback. What it lacks is the
straightforward, general chain from compute-produced data to data-dependent compute and rendering.

:::

```text
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

## When to use it

Use GPU Core when an application needs several GPU operations to share resources and execute as one
repeatable plan. It is especially useful when intermediate data should remain GPU-resident, output
sizes are bounded but data-dependent, later work consumes indirect counts, or work must be
conditional, measured, or spread across frames.

Prefer direct luma.gl commands for a small fixed pass sequence that does not benefit from shared
allocation, hazard analysis, work planning, or graph inspection.

## Choose a learning path

You do not need to read the complete API reference before building a graph. Start with the path
closest to the problem you are solving; each one is deliberately three short stops.

<div className="gpu-core-reading-paths">
  <article className="gpu-core-reading-path">
    <span>New to GPU compute</span>
    <strong>I know WebGL, not compute</strong>
    <ol>
      <li><a href="#the-small-webgpu-leap-behind-gpu-core">The WebGPU leap</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/tutorial">First graph</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes">GPU Core cookbook</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Raw WebGPU experience</span>
    <strong>I already record compute passes</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/tutorial#translate-familiar-webgpu-concepts">Responsibility map</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts">Execution model</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/gpu-command-graph">Command graph API</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Application pipeline</span>
    <strong>I need GPU-resident visualization</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes#select-compact-and-render">Selection recipe</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/draw-command-buffer">Indirect drawing</a></li>
      <li><a href="/examples/experimental/gpu-frustum-culling">Frustum example</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Data analysis</span>
    <strong>I need dataframe-style operations</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes#aggregate-a-selection">Aggregation recipe</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-dataframe">GPU Dataframe overview</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-dataframe-operations">GPU Dataframe operations</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Reusable operation</span>
    <strong>I want to contribute a subgraph</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts#composition-levels">Composition levels</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/recipes#package-a-reusable-operation">Contributor recipe</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/gpu-command-graph#extension-libraries">Extension contracts</a></li>
    </ol>
  </article>
  <article className="gpu-core-reading-path">
    <span>Diagnosis</span>
    <strong>I need to explain cost or failure</strong>
    <ol>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts#instrumentation-and-autotuning">Instrumentation</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/gpu-command-graph#gpucommandgraphinspector">Graph inspector</a></li>
      <li><a href="/docs/api-reference/experimental/gpu-core/concepts#capacity-validation-and-failure-behavior">Validation</a></li>
    </ol>
  </article>
</div>

## Live example

This small interactive pipeline exposes the intermediate values normally kept inside GPU buffers.
Click source rows, then inspect how mask, exclusive scan, stable scatter, and an indirect draw fit
together.

<GPUExampleCard
  demonstrates={['mask', 'scan', 'stable compaction', 'indirect drawing']}
  input="Eight source rows with editable visibility flags"
  gpuOutput="Packed source IDs and one indirect draw record"
  cpuReadback="None"
  execution="Deterministic teaching model; production topology compiles once"
  compatibility="Conceptual model plus WebGPU production APIs"
  fullPageHref="/docs/api-reference/experimental/gpu-core/tutorial"
  sourceHref="https://github.com/visgl/luma.gl/tree/master/website/src/components/docs/gpu-core-pipeline-tutorial.tsx"
  inspectorHref="/docs/api-reference/experimental/gpu-core/concepts#interactive-compiler-anatomy"
/>

<GPUCorePipelineTutorial compact />

## Quick start

```ts
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

Contributors add resources and nodes but do not compile or submit the graph. The application retains
control of synchronization, frame pacing, readback, cancellation, and publication.

## Core concepts and data model

- **Logical resources** describe buffers, textures, views, ownership, and intended uses.
- **Nodes** declare compute, copy, or render work plus every resource range they read or write.
- **Contributors** add reusable operations without taking over graph lifecycle.
- **Compilation** derives hazards, execution order, physical allocation, and diagnostics.
- **Encoding** records the immutable compiled plan using current parameters and imported resources.
- **Bounded outputs** combine fixed-capacity storage with counts or indirect command records.

See [Execution and composition](/docs/api-reference/experimental/gpu-core/concepts) for resource ownership, hazard scheduling, conditions,
resumable execution, budgeting, instrumentation, and autotuning. See
[`GPUCommandGraph`](/docs/api-reference/experimental/gpu-core/gpu-command-graph) for the construction, compilation, and encoding API.
The [GPU Core cookbook](/docs/api-reference/experimental/gpu-core/recipes) maps common
application outcomes to the operations that compose them.

## GPU Core feature card

| Capability | What it enables | Public surface |
| --- | --- | --- |
| **Declarative graph** | One schedule for GPU preparation, analysis, indirect drawing, and picking | `GPUCommandGraph` and graph contributors |
| **Composable primitives** | Masks, scans, sorting, traversal, BVHs, binning, reductions, histograms, FFTs, picking, and readback | `GPU*` contributors from `@luma.gl/experimental` |
| **GPU-driven output** | Bounded counts, compacted IDs, and indirect commands without source-data readback | `GPUScan`, `GPUCompaction`, `DrawCommandBuffer` |
| **Batch-preserving execution** | Ordered `GPUVector` chunks without silently repacking a dataset | `GraphVectorView` and chunk-aware contributors |
| **Conditional execution** | CPU-known work can be omitted and GPU-known empty work can resolve through indirect dispatch | CPU predicates and GPU indirect conditions |
| **Multi-frame execution** | Large immutable plans can advance in bounded resumable steps | `planExecution()` and resumable execution |
| **Adaptive budgets** | Measured queue time can tune bounded step sizes | `GPUCommandGraphExecutionBudgetController` |
| **Kernel autotuning** | Equivalent supported kernels can be selected per adapter and workload | `GPUCommandGraphAutotuner` |
| **Instrumentation** | Encode time, GPU timing, work estimates, allocations, dispatches, draws, and custom counters | `GPUCommandGraphInspector` and timing reports |
| **Hazard scheduling** | RAW, WAR, and WAW dependencies derive from resource uses | Compiled schedule diagnostics |
| **Transient reuse** | Compatible resources share allocations when lifetimes do not overlap | Allocation plan and reuse statistics |
| **Validation** | Binding aliases, device limits, unsupported features, and incomplete estimates fail before submission | Compilation and preflight reports |
| **Explicit ownership** | Applications retain submission, readback cadence, cancellation, and UI publication | Compile-and-encode lifecycle |

## Examples

- [GPU Sort](/examples/experimental/gpu-sort) compares graph-native segmented and unsegmented GPU
  sorting while reporting the selected execution path and measured throughput.
- [GPU Trace Viewer](/examples/experimental/gpu-trace-viewer) combines hierarchy, selection,
  indexing, aggregation, dependency traversal, picking, and indirect rendering while preserving
  canonical span identity.
- [GPU Data Analysis](/examples/experimental/gpu-data-analysis) composes reductions, histograms,
  filtered aggregations, and grid bins.
- [GPU Frustum Culling](/examples/experimental/gpu-frustum-culling) compacts visible scene instances
  and writes an indirect draw count.
- [Vector Field Lab](/examples/showcase/vector-field-lab) composes analytic volume sampling with
  3D gradient, divergence, curl, and Laplacian nodes and ray marches their outputs directly.

## Operations and API index

| Family | Operations |
| --- | --- |
| Graph execution | [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-core/gpu-command-graph), `CompiledGPUCommandGraph`, `GPUCommandGraphExecution`, `GPUCommandGraphExecutionBudgetController`, `GPUCommandGraphAutotuner`, `GPUCommandGraphInspector`, `GraphExternalTextureHandle`, [`GPUTextureHistory`](/docs/api-reference/experimental/gpu-core/gpu-texture-history), [`GPUReadbackRing`](/docs/api-reference/experimental/gpu-core/gpu-readback-ring), [`DrawCommandBuffer`](/docs/api-reference/experimental/gpu-core/draw-command-buffer) |
| Data movement | `GPUUint32Gather` selects or reorders packed uint32 rows; `GPUByteRangeGather` concatenates variable byte ranges; `GPULZByteDecompressor` resolves literal and backreference spans for format-specific LZ decoders. These contribute bounded graph-native compute operations. |
| Selection and compaction | [`GPUScan`](/docs/api-reference/experimental/gpu-core/gpu-scan), `GPUScanUint64` for exceptional split-word inclusive 64-bit prefixes, [`GPUGallopingSearch`](/docs/api-reference/experimental/gpu-core/gpu-galloping-search), [`GPUCompaction`](/docs/api-reference/experimental/gpu-core/gpu-compaction), `GPUIndexedRangeCompaction`, `GPUPartitionedIndexedRangeCompaction`, `GPUChunkedIndexedScatter`, `GPUTextSelection`, [`GPUMask`](/docs/api-reference/experimental/gpu-core/gpu-mask), [`GPUVisibilityWorkflow`](/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow), [`GPUVirtualGeometrySelection`](/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection) |
| Hierarchies and traversal | [`GPUHierarchyLayout`](/docs/api-reference/experimental/gpu-core/gpu-hierarchy-layout), [`GPUGraphTraversal`](/docs/api-reference/experimental/gpu-core/gpu-graph-traversal), [`GPUAncestorProjection`](/docs/api-reference/experimental/gpu-core/gpu-ancestor-projection) |
| Sorting and aggregation | [`GPUSort`](/docs/api-reference/experimental/gpu-core/gpu-sort), `GPUBatchSort`, [`GPUSegmentedSort`](/docs/api-reference/experimental/gpu-core/gpu-segmented-sort), [`GPUFFT2D`](/docs/api-reference/experimental/gpu-core/gpu-fft2d), [`GPUReduction`](/docs/api-reference/experimental/gpu-core/gpu-reduction), [`GPUHistogram`](/docs/api-reference/experimental/gpu-core/gpu-histogram), [`GPUGroupAggregation`](/docs/api-reference/experimental/gpu-core/gpu-group-aggregation) |
| Sampled fields | `GPUFiniteDifference2D` and `GPUFiniteDifference3D` for gradient, divergence, curl, and Laplacian evaluation with explicit spacing and boundary policy |
| Spatial indexing | [`GPUGridBinning`](/docs/api-reference/experimental/gpu-core/gpu-grid-binning), [`GPUGridAggregation`](/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation), [`GPUGridIndex`](/docs/api-reference/experimental/gpu-core/gpu-grid-index), [`GPUGridIndexQuery`](/docs/api-reference/experimental/gpu-core/gpu-grid-index-query), [`GPUPointSpatialFilter`](/docs/api-reference/experimental/gpu-core/gpu-point-spatial-filter), [`GPUBVH`](/docs/api-reference/experimental/gpu-core/gpu-bvh), [`GPUSegmentedBVH`](/docs/api-reference/experimental/gpu-core/gpu-segmented-bvh), [`GPUBVHQuery`](/docs/api-reference/experimental/gpu-core/gpu-bvh-query) |
| GPU scenes | [`GPUScene`](/docs/api-reference/experimental/gpu-core/gpu-scene), [scene adapters](/docs/api-reference/experimental/gpu-core/gpu-scene-adapters), [draw generation](/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation), [resource groups](/docs/api-reference/experimental/gpu-core/gpu-scene-resource-groups), [`GPUIndexPickingTarget`](/docs/api-reference/experimental/gpu-core/gpu-index-picking-target) |
| Hash indexes and joins | [`GPUHashIndex`](/docs/api-reference/experimental/gpu-core/gpu-hash-index), [`GPUBatchHashIndex`](/docs/api-reference/experimental/gpu-core/gpu-batch-hash-index), [`GPUHashJoin`](/docs/api-reference/experimental/gpu-core/gpu-hash-join), [`GPUBatchHashJoin`](/docs/api-reference/experimental/gpu-core/gpu-batch-hash-join) |

Trace-domain algorithms are indexed from the
[`@luma.gl/experimental/gpu-trace` overview](/docs/api-reference/experimental/gpu-trace).

## Limits and compatibility

- GPU Core is experimental and requires WebGPU.
- Compiled graph topology and capacities are immutable; parameters and compatible imports may vary.
- Capacity-dependent outputs report truncation or incomplete results instead of reallocating.
- Device features and limits are checked during construction, compilation, or explicit preflight.
- Readback and queue submission remain explicit application responsibilities.

## Related modules

- [`@luma.gl/experimental/gpu-trace`](/docs/api-reference/experimental/gpu-trace) adds trace semantics.
- [GPU Graph](/docs/api-reference/experimental/gpu-graph) provides graph-data analytics.
- [GPU Raster](/docs/api-reference/experimental/gpu-raster) provides raster and field operations.
- [GPU Dataframe](/docs/api-reference/experimental/gpu-dataframe) provides dataframe-style GPU analysis.
- [`@luma.gl/gpgpu/gpu-data`](/docs/api-reference/gpgpu/gpu-data) defines Arrow-independent GPU data containers.
