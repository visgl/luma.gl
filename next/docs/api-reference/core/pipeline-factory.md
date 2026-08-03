# PipelineFactory

`PipelineFactory` caches and reuses [`RenderPipeline`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md) and [`ComputePipeline`](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md) instances for one device.

It is primarily useful when many models or computations assemble identical pipelines. Reusing those pipelines reduces redundant pipeline creation and works well together with [`ShaderFactory`](https://luma.gl/next/docs/api-reference/core/shader-factory.md).

If you use [`Model`](https://luma.gl/next/docs/api-reference/engine/model.md) or [`Computation`](https://luma.gl/next/docs/api-reference/engine/compute/computation.md), those engine wrappers already use core factories by default. Create a `PipelineFactory` directly when you want explicit cache ownership or when application code creates pipelines without going through engine wrappers.

info

Pipeline creation involves shader compilation and backend-specific linking work. That cost can become noticeable during startup and whenever applications repeatedly assemble equivalent pipelines on demand.

## Usage[​](#usage "Direct link to Usage")

```
import {PipelineFactory} from '@luma.gl/core';

const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(device);
const pipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

// Later, when the caller is done with the pipeline:
pipelineFactory.release(pipeline);
```

## Properties[​](#properties "Direct link to Properties")

### `device: Device`[​](#device-device "Direct link to device-device")

Device that owns the cached pipelines.

## Methods[​](#methods "Direct link to Methods")

### `PipelineFactory.getDefaultPipelineFactory(device: Device): PipelineFactory`[​](#pipelinefactorygetdefaultpipelinefactorydevice-device-pipelinefactory "Direct link to pipelinefactorygetdefaultpipelinefactorydevice-device-pipelinefactory")

Returns the default singleton factory stored on the device's core module state.

### `constructor(device: Device)`[​](#constructordevice-device "Direct link to constructordevice-device")

Creates a factory for one device.

### `createRenderPipeline(props: RenderPipelineProps): RenderPipeline`[​](#createrenderpipelineprops-renderpipelineprops-renderpipeline "Direct link to createrenderpipelineprops-renderpipelineprops-renderpipeline")

Returns a render pipeline. If caching is enabled and an equivalent cached wrapper was already requested, the cached instance is reused and its internal reference count is incremented.

### `createComputePipeline(props: ComputePipelineProps): ComputePipeline`[​](#createcomputepipelineprops-computepipelineprops-computepipeline "Direct link to createcomputepipelineprops-computepipelineprops-computepipeline")

![WebGPU supported](https://img.shields.io/badge/WebGPU-yes-brightgreen.svg?style=flat-square)![WebGL2 not supported](https://img.shields.io/badge/WebGL2-no-red.svg?style=flat-square)

Equivalent cache-aware constructor for compute pipelines.

### `release(pipeline: RenderPipeline | ComputePipeline): void`[​](#releasepipeline-renderpipeline--computepipeline-void "Direct link to releasepipeline-renderpipeline--computepipeline-void")

Releases a previously requested pipeline. When the reference count reaches zero, the pipeline is either destroyed or retained depending on `device.props._destroyPipelines`.

## WebGL Notes[​](#webgl-notes "Direct link to WebGL Notes")

* On WebGL, `PipelineFactory` may return different cached `RenderPipeline` wrappers that share one linked `WebGLProgram`.

* Shared `WebGLProgram` reuse is the primary optimization on WebGL; exact wrapper reuse is secondary.

* Wrapper caching still respects pipeline-level defaults such as `topology`, `parameters`, and layout-related props.

* WebGL link-time props such as `varyings` and `bufferMode` are also respected when determining whether shared programs can be reused.

* This lets WebGL reduce shader-link overhead without changing the per-pipeline behavior seen by direct `RenderPipeline.draw()` callers.

* Device props can tune this behavior:

  <!-- -->

  * `_cachePipelines` enables wrapper caching.
  * `_sharePipelines` enables shared WebGL program reuse across compatible wrappers.
  * `_destroyPipelines` controls whether unused cached pipelines are destroyed when their reference count reaches zero.

## Eviction[​](#eviction "Direct link to Eviction")

By default, `PipelineFactory` keeps unused cached pipelines alive after their reference count reaches zero. This is intentional: applications often create and destroy the same pipeline shapes repeatedly, and retaining them allows later requests to hit the cache instead of recreating pipeline state.

If an application creates very large numbers of distinct pipelines and cache growth becomes a memory concern, set `device.props._destroyPipelines` to `true`. In that mode, `PipelineFactory.release()` will evict cached pipelines once they become unused, trading memory usage for more frequent pipeline recreation work.

## Remarks[​](#remarks "Direct link to Remarks")

* `PipelineFactory` hashing is based on pipeline inputs and device type, not just object identity.
* WebGPU render-pipeline caching tracks immutable descriptor-shaping inputs such as shader sources, entry points, layouts, parameters, topology, buffer layout, and attachment formats.
* Callers that use `createRenderPipeline()` or `createComputePipeline()` directly should pair those calls with `release()` to avoid leaking cached references.
* The exported `PipelineFactoryProps` type is currently an alias of [`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md#renderpipelineprops).
