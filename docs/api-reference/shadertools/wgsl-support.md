# WGSL Support

`@luma.gl/shadertools` supports WGSL shader assembly in addition to GLSL.

## Recommended Binding Style

If your WGSL goes through shadertools assembly, use `@binding(auto)` and pass
resources by name from JavaScript.

```wgsl
struct AppUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var colorTexture: texture_2d<f32>;
@group(0) @binding(auto) var colorTextureSampler: sampler;
```

```ts
model.setBindings({
  app: uniformBuffer,
  colorTexture: texture
});
```

Shadertools rewrites `@binding(auto)` to concrete binding numbers before the
final WGSL is reflected and compiled by WebGPU.

This works for:

- application WGSL passed through `Model` or `ShaderAssembler`
- WGSL contributed by shader modules

## WGSL Assembly Model

For WGSL, `ShaderAssembler.assembleWGSLShader(...)`:

- resolves shader-module dependencies
- prepends module WGSL source to the application WGSL source
- applies shader injections and preprocessing
- rewrites `@binding(auto)` to concrete bindings
- returns one assembled WGSL shader source string

Unlike the GLSL path, there is no separate vertex/fragment pair in the WGSL
assembler API. The input source is one unified WGSL shader containing the
entry points needed by the pipeline.

See [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler) for
the API details.

## When Explicit Numbers Still Matter

Most users should treat binding numbers as an implementation detail.

The main exception is low-level raw WebGPU WGSL that does not go through
shadertools assembly, such as direct `device.createShader(...)` usage. That
path still expects standard WGSL with concrete numeric bindings.

For current shadertools parsing, keep `@group(...)`, `@binding(auto)`, and
`var ...` on the same line.

## Group `0` Ownership

Shadertools keeps group `0` easy for applications:

- application-owned group-0 bindings allocate from `0`
- module-owned group-0 bindings allocate from `100+`

That split is mostly relevant for module authors and debugging. Application
code should normally just use `@binding(auto)`.

## Debugging Binding Assignments

Assembled WGSL includes a comment summary of module-owned binding assignments.

Example:

```wgsl
// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
// pbrProjection.pbrProjection -> @group(0) @binding(100)
// skin.skin -> @group(0) @binding(101)
```

`ShaderAssembler.assembleWGSLShader(...)` also returns a structured
`bindingTable`, and `Model.getBindingDebugTable()` exposes the same data for
WGSL-backed models.

## Relationship To GLSL And WebGL

`@binding(auto)` is a WGSL-only shadertools feature. GLSL and WebGL continue to
use luma.gl's existing logical binding and layout metadata.

## Related Pages

- [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler)
- [`Shader Module Conventions`](/docs/api-reference/shadertools/shader-conventions)
- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
