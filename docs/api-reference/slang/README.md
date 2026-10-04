---
title: Slang
description: Experimental Slang shader authoring for WebGL 2 and WebGPU, available from luma.gl v10.
---

import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {SlangShadersExample} from '@site/src/examples';

# Slang

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="version">Since v10</DocumentationBadge>
</DocumentationBadges>

<div style={{margin: '1rem 0'}}>
  <img className="docs-api-card__logo--on-light" src="/img/standards/slang-light.svg" alt="Slang" width="224" height="70" />
</div>

`@luma.gl/slang` converts a self-contained Slang shader to GLSL or WGSL synchronously in
TypeScript. It runs in browsers and Node.js without runtime dependencies, a native compiler or
WebAssembly. The compiler is optional: applications import and register it themselves.

:::caution Experimental API

Available from luma.gl v10. APIs and the supported language subset may change between releases.
This is a practical shader-authoring subset, not the upstream Slang compiler or full language compatibility.

:::

## Install

Install the same v10 or later version as your other luma.gl packages. For prereleases, select the
same prerelease version explicitly. Slang is not available in v9.

```bash
yarn add @luma.gl/slang
```

## Live Slang sculpture

Orbit an animated ray-marched sculpture, change its material and twist, or pause to inspect it.
One Slang shader contains both render entry points and uses reusable Slang distance-field and
material modules. The application supplies compiler registration and uniform packing on both backends.

<SlangShadersExample embedded embeddedHeight={480} showStats={false} />

[Open the sculpture example](/examples/tutorials/slang-shaders), or explore the
[WebGPU particle vortex](/examples/tutorials/slang-particles), which shares one Slang source across
compute, vertex and fragment stages.

## Compile a shader

```typescript
import {transpileSlang} from '@luma.gl/slang';

const shader = transpileSlang(`
  [shader("fragment")]
  float4 shade(float2 coordinates : TEXCOORD0) : SV_Target0 {
    return float4(coordinates, 0.0, 1.0);
  }
`, {
  target: 'wgsl',
  entryPoint: 'shade',
  locations: {TEXCOORD0: 0}
});

const fragmentShader = device.createShader({stage: shader.stage, source: shader.code});
// Use shader.entryPoint when creating a pipeline from fragmentShader.
```

## transpileSlang

`transpileSlang(source, options)` returns generated `code`, `target`, `stage`, the target
`entryPoint`, binding/interface `reflection`, and a generated-line `sourceMap`.

`options.target` is `wgsl` or `glsl`. Select a source function with `options.entryPoint` when
there are multiple `[shader]` entry points. Use `options.stage` for a function without a
`[shader]` attribute. `options.glslVersion` defaults to `300 es` for render shaders and `450`
for compute; storage buffers require `450`. `options.sourceName` customizes diagnostic filenames.

`options.locations` maps semantics to locations. Reuse the same mapping for separately
compiled vertex and fragment source files. Generated resources and user identifiers carry a
prefix to avoid target keyword collisions; use `reflection.bindings[].shaderName` for host bindings.

WGSL entry points are named `_slang_entry_<source function>`; GLSL entry points are `main`.
Use the returned entry-point name instead of assuming the source name is preserved.

## Unified WGSL programs

Use `transpileSlangWGSL(source, options?)` to emit multiple entry points in one WGSL shader
module. By default it selects all `[shader(...)]` functions; `entryPoints` can select a list
of source function names. Shared structs, resources, and helpers are emitted once. The result
contains `code` and `entryPoints`, keyed by source function name, with each generated
`entryPoint`, `stage`, and `reflection`. Pass the generated names to pipeline creation.
The `sourceName` and `locations` options have the same meaning as for `transpileSlang`.

## Use with luma.gl

Core, Engine and Shadertools do not import the compiler. Register an application-owned callback
with `shaderAssembler.addShaderTranspiler(...)`, then use `sourceLanguage: 'slang'` on a `Model`,
`Computation` or reusable `ShaderModule`. The
[sculpture adapter](https://github.com/visgl/luma.gl/blob/master/examples/tutorials/slang-shaders/slang-transpiler.ts)
handles GLSL ES 300 and unified WGSL entry points, and collects reflection for resource bindings.

The separate [`@luma.gl/slang/luma` helpers](/docs/api-reference/slang/reflection) convert compiler
reflection into luma shader layouts, resource names, uniform-buffer layouts and device requirements.
Applications still create resources, request device features, bind textures and samplers, and check limits.
Registering the transpiler does not install those helpers in the framework.

## Compatibility and limits

| Capability | WebGL 2 | WebGPU |
| --- | --- | --- |
| Render shaders | GLSL ES 300 | WGSL |
| Uniform buffers and ordinary texture sampling | Supported | Supported |
| Compute, storage buffers and storage textures | Unavailable | Supported subset |
| Gathers, multisampled loads, 1D/cube-array textures and mip-count queries | Unavailable | Supported subset |

Explicit GLSL 450 output is available for compatible desktop consumers; it is not a WebGL target.
GLSL ES 300 texture bindings remain application-managed. Matrix values are packed in Slang row
order; `mul` provides linear algebra while ordinary matrix arithmetic is component-wise.

The subset includes scalar/vector/float-matrix math, structures, fixed arrays, overloaded functions,
output parameters, initializer lists, inferred `var`/`let` locals, loops, switch fallthrough, entry-point
semantics, uniform/storage buffers and texture operations. Integers are limited to 32 bits. Switch
clause locals cannot be shared across clauses; declare shared locals before the switch. `let` is
immutable, but integer `const` declarations provide compile-time case labels. Return-path and barrier
checks are conservative; synchronized barriers must be unconditional.

Imports, includes, macros, namespaces, generics, interfaces, methods and autodiff are unsupported.
See the [complete supported-language list](https://github.com/visgl/luma.gl/blob/master/modules/slang/README.md#supported-language)
for resource conventions and target-specific limits. Compile generated source on the destination
device to validate remaining typing, layout, uniformity and device limits.

## Uniform packing and diagnostics

Uniform buffers support nested structs, arrays, bools and matrices using a shared std140-compatible
layout. `reflection.bindings[].layout` supplies member offsets, sizes, alignments and array/matrix
strides. `packSlangUniforms(layout, values)` creates uploadable bytes from nested objects and arrays;
matrices use flattened row-ordered values. Structured buffers expose `elementStride`. Plain GLSL
uniform globals are application-managed and have no buffer-backed layout.

`SlangTranspileError.diagnostics` supplies source names, messages, offsets, lines and columns.
`mapSlangDiagnostic(result.sourceMap, generatedLine, message)` maps destination compiler errors to
original statement starts. Columns are approximate; generated wrappers may map to their declaration.

The optional compiler is guarded by bundle-size checks (about 28 KB gzip).
