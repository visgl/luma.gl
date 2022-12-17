# Overview

`@luma.gl/shadertools` provides:
- a shader module system that enables applications to compose portable shaders from libraries of shader modules
- together with a core library of shader modules that applications can add to their own shaders to add features such as lighting, picking, image processing and more.

:::info
The `@luma.gl/shadertools` module only performs textual processing on shader source code. It does not use or depend on the WebGL or WebGPU APIs or any other luma.gl module.
:::

## Features

Shader Modules
- A Shader Module system allowing
- A Shader Pass system allowing simple description and chaining of post processing effects.
- A props to uniforms mapping system
- A selection of shader modules and shader passes
- A GLSL Version Transpiler (transpiles between GLSL ES 3.00, GLSL ES 1.00).

### Shader Injections

A number of shader injection points are defined by the system, letting applications inject custom code into shaders.

### Shader Hooks

To allow shader modules to have more control in the modification of the application's shaders, a set of shader modules can define shader hooks.
