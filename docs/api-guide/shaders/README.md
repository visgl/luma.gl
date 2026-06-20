import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Overview

<ShaderLevelDocsTabs active="overview" />

luma.gl applications must provide the shader source code that will ultimately
run on the GPU. Such code must be provided as WGSL and/or GLSL depending on
which backend(s) are targeted. luma.gl helps assemble that source, bind its
inputs, and run it through the engine APIs.

| Question | Guide page | Main reference pages |
| --- | --- | --- |
| How does luma.gl combine application source with reusable shader code? | [Shader Assembly](/docs/api-guide/shaders/shader-assembly) | [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler), [`ShaderModule`](/docs/api-reference/shadertools/shader-module), [`ShaderPlugin`](/docs/api-reference/shadertools/shader-plugin) |
| How do I let optional features customize a base shader without copying it? | [Writing Customizable Shaders](/docs/api-guide/shaders/writing-customizable-shaders) | [`ShaderPlugin`](/docs/api-reference/shadertools/shader-plugin), [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler) |
| How do I keep one rendering feature available on WebGPU and WebGL 2? | [Writing Portable Shaders](/docs/api-guide/shaders/writing-portable-shaders) | [`Model`](/docs/api-reference/engine/model), [`WGSL Support`](/docs/api-reference/shadertools/wgsl-support) |
| How do I run image effects or other fullscreen texture stages? | [Shader Passes](/docs/api-guide/shaders/shader-passes) | [`ShaderPass`](/docs/api-reference/shadertools/shader-pass), [`ShaderPassRenderer`](/docs/api-reference/engine/passes/shader-pass-renderer) |

Related reference topics:

- [Core Shader Types](/docs/api-reference/core/shader-types) defines the
  descriptors used by `ShaderModule.uniformTypes`.
- [Shader Inputs](/docs/api-guide/engine/shader-inputs) explains the engine-side
  bridge from module props to uniform buffers and bindings.
- [Bind Groups and Bindings](/docs/api-guide/gpu/gpu-bindings) explains named
  shader resources and logical bind groups.

For runnable examples, see the [Shader Modules](/docs/tutorials/shader-modules),
[Shader Hooks](/docs/tutorials/shader-hooks),
[Shader Plugins](/docs/tutorials/shader-plugins), and
[Lighting](/docs/tutorials/lighting) tutorials.
