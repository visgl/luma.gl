# Choosing an Engine compute helper

[Workflow](https://luma.gl/next/docs/api-guide/engine/transforms.md)[Computation](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)[BufferTransform](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)[TextureTransform](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)[Swap](https://luma.gl/next/docs/api-reference/engine/compute/swap.md)

## Outcome[​](#outcome "Direct link to Outcome")

Engine offers small wrappers for bounded GPU computation. Choose one from the backend, data shape, and number of stages—not merely because all of them are described as “transforms.”

| Need                                               | Preferred API                                                                                          | Backend                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| General compute over storage buffers or textures   | [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)            | WebGPU                           |
| Buffer-to-buffer vertex transform feedback         | [`BufferTransform`](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)   | WebGL 2                          |
| Existing texture-to-texture transform code         | [`TextureTransform`](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md) | Compatibility helper; deprecated |
| Exact pass, pipeline, or synchronization control   | [Core compute commands](https://luma.gl/next/docs/api-guide/gpu/gpu-commands.md)                  | Backend-dependent                |
| Several dependent operations with shared resources | [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)                      | WebGPU                           |

The conclusion is intentionally narrow: use an Engine helper for one reusable operation. Move down to Core for exact control or up to GPU Core when the operation becomes a pipeline.

## Mental model[​](#mental-model "Direct link to Mental model")

GPU computation is valuable when the output feeds another GPU stage. A CPU readback is not a normal connection between stages: it introduces latency, synchronization, and data transfer.

```
GPU input → compute/transform → GPU output → render or next GPU operation

                                      ↘ small, deliberate readback when required
```

The Engine wrappers manage shader assembly and common binding work, but the application still owns the input/output resources and submission lifecycle.

## WebGPU: `Computation`[​](#webgpu-computation "Direct link to webgpu-computation")

`Computation` plays the compute equivalent of `Model`. It assembles WGSL, manages `ShaderInputs`, creates or reuses a compute pipeline, binds resources, and dispatches into a caller-owned `ComputePass`.

```
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

Use `setBindings()` or shader-module props to update values without reconstructing the computation. Destroy the computation when its owner is finished.

## WebGL 2: `BufferTransform`[​](#webgl-2-buffertransform "Direct link to webgl-2-buffertransform")

`BufferTransform` wraps transform feedback: a vertex shader reads attributes and captures named outputs into buffers. It is useful when an existing WebGL 2 workflow needs buffer-to-buffer processing, but it is not a portable substitute for general WebGPU compute.

```
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

Keep input and output buffers distinct for one iteration. If an iterative algorithm alternates buffers, make that swap explicit in application state so ownership remains clear.

## Texture transforms and compatibility[​](#texture-transforms-and-compatibility "Direct link to Texture transforms and compatibility")

`TextureTransform` renders into a target texture through an internal model and framebuffer. It remains exported for compatibility but is deprecated. For new code:

* use `Computation` when WebGPU compute and storage textures fit the task;
* use an explicit Core render pass for portable image processing;
* use a Shadertools pass for a reusable screen-space effect.

This avoids designing a new workflow around a compatibility abstraction with a narrower future.

## When the operation becomes a graph[​](#when-the-operation-becomes-a-graph "Direct link to When the operation becomes a graph")

One computation followed by one draw does not require GPU Core. A graph becomes useful when the workflow has several of these properties:

* multiple dependent compute, copy, and render stages;
* temporary resources whose lifetimes can be reused;
* GPU-produced counts that drive indirect dispatch or drawing;
* conditional or resumable work;
* instrumentation or frame budgets across the complete pipeline.

At that point, package the operation as a graph contributor rather than manually coordinating several Engine helpers.

## Decisions and tradeoffs[​](#decisions-and-tradeoffs "Direct link to Decisions and tradeoffs")

* **Portability:** WebGPU `Computation` and WebGL 2 `BufferTransform` express different shader models. A portable product may need two implementations, not one abstraction that hides the difference.
* **Data shape:** Buffers suit records and arrays; textures suit image neighborhoods and filtered sampling.
* **Readback:** Keep results GPU-resident when they feed rendering. Read back only compact results that JavaScript must consume.
* **Dispatch size:** Bound work from the actual logical element count and device limits. Large global operations may need chunking or a multi-frame graph budget.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Presenting `BufferTransform` as WebGPU compute or `Computation` as a WebGL 2 fallback.
* Reusing a buffer as simultaneous input and output without an explicitly supported in-place algorithm.
* Reading every result back before rendering it.
* Rebuilding shaders and pipelines for value-only changes.
* Chaining many helpers manually after the workload has become a dependency graph.

## Related pages[​](#related-pages "Direct link to Related pages")

* [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md)
* [`BufferTransform`](https://luma.gl/next/docs/api-reference/engine/compute/buffer-transform.md)
* [`TextureTransform`](https://luma.gl/next/docs/api-reference/engine/compute/texture-transform.md)
* [Core GPU data processing](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md)
* [GPU Core tutorial](https://luma.gl/next/docs/api-reference/experimental/gpu-core/tutorial.md)
