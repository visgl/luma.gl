# ComputePipeline

:::caution
The luma.gl v9 API is currently in [public review](/docs/public-review) and may be subject to change.
:::

> `ComputePipeline` is only available on WebGPU. Note that you can still perform
> many GPU computations on WebGL using `RenderPipeline`.

A `ComputePipeline` holds a compiled and linked compute shader.

## Members

- `device`: `Device` - holds a reference to the device that created this resource
- `handle`: `unknown` - holds the underlying WebGL or WebGPU object
- `props`: `ComputePipelineProps` - holds a copy of the `ComputePipelineProps` used to create this `ComputePipeline`.

## Methods

### `constructor(props: ComputePipelineProps)`

`ComputePipeline` is an abstract class and cannot be instantiated directly. Create with `device.createComputePipeline(...)`.

### `destroy(): void`

Free up any GPU resources associated with this compute pipeline immediately (instead of waiting for garbage collection).
