# PipelineFactory

`PipelineFactory` caches and reuses [`RenderPipeline`](/docs/api-reference/core/resources/render-pipeline) and `ComputePipeline` instances for one device.

It is primarily useful when many models or computations assemble identical pipelines. Reusing those pipelines reduces redundant pipeline creation and works well together with [`ShaderFactory`](/docs/api-reference/engine/shader-factory).

:::info
Pipeline creation involves shader compilation and backend-specific linking work. That cost can become noticeable during startup and whenever applications repeatedly assemble equivalent pipelines on demand.
:::

## Usage

```typescript
import {PipelineFactory} from '@luma.gl/engine';

const pipelineFactory = PipelineFactory.getDefaultPipelineFactory(device);
const pipeline = pipelineFactory.createRenderPipeline({vs, fs, topology: 'triangle-list'});

// Later, when the caller is done with the pipeline:
pipelineFactory.release(pipeline);
```

## Properties

### `device: Device`

Device that owns the cached pipelines.

## Methods

### `PipelineFactory.getDefaultPipelineFactory(device: Device): PipelineFactory`

Returns the default singleton factory stored on the device's engine module state.

### `constructor(device: Device)`

Creates a factory for one device.

### `createRenderPipeline(props: RenderPipelineProps): RenderPipeline`

Returns a render pipeline. If caching is enabled and an equivalent pipeline was already requested, the cached instance is reused and its internal reference count is incremented.

### `createComputePipeline(props: ComputePipelineProps): ComputePipeline`

Equivalent cache-aware constructor for compute pipelines.

### `release(pipeline: RenderPipeline | ComputePipeline): void`

Releases a previously requested pipeline. When the reference count reaches zero, the pipeline is either destroyed or retained depending on `device.props._destroyPipelines`.

## WebGL Notes

- On WebGL, `PipelineFactory` may return different cached `RenderPipeline` wrappers that share one linked `WebGLProgram`.
- Wrapper caching still respects pipeline-level defaults such as `topology`, `parameters`, and layout-related props.
- WebGL link-time props such as `varyings` and `bufferMode` are also respected when determining whether shared programs can be reused.
- This lets WebGL reduce shader-link overhead without changing the per-pipeline behavior seen by direct `RenderPipeline.draw()` callers.
- Device props can tune this behavior:
  - `_cachePipelines` enables wrapper caching.
  - `_sharePipelines` enables shared WebGL program reuse across compatible wrappers.
  - `_destroyPipelines` controls whether unused cached pipelines are destroyed when their reference count reaches zero.

## Eviction

By default, `PipelineFactory` keeps unused cached pipelines alive after their reference count reaches zero. This is intentional: applications often create and destroy the same pipeline shapes repeatedly, and retaining them allows later requests to hit the cache instead of recreating pipeline state.

If an application creates very large numbers of distinct pipelines and cache growth becomes a memory concern, set `device.props._destroyPipelines` to `true`. In that mode, `PipelineFactory.release()` will evict cached pipelines once they become unused, trading memory usage for more frequent pipeline recreation work.

## Remarks

- `PipelineFactory` hashing is based on pipeline inputs and device type, not just object identity.
- Callers that use `createRenderPipeline()` or `createComputePipeline()` directly should pair those calls with `release()` to avoid leaking cached references.
