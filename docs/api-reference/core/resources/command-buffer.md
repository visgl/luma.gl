# CommandBuffer

[Resource](https://luma.gl/docs/api-reference/core/resources/resource.md)[Buffer](https://luma.gl/docs/api-reference/core/resources/buffer.md)[CommandBuffer](https://luma.gl/docs/api-reference/core/resources/command-buffer.md)[QuerySet](https://luma.gl/docs/api-reference/core/resources/query-set.md)[Fence](https://luma.gl/docs/api-reference/core/resources/fence.md)[PipelineLayout](https://luma.gl/docs/api-reference/core/resources/pipeline-layout.md)

`CommandBuffer` is an immutable recorded unit of GPU work produced by a [`CommandEncoder`](https://luma.gl/docs/api-reference/core/resources/command-encoder.md). Submit it through the owning `Device`.

**CommandBuffer**

* Creation

  Finish a CommandEncoder

* Ownership

  Owned by the creating device and application

* Usage

  Submit recorded copy, compute, and render commands

* Lifecycle

  Record once; submission behavior is backend-specific

* Compatibility

  Native WebGPU concept with portable luma.gl abstraction

* Cost

  Recording groups work; submission remains an explicit queue boundary

## Common mistake[​](#common-mistake "Direct link to Common mistake")

Do not mutate resources or layouts as if finishing the encoder changed the recorded command contract. Build a new command buffer when the operation sequence changes.

## Related workflow[​](#related-workflow "Direct link to Related workflow")

See [GPU commands](https://luma.gl/docs/api-guide/gpu/gpu-commands.md).
