# Shader Assembly

[Assembly](https://luma.gl/docs/api-guide/shaders/shader-assembly.md)[Customization](https://luma.gl/docs/api-guide/shaders/writing-customizable-shaders.md)[Portability](https://luma.gl/docs/api-guide/shaders/writing-portable-shaders.md)[Passes](https://luma.gl/docs/api-guide/shaders/shader-passes.md)

While it is possible for luma.gl applications to provide complete WGSL or GLSL shaders, a more typical use case is to build up shaders by importing reusable shader code.

Shader assembly is textual composition around application-owned shader source. The application still owns entry points, i.e. the shader **main** functions, attributes, varyings, and the main control flow.

`@luma.gl/shadertools` adds reusable source and extension code before `Model`, `Computation`, or a lower-level pipeline compiles the final shader.

## Assembly Pieces[​](#assembly-pieces "Direct link to Assembly Pieces")

| Piece                     | Owns                                                                                                           | Use it for                                                                                    | Reference                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Application shader source | The shader entry points and primary flow.                                                                      | The WGSL `source` string or GLSL `vs`/`fs` strings supplied by the application.               | [`Model`](https://luma.gl/docs/api-reference/engine/model.md)                                                |
| `ShaderInputs`            | Module props, uniforms, and bindings after assembly.                                                           | Updating typed module props and explicit resource bindings after source assembly.             | [`ShaderInputs`](https://luma.gl/docs/api-reference/engine/shader-inputs.md)                                 |
| `ShaderModule`            | Reusable WGSL/GLSL source, uniform descriptors, bindings, dependencies, and optional injections.               | Importing a static shader library such as picking, lighting, projection, or a helper library. | [`ShaderModule`](https://luma.gl/docs/api-reference/shadertools/shader-module.md)                            |
| `ShaderPlugin`            | Reusable modules, defines, shader-facing vertex inputs, and named injections resolved for one shader language. | Attaching a dynamic, optional shader extension to a `Model` or `Computation`.                 | [`ShaderPlugin`](https://luma.gl/docs/api-reference/shadertools/shader-plugin.md)                            |
| Shader dependency         | Module ordering.                                                                                               | Bringing required modules in before a module that calls them.                                 | [`ShaderModule.dependencies`](https://luma.gl/docs/api-reference/shadertools/shader-module.md#fields)        |
| Define                    | Conditional source selection.                                                                                  | Backend or feature switches evaluated before assembly.                                        | [`WGSL Support`](https://luma.gl/docs/api-reference/shadertools/wgsl-support.md)                             |
| Shader hook               | A named callback emitted by the assembler and called by base shader source.                                    | A deliberate extension point such as `OFFSET_POSITION` or `FILTER_COLOR`.                     | [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md#hooks-and-injections) |
| Injection                 | Ordered source inserted at a named hook or standard anchor.                                                    | Adding declarations or small flow changes without copying the base shader.                    | [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md#hooks-and-injections) |

## Assembly Flow[​](#assembly-flow "Direct link to Assembly Flow")

| Step                          | What happens                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Author base source         | Write unified WGSL for WebGPU, GLSL stage strings for WebGL 2, or both.                                                                                    |
| 2. Attach modules and plugins | Pass `modules` and `plugins` to `Model` or `Computation`, or call `ShaderAssembler` directly.                                                              |
| 3. Resolve composition        | Plugin variants are selected for the active shader language, modules are deduplicated by name, and module dependencies are ordered before their consumers. |
| 4. Apply defines              | Platform, module, plugin, and application defines select active source before final assembly.                                                              |
| 5. Assemble source            | Module source is prepended, hooks are emitted, and ordered injections are applied.                                                                         |
| 6. Relocate WGSL bindings     | Assembled WGSL rewrites `@binding(auto)` declarations to concrete binding numbers.                                                                         |
| 7. Compile and bind           | The engine reflects the assembled source, creates shaders and pipelines, and uses `ShaderInputs` plus explicit bindings at draw or dispatch time.          |

## Choosing The Primitive[​](#choosing-the-primitive "Direct link to Choosing The Primitive")

| Need                                                                                      | Prefer                                 |
| ----------------------------------------------------------------------------------------- | -------------------------------------- |
| Import static reusable functions, uniform blocks, bindings, or dependencies into shaders. | `ShaderModule`                         |
| Expose a callback point owned by a base shader.                                           | Shader hook                            |
| Insert declarations or a short statement at a standard shader anchor.                     | Named injection                        |
| Attach dynamic optional reusable behavior to `Model` or `Computation`.                    | `ShaderPlugin`                         |
| Run a shader module as a fullscreen texture-processing stage.                             | `ShaderPass` with `ShaderPassRenderer` |

Modules and plugins are related but not interchangeable. A module is like a static library import: it contributes reusable shader code and its shader-facing data whenever the shader is assembled. A plugin is a dynamic, optional extension: it can add modules, defines, shader-facing vertex inputs, and injections when a `Model` or `Computation` opts into that behavior. Hooks are the contract a base shader exposes when attached code must participate in its flow.

## Hooks And Standard Anchors[​](#hooks-and-standard-anchors "Direct link to Hooks And Standard Anchors")

Hooks are named functions, while standard anchors are named locations in the source. Base shaders should expose hooks when callers need a stable semantic extension point. Use standard anchors for smaller structural additions.

| Target                             | Meaning                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `vs:HOOK_NAME`                     | Vertex hook registered with the assembler.              |
| `fs:HOOK_NAME`                     | Fragment hook registered with the assembler.            |
| `vs:#decl`, `fs:#decl`             | Declarations near the top of the matching shader stage. |
| `vs:#main-start`, `fs:#main-start` | Statements at the start of the matching main function.  |
| `vs:#main-end`, `fs:#main-end`     | Statements at the end of the matching main function.    |

For the authoring choices behind these extension points, continue with [Writing Customizable Shaders](https://luma.gl/docs/api-guide/shaders/writing-customizable-shaders.md). For exact descriptor fields and examples, use the [`ShaderModule`](https://luma.gl/docs/api-reference/shadertools/shader-module.md), [`ShaderPlugin`](https://luma.gl/docs/api-reference/shadertools/shader-plugin.md), and [`ShaderAssembler`](https://luma.gl/docs/api-reference/shadertools/shader-assembler.md) reference pages.
