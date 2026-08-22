# GPU Core Execution and Composition

[Overview](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)[Tutorial](https://luma.gl/next/docs/api-reference/experimental/gpu-core/tutorial.md)[Cookbook](https://luma.gl/next/docs/api-reference/experimental/gpu-core/recipes.md)[Concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-core/concepts.md)

## Overview[​](#overview "Direct link to Overview")

GPU Core separates reusable GPU operations from application lifecycle. Contributors declare logical resources and nodes. Compilation turns those declarations into a validated schedule and allocation plan. Encoding records the compiled plan into a caller-owned command encoder.

The lifecycle has two distinct preparation steps:

1. Calling a contributor's `addToGraph()` expands the operation into logical resources and low-level nodes.
2. Calling `compile()` validates those declarations, infers resource dependencies, chooses a stable topological order, plans compatible transient reuse, creates physical resources, and compiles node callbacks.

Encoding then records the immutable plan using current parameters and compatible imported resources. The application still submits the resulting command buffer.

## Interactive compiler anatomy[​](#interactive-compiler-anatomy "Direct link to Interactive compiler anatomy")

The inspector below uses one deterministic selection-and-render workflow to expose each compiler view. It is a teaching model of the real compiler contract: contributors expand before `compile()`, resource uses derive hazards, scheduling defines lifetimes, and compatible non-overlapping transients may share physical storage.

Interactive compiler anatomy

### Follow one graph from declaration to encoded work

Choose a compilation view, then select a node to connect its code, resources, dependencies, work estimate, and bounded output.

1Declared graph2Derived hazards3Execution order4Resource lifetimes5Aliasing plan6Encoded work7Frame slices

**Declared graph**

Contributors have expanded into nodes and logical resources. The application has not recorded any GPU commands yet.

1. compute**Classify visible**
2. compute**Scan blocks**
3. compute**Apply scan carry**
4. compute**Scatter and count**
5. compute**Prepare visible style**
6. compute**Finalize instances**
7. render**Render visible**

Selected node**Scatter and count**

Reads**source, flags, offsets**

Writes**visible-ids, draw-args**

Work**1M invocations**

Publishes**Packed IDs and a GPU-written indirect count**

```
new GPUCompaction({input: source, flags, output: visibleIds, count}).addToGraph(graph);
```

## When to use it[​](#when-to-use-it "Direct link to When to use it")

Use these concepts when building a contributor, composing multiple GPU algorithms, or diagnosing why a graph allocates, schedules, skips, or resumes work in a particular way. Operation users can normally start from an individual operation reference.

## Composition levels[​](#composition-levels "Direct link to Composition levels")

| Level       | Responsibility                                                 | Examples                                                |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| Resource    | Describes storage, format, range, ownership, and allowed uses  | Imported buffers, transient textures, typed graph views |
| Kernel      | Records one bounded GPU operation                              | A scan workgroup, histogram count, or render draw       |
| Algorithm   | Coordinates several nodes to produce one semantic result       | Scan, compaction, sort, BVH construction                |
| Workflow    | Combines algorithms for an application outcome                 | Visibility, picking, trace interaction                  |
| Application | Owns compilation, encoding, submission, state, and publication | Trace viewer, raster lab, frustum culling               |

Contributors may add resources, nodes, estimates, and diagnostics. They must not submit commands or silently take ownership of the application frame loop.

## Resources and ownership[​](#resources-and-ownership "Direct link to Resources and ownership")

Imported resources are caller-owned. Transient resources are graph-owned and may reuse compatible physical allocations when their scheduled lifetimes do not overlap. Views identify logical byte or texture subranges; compilation reasons about underlying physical overlap, not only view identifiers.

Every read and write must declare its use. This lets compilation identify read-after-write, write-after-read, and write-after-write hazards and reject ambiguous writable aliases before WebGPU validation or execution.

Compiled topology and capacities are immutable. An encoding may supply new parameters, frame textures, external textures, or compatible imported resources, but it cannot change the resource shape validated during compilation.

## Scheduling and passes[​](#scheduling-and-passes "Direct link to Scheduling and passes")

Compilation derives dependencies from resource hazards plus explicit dependencies. Independent nodes retain deterministic declaration order. Compatible compute nodes may share a physical compute pass; copy and render boundaries, debug labels, and timing requirements may split passes.

Per-node GPU timestamps require separate physical pass boundaries. Statistics therefore distinguish logical nodes from encoded passes, dispatches, and draws.

## Conditional execution[​](#conditional-execution "Direct link to Conditional execution")

CPU and GPU conditions solve different problems:

* A CPU condition evaluates encoding parameters before a pass is opened. It avoids encoding and GPU work for state already known without readback.
* A GPU indirect condition reads a GPU-written indirect dispatch record. A zero `x` count avoids shader work without mapping the predicate to the CPU.

```
graph.addComputePass({

  id: 'optional-analysis',

  condition: {

    id: 'analysis-enabled',

    source: 'cpu',

    evaluate: parameters => parameters.analysisEnabled

  },

  resources,

  compile: compileAnalysis

});
```

A condition does not create fallback data. Skipped writers leave retained contents unchanged, and downstream nodes are not skipped automatically. Condition the complete dependent chain, version or clear retained outputs, or guarantee that skipped output is not consumed.

## Resumable execution and work budgets[​](#resumable-execution-and-work-budgets "Direct link to Resumable execution and work budgets")

Large algorithms can expose execution steps whose graph topology remains immutable. A plan selects a bounded sequence of steps for one encoding and preserves continuation state for a later frame.

Work estimates describe invocations, bytes read and written, dispatches, draws, and whether an estimate is exact or an upper bound. An application-provided budget selects steps; the graph does not guess a device-wide safe workload.

`GPUCommandGraphExecutionBudgetController` can adjust an explicitly bounded step size from measured queue timings. Minimums, maximums, cancellation, and publication policy remain application-owned.

## Instrumentation and autotuning[​](#instrumentation-and-autotuning "Direct link to Instrumentation and autotuning")

`GPUCommandGraphInspector` exposes the compiled schedule, resource lifetimes, physical allocation reuse, conditions, work estimates, encoding statistics, and optional GPU timings.

`GPUCommandGraphAutotuner` compares equivalent supported kernels within adapter-specific workload buckets. Profiles are serializable but storage is application-owned. Graphs without an autotuner retain deterministic capability-based selection.

Instrumentation distinguishes candidate work from actual dispatch, exact estimates from upper bounds, CPU encoding from GPU duration, logical nodes from physical passes, and persistent from reusable transient allocation.

## Capacity, validation, and failure behavior[​](#capacity-validation-and-failure-behavior "Direct link to Capacity, validation, and failure behavior")

GPU Core validates structural errors before submission where possible, including duplicate IDs, incompatible aliases, undeclared resource uses, unsupported features, exceeded limits, invalid indirect conditions, and plans that exceed explicit budgets.

Preflight is advisory for workload policy and authoritative for declared structural constraints. A variable-sized result uses fixed capacity plus a count and reports overflow or incomplete work; it does not silently allocate or truncate without a diagnostic.

## Performance[​](#performance "Direct link to Performance")

Cache graph compilation. Recompile when topology, capacities, formats, or feature requirements change. Re-encode when parameters or imported frame resources change. Do neither for a static view whose retained outputs remain valid.

Measure the complete pipeline: candidates, compute invocations, bytes touched, passes, dispatches, indirect draws, readback cadence, and GPU duration. Row count alone is not a sufficient cost model.

## Related APIs[​](#related-apis "Direct link to Related APIs")

* [GPU Core cookbook](https://luma.gl/next/docs/api-reference/experimental/gpu-core/recipes.md) starts from application outcomes rather than individual classes.
* [`GPUCommandGraph`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-command-graph.md) documents construction and compiled execution.
* [`GPUTextureHistory`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-texture-history.md) manages rotating retained texture state.
* [`GPUReadbackRing`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md) supports bounded asynchronous readback.
* The [GPU Core overview](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md) indexes reusable operations and domain modules.
