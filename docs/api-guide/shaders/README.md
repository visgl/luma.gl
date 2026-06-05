import {ShaderLevelDocsTabs} from '@site/src/components/docs/shader-level-docs-tabs';

# Overview

<ShaderLevelDocsTabs active="overview" />

Shader-Level Programming is where luma.gl applications define the shader source
that ultimately runs on the GPU. luma.gl does not replace shader authoring with
a scene language or code generator: applications still provide explicit WGSL
and/or GLSL source, then use luma.gl APIs to assemble, bind, and run that source
portably.

Portable applications usually keep matching shader sources for both backends:

- WebGPU uses WGSL, commonly as one unified source string containing the entry
  points needed by the pipeline.
- WebGL 2 uses GLSL ES 3.00, commonly as separate vertex and fragment shader
  source strings.
- `Model` and `ShaderAssembler` accept those sources directly and combine them
  with shader modules, hooks, injections, defines, and binding metadata.

`@luma.gl/shadertools` helps applications organize shader code without hiding
the shader program. Its shader assembler can prepend reusable module source,
resolve module dependencies, apply injections, and, for assembled WGSL, rewrite
`@binding(auto)` declarations to concrete binding numbers before WebGPU compiles
the final shader.

Use this guide when deciding how to structure application shader source:

- [Shader Modules](/docs/api-guide/shaders/shader-modules) package reusable WGSL
  and GLSL snippets plus their uniforms, bindings, and dependencies.
- [Shader Hooks](/docs/api-guide/shaders/shader-hooks) let base shaders expose
  named extension points that attached modules can customize.
- [Shader Types](/docs/api-guide/shaders/shader-types) points to the canonical
  descriptors used for shader-facing uniform layouts.

For runnable examples, see the [Shader Modules](/docs/tutorials/shader-modules),
[Shader Hooks](/docs/tutorials/shader-hooks), and [Lighting](/docs/tutorials/lighting)
tutorials. For API details, see [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler),
[`ShaderModule`](/docs/api-reference/shadertools/shader-module), and
[`WGSL Support`](/docs/api-reference/shadertools/wgsl-support).
