# WGSL Support

[Overview](https://luma.gl/next/docs/api-reference/shadertools.md)[ShaderModule](https://luma.gl/next/docs/api-reference/shadertools/shader-module.md)[ShaderPlugin](https://luma.gl/next/docs/api-reference/shadertools/shader-plugin.md)[ShaderPass](https://luma.gl/next/docs/api-reference/shadertools/shader-pass.md)[ShaderAssembler](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)[Shader Parsing](https://luma.gl/next/docs/api-reference/shadertools/shader-info.md)[WGSL](https://luma.gl/next/docs/api-reference/shadertools/wgsl-support.md)[Conventions](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)

`@luma.gl/shadertools` supports WGSL shader assembly in addition to GLSL. For cross-backend authoring guidance, see [Writing Portable Shaders](https://luma.gl/next/docs/api-guide/shaders/writing-portable-shaders.md).

## Recommended Binding Style[​](#recommended-binding-style "Direct link to Recommended Binding Style")

If your WGSL goes through shadertools assembly, use `@binding(auto)` and pass resources by name from JavaScript.

```
struct AppUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var colorTexture: texture_2d<f32>;
@group(0) @binding(auto) var colorTextureSampler: sampler;
```

```
model.setBindings({
  app: uniformBuffer,
  colorTexture: texture
});
```

Shadertools rewrites `@binding(auto)` to concrete binding numbers before the final WGSL is reflected and compiled by WebGPU.

This works for:

* application WGSL passed through `Model` or `ShaderAssembler`
* WGSL contributed by shader modules

## WGSL Assembly Model[​](#wgsl-assembly-model "Direct link to WGSL Assembly Model")

For WGSL, `ShaderAssembler.assembleWGSLShader(...)`:

* resolves shader-module dependencies
* prepends module WGSL source to the application WGSL source
* applies shader injections and preprocessing
* rewrites `@binding(auto)` to concrete bindings
* returns one assembled WGSL shader source string

Unlike the GLSL path, there is no separate vertex/fragment pair in the WGSL assembler API. The input source is one unified WGSL shader containing the entry points needed by the pipeline.

See [`ShaderAssembler`](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md) for the API details.

## Conditional WGSL[​](#conditional-wgsl "Direct link to Conditional WGSL")

WGSL itself has constants rather than a C-style preprocessor. luma.gl preprocesses assembled WGSL before assigning `@binding(auto)`, so inactive resource declarations do not reserve binding numbers.

`Model`, `Computation`, and `ShaderAssembler` accept boolean or numeric `defines`. Supported conditions are `#ifdef NAME`, `#ifndef NAME`, `#if NAME`, `#if !NAME`, `#if defined(NAME)`, `#if !defined(NAME)`, and boolean or numeric literals. Compound expressions such as `A && B` are not supported.

For WGSL assembled from a `Model` or `Computation`, luma.gl also sets `LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS` from `device.limits.maxStorageBuffersInVertexStage`. Use it when a vertex shader has storage-backed and attribute-backed variants:

```
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
@group(0) @binding(auto) var<storage, read> positions: array<vec4<f32>>;
#else
struct VertexInput {
  @location(0) position: vec4<f32>,
};
#endif
```

The inactive branch is removed before WGSL reflection and auto-binding assignment.

## When Explicit Numbers Still Matter[​](#when-explicit-numbers-still-matter "Direct link to When Explicit Numbers Still Matter")

Most users should treat binding numbers as an implementation detail.

The main exception is low-level raw WebGPU WGSL that does not go through shadertools assembly, such as direct `device.createShader(...)` usage. That path still expects standard WGSL with concrete numeric bindings.

For current shadertools parsing, keep `@group(...)`, `@binding(auto)`, and `var ...` on the same line.

## Group `0` Ownership[​](#group-0-ownership "Direct link to group-0-ownership")

Shadertools keeps group `0` easy for applications:

* application-owned group-0 bindings allocate from `0`
* module-owned group-0 bindings allocate from `100+`

That split is mostly relevant for module authors and debugging. Application code should normally just use `@binding(auto)`.

## Debugging Binding Assignments[​](#debugging-binding-assignments "Direct link to Debugging Binding Assignments")

Assembled WGSL includes a comment summary of module-owned binding assignments.

Example:

```
// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
// pbrProjection.pbrProjection -> @group(0) @binding(100)
// skin.skin -> @group(0) @binding(101)
```

`ShaderAssembler.assembleWGSLShader(...)` also returns a structured `bindingTable`, and `Model.getBindingDebugTable()` exposes the same data for WGSL-backed models.

## Relationship To GLSL And WebGL[​](#relationship-to-glsl-and-webgl "Direct link to Relationship To GLSL And WebGL")

`@binding(auto)` is a WGSL-only shadertools feature. GLSL and WebGL continue to use luma.gl's existing logical binding and layout metadata.

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`ShaderAssembler`](https://luma.gl/next/docs/api-reference/shadertools/shader-assembler.md)
* [`Shader Module Conventions`](https://luma.gl/next/docs/api-reference/shadertools/shader-conventions.md)
* [Bind Groups and Bindings Guide](https://luma.gl/next/docs/api-guide/gpu/gpu-bindings.md)
