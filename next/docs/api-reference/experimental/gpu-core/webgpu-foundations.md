# WebGPU Foundations for GPU Command Graphs

## Overview[​](#overview "Direct link to Overview")

A GPU command graph connects compute, copy, and rendering stages while keeping intermediate data on the GPU. WebGPU supplies the execution and memory primitives; GPU Core supplies the resource model, dependency analysis, and reusable compiled schedule.

This page describes command graphs in `@luma.gl/gpgpu/gpu-core`. The separate [GPU Graph module](https://luma.gl/next/docs/api-reference/experimental/gpu-graph.md) analyzes graph datasets such as networks of vertices and edges.

## The features that make it possible[​](#the-features-that-make-it-possible "Direct link to The features that make it possible")

| WebGPU feature                                | What it enables                                                             | Example in a command graph                                            |
| --------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Compute shaders                               | General-purpose parallel processing independent of rasterization            | Test visibility, scan flags, sort keys, or integrate simulation state |
| Storage buffers                               | Indexed random-access reads and writes of structured GPU data               | Read source records and write packed visible IDs for rendering        |
| Indirect dispatch and drawing                 | Consume GPU-written work counts without a count readback to JavaScript      | Dispatch over a compacted result or draw only visible instances       |
| Workgroups and workgroup memory               | Cooperating invocations share local scratch storage and synchronize locally | Reduce a tile, scan a block, or reuse a loaded data tile              |
| Integer atomics                               | Coordinate concurrent updates to one integer location                       | Count histogram bins, reserve output slots, or claim a visited vertex |
| Explicit command encoding and resource usages | Compose compute, copy, and render work with validated usage boundaries      | Write indirect arguments in compute and consume them in a later pass  |
| Storage textures                              | Address image-like intermediate results from compute                        | Produce a field or image consumed by another compute or render stage  |
| Asynchronous pipeline creation                | Prepare multiple pipelines without serial synchronous compilation stalls    | Await `graph.compileAsync()` before entering the frame loop           |
| Optional timestamp queries                    | Measure GPU pass durations separately from CPU encoding                     | Sample a graph and inspect its GPU Trace panel                        |

## Compute shaders turn data into more work[​](#compute-shaders-turn-data-into-more-work "Direct link to Compute shaders turn data into more work")

A compute dispatch launches workgroups, each containing a fixed arrangement of invocations. An invocation can process a row, vertex, particle, or tile. Algorithms with global dependencies usually expand into multiple dispatches: a large scan, for example, needs block scans and a step that propagates block offsets.

Workgroup memory is shared only within one workgroup. A workgroup barrier is not a global barrier across a dispatch. Use separate dispatch stages for dependencies between workgroups. All required invocations must reach barriers in uniform control flow; an early return before a barrier can be invalid. Choose workgroup sizes within the adapter's limits.

## Storage keeps the pipeline GPU-resident[​](#storage-keeps-the-pipeline-gpu-resident "Direct link to Storage keeps the pipeline GPU-resident")

Storage buffers let shaders access records by index and produce data for later stages. Allocate buffers with the usages needed by the entire pipeline, such as storage plus indirect usage for an argument buffer. Storage access does not make concurrent writes safe: assign each output a unique writer, use an appropriate atomic operation, or split the algorithm into ordered stages.

WGSL atomics operate on supported integer atomic types. They protect the atomic location, not an entire record or an arbitrary sequence of surrounding writes. Do not use a spin loop between workgroups as a substitute for a dispatch boundary.

## Indirect work removes a count roundtrip[​](#indirect-work-removes-a-count-roundtrip "Direct link to Indirect work removes a count roundtrip")

A visibility pipeline can keep both its result and its size on the GPU:

```
Source records → visibility flags → scan → packed visible IDs → render

                                        ↘ visible count → indirect draw arguments ↗
```

The CPU still constructs and submits commands. Indirect execution removes the need to read a GPU-produced count before deciding how much work those commands perform. It does not let a shader create arbitrary command buffers or remove capacity limits. Reserve bounded output storage and report overflow explicitly.

## What the graph adds[​](#what-the-graph-adds "Direct link to What the graph adds")

WebGPU does not infer the application graph. GPU Core uses declared resource reads and writes to order dependent nodes, plan transient lifetimes, and encode the resulting schedule. Independent nodes in the graph do not imply simultaneous execution on separate hardware queues.

Continue with [execution techniques](https://luma.gl/next/docs/api-reference/experimental/gpu-core/execution-techniques.md), the [first graph tutorial](https://luma.gl/next/docs/api-reference/experimental/gpu-core/tutorial.md), or [debugging](https://luma.gl/next/docs/api-reference/experimental/gpu-core/debugging.md).

## WebGPU references[​](#webgpu-references "Direct link to WebGPU references")

The [WebGPU specification](https://www.w3.org/TR/webgpu/) defines buffers, command encoding, indirect execution, pipeline creation, and queries. The [WGSL specification](https://www.w3.org/TR/WGSL/) defines workgroups, memory access, atomics, and synchronization.
