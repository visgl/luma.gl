# PipelineLayout

[Resource](https://luma.gl/next/docs/api-reference/core/resources/resource.md)[Buffer](https://luma.gl/next/docs/api-reference/core/resources/buffer.md)[CommandBuffer](https://luma.gl/next/docs/api-reference/core/resources/command-buffer.md)[QuerySet](https://luma.gl/next/docs/api-reference/core/resources/query-set.md)[Fence](https://luma.gl/next/docs/api-reference/core/resources/fence.md)[PipelineLayout](https://luma.gl/next/docs/api-reference/core/resources/pipeline-layout.md)

`PipelineLayout` describes the binding groups available to a render or compute pipeline.

**PipelineLayout**

* Creation

  Device.createPipelineLayout()

* Ownership

  Explicit application-owned Core resource

* Usage

  Shared render and compute pipeline binding contract

* Lifecycle

  Create before dependent pipelines; destroy with the owning subsystem

* Compatibility

  Explicit on WebGPU; adapted where supported on WebGL

* Cost

  Prefer stable reusable layouts over per-frame creation

## Common mistake[​](#common-mistake "Direct link to Common mistake")

The pipeline layout and shader binding declarations must describe compatible groups, bindings, visibility, and resource types.

## Related workflow[​](#related-workflow "Direct link to Related workflow")

See [GPU bindings](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md) and [`ShaderLayout`](https://luma.gl/next/docs/api-reference/core/shader-layout.md).
