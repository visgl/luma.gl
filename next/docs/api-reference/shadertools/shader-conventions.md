# Shader Module Conventions

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[ShaderAssembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader Parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

caution

This describes informal conventions that luma.gl applies to its shaders. It is still a work in progress.

## Uniform Blocks[​](#uniform-blocks "Direct link to Uniform Blocks")

Shader modules are increasingly organized around a logical bind-group convention:

| Group | Intended Use                                                               | Typical Examples                                                                                      |
| ----- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `0`   | Core engine-owned per-draw state                                           | `project`, `pbrProjection`, `picking`, `skin`, transform or object data                               |
| `1`   | Application-defined shared state                                           | renderer feature blocks, app-specific environment or simulation state, terrain or dataset-level state |
| `2`   | Lighting and other scene invariants reused across many materials and draws | `lighting`, `dirlight`, shared `ibl`, shadow maps and shadow parameters                               |
| `3`   | Per-material surface state                                                 | `pbrMaterial`, `lambertMaterial`, `phongMaterial`, `gouraudMaterial`, material textures and samplers  |

Postprocessing and effect parameters should generally stay in group `0` for now. They are pass-local state rather than material state, and reusing group `3` for both would make the convention ambiguous.

Projection-style blocks stay in group `0` when they mix camera data with object-dependent matrices such as `modelMatrix` or `normalMatrix`. A pure camera or view-projection block could reasonably live in group `1` or group `2`.

For the current public guidance, see the [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md).

For shader module descriptor fields, see [`ShaderModule`](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md). For passes that run shader modules through an engine renderer, see [`ShaderPass`](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md).
