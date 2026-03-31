# Overview

`@luma.gl/shadertools` provides:
- a shader module system that enables applications to compose portable shaders from libraries of shader modules
- together with a core library of shader modules that applications can add to their own shaders to add features such as lighting, picking, image processing and more.

For the uniform descriptor syntax used by shader modules, see
[Core Shader Types](/docs/api-reference/core/shader-types).

:::info
The `@luma.gl/shadertools` module only performs textual processing on shader source code. It does not use or depend on the WebGL or WebGPU APIs or any other luma.gl module.
:::

## Features

Shader Modules
- A Shader Module system allowing
- A Shader Pass system allowing simple description and chaining of post processing effects.
- A props to uniforms mapping system
- A selection of shader modules and shader passes

Additional reference pages:

- [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler)
- [`WGSL Support`](/docs/api-reference/shadertools/wgsl-support)
- [`Shader Module Conventions`](/docs/api-reference/shadertools/shader-conventions)

## Built-in Shader Modules

The API reference contains pages for the built-in shader modules exported by `@luma.gl/shadertools`:

- [`random`](/docs/api-reference/shadertools/shader-modules/random)
- [`fp32`](/docs/api-reference/shadertools/shader-modules/fp32)
- [`fp64`](/docs/api-reference/shadertools/shader-modules/fp64)
- [`fp64arithmetic`](/docs/api-reference/shadertools/shader-modules/fp64-arithmetic)
- [`floatColors`](/docs/api-reference/shadertools/shader-modules/float-colors)
- [`picking`](/docs/api-reference/shadertools/shader-modules/picking)
- [`skin`](/docs/api-reference/shadertools/shader-modules/skin)
- [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting)
- [`dirlight`](/docs/api-reference/shadertools/shader-modules/dirlight)
- [`lambertMaterial`](/docs/api-reference/shadertools/shader-modules/lambert-material)
- [`gouraudMaterial`](/docs/api-reference/shadertools/shader-modules/gouraud-material)
- [`phongMaterial`](/docs/api-reference/shadertools/shader-modules/phong-material)
- [`pbrMaterial`](/docs/api-reference/shadertools/shader-modules/pbr-material)

### Shader Injections

A number of shader injection points are defined by the system, letting applications inject custom code into shaders.

### Shader Hooks

To allow shader modules to have more control in the modification of the application's shaders, a set of shader modules can define shader hooks.
