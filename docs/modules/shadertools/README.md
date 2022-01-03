# @luma.gl/shadertools

The shadertools module provides an API for describing and composing shaders.

The current focus is on GLSL however the design should allow for WGSL support to eventually be included.

In particular,
- shadertools does not use WebGL or WebGPU API, meaning that it can be used with either (or both, in applications that support both).

## Features

- A GLSL Version Transpiler (transpiles between GLSL ES 4.50, GLSL ES 3.00, GLSL ES 1.00).
- API independent description for external shader entry points (attributes, varyings, uniforms, uniform blocks)
- Utilities for working with Uniform Buffers from JavaScript
- A Shader Module system allowing
- A props to uniforms mapping system
- A Shader Pass system allowing simple description and chaining of post processing effects.
- A selection of shader modules and shader passes
