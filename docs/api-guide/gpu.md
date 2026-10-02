# Core GPU programming

[Overview](https://luma.gl/docs/api-reference/core.md)[Programming guide](https://luma.gl/docs/api-guide/gpu.md)[Cookbook](https://luma.gl/docs/api-guide/gpu/cookbook.md)

## Outcome[​](#outcome "Direct link to Outcome")

Core gives you explicit control of GPU work without tying the application to raw WebGPU or WebGL 2 objects. After reading this guide, you should be able to answer five questions for any rendering or compute task:

1. Which backend and capabilities does the task require?
2. Which resources must live on the GPU, and who owns them?
3. How does shader code see those resources?
4. Which commands produce the result, and when are they submitted?
5. When can resources be reused, read back, resized, or destroyed?

If you would rather have geometry, shader inputs, pipeline reuse, and redraw tracking managed for you, start with the [Engine guide](https://luma.gl/docs/api-guide/engine.md). Core is the right layer when those details are part of the problem you need to solve.

## Mental model[​](#mental-model "Direct link to Mental model")

A Core application has two kinds of state:

* **Durable GPU state** includes buffers, textures, samplers, shaders, pipelines, and presentation contexts. Create these deliberately, reuse them across frames, and destroy the resources your application owns.
* **Recorded work** includes copies, render passes, compute passes, and command buffers. An encoder records an ordered unit of work; submitting it makes that work eligible to execute.

The `Device` connects the two. It reports capabilities, creates resources and pipelines, starts passes, and submits finished commands. It does not decide what your frame loop should render or when your application should redraw.

```
adapter → device → resources → layouts and bindings → pipeline

                                                    ↓

CPU update → command encoder → render/compute pass → submit → present or read back
```

The important conclusion is that **resources describe what exists; commands describe what happens to it**. Keeping those lifetimes separate makes performance and ownership much easier to reason about.

## Complete workflow[​](#complete-workflow "Direct link to Complete workflow")

### 1. Choose and create a device[​](#1-choose-and-create-a-device "Direct link to 1. Choose and create a device")

Import the adapters your application can use, request `webgpu`, `webgl`, or `best-available`, then inspect features and limits before selecting an implementation path. See [GPU initialization](https://luma.gl/docs/api-guide/gpu/gpu-initialization.md).

### 2. Create owned resources[​](#2-create-owned-resources "Direct link to 2. Create owned resources")

Create buffers for linear data and textures for sampled or renderable images. Declare every usage a resource will need; backends use that information for validation and allocation. Keep ownership explicit so teardown does not destroy borrowed resources. See [GPU resources](https://luma.gl/docs/api-guide/gpu/gpu-resources.md) and [GPU memory](https://luma.gl/docs/api-guide/gpu/gpu-memory.md).

### 3. Describe the shader interface[​](#3-describe-the-shader-interface "Direct link to 3. Describe the shader interface")

Layouts define how bytes become shader values. Bindings connect buffers, textures, samplers, and uniform blocks to that interface. Vertex attributes are one specialized input path; storage buffers are the general WebGPU data path. See [bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md), [memory layouts](https://luma.gl/docs/api-guide/gpu/gpu-memory-layouts.md), and [tabular data in WGSL](https://luma.gl/docs/api-guide/gpu/tabular-data-in-wgsl.md).

### 4. Build reusable pipeline state[​](#4-build-reusable-pipeline-state "Direct link to 4. Build reusable pipeline state")

Compile shaders and fixed rendering or compute state into pipelines. Parameters such as depth, blending, and culling belong to the pipeline or pass according to how frequently they change. See [rendering](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md) and [GPU parameters](https://luma.gl/docs/api-guide/gpu/gpu-parameters.md).

### 5. Encode and submit work[​](#5-encode-and-submit-work "Direct link to 5. Encode and submit work")

Record uploads, copies, render passes, and compute passes in dependency order. Use immediate helpers for isolated updates; use an explicit command encoder when ordering several operations matters. Finish the command buffer and submit it once. See [issuing GPU commands](https://luma.gl/docs/api-guide/gpu/gpu-commands.md).

### 6. Present, read back, and reuse[​](#6-present-read-back-and-reuse "Direct link to 6. Present, read back, and reuse")

Present rendered output through a canvas context, or request an asynchronous readback when the CPU genuinely needs a result. Reuse resources and pipelines between frames; recreate only what changed. Avoid using readback as an ordinary connection between GPU stages.

### 7. Destroy what you own[​](#7-destroy-what-you-own "Direct link to 7. Destroy what you own")

Stop producers first, then destroy application-owned models, pipelines, buffers, textures, and the device. Borrowed resources remain the responsibility of their owner.

## Choose the next page[​](#choose-the-next-page "Direct link to Choose the next page")

| If you need to…                         | Continue with…                                                                 | Conclusion you should reach                                         |
| --------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Open a portable backend                 | [GPU initialization](https://luma.gl/docs/api-guide/gpu/gpu-initialization.md) | Select by required capabilities, not by browser name.               |
| Understand allocation and transfer cost | [GPU memory](https://luma.gl/docs/api-guide/gpu/gpu-memory.md)                 | Keep intermediate data GPU-resident when possible.                  |
| Upload or copy linear data              | [GPU buffers](https://luma.gl/docs/api-guide/gpu/gpu-buffers.md)               | Choose an operation from access pattern and synchronization cost.   |
| Sample or render images                 | [GPU textures](https://luma.gl/docs/api-guide/gpu/gpu-textures.md)             | Format, usage, layout, and sampling must agree.                     |
| Expose data to shaders                  | [GPU bindings](https://luma.gl/docs/api-guide/gpu/gpu-bindings.md)             | A stable ownership convention keeps interfaces composable.          |
| Render into a canvas or texture         | [GPU rendering](https://luma.gl/docs/api-guide/gpu/gpu-rendering.md)           | Reuse resources and pipelines; encode only the work for this frame. |
| Start from a small task                 | [Core GPU cookbook](https://luma.gl/docs/api-guide/gpu/cookbook.md)            | Copy one complete lifecycle, then expand it.                        |

## Decisions and tradeoffs[​](#decisions-and-tradeoffs "Direct link to Decisions and tradeoffs")

* **Core or Engine?** Use Core when resource, binding, pass, or submission behavior is central. Use Engine when the task is naturally one or more reusable models.
* **WebGPU or portable?** Provide both WGSL and GLSL paths when WebGL 2 is a requirement. Do not assume that a WebGPU-only storage or compute feature has a transparent fallback.
* **Immediate helper or encoder?** Prefer a helper for one independent update. Prefer explicit encoding when copies, compute, and rendering must form one ordered submission.
* **Readback or another GPU stage?** Keep data on the GPU unless JavaScript must consume the result. Readbacks introduce latency and may force synchronization.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Creating pipelines, large buffers, or textures on every frame instead of reusing them.
* Omitting a required resource usage and discovering the mismatch only when encoding work.
* Treating byte layout, shader value type, and binding location as the same concept.
* Reading GPU results back merely to decide the next draw or dispatch.
* Destroying borrowed resources, or forgetting to destroy application-owned resources.
* Assuming Core schedules a frame loop or redraw policy; those remain application decisions.

## Next steps[​](#next-steps "Direct link to Next steps")

* Use the [Core GPU cookbook](https://luma.gl/docs/api-guide/gpu/cookbook.md) for short, copyable workflows.
* Use the [Core API overview](https://luma.gl/docs/api-reference/core.md) to map concepts to exact classes.
* Move up to [Engine](https://luma.gl/docs/api-guide/engine.md) when a managed `Model` is a better unit of work.
* Add GPU scheduling when several GPU operations need dependency scheduling, transient reuse, indirect work, or bounded multi-frame execution.
