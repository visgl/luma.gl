---
title: Choosing an Engine compute helper
description: Choose between WebGPU Computation, WebGL 2 BufferTransform, legacy texture transforms, direct Core passes, and GPU scheduling.
---

import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Choosing an Engine compute helper

<EngineDocsTabs group="compute" active="gpu-computations" />

## Outcome

Engine offers small wrappers for bounded GPU computation. Choose one from the backend, data
shape, and number of stages—not merely because all of them are described as “transforms.”

| Need | Preferred API | Backend |
| --- | --- | --- |
| General compute over storage buffers or textures | [`Computation`](/docs/api-reference/engine/compute/computation) | WebGPU |
| Buffer-to-buffer vertex transform feedback | [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform) | WebGL 2 |
| Existing texture-to-texture transform code | [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform) | Compatibility helper; deprecated |
| Exact pass, pipeline, or synchronization control | [Core compute commands](/docs/api-guide/gpu/gpu-commands) | Backend-dependent |
| Several dependent operations with shared resources | GPU scheduling | WebGPU |

The conclusion is intentionally narrow: use an Engine helper for one reusable operation. Move
down to Core for exact control or up to GPU scheduling when the operation becomes a pipeline.

## Mental model

GPU computation is valuable when the output feeds another GPU stage. A CPU readback is not a
normal connection between stages: it introduces latency, synchronization, and data transfer.

```text
GPU input → compute/transform → GPU output → render or next GPU operation
                                      ↘ small, deliberate readback when required
```

The Engine wrappers manage shader assembly and common binding work, but the application still
owns the input/output resources and submission lifecycle.

## WebGPU: `Computation`

`Computation` plays the compute equivalent of `Model`. It assembles WGSL, manages
`ShaderInputs`, creates or reuses a compute pipeline, binds resources, and dispatches into a
caller-owned `ComputePass`.

```ts
import {Computation} from '@luma.gl/engine';

const computation = new Computation(device, {
  source: computeShader,
  bindings: {inputBuffer, outputBuffer}
});

const commandEncoder = device.createCommandEncoder();
computation.predraw(commandEncoder);

const computePass = commandEncoder.beginComputePass();
computation.dispatch(computePass, workgroupCount);
computePass.end();

device.submit(commandEncoder.finish());
```

Use `setBindings()` or shader-module props to update values without reconstructing the
computation. Destroy the computation when its owner is finished.

## WebGL 2: `BufferTransform`

`BufferTransform` wraps transform feedback: a vertex shader reads attributes and captures named
outputs into buffers. It is useful when an existing WebGL 2 workflow needs buffer-to-buffer
processing, but it is not a portable substitute for general WebGPU compute.

```ts
import {BufferTransform} from '@luma.gl/engine';

const transform = new BufferTransform(device, {
  vs: vertexShader,
  outputs: ['outValue'],
  attributes: {inValue: sourceBuffer},
  bufferLayout: [{name: 'inValue', format: 'float32'}],
  vertexCount: valueCount
});

transform.run({
  outputBuffers: {outValue: targetBuffer},
  discard: true
});
```

Keep input and output buffers distinct for one iteration. If an iterative algorithm alternates
buffers, make that swap explicit in application state so ownership remains clear.

## Texture transforms and compatibility

`TextureTransform` renders into a target texture through an internal model and framebuffer. It
remains exported for compatibility but is deprecated. For new code:

- use `Computation` when WebGPU compute and storage textures fit the task;
- use an explicit Core render pass for portable image processing;
- use a Shadertools pass for a reusable screen-space effect.

This avoids designing a new workflow around a compatibility abstraction with a narrower future.

## When the operation becomes a graph

One computation followed by one draw does not require GPU scheduling. A graph becomes useful when the
workflow has several of these properties:

- multiple dependent compute, copy, and render stages;
- temporary resources whose lifetimes can be reused;
- GPU-produced counts that drive indirect dispatch or drawing;
- conditional or resumable work;
- instrumentation or frame budgets across the complete pipeline.

At that point, package the operation as a graph contributor rather than manually coordinating
several Engine helpers.

## Decisions and tradeoffs

- **Portability:** WebGPU `Computation` and WebGL 2 `BufferTransform` express different shader
  models. A portable product may need two implementations, not one abstraction that hides the
  difference.
- **Data shape:** Buffers suit records and arrays; textures suit image neighborhoods and filtered
  sampling.
- **Readback:** Keep results GPU-resident when they feed rendering. Read back only compact
  results that JavaScript must consume.
- **Dispatch size:** Bound work from the actual logical element count and device limits. Large
  global operations may need chunking or a multi-frame graph budget.

## Common mistakes

- Presenting `BufferTransform` as WebGPU compute or `Computation` as a WebGL 2 fallback.
- Reusing a buffer as simultaneous input and output without an explicitly supported in-place
  algorithm.
- Reading every result back before rendering it.
- Rebuilding shaders and pipelines for value-only changes.
- Chaining many helpers manually after the workload has become a dependency graph.

## Related pages

- [`Computation`](/docs/api-reference/engine/compute/computation)
- [`BufferTransform`](/docs/api-reference/engine/compute/buffer-transform)
- [`TextureTransform`](/docs/api-reference/engine/compute/texture-transform)
- GPU scheduling tutorial
