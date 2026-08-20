---
title: GPGPU programming
description: Choose and compose luma.gl APIs for portable GPU data processing, GPU tables, and WebGPU command graphs.
---

# GPGPU programming

GPU data processing in luma.gl ranges from portable lazy vector operations to explicitly scheduled
WebGPU command graphs. Start with the highest-level API that expresses the workflow cleanly.

## Outcome and prerequisites

This guide helps you choose between `@luma.gl/gpgpu`, GPU tables, Engine compute helpers, and
experimental GPU Core. It assumes familiarity with buffers and typed arrays; the
[Core GPU guide](/docs/api-guide/gpu) introduces those concepts.

## Mental model

| Need | Start with |
| --- | --- |
| Portable lazy vector expressions on CPU, WebGL 2, or WebGPU | [`@luma.gl/gpgpu`](/docs/api-reference/gpgpu) |
| Batch-preserving GPU columns and schemas | [`@luma.gl/tables`](/docs/api-reference/tables) |
| One explicit buffer or texture computation | [Engine compute helpers](/docs/api-guide/engine/transforms) |
| Several dependent WebGPU operations, indirect work, or transient reuse | [GPU Core](/docs/api-reference/experimental/gpu-core) |

## Complete workflow

```ts
import {GPUDataEvaluator, add, cleanEvaluate} from '@luma.gl/gpgpu';

const values = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});
const adjusted = add(values, GPUDataEvaluator.fromConstant(0.5));
const result = await cleanEvaluate(device, adjusted);
```

Operations stay lazy until evaluation. `cleanEvaluate()` retains the requested output and releases
intermediate evaluator results.

## Decisions and tradeoffs

- Prefer GPGPU evaluators when portability and expression composition matter most.
- Prefer GPU Core when WebGPU-only scheduling, GPU-written work counts, or multi-pass resource
  planning matter more than backend portability.
- Preserve source chunks in GPU tables instead of silently repacking streaming data.
- Avoid readback between operations unless the CPU actually needs the result.

## Common mistakes

- Evaluating every intermediate expression separately instead of evaluating the final expression.
- Treating GPU memory layout and shader value types as the same contract.
- Choosing a command graph for a single simple operation that has no scheduling problem to solve.

## Next steps

- [Choosing a GPU data-processing API](/docs/api-guide/gpu/gpu-data-processing)
- [GPU tables](/docs/api-guide/gpu/gpu-tables)
- [Tabular data in WGSL](/docs/api-guide/gpu/tabular-data-in-wgsl)
- [GPU floating-point precision](/docs/api-guide/shaders/gpu-floating-point-precision)
