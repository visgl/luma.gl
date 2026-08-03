# GPU Resources

[Overview](https://luma.gl/next/docs/api-guide/gpu.md)[Initialization](https://luma.gl/next/docs/api-guide/gpu/gpu-initialization.md)[Resources](https://luma.gl/next/docs/api-guide/gpu/gpu-resources.md)[Data Processing](https://luma.gl/next/docs/api-guide/gpu/gpu-data-processing.md)[Rendering](https://luma.gl/next/docs/api-guide/gpu/gpu-rendering.md)[Antialiasing](https://luma.gl/next/docs/api-guide/gpu/gpu-antialiasing.md)[Parameters](https://luma.gl/next/docs/api-guide/gpu/gpu-parameters.md)

A key role of the `Device` class is to let the application create GPU resources. The main GPU resources that luma.gl applications will typically be creating directly are `Buffer` and `Texture` objects.

However there is a number of other GPU resource objects. These are usually created automatically behind the scenes, e.g. by the `Model`, `BufferTransform`, `TextureTransform`, and `Computation` classes, but can be created directly if needed.

## Types of GPU Resources[​](#types-of-gpu-resources "Direct link to Types of GPU Resources")

GPU resources correspond to data on the GPU and/or a state object in the GPU driver.

* Resources that represent actual memory uploaded to the GPU are `Buffer` and `Texture`.
* Resources that hold executable GPU code, such as `Shader`, `Renderpipeline` and `ComputePipeline`.
* Other GPU resources tend to hold validated settings or state (usually these are GPU driver objects rather)

## Creating GPU Resources[​](#creating-gpu-resources "Direct link to Creating GPU Resources")

The [`Device`](https://luma.gl/next/docs/api-reference/core/device.md) class provides methods for creating GPU resources

luma.gl provides a consistent API

| Resource creation method                                                                                                                    | Description                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `device.createBuffer(props: BufferProps)`<br />`device.createBuffer(props: ArrayBuffer)`<br />`device.createBuffer(props: ArrayBufferView)` | Create a [`Buffer`](https://luma.gl/next/docs/api-reference/core/resources/buffer.md).                                                                                              |
| `device.createTexture(props: TextureProps)`<br />`device.createTexture(Promise<TextureData>)`                                               | Create a [`Texture`](https://luma.gl/next/docs/api-reference/core/resources/texture.md).                                                                                            |
| `device.createSampler(props: SamplerProps)`                                                                                                 | Create a [`Sampler`](https://luma.gl/next/docs/api-reference/core/resources/sampler.md).                                                                                            |
| `device.createFramebuffer(props: FramebufferProps)`                                                                                         | Create a [`Framebuffer`](https://luma.gl/next/docs/api-reference/core/resources/framebuffer.md).                                                                                    |
| `device.createShader(props: ShaderProps)`                                                                                                   | Create a [`Shader`](https://luma.gl/next/docs/api-reference/core/resources/shader.md).                                                                                              |
| `device.createRenderPipeline(props: RenderPipelineProps)`                                                                                   | Create a [`RenderPipeline`](https://luma.gl/next/docs/api-reference/core/resources/render-pipeline.md) (aka program)                                                                |
| `device.createComputePipeline(props: ComputePipelineProps)`                                                                                 | Create a [`ComputePipeline`](https://luma.gl/next/docs/api-reference/core/resources/compute-pipeline.md) (aka program)                                                              |
| `device.createRenderBundleEncoder(props?: RenderBundleEncoderProps)`                                                                        | Create a [`RenderBundleEncoder`](https://luma.gl/next/docs/api-reference/core/resources/render-bundle-encoder.md) for reusable WebGPU render commands.                              |
| `beginRenderPass(props: RenderPassProps)`                                                                                                   | Create a [`RenderPass`](https://luma.gl/next/docs/api-reference/core/resources/render-pass.md).                                                                                     |
| `beginComputePass(props?: ComputePassProps)`                                                                                                | Create a [`ComputePass`](https://luma.gl/next/docs/api-reference/core/resources/compute-pass.md) which can be used to bind data and run compute operations using compute pipelines. |
