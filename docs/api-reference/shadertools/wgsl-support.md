# WGSL Support

`@luma.gl/shadertools` supports WGSL shader assembly in addition to GLSL. The
WGSL path is intentionally conservative: it focuses on composing reusable
module source into a single valid WGSL shader before that shader is reflected
and compiled by the WebGPU backend.

## Core Principles

The current WGSL support in shadertools follows a few important rules:

- shadertools only performs textual assembly on WGSL source
- the final assembled WGSL must be valid WGSL before WebGPU reflection runs
- shader modules can contribute WGSL declarations and helper functions
- bind-group ownership still comes from shader-module binding metadata and the
  assembled WGSL declarations

In practice this means shadertools assembles module WGSL first, then the
assembled source is passed to WebGPU reflection and compilation.

## WGSL Assembly Model

For WGSL, `ShaderAssembler.assembleWGSLShader(...)`:

- resolves shader-module dependencies
- prepends module WGSL source to the application WGSL source
- applies shader injections and preprocessing
- returns one assembled WGSL shader source string

Unlike the GLSL path, there is no separate vertex/fragment pair in the WGSL
assembler API. The input source is expected to be one unified WGSL shader that
contains the entry points needed by the pipeline.

See [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler) for
the API details.

## `@binding(auto)` In Module WGSL

Shadertools now supports WGSL `@binding(auto)` in module-injected WGSL source.
This is a shadertools feature, not standard WGSL syntax.

Example:

```wgsl
@group(0) @binding(auto) var<uniform> pbrProjection: pbrProjectionUniforms;
```

During assembly, shadertools rewrites `auto` to a concrete binding number
before the final WGSL source is reflected by WebGPU.

Current limits:

- WGSL only
- module source only
- not supported in application-authored entry WGSL
- application WGSL still cannot use `@binding(auto)` in v1
- module WGSL supports both `@group(N) @binding(auto) var ...` and
  `@binding(auto) @group(N) var ...` on one line
- the preferred style for module WGSL is `@group(N) @binding(auto) var ...`

If `@binding(auto)` remains unresolved in the final assembled WGSL, assembly
fails before WebGPU reflection.

## Group `0` Ownership

The current WGSL relocation rules are designed to keep group `0` easy for
applications to use directly.

- application-authored explicit group-0 bindings own `0..99`
- shadertools module `@binding(auto)` in group `0` allocates from `100+`
- explicit module-owned group-0 bindings must also be `100+`
- application-authored explicit group-0 bindings at `100+` are rejected

This keeps the ownership split simple:

- the application owns the low explicit slots in group `0`
- shadertools owns relocated module slots above that range

Other groups currently keep their existing explicit numeric bindings unless a
module opts into `@binding(auto)`.

## Debugging Binding Assignments

To make relocation easier to inspect, assembled WGSL now includes a comment
summary of module-owned binding assignments.

Example:

```wgsl
// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
// pbrProjection.pbrProjection -> @group(0) @binding(100)
// skin.skin -> @group(0) @binding(101)
```

`ShaderAssembler.assembleWGSLShader(...)` also returns a structured
`bindingTable`, and `Model.getBindingDebugTable()` exposes the same data for
WGSL-backed models. The comment block remains a convenient source-level summary
for logs, snapshots, and captured assembled WGSL.

## Relationship To GLSL And WebGL

The current relocation behavior does not apply to GLSL.

- GLSL source is not rewritten for binding relocation
- WebGL does not use native WGSL-style binding declarations
- WebGL grouping remains logical and is driven by shader-layout and
  shader-module metadata rather than WGSL annotations

So `@binding(auto)` should currently be treated as a WGSL-only shadertools
feature.

## Related Pages

- [`ShaderAssembler`](/docs/api-reference/shadertools/shader-assembler)
- [`Shader Module Conventions`](/docs/api-reference/shadertools/shader-conventions)
- [Bind Groups and Bindings Guide](/docs/api-guide/gpu/gpu-bindings)
