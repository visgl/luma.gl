# Graph

`@luma.gl/graph` provides operations, GPU data, and execution infrastructure. Start with [Getting started with graphs](https://luma.gl/next/docs/api-reference/graph/getting-started.md) for a complete computation and cleanup example.

## Learn in this order[​](#learn-in-this-order "Direct link to Learn in this order")

1. [Getting started](https://luma.gl/next/docs/api-reference/graph/getting-started.md): inputs → operations → selected results → execution.
2. [Inputs, results, and state](https://luma.gl/next/docs/api-reference/graph/gpu-graph-values.md): types, dimensions, ownership, storage reuse, and caller-owned encoding.
3. [Expression syntax](https://luma.gl/next/docs/api-reference/graph/gpu-expression-operation.md): arithmetic, functions, casts, components, and typed rows.
4. [Upload and copy](https://luma.gl/next/docs/api-reference/graph/gpu-transfer-operations.md) and [capacity/count results](https://luma.gl/next/docs/api-reference/graph/gpu-compaction-operation.md): data movement and GPU-sized selection.
5. [Operation contracts](https://luma.gl/next/docs/api-reference/graph/gpu-operation.md): extend the graph with explicit logical effects and lowerings.
6. [Command-graph concepts](https://luma.gl/next/docs/api-reference/experimental/gpu-core/concepts.md): scheduling and physical resources when implementing a lowering or diagnosing execution.

## Choose an interface[​](#choose-an-interface "Direct link to Choose an interface")

| Interface                             | Use it for                                                                           | Execution                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `GPUGraph`                            | Named inputs/state and operation-defined results, including custom WebGPU operations | `compile(device)`, then `run(bindings)` or `prepare(bindings)` and caller-owned encoding  |
| `GPUSimpleGraph` reusable expressions | Shared expression, upload, and copy operations on WebGL and WebGPU                   | `compile(device)`, then `run({inputs, outputTargets})`                                    |
| `GPUSimpleGraph` evaluator recipes    | Lazy uploads and evaluator operations beyond the shared expression subset            | `new GPUSimpleGraph(device)`, then `compile()` and `run()`                                |
| `GPUCommandGraph`                     | Explicit compute, render, and copy passes, textures, and advanced scheduling         | Compile fixed resource descriptors, encode into a caller-owned encoder, submit explicitly |

These are related layers, not interchangeable APIs. Full `GPUGraph` execution currently requires WebGPU. SimpleGraph does not support full-graph custom lowerings, mutable state, or the prepared execution API. Its evaluator recipes also have different result ownership; see its [mode comparison](https://luma.gl/next/docs/api-reference/graph/gpu-simple-graph.md#choose-an-authoring-mode).

## How the layers fit[​](#how-the-layers-fit "Direct link to How the layers fit")

`GPUGraph` describes logical operations. Reusable compilation checks their contracts and builds expression kernels. Preparing an invocation resolves dimensions and lowers operations through `GPUGraphCompiler` into a `GPUCommandGraph`. The command graph schedules concrete passes, tracks hazards, and plans compatible transient reuse. Encoding appends those commands; the application or `run()` submits them.

Applications normally use `graph.compile(device)`. The lower-level `GPUGraphCompiler.compile()` returns command-graph declarations for advanced composition and requires concrete vector sizes. See the [GPUGraph reference](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-graph.md) and [command-graph reference](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-command-graph.md).

## Data and processing modules[​](#data-and-processing-modules "Direct link to Data and processing modules")

GPU data primitives live in `@luma.gl/graph/gpu-data`. A `GPUData` owns or borrows one buffer; a `GPUVector` describes an ordered sequence of chunks. Engine renderers consume these shared types. Logical graph declarations describe values; they do not own the input buffers.

Optional processing modules use explicit subpaths. Their individual references identify whether they provide semantic operations, command-graph contributors, or higher-level workflows; sharing the graph package does not imply every algorithm accepts the reusable expression interface.

| Subpath                                                                                      | Capability                                                                          |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [`gpu-simple-graph`](https://luma.gl/next/docs/api-reference/graph/gpu-simple-graph.md) | Portable evaluator-backed composition, upload/copy, scoped runs, and output storage |
| `gpu-core`                                                                                   | Graph primitives, GPU programs, resource planning, and execution helpers            |
| `gpu-graph-algorithms`                                                                       | Graph topology, analytics, and layouts                                              |
| `gpu-parse`                                                                                  | Encoded columnar page decoding                                                      |
| `gpu-vector-search`                                                                          | Similarity search and clustering                                                    |
| `gpu-dggs`, `gpu-h3`, `gpu-a5`, `geospatial`, `gpu-project`                                  | Spatial indexing and coordinate processing                                          |
| `gpu-physics`, `gpu-geometry`, `gpu-pointcloud`, `gpu-timeseries`                            | Physics and domain computations                                                     |
| `gpu-tables`, `gpu-dataframe`, `gpu-sql`, `gpu-crossfilter`                                  | Tables, queries, and selection                                                      |
| `gpu-raster`, `lucim`                                                                        | Raster and volume processing                                                        |
| `gpu-simulation`, `gpu-effects`                                                              | Graph-based ocean/fire simulations and FFT bloom                                    |
| `gpu-trace`                                                                                  | Trace analytics                                                                     |

For image processing, see [texture values and execution bindings](https://luma.gl/next/docs/api-reference/graph/gpu-graph-textures.md).
