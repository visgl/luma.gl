# GPGPU programming

GPU data processing in luma.gl ranges from portable lazy vector operations to higher-level experimental analytical modules. Start with the highest-level API that expresses the workflow cleanly.

## Outcome and prerequisites[​](#outcome-and-prerequisites "Direct link to Outcome and prerequisites")

This guide helps you choose between the stable `@luma.gl/gpgpu` evaluators, its experimental subpaths, Engine compute helpers, and experimental GPU tables. It assumes familiarity with buffers and typed arrays; the [Core GPU guide](https://luma.gl/docs/api-guide/gpu.md) introduces those concepts.

## Mental model[​](#mental-model "Direct link to Mental model")

| Need                                                        | Start with                                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Portable lazy vector expressions on CPU, WebGL 2, or WebGPU | [`@luma.gl/gpgpu`](https://luma.gl/docs/api-reference/gpgpu.md)                                     |
| Primitive GPU chunks, vectors, and memory formats           | [`@luma.gl/gpgpu/gpu-data`](https://luma.gl/docs/api-reference/gpgpu/gpu-data.md)                   |
| Batch-preserving GPU tables and schemas                     | [`@luma.gl/experimental/gpu-tables`](https://luma.gl/docs/api-reference/experimental/gpu-tables.md) |
| One explicit buffer or texture computation                  | [Engine compute helpers](https://luma.gl/docs/api-guide/engine/transforms.md)                       |

## Complete workflow[​](#complete-workflow "Direct link to Complete workflow")

```
import {GPUDataEvaluator, add, cleanEvaluate} from '@luma.gl/gpgpu';



const values = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 1});

const adjusted = add(values, GPUDataEvaluator.fromConstant(0.5));

const result = await cleanEvaluate(device, adjusted);
```

Operations stay lazy until evaluation. `cleanEvaluate()` retains the requested output and releases intermediate evaluator results.

## Decisions and tradeoffs[​](#decisions-and-tradeoffs "Direct link to Decisions and tradeoffs")

* Prefer GPGPU evaluators when portability and expression composition matter most.
* Preserve source chunks in GPU vectors and tables instead of silently repacking streaming data.
* Avoid readback between operations unless the CPU actually needs the result.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Evaluating every intermediate expression separately instead of evaluating the final expression.
* Treating GPU memory layout and shader value types as the same contract.

## Next steps[​](#next-steps "Direct link to Next steps")

* [GPU tables](https://luma.gl/docs/api-guide/gpu/gpu-tables.md)
* [Tabular data in WGSL](https://luma.gl/docs/api-guide/gpu/tabular-data-in-wgsl.md)
* [GPU floating-point precision](https://luma.gl/docs/api-guide/shaders/gpu-floating-point-precision.md)
