# GPGPU programming

GPU data processing in luma.gl ranges from portable lazy vector operations to explicitly scheduled WebGPU command graphs. Start with the highest-level API that expresses the workflow cleanly.

## Outcome and prerequisites[​](#outcome-and-prerequisites "Direct link to Outcome and prerequisites")

This guide helps you choose between the stable `@luma.gl/graph/gpu-simple-graph` evaluators, its experimental subpaths, Engine compute helpers, and experimental GPU tables. It assumes familiarity with buffers and typed arrays; the [Core GPU guide](https://luma.gl/next/docs/api-guide/gpu.md) introduces those concepts.

## Mental model[​](#mental-model "Direct link to Mental model")

| Need                                                                   | Start with                                                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Portable lazy vector expressions on CPU, WebGL 2, or WebGPU            | [GPU Evaluations with GPUVectorEvaluator](https://luma.gl/next/docs/api-guide/gpu/gpu-evaluations.md) |
| Primitive GPU chunks, vectors, and memory formats                      | [`@luma.gl/graph/gpu-data`](https://luma.gl/next/docs/api-reference/graph/gpu-data.md)                |
| Batch-preserving GPU tables and schemas                                | [`@luma.gl/graph/gpu-tables`](https://luma.gl/next/docs/api-reference/experimental/gpu-tables.md)     |
| One explicit buffer or texture computation                             | [Engine compute helpers](https://luma.gl/next/docs/api-guide/engine/transforms.md)                    |
| Several dependent WebGPU operations, indirect work, or transient reuse | [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)                          |

For a reusable graph with named runtime inputs, begin with [Getting started with graphs](https://luma.gl/next/docs/api-reference/graph/getting-started.md). `GPUGraph` executes on WebGPU; `GPUSimpleGraph` shares its expression subset on WebGL and WebGPU. The evaluator workflow below is a separate lazy API with evaluator-owned outputs.

## Complete workflow[​](#complete-workflow "Direct link to Complete workflow")

```
import {GPUDataEvaluator, add, cleanEvaluate} from '@luma.gl/graph/gpu-simple-graph';



const values = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});

const adjusted = add(values, GPUDataEvaluator.fromConstant(0.5));

const result = await cleanEvaluate(device, adjusted);
```

Operations stay lazy until evaluation. `cleanEvaluate()` retains the requested output and releases intermediate evaluator results.

## Decisions and tradeoffs[​](#decisions-and-tradeoffs "Direct link to Decisions and tradeoffs")

* Prefer GPGPU evaluators when portability and expression composition matter most.
* Prefer `@luma.gl/graph/gpu-core` when WebGPU-only scheduling, GPU-written work counts, or multi-pass resource planning matter more than backend portability.
* Preserve source chunks in GPU vectors and tables instead of silently repacking streaming data.
* Avoid readback between operations unless the CPU actually needs the result.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Evaluating every intermediate expression separately instead of evaluating the final expression.
* Treating GPU memory layout and shader value types as the same contract.
* Choosing a command graph for a single simple operation that has no scheduling problem to solve.

## Next steps[​](#next-steps "Direct link to Next steps")

* [GPU Evaluations](https://luma.gl/next/docs/api-guide/gpu/gpu-evaluations.md)

* [GPU physics: background and architecture](https://luma.gl/next/docs/api-guide/gpu/gpu-physics.md)

* [Choosing a GPU data-processing API](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md)

* [GPU tables](https://luma.gl/next/docs/api-guide/gpu/gpu-tables.md)

* [Tabular data in WGSL](https://luma.gl/next/docs/api-guide/gpu/tabular-data-in-wgsl.md)

* [GPU floating-point precision](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)
