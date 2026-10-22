# luma.gl glossary

This glossary gives luma.gl terms one canonical definition. Reference pages link here instead of redefining the same concept differently in every module.

## GPU resources and execution[​](#gpu-resources-and-execution "Direct link to GPU resources and execution")

| Term                | Meaning                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**        | A GPU-backed object such as a buffer, texture, sampler, shader, or pipeline. Resources have an explicit owner and lifetime even when another object borrows them. |
| **Ownership**       | Responsibility for destroying an object. A borrowing renderer may use a resource without owning it.                                                               |
| **Binding**         | A connection between a shader-visible name or slot and a buffer, texture, sampler, or other resource.                                                             |
| **Layout**          | The declared memory or binding structure that lets application data agree with shader inputs.                                                                     |
| **Pipeline**        | Compiled render or compute state: shaders plus fixed configuration such as vertex layouts, attachment formats, and depth or blend state.                          |
| **Pass**            | A group of render or compute commands encoded against compatible attachments and pipeline state.                                                                  |
| **Command encoder** | A CPU-side recorder that collects GPU commands before submission.                                                                                                 |
| **Submission**      | Sending a finished command buffer to the GPU queue. Encoding describes work; submission schedules it.                                                             |
| **GPU residency**   | Data being available in GPU-accessible memory without requiring a CPU download or re-upload for the next operation.                                               |

## Scheduling and synchronization[​](#scheduling-and-synchronization "Direct link to Scheduling and synchronization")

| Term                   | Meaning                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data hazard**        | A read/write conflict where one operation depends on data another operation reads or writes. A command graph uses declared accesses to order hazardous operations safely. |
| **Dependency**         | An ordering relationship between operations. It may follow from resource access or be declared explicitly for a semantic reason.                                          |
| **Indirect work**      | A draw or dispatch whose count or arguments are written into a GPU buffer, allowing GPU results to control later GPU work without CPU readback.                           |
| **Transient resource** | Scratch storage whose logical lifetime is limited to part of a compiled workflow and can therefore share physical memory with non-overlapping resources.                  |
| **Aliasing**           | Reusing the same physical allocation for distinct logical resources whose live ranges do not overlap. Writable overlap at the same time is rejected.                      |
| **Readback**           | Copying a GPU result into CPU-visible memory. Readback can introduce synchronization and should be limited to small, explicitly requested results.                        |

## Engine and shaders[​](#engine-and-shaders "Direct link to Engine and shaders")

| Term              | Meaning                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Redraw**        | A request to produce another frame because view, data, animation, or asynchronous GPU state changed. An unchanged view should remain idle. |
| **Shader module** | Reusable WGSL/GLSL source plus its declared dependencies and shader-facing inputs.                                                         |
| **Shader hook**   | A named extension point owned and called by base shader source.                                                                            |
| **Injection**     | Source inserted at a hook or standard assembly location without copying the complete base shader.                                          |
| **Shader plugin** | Optional reusable behavior that can contribute modules, defines, vertex inputs, and injections to a model or computation.                  |

## Related pages[​](#related-pages "Direct link to Related pages")

* [How luma.gl fits together](https://luma.gl/docs/api-guide/luma-layers.md)
* [Core GPU programming](https://luma.gl/docs/api-guide/gpu.md)
* [Shader assembly](https://luma.gl/docs/api-guide/shaders/shader-assembly.md)
* [GPU Core concepts](https://luma.gl/docs/api-reference/experimental/gpu-core/concepts.md)
