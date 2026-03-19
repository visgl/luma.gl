# Shader Types Guide

<p class="badges">
  <img src="https://img.shields.io/badge/From-v9.3-blue.svg?style=flat-square" alt="From-v9.3" />
</p>

luma.gl uses portable shader type descriptors across `@luma.gl/core`,
`@luma.gl/engine`, and `@luma.gl/shadertools`.

The canonical descriptor reference now lives in
[Core Shader Types](/docs/api-reference/core/shader-types).

Use that page for:

- primitive uniform descriptors like `'f32'`, `'vec3<f32>'`, and `'mat4x4<f32>'`
- composite uniform descriptors for structs and fixed-size arrays
- `UniformTypes<T>` validation rules
- nested `ShaderInputs` updates and uniform-buffer packing behavior
- canonical array descriptors for uniform buffers

## Where Shader Types Show Up

- [`ShaderModule.uniformTypes`](/docs/api-reference/shadertools/shader-module)
  declares shader-facing layouts
- [`ShaderInputs`](/docs/api-reference/engine/shader-inputs) preserves nested
  app-facing values
- [`UniformStore`](/docs/api-reference/core/uniform-store) and
  [`UniformBufferLayout`](/docs/api-reference/core/uniform-buffer-layout)
  flatten and pack those values for upload

## Related Pages

- [Core Shader Types](/docs/api-reference/core/shader-types)
- [Shader Modules](/docs/api-guide/shaders/shader-modules)
- [ShaderModule Reference](/docs/api-reference/shadertools/shader-module)
- [ShaderInputs Reference](/docs/api-reference/engine/shader-inputs)
- [Vertex Formats](/docs/api-reference/core/vertex-formats)
- [Texture Formats](/docs/api-reference/core/texture-formats)

The nested update is merged by schema before being packed into the backing
uniform buffer.
