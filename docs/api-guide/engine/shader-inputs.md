# Shader Inputs

[Model](https://luma.gl/docs/api-reference/engine/model.md)[Inputs workflow](https://luma.gl/docs/api-guide/engine/shader-inputs.md)[ShaderInputs](https://luma.gl/docs/api-reference/engine/shader-inputs.md)[Materials](https://luma.gl/docs/api-guide/engine/materials.md)

`ShaderInputs` is the engine-side bridge between shader-module props and the uniform buffers or bindings consumed by a [`Model`](https://luma.gl/docs/api-reference/engine/model.md) or [`Computation`](https://luma.gl/docs/api-reference/engine/compute/computation.md).

It resolves shader-module dependencies, calls each module's `getUniforms()` function, keeps per-module uniform values grouped by module name, and separates uniform values from resource bindings.

## Where Shader Types Fit[​](#where-shader-types-fit "Direct link to Where Shader Types Fit")

`ShaderInputs` relies on shader-module `uniformTypes` declarations to understand which returned values are uniforms and how nested composite values should be merged.

For the descriptor syntax and the TypeScript inference rules behind `uniformTypes`, see [Core Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md).

## Composite Uniforms[​](#composite-uniforms "Direct link to Composite Uniforms")

`ShaderInputs` preserves the nested JavaScript shape of composite uniforms at the module boundary. For example, a module can expose a struct or array-of-structs API while still packing those values into a flat uniform buffer internally.

This is what allows modules like [`lighting`](https://luma.gl/docs/api-reference/shadertools/shader-modules/lighting.md) to accept `lights: Light[]` even though the underlying uniform buffer uses a fixed-size trailing array of light structs.

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [Core Shader Types](https://luma.gl/docs/api-reference/core/shader-types.md)
* [Shader Assembly](https://luma.gl/docs/api-guide/shaders/shader-assembly.md)
* [ShaderInputs Reference](https://luma.gl/docs/api-reference/engine/shader-inputs.md)
* [UniformStore](https://luma.gl/docs/api-reference/core/uniform-store.md)
* [ShaderBlockLayout](https://luma.gl/docs/api-reference/core/shader-block-layout.md)
