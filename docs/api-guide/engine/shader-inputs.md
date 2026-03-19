# Shader Inputs

`ShaderInputs` is the engine-side bridge between shader-module props and the
uniform buffers or bindings consumed by a [`Model`](/docs/api-reference/engine/model)
or [`Computation`](/docs/api-reference/engine/compute/computation).

It resolves shader-module dependencies, calls each module's `getUniforms()`
function, keeps per-module uniform values grouped by module name, and separates
uniform values from resource bindings.

## Where Shader Types Fit

`ShaderInputs` relies on shader-module `uniformTypes` declarations to understand
which returned values are uniforms and how nested composite values should be
merged.

For the descriptor syntax and the TypeScript inference rules behind
`uniformTypes`, see [Shader Types](/docs/api-guide/shaders/shader-types).

## Composite Uniforms

`ShaderInputs` preserves the nested JavaScript shape of composite uniforms at the
module boundary. For example, a module can expose a struct or array-of-structs
API while still packing those values into a flat uniform buffer internally.

This is what allows modules like [`lighting`](/docs/api-reference/shadertools/shader-modules/lighting)
to accept `lights: Light[]` even though the underlying uniform buffer uses a
fixed-size trailing array of light structs.

## Related Pages

- [Shader Types](/docs/api-guide/shaders/shader-types)
- [Shader Modules](/docs/api-guide/shaders/shader-modules)
- [ShaderInputs Reference](/docs/api-reference/engine/shader-inputs)
- [UniformStore](/docs/api-reference/core/uniform-store)
- [UniformBufferLayout](/docs/api-reference/core/uniform-buffer-layout)
