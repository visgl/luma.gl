# Create and own GPU resources

[Initialization](https://luma.gl/docs/api-guide/gpu/gpu-initialization.md)[Resources](https://luma.gl/docs/api-guide/gpu/gpu-resources.md)[Data processing](https://luma.gl/docs/api-guide/gpu/gpu-data-processing.md)

## Outcome[​](#outcome "Direct link to Outcome")

GPU resources are durable objects used by one or more submissions. Create them outside the per-frame path when possible, declare every intended usage, reuse them while their contract is stable, and destroy the resources your application owns.

Passes and command encoders are different: they record a unit of work and are not durable scene state.

## Resource families[​](#resource-families "Direct link to Resource families")

| Family                      | Purpose                                                        | Typical lifetime                                                 |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| Data                        | `Buffer`, `Texture`, `Sampler`, `ExternalTexture`              | Reused while the underlying data or source is valid              |
| Executable state            | `Shader`, `RenderPipeline`, `ComputePipeline`                  | Reused across compatible draws or dispatches                     |
| Render targets              | `Framebuffer`, texture views, presentation contexts            | Reused until size, format, or attachment set changes             |
| Synchronization and queries | `Fence`, `QuerySet`                                            | Scoped to the measurements or completion tracking they represent |
| Recorded work               | `CommandEncoder`, `RenderPass`, `ComputePass`, `CommandBuffer` | Created, finished, and submitted as one bounded unit of work     |

Engine classes such as `Model`, `Computation`, and transform helpers create some of these Core resources internally. The ownership rule remains the same: destroying the Engine owner releases the resources it created; externally supplied resources remain caller-owned unless the exact API states otherwise.

## Complete lifecycle[​](#complete-lifecycle "Direct link to Complete lifecycle")

1. **Choose the contract.** Decide format, byte size, dimensions, usage, and backend compatibility before allocation.
2. **Create.** Use the matching `Device` factory or pass-begin method.
3. **Initialize.** Upload data immediately or encode an ordered copy.
4. **Bind and use.** Connect the resource to compatible layouts, pipelines, and passes.
5. **Update or reuse.** Change contents without reallocating when the resource contract remains valid.
6. **Replace deliberately.** Recreate when size, format, usage, or another structural property changes.
7. **Destroy owned resources.** Stop work that may reference them, then release them once.

## Creation map[​](#creation-map "Direct link to Creation map")

| API                                     | Creates or begins                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `device.createBuffer(...)`              | [`Buffer`](https://luma.gl/docs/api-reference/core/resources/buffer.md)                             |
| `device.createTexture(...)`             | [`Texture`](https://luma.gl/docs/api-reference/core/resources/texture.md)                           |
| `device.createSampler(...)`             | [`Sampler`](https://luma.gl/docs/api-reference/core/resources/sampler.md)                           |
| `device.createFramebuffer(...)`         | [`Framebuffer`](https://luma.gl/docs/api-reference/core/resources/framebuffer.md)                   |
| `device.createShader(...)`              | [`Shader`](https://luma.gl/docs/api-reference/core/resources/shader.md)                             |
| `device.createRenderPipeline(...)`      | [`RenderPipeline`](https://luma.gl/docs/api-reference/core/resources/render-pipeline.md)            |
| `device.createComputePipeline(...)`     | [`ComputePipeline`](https://luma.gl/docs/api-reference/core/resources/compute-pipeline.md)          |
| `device.createCommandEncoder(...)`      | [`CommandEncoder`](https://luma.gl/docs/api-reference/core/resources/command-encoder.md)            |
| `commandEncoder.beginRenderPass(...)`   | [`RenderPass`](https://luma.gl/docs/api-reference/core/resources/render-pass.md)                    |
| `commandEncoder.beginComputePass(...)`  | [`ComputePass`](https://luma.gl/docs/api-reference/core/resources/compute-pass.md)                  |
| `device.createRenderBundleEncoder(...)` | [`RenderBundleEncoder`](https://luma.gl/docs/api-reference/core/resources/render-bundle-encoder.md) |

Some convenience methods begin a pass through the device’s current encoder. Prefer an explicit encoder when copies, compute, and rendering need one visible ordering and submission boundary.

## Ownership questions to answer[​](#ownership-questions-to-answer "Direct link to Ownership questions to answer")

For each resource, make these decisions explicit:

* Who calls `destroy()`?
* May another object retain or borrow it?
* Can in-flight GPU work still reference it?
* Does resizing or reconfiguration replace it?
* Does a cache or factory share it across models?

Resource sharing is useful only when ownership remains unambiguous. Passing a buffer into another object does not automatically transfer ownership.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Allocating a new resource for a contents-only update.
* Omitting a usage needed by a later copy, binding, or render attachment.
* Treating passes and encoders as reusable resources after they are ended or finished.
* Destroying caller-supplied resources from a wrapper that only borrowed them.
* Retaining size-dependent framebuffers or textures after the canvas size changed.

## Next steps[​](#next-steps "Direct link to Next steps")

* [GPU memory](https://luma.gl/docs/api-guide/gpu/gpu-memory.md) explains transfer and readback cost.
* [Bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md) connects resources to shader interfaces.
* [Issuing GPU commands](https://luma.gl/docs/api-guide/gpu/gpu-commands.md) explains recording and submission.
* [`Resource`](https://luma.gl/docs/api-reference/core/resources/resource.md) defines the shared resource contract.
