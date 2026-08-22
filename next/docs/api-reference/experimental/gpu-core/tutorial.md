# GPU Core Tutorial

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)[Tutorial](https://luma.gl/next/docs/api-reference/experimental/gpu-core/tutorial.md)[Cookbook](https://luma.gl/next/docs/api-reference/experimental/gpu-core/recipes.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-core/concepts.md)

## Overview[​](#overview "Direct link to Overview")

This tutorial builds the smallest useful GPU-driven pipeline: classify source rows, calculate stable output positions, pack the selected rows, and pass the resulting count directly to an indirect draw. It is intended for developers who already understand WebGL or WebGPU passes but are new to declarative GPU dataflow.

The important change is one of ownership. Shaders still define what computation means, and the application still owns persistent data, rendering, synchronization, and submission. GPU Core owns the reusable description of intermediate resources and operations, then derives their legal order, transient allocations, validation, and work estimates.

In the rest of the documentation, hover or focus a dotted term such as resourceA GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation. or hazardA conflicting resource access that requires ordering, such as a write that must finish before a later read. for its concise definition.

## Terminology in one minute[​](#terminology-in-one-minute "Direct link to Terminology in one minute")

| Term                                      | Plain-language meaning                                                                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**                              | Data that GPU work reads or writes, usually a buffer or texture. A graph resource is a logical handle describing required size, format, and uses; compilation connects it to physical GPU storage.                               |
| **Node**                                  | One declared unit of compute, copy, or render work, including the resources it reads and writes. A node may encode one pass or contribute work to a shared pass.                                                                 |
| **Dependency**                            | An ordering rule stated by the application: this node must run after another node.                                                                                                                                               |
| **Read/write hazard (resource conflict)** | An ordering rule inferred from data access. If one node writes a resource that another reads or writes, running them in the wrong order could change the result. GPU and compiler literature commonly shortens this to *hazard*. |
| **Contributor**                           | A reusable operation such as `GPUScan` or `GPUCompaction` that adds its resources and nodes to an application-owned graph. It does not compile, submit, or own the frame loop.                                                   |
| **Transient resource**                    | Temporary scratch storage owned by the compiled graph. Compatible transients may share one physical allocation when their lifetimes do not overlap.                                                                              |
| **Compilation**                           | The step that validates the declared graph, derives hazards and order, plans transient storage, and produces an immutable executable schedule.                                                                                   |
| **Indirect command**                      | A standard draw or dispatch argument record stored in a buffer. Because compute work can write it, later GPU work can use a GPU-produced count without waiting for JavaScript.                                                   |

Three distinctions prevent common misunderstandings:

* **GPU Core** is the execution and composition framework; **GPU Graph** is a collection of algorithms for graph-shaped data built with that framework.
* **Graph compilation** plans resource use and execution order; **shader compilation** turns WGSL into device-executable programs. A contributor may cause both, but they are different steps.
* A **batch or chunk** is a durable partition of data. An **execution slice** is the bounded portion of an operation selected to run in one frame. Slicing work does not silently repack its data.

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

Same GPU work, different ownership

### Manual WebGPU and GPU Core

GPU Core does not replace WGSL or submission. It makes the intermediate resources, hazards, reusable operations, and bounded outputs explicit enough to compile and inspect. These excerpts focus on scheduling; buffer creation, shaders, and render setup are intentionally omitted.

**Manual WebGPU scheduling**The application coordinates every pass, scratch allocation, binding, and output field.

```
const encoder = device.createCommandEncoder();

encodeMaskPass(encoder, source, flags);
encodeExclusiveScanPasses(encoder, flags, offsets, scratch);
encodeScatterPass(encoder, sourceIds, flags, offsets, visibleIds);
encodeDrawCountPass(encoder, flags, offsets, indirectArguments);

const pass = encoder.beginRenderPass(renderPassDescriptor);
pass.setPipeline(renderPipeline);
pass.setBindGroup(0, renderBindings);
pass.drawIndirect(indirectArguments, 0);
pass.end();

device.queue.submit([encoder.finish()]);
```

**GPU Core composition**The application declares durable resources and intent; contributors expand into scheduled passes.

```
const graph = new GPUCommandGraph(device, {
  id: 'visible-instances'
});

const sourceIds = graph.importGPUData('source-ids', sourceIdsData);
const flags = graph.importGPUData('visibility-flags', flagsData);
const visibleIds = graph.importGPUData('visible-ids', visibleIdsData);
const commandViews = drawCommands.importToGraph(graph);

new GPUCompaction({
  input: sourceIds,
  flags,
  output: visibleIds,
  count: commandViews.instanceCounts
}).addToGraph(graph);

const compiled = graph.compile();
compiled.encode(encoder, {parameters: undefined});
drawCommands.draw(renderPass, 0);
```

**Application still owns**

* WGSL semantics
* persistent source buffers
* command submission
* render pipelines

**Graph compilation owns**

* hazard ordering
* transient allocation
* stable scheduling
* validation and estimates

From composition to commands

### From declared intent to an executable plan

1. **Composed**The application combines its mask node with a GPUCompaction contributor.
2. **Declared**addToGraph() expands compaction into logical resources, scan nodes, and scatter nodes.
3. **Scheduled**Read-after-write and write-after-read hazards derive the legal pass order.
4. **Allocated**Scan offsets are transient; source, packed output, and draw arguments remain borrowed.
5. **Encoded**The immutable plan records into the command encoder supplied by the application.

## Read the pipeline from left to right[​](#read-the-pipeline-from-left-to-right "Direct link to Read the pipeline from left to right")

1. **Source** preserves canonical row identity. Packing never changes what source row an object refers to.
2. **Mask** expresses a source-aligned decision. Keeping this representation is useful when later shaders already visit every row.
3. **Scan** assigns every selected row a unique, stable destination without serial processing or an unordered atomic append.
4. **Scatter** writes selected values to those destinations. Only the prefix identified by the published count is valid.
5. **Indirect draw** consumes that count on the GPU. JavaScript does not need to download it before rendering.

`GPUCompaction` contributes the scan and scatter stages together. The tutorial separates them visually because understanding their intermediate contract makes many other primitives—variable geometry expansion, sorting, grouping, text selection, and trace visibility—much easier to follow.

## Translate familiar WebGPU concepts[​](#translate-familiar-webgpu-concepts "Direct link to Translate familiar WebGPU concepts")

| Familiar WebGPU responsibility     | GPU Core expression                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Allocate every intermediate buffer | Declare a transient logical resource or use a contributor that declares one    |
| Record passes in dependency order  | Declare every resource read and write; compilation derives hazards and order   |
| Carry a GPU-produced count forward | Expose a bounded count view or an indirect command field                       |
| Rebuild a changing workflow        | Compile stable topology once and update parameters or imported resources       |
| Skip optional work in JavaScript   | Attach a CPU predicate or a GPU-written indirect condition                     |
| Split a large operation manually   | Plan bounded, resumable execution across frames                                |
| Diagnose which pass is expensive   | Inspect nodes, estimates, allocations, dispatches, draws, and optional timings |

## What the graph does not hide[​](#what-the-graph-does-not-hide "Direct link to What the graph does not hide")

* A compute node still has explicit WGSL, bindings, and dispatch semantics.
* Persistent application buffers remain application-owned unless ownership is transferred explicitly.
* Output capacity remains explicit. A bounded result reports overflow or incompleteness rather than silently reallocating.
* The application decides when to encode, submit, await completion, read back small results, and publish asynchronous UI state.
* A graph does not make inherently global work cheap; its estimates and execution plans make that cost visible and controllable.

## Continue from here[​](#continue-from-here "Direct link to Continue from here")

* [Execution and composition](https://luma.gl/next/docs/api-reference/experimental/gpu-core/concepts.md) explains resources, hazards, conditions, resumable execution, and instrumentation.
* [GPU Core cookbook](https://luma.gl/next/docs/api-reference/experimental/gpu-core/recipes.md) maps selection, aggregation, sorting, spatial queries, picking, and budgeted work to concrete operations.
* [`GPUCommandGraph`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-command-graph.md) documents the construction, compilation, and encoding lifecycle.
* [`GPUScan`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scan.md) explains exclusive, inclusive, segmented, and chunk-preserving prefix sums.
* [`GPUCompaction`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-compaction.md) documents the stable bounded-output contract used in the tutorial.
* [`DrawCommandBuffer`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/draw-command-buffer.md) provides typed storage and views for WebGPU indirect records.
* [`GPUVisibilityWorkflow`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow.md) packages mask composition, stable compaction, and an indirect-ready count for common renderers.
