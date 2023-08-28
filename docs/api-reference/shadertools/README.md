# Overview

`@luma.gl/shadertools` implements a shader module system that lets applications compose shaders from libraries of shader modules.

`@luma.gl/shadertools` also provides a core library of shader modules that applications can add to their own shaders to add features such as lighting, picking, image processing and more.

:::info
The `@luma.gl/shadertools` module performs textual processing on shader source code. It does not use or depend on the WebGL or WebGPU APIs or any other luma.gl module.
:::

:::caution
The current focus is on GLSL however the ambition is to add WGSL support in the near future (which may cause breaking changes).
:::

## Features

Shader Modules
- A Shader Module system allowing
- A Shader Pass system allowing simple description and chaining of post processing effects.
- A props to uniforms mapping system
- A selection of shader modules and shader passes
- A GLSL Version Transpiler (transpiles between GLSL ES 3.00, GLSL ES 1.00).


### Shader Injections

A number of shader injection points

### Shader Hooks

To allow shader modules to have more control in the modification of the application's shaders 
A set of shaders can provide shader hooks.

