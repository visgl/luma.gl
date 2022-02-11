# Resources

GPU resources come in a few different flavors

- Resources that represent actual memory uploaded to the GPU are `Buffer` and `Texture`.
- Resources that hold executable GPU code, such as `Shader`, `Renderpipeline` and `ComputePipeline`.
- Other GPU resources tend to hold validated settings or state (usually these are GPU driver objects rather)

## Creating GPU Resources

The [`Device`](../api-reference/device) class provides methods for creating GPU resources

luma.gl provides a consistent API

| Resource creation method                                                               | Description                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `device.createBuffer(props: BufferProps \| ArrayBuffer \| ArrayBufferView): Buffer`    | Create a buffer, Deduces `indexType` if usage.                                                                                        |
| `device.createTexture(props: TextureProps \| Promise<TextureData> \| string): Texture` | Create a [`Texture`](./resources/texture).                                                                                            |
| `device.createSampler(props: SamplerProps): Sampler`                                   | Create a [`Sampler`](./resources/sampler).                                                                                            |
| `device.createFramebuffer(props: FramebufferProps): Framebuffer`                       | Create a [`Framebuffer`](./resources/framebuffer).                                                                                    |
| `device.createShader(props: ShaderProps): Shader`                                      | Create a [`Shader`](./resources/shader).                                                                                              |
| `device.createRenderPipeline(props: RenderPipelineProps): RenderPipeline`              | Create a [`RenderPipeline`](./resources/render-pipeline) (aka program)                                                                |
| `device.createComputePipeline(props: ComputePipelineProps): ComputePipeline`           | Create a [`ComputePipeline`](./resources/compute-pipeline) (aka program)                                                              |
| `beginRenderPass(props: RenderPassProps): RenderPass`                                  | Create a [`RenderPass`](./resources/render-pass).                                                                                     |
| `beginComputePass(props?: ComputePassProps): ComputePass`                              | Create a [`ComputePass`](./resources/compute-pass) which can be used to bind data and run compute operations using compute pipelines. |
| `getDefaultRenderPass(): RenderPass`                                                   | A default `RenderPass` is provided for applications that don't need to create multiple or specially configured render passes.         |
