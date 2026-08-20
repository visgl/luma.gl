import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUCorePipelineTutorial} from '@site/src/components/docs/gpu-core-pipeline-tutorial';
import {GPUCoreTerm} from '@site/src/components/docs/gpu-core-terms';

# GPU Core Tutorial

<GPUCoreDocsTabs active="tutorial" />

## Overview

This tutorial builds the smallest useful GPU-driven pipeline: classify source rows, calculate stable
output positions, pack the selected rows, and pass the resulting count directly to an indirect
draw. It is intended for developers who already understand WebGL or WebGPU passes but are new to
declarative GPU dataflow.

The important change is one of ownership. Shaders still define what computation means, and the
application still owns persistent data, rendering, synchronization, and submission. GPU Core owns
the reusable description of intermediate resources and operations, then derives their legal order,
transient allocations, validation, and work estimates.

In the rest of the documentation, hover or focus a dotted term such as
<GPUCoreTerm term="resource" /> or <GPUCoreTerm term="hazard" /> for its concise definition.

## Terminology in one minute

| Term | Plain-language meaning |
| --- | --- |
| **Resource** | Data that GPU work reads or writes, usually a buffer or texture. A graph resource is a logical handle describing required size, format, and uses; compilation connects it to physical GPU storage. |
| **Node** | One declared unit of compute, copy, or render work, including the resources it reads and writes. A node may encode one pass or contribute work to a shared pass. |
| **Dependency** | An ordering rule stated by the application: this node must run after another node. |
| **Read/write hazard (resource conflict)** | An ordering rule inferred from data access. If one node writes a resource that another reads or writes, running them in the wrong order could change the result. GPU and compiler literature commonly shortens this to _hazard_. |
| **Contributor** | A reusable operation such as `GPUScan` or `GPUCompaction` that adds its resources and nodes to an application-owned graph. It does not compile, submit, or own the frame loop. |
| **Transient resource** | Temporary scratch storage owned by the compiled graph. Compatible transients may share one physical allocation when their lifetimes do not overlap. |
| **Compilation** | The step that validates the declared graph, derives hazards and order, plans transient storage, and produces an immutable executable schedule. |
| **Indirect command** | A standard draw or dispatch argument record stored in a buffer. Because compute work can write it, later GPU work can use a GPU-produced count without waiting for JavaScript. |

Three distinctions prevent common misunderstandings:

- **GPU Core** is the execution and composition framework; **GPU Graph** is a collection of
  algorithms for graph-shaped data built with that framework.
- **Graph compilation** plans resource use and execution order; **shader compilation** turns WGSL
  into device-executable programs. A contributor may cause both, but they are different steps.
- A **batch or chunk** is a durable partition of data. An **execution slice** is the bounded portion
  of an operation selected to run in one frame. Slicing work does not silently repack its data.

<GPUCorePipelineTutorial />

## Read the pipeline from left to right

1. **Source** preserves canonical row identity. Packing never changes what source row an object
   refers to.
2. **Mask** expresses a source-aligned decision. Keeping this representation is useful when later
   shaders already visit every row.
3. **Scan** assigns every selected row a unique, stable destination without serial processing or an
   unordered atomic append.
4. **Scatter** writes selected values to those destinations. Only the prefix identified by the
   published count is valid.
5. **Indirect draw** consumes that count on the GPU. JavaScript does not need to download it before
   rendering.

`GPUCompaction` contributes the scan and scatter stages together. The tutorial separates them
visually because understanding their intermediate contract makes many other primitives—variable
geometry expansion, sorting, grouping, text selection, and trace visibility—much easier to follow.

## Translate familiar WebGPU concepts

| Familiar WebGPU responsibility | GPU Core expression |
| --- | --- |
| Allocate every intermediate buffer | Declare a transient logical resource or use a contributor that declares one |
| Record passes in dependency order | Declare every resource read and write; compilation derives hazards and order |
| Carry a GPU-produced count forward | Expose a bounded count view or an indirect command field |
| Rebuild a changing workflow | Compile stable topology once and update parameters or imported resources |
| Skip optional work in JavaScript | Attach a CPU predicate or a GPU-written indirect condition |
| Split a large operation manually | Plan bounded, resumable execution across frames |
| Diagnose which pass is expensive | Inspect nodes, estimates, allocations, dispatches, draws, and optional timings |

## What the graph does not hide

- A compute node still has explicit WGSL, bindings, and dispatch semantics.
- Persistent application buffers remain application-owned unless ownership is transferred
  explicitly.
- Output capacity remains explicit. A bounded result reports overflow or incompleteness rather than
  silently reallocating.
- The application decides when to encode, submit, await completion, read back small results, and
  publish asynchronous UI state.
- A graph does not make inherently global work cheap; its estimates and execution plans make that
  cost visible and controllable.

## Continue from here

- [Execution and composition](/docs/api-reference/experimental/gpu-core/concepts) explains
  resources, hazards, conditions, resumable execution, and instrumentation.
- [GPU Core cookbook](/docs/api-reference/experimental/gpu-core/recipes) maps selection,
  aggregation, sorting, spatial queries, picking, and budgeted work to concrete operations.
- [`GPUCommandGraph`](/docs/api-reference/experimental/gpu-core/gpu-command-graph) documents
  the construction, compilation, and encoding lifecycle.
- [`GPUScan`](/docs/api-reference/experimental/gpu-core/gpu-scan) explains exclusive,
  inclusive, segmented, and chunk-preserving prefix sums.
- [`GPUCompaction`](/docs/api-reference/experimental/gpu-core/gpu-compaction) documents the
  stable bounded-output contract used in the tutorial.
- [`DrawCommandBuffer`](/docs/api-reference/experimental/gpu-core/draw-command-buffer)
  provides typed storage and views for WebGPU indirect records.
- [`GPUVisibilityWorkflow`](/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow)
  packages mask composition, stable compaction, and an indirect-ready count for common renderers.
