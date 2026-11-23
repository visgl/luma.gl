---
title: Graph
description: Describe GPU computations, bind data, and compose execution with rendering.
---

# Graph

`@luma.gl/graph` provides operations, GPU data, and execution infrastructure. Start with
[Getting started with graphs](./getting-started.md) for a complete computation and cleanup example.

## Learn in this order

1. [Getting started](./getting-started.md): inputs → operations → selected results → execution.
2. [Inputs, results, and state](./gpu-graph-values.md): types, dimensions, ownership, storage reuse, and caller-owned encoding.
3. [Expression syntax](./gpu-expression-operation.md): arithmetic, functions, casts, components, and typed rows.
4. [Upload and copy](./gpu-transfer-operations.md) and [capacity/count results](./gpu-compaction-operation.md): data movement and GPU-sized selection.
5. [Texture values](./gpu-graph-textures.md) and [fullscreen shader passes](./gpu-shader-pass-operation.md): image inputs, operation-owned results, and shared WebGPU effects.
6. [Operation contracts](./gpu-operation.md): extend the graph with explicit logical effects and lowerings.
7. [Command-graph concepts](/docs/api-reference/experimental/gpu-core/concepts): scheduling and physical resources when implementing a lowering or diagnosing execution.

Read [CPU and GPU data flow](./data-flow.md) for residency, transfer diagrams, Arrow/GeoArrow adapters, and layer preparation.

## Choose an interface

| Interface | Use it for | Execution |
| --- | --- | --- |
| `GPUGraph` | Named inputs/state and operation-defined results, including custom WebGPU operations | `compile(device)`, then `run(bindings)` or `prepare(bindings)` and caller-owned encoding |
| `GPUSimpleGraph` reusable operations | Shared numeric operations; texture copies and shader passes on WebGPU | `compile(device)`, then `run({inputs, outputTargets})`; texture-only programs also support `prepare()` |
| `GPUSimpleGraph` evaluator recipes | Lazy uploads and evaluator operations beyond the shared expression subset | `new GPUSimpleGraph(device)`, then `compile()` and `run()` |
| `GPUCommandGraph` | Explicit compute, render, and copy passes, textures, and advanced scheduling | Compile fixed resource descriptors, encode into a caller-owned encoder, submit explicitly |

These are related layers, not interchangeable APIs. Full `GPUGraph` execution currently requires
WebGPU. SimpleGraph supports prepared texture-copy/shader-pass programs on WebGPU; numeric
evaluator programs use asynchronous `run()`. It does not support full-graph custom lowerings or
mutable state. Its evaluator recipes also have different result ownership; see its
[mode comparison](./gpu-simple-graph.md#choose-an-authoring-mode).

## How the layers fit

`GPUGraph` describes logical operations. Reusable compilation checks their contracts and builds
expression kernels. Preparing an invocation resolves dimensions and lowers operations through
`GPUGraphCompiler` into a `GPUCommandGraph`. The command graph schedules concrete passes,
tracks hazards, and plans compatible transient reuse. Encoding appends those commands; the
application or `run()` submits them.

Applications normally use `graph.compile(device)`. The lower-level `GPUGraphCompiler.compile()`
returns command-graph declarations for advanced composition and requires concrete vector
sizes. See the [GPUGraph reference](/docs/api-reference/experimental/gpu-core/gpu-graph) and
[command-graph reference](/docs/api-reference/experimental/gpu-core/gpu-command-graph).

## Data and processing modules

GPU data primitives live in `@luma.gl/graph/gpu-data`. A `GPUData` owns or borrows one buffer;
a `GPUVector` describes an ordered sequence of chunks. Engine renderers consume these shared
types. Logical graph declarations describe values; they do not own the input buffers.

Optional processing modules use explicit subpaths. Their individual references identify whether
they provide semantic operations, command-graph contributors, or higher-level workflows; sharing
the graph package does not imply every algorithm accepts the reusable expression interface.

| Subpath | Capability |
| --- | --- |
| [`gpu-simple-graph`](/docs/api-reference/graph/gpu-simple-graph) | Portable evaluator-backed composition, upload/copy, scoped runs, and output storage |
| `gpu-core` | Graph primitives, GPU programs, resource planning, and execution helpers |
| `gpu-graph-algorithms` | Graph topology, analytics, and layouts |
| `gpu-parse` | Encoded columnar page decoding |
| `gpu-vector-search` | Similarity search and clustering |
| `gpu-dggs`, `gpu-h3`, `gpu-a5`, `geospatial`, `gpu-project` | Spatial indexing and coordinate processing |
| `gpu-physics`, `gpu-geometry`, `gpu-pointcloud`, `gpu-timeseries` | Physics and domain computations |
| `gpu-tables`, `gpu-dataframe`, `gpu-sql`, `gpu-crossfilter` | Tables, queries, and selection |
| `gpu-raster`, `lucim` | Raster and volume processing |
| `gpu-simulation`, `gpu-effects` | Graph-based ocean/fire simulations and FFT bloom |
| `gpu-trace` | Trace analytics |

For image processing, see [texture values and execution bindings](./gpu-graph-textures.md).
