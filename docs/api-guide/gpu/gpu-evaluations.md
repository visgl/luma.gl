---
title: GPU Evaluations
description: Compose lazy GPU vector expressions while preserving source chunks and controlling evaluation.
---

# GPU Evaluations

`GPUVectorEvaluator` applies a lazy computation to a `GPUVector`. It preserves the vector's
ordered data chunks, so streaming data can stay in its original batches without implicit packing.
Use it to compose supported operations and materialize the result when it is needed.

## Evaluate a vector expression

Given an existing `GPUVector` named `vector` and a luma.gl `device`:

```ts
import {GPUDataEvaluator, GPUVectorEvaluator, add, cleanEvaluate} from '@luma.gl/gpgpu';

const offset = GPUDataEvaluator.fromConstant(0.5);
const adjusted = GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(data =>
  add(data, offset)
);

await cleanEvaluate(device, adjusted);
const result = await adjusted.evaluate(device);
```

`mapGPUData()` describes a transform for each chunk. Constructing the expression does not
immediately dispatch every intermediate operation. Evaluation materializes a `GPUVector`
with the original chunk order and boundaries; evaluating an already materialized expression
reuses its cached result.

`cleanEvaluate()` evaluates the requested roots and releases intermediate evaluator results.
It returns the original evaluator shape, so the example obtains the materialized vector through
`evaluate()`. Keep the root evaluator alive while its output storage is in use.

## Vectors and chunks

A `GPUVector` is an ordered list of `GPUData` chunks. `GPUVectorEvaluator` is the vector-level
entry point; `GPUDataEvaluator` describes the operations inside each chunk. Leaf operations such
as `add()` accept chunk data or data evaluators, which is why the example applies them inside
`mapGPUData()`.

This distinction lets you compose computations without silently combining streaming batches.
Packing remains an explicit choice. See [GPU data processing](/docs/api-guide/gpu/gpu-data-processing)
for the broader choice of APIs.

## Ownership and readback

Evaluators borrow source GPU data. Destroying an evaluator does not destroy borrowed input
chunks or buffers. Automatically allocated operation outputs are owned by their evaluators;
follow the [evaluator ownership rules](/docs/api-reference/gpgpu/gpu-data-evaluator)
when retaining outputs or supplying target buffers.

Keep results on the GPU between operations. Read them back only when the CPU needs their values.

## When to use GPU Graph

Use vector evaluations when supported operations and expression composition express the computation.
Use [GPU Graph](/docs/api-reference/experimental/gpu-core/concepts) when you need explicit
WebGPU scheduling across compute, rendering, and copies, including indirect work and transient
resource planning.

## Related APIs

- [GPUVectorEvaluator reference](/docs/api-reference/gpgpu/gpu-data-evaluator#gpuvectorevaluator)
- [Operation catalog](/docs/api-reference/gpgpu/operations)
- [cleanEvaluate](/docs/api-reference/gpgpu/clean-evaluate)
