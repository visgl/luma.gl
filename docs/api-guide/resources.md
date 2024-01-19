# GPU Resources

A key role of the `Device` class is to let the application create GPU resources. 
The main GPU resources that luma.gl applications will typically be creating directly are 
`Buffer` and `Texture` objects. 

However there is a number of other GPU resource objects. These are usually created 
automatically behind the scenes, e.g. by the `Model` and `Transform` classes, but can
be created directly if needed.

## Types of GPU Resources

GPU resources correspond to data on the GPU and/or a state object in the GPU driver.

- Resources that represent actual memory uploaded to the GPU are `Buffer` and `Texture`.
- Resources that hold executable GPU code, such as `Shader`, `Renderpipeline` and `ComputePipeline`.
- Other GPU resources tend to hold validated settings or state (usually these are GPU driver objects rather)

## Creating GPU Resources

The [`Device`](/docs/api-reference/core/device) class provides methods for creating GPU resources

luma.gl provides a consistent API

| Resource creation method                                                               | Description                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `device.createBuffer(props: BufferProps)`<br/>`device.createBuffer(props: ArrayBuffer)`<br/>`device.createBuffer(props:  ArrayBufferView)`    | Create a [`Buffer`](/docs/api-reference/core/resources/buffer).                                                                                        |
| `device.createTexture(props: TextureProps)`<br/> `device.createTexture(Promise<TextureData>)`| Create a [`Texture`](/docs/api-reference/core/resources/texture).                                                                                            |
| `device.createSampler(props: SamplerProps)`                                   | Create a [`Sampler`](/docs/api-reference/core/resources/sampler).                                                                                            |
| `device.createFramebuffer(props: FramebufferProps)`                       | Create a [`Framebuffer`](/docs/api-reference/core/resources/framebuffer).                                                                                    |
| `device.createShader(props: ShaderProps)`                                      | Create a [`Shader`](/docs/api-reference/core/resources/shader).                                                                                              |
| `device.createRenderPipeline(props: RenderPipelineProps)`              | Create a [`RenderPipeline`](/docs/api-reference/core/resources/render-pipeline) (aka program)                                                                |
| `device.createComputePipeline(props: ComputePipelineProps)`           | Create a [`ComputePipeline`](/docs/api-reference/core/resources/compute-pipeline) (aka program)                                                              |
| `beginRenderPass(props: RenderPassProps)`                                  | Create a [`RenderPass`](/docs/api-reference/core/resources/render-pass).                                                                                     |
| `beginComputePass(props?: ComputePassProps)`                              | Create a [`ComputePass`](/docs/api-reference/core/resources/compute-pass) which can be used to bind data and run compute operations using compute pipelines. |
| `getDefaultRenderPass()`                                                   | A default `RenderPass` is provided for applications that don't need to create multiple or specially configured render passes.         |
