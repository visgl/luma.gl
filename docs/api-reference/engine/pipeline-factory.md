# PipelineFactory

`PipelineFactory` caches and reuses [`RenderPipeline`](/docs/api-reference/core/resources/render-pipeline) and `ComputePipeline` instances for one device.

It is primarily useful when many models or computations assemble identical pipelines. Reusing those pipelines reduces redundant pipeline creation and works well together with [`ShaderFactory`](/docs/api-reference/engine/shader-factory).

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

### `cachingEnabled: boolean`

Whether pipeline reuse is enabled for the current device configuration.

### `destroyPolicy: 'unused' | 'never'`

Controls whether released pipelines are destroyed when the reference count reaches zero.

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

Releases a previously requested pipeline. When the reference count reaches zero, the pipeline is either destroyed or retained depending on `destroyPolicy`.

## Remarks

- `PipelineFactory` hashing is based on pipeline inputs and device type, not just object identity.
- Callers that use `createRenderPipeline()` or `createComputePipeline()` directly should pair those calls with `release()` to avoid leaking cached references.
