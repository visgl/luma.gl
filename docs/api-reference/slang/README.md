---
title: Slang 🧪
description: Experimental Slang shader authoring for WebGL 2 and WebGPU, available from luma.gl v10.
---

import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {SlangShadersExample} from '@site/src/examples';

# Slang 🧪

<div style={{margin: '1rem 0'}}>
  <img className="docs-api-card__logo--on-light" src="/img/standards/slang-light.svg" alt="Slang" width="224" height="70" />
</div>

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="version">Since v10</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/slang` transpiles a subset of Slang shader source to WGSL or GLSL. It runs in
browsers and Node.js without runtime dependencies, a native compiler, or WebAssembly.

The package explores a smaller compiler for web applications where download size matters.
Note that the Slang project provides a fully featured [WebAssembly compiler](https://github.com/shader-slang/slang/blob/master/docs/building.md#webassembly-build)
but its large bundle size can be a barrier for web applications.
See the [bundle size comparison](#bundle-size) for measured sizes.

<SlangShadersExample embedded embeddedHeight={480} showStats={false} />

[Open the sculpture example](/examples/tutorials/slang-shaders), or explore the
[WebGPU particle vortex](/examples/tutorials/slang-particles), which shares one Slang source across
compute, vertex and fragment stages.

## Roadmap

:::info

Slang offers a promising solution to a long-standing luma.gl challenge: maintaining
separate WGSL and GLSL implementations of every shader. By rewriting luma.gl shaders in
Slang, we could remove that duplication and generate the language required by the active
GPU backend. The current compiler subset does not yet cover every luma.gl shader.

:::

:::caution[Exploratory]

This module is exploratory; its APIs and supported features may change.

:::

## Features

<div className="slang-feature-table">

| Feature | Support | Comment |
| --- | :---: | --- |
| WGSL output | ✅ | Generate WebGPU shaders from supported Slang source. |
| GLSL 300 output | ✅ | Generate GLSL ES 300 for WebGL 2. |
| GLSL 450 output | ✅ | Generate GLSL 450 for compatible desktop consumers; this is not a WebGL target. |
| Render shaders | ✅ | Vertex and fragment stages target WebGPU and WebGL 2. |
| Compute and storage | ✅ | A supported subset targets WebGPU; these features are unavailable on WebGL 2. |
| Named modules | ✅ | Resolve imports through an application-supplied registry. |
| Native shader integration | ✅ | Supply WGSL or GLSL implementations through native shader contracts. |
| Browser and Node.js | ✅ | The TypeScript compiler runs without a native or WebAssembly dependency. |
| Complete Slang language | ❌ | The compiler implements a subset; see [compatibility and limits](#compatibility-and-limits). |

</div>


## Installation

Install the same v10 or later version as your other luma.gl packages. For prereleases, select the
same prerelease version explicitly. Slang is not available in v9.

```bash
yarn add @luma.gl/slang
```

## Compile your first shader

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

## Compiler options and results

`transpileSlang(source, options)` compiles one entry point. It returns shader `code`,
`target`, `stage`, the generated `entryPoint`, resource and interface `reflection`, and a
`sourceMap` for diagnostics. Public declarations also return optional `exports` metadata.

`options.target` is `wgsl` or `glsl`. Select a source function with `options.entryPoint` when
there are multiple `[shader]` entry points. Set `options.stage` when the function has no
`[shader]` attribute. `options.glslVersion` defaults to `300 es` for render shaders and `450`
for compute; storage buffers require `450`. `options.sourceName` sets the diagnostic filename.

Set `options.omitUnusedResources` to omit inactive WGSL resource declarations when using
automatic pipeline layout discovery. Reflection still includes those resources with zero visibility.

`options.locations` maps semantics to locations. Reuse the same explicit mapping for
separately compiled vertex and fragment shaders; automatically assigned locations can differ
between source files. Generated resources and user identifiers carry a
prefix to avoid target keyword collisions; use `reflection.bindings[].shaderName` for host bindings.

WGSL entry points are named `_slang_entry_<source function>`; GLSL entry points are `main`.
Use the returned entry-point name instead of assuming the source name is preserved.

## Multiple entry points in WGSL

Use `transpileSlangWGSL(source, options?)` to emit multiple entry points in one WGSL shader
module. By default it selects all `[shader(...)]` functions; `entryPoints` can select a list
of source function names. Shared structs, resources, and helpers are emitted once. The result
contains `code` and `entryPoints`, keyed by source function name, with each generated
`entryPoint`, `stage`, and `reflection`. Pass the generated names to pipeline creation.
The `sourceName`, `locations`, `modules` and `exports` options have the same meaning as for `transpileSlang`.

## Integrate with luma.gl

Applications opt into compilation by registering a callback
with `shaderAssembler.addShaderTranspiler(...)`, then use `sourceLanguage: 'slang'` on a `Model`,
`Computation` or reusable `ShaderModule`. The
[sculpture adapter](https://github.com/visgl/luma.gl/blob/master/examples/tutorials/slang-shaders/slang-transpiler.ts)
handles GLSL ES 300 and unified WGSL entry points, and collects reflection for resource bindings.

The [`@luma.gl/slang/luma` helpers](/docs/api-reference/slang/reflection) convert compiler
reflection into luma shader layouts, resource names, uniform-buffer layouts and device requirements.
Applications still create resources, request device features, bind textures and samplers, and check limits.
Registering the transpiler does not install those helpers in the framework.

## Uniform packing and diagnostics

Uniform buffers support nested structs, arrays, bools and matrices using a shared std140-compatible
layout. `reflection.bindings[].layout` supplies member offsets, sizes, alignments and array/matrix
strides. `packSlangUniforms(layout, values)` creates uploadable bytes from nested objects and arrays;
matrices use flattened row-ordered values. Structured buffers expose `elementStride`. Plain GLSL
uniform globals are application-managed and have no buffer-backed layout.

`SlangTranspileError.diagnostics` supplies source names, messages, offsets, lines and columns.
`mapSlangDiagnostic(result.sourceMap, generatedLine, message)` maps destination compiler errors to
original statement starts. Columns are approximate; generated wrappers may map to their declaration.

## Named imports and native shader contracts

Applications supply `modules`, a synchronous `SlangModuleRegistry` mapping exact names to
Slang strings or native contracts. Both compiler functions accept it. `import math.palette;`
looks up the literal key `math.palette`; there is no filesystem, network or package resolution.
Dependencies resolve in source order, once per compilation. Missing modules, cycles and duplicate
symbols produce diagnostics at the original module name and line. Imports must be at module scope.
This subset uses one shared namespace, including transitive dependencies; module visibility,
namespace syntax, quoted paths and Slang access modifiers are not implemented.

A native contract has Slang `declarations` and optional `wgsl`/`glsl` implementations. Imported
contracts need an implementation for the selected target. Function declarations are prototypes;
structures and resources are emitted by the compiler, so implementations must not redeclare them.
`names` optionally maps source declarations to public target names; the default is the source name.
Adapt an existing `ShaderModule` by supplying its target source in the registry, as the sculpture
example does with `valueNoise`. Include that native source once, through the registry.

```typescript
const options = {
  modules: {
    palette: 'float getBrightness(float value) { return value * 0.5; }',
    native: {
      declarations: 'float applyNative(float value);',
      imports: 'float brightnessPublic(float value);',
      wgsl: 'fn applyNative(value: f32) -> f32 { return brightnessPublic(value); }',
      glsl: 'float applyNative(float value) { return brightnessPublic(value); }'
    }
  },
  exports: {getBrightness: 'brightnessPublic'}
};
const shader = transpileSlang(`
  import palette;
  import native;
  [shader("fragment")] float4 main() : SV_Target0 { return float4(applyNative(1)); }
`, {...options, target: 'wgsl'});
```

`exports` maps Slang declarations to explicit public target identifiers. Native `imports` contains
Slang prototypes using those public names. Return types, parameter types and `in`/`out`/`inout`
directions must match an exported Slang helper. The returned optional `exports` record describes
public names and source signatures. Public structs keep field names; every struct used by a public
contract must also be public. Public functions cannot be overloaded. Choose ordinary, distinct
target identifiers starting with a letter, avoiding target keywords and reserved prefixes.
Private generated names are implementation details.

Scalar/vector/matrix values, public structs and fixed arrays use the compiler's target value ABI.
WGSL output parameters use `ptr<function, T>`; GLSL uses `out`/`inout`. Native code can read public
resources, which retain their bindings and conservative visibility even with `omitUnusedResources`.
WGSL structured buffers are arrays; public GLSL 450 structured-buffer blocks expose `data[]`.
GLSL ES 300 textures remain ordinary sampler uniforms with application-managed bindings; standalone
Slang samplers have no GLSL declaration. Depth/comparison texture usage must be established by a
Slang sampling call, since opaque native sampling cannot drive texture inference.

Uniform buffer declarations use the shared std140 representation. Numeric flat fields are directly
accessible by their public names; bools are stored as uints, and arrays/matrices use generated
uniform wrappers in WGSL. Use reflection for host packing and explicit conversions in native code;
public value types and uniform storage representations can differ. Public resource arrays are
unsupported; declare individual resources. Native implementations must be valid for every selected
stage, or applications must choose stage-appropriate registries in their transpiler callback.

The compiler type-checks Slang calls and declared callback contracts. It does not parse or prove that
opaque native implementations match those contracts. Compile the resulting code on the destination
device to validate signatures, stage restrictions, layouts and uniformity. Source maps identify
registry source by its key, native implementations by `<key>.wgsl`/`<key>.glsl`, and callback contracts
by `<key>:imports`. Native implementation lines map directly; generated Slang columns remain approximate.

## Compatibility and limits

<div className="slang-backend-table">

| Capability | WebGPU | WebGL 2 |
| --- | --- | --- |
| Render shaders | ✅ WGSL | ✅ GLSL ES 300 |
| Uniform buffers and ordinary texture sampling | ✅ | ✅ |
| Compute, storage buffers and storage textures | ✅ Subset | ❌ |
| Gathers, multisampled loads, 1D/cube-array textures and mip-count queries | ✅ Subset | ❌ |

</div>

### Language features and boundaries

<div className="slang-feature-table">

| Feature | Support | Comment |
| --- | :---: | --- |
| GLSL 450 | ✅ | Available for compatible desktop consumers; not a WebGL target. |
| GLSL ES 300 texture bindings | ✅ | Bindings remain application-managed. |
| Numeric types and matrix operations | ✅ | Scalar, vector, and float-matrix math is supported; integers are limited to 32 bits. Matrices use Slang row order; `mul` performs linear algebra while ordinary matrix arithmetic is component-wise. |
| Structures, arrays, and functions | ✅ | Structures, fixed arrays, overloads, output parameters, and initializer lists are supported. |
| Local variables and control flow | ✅ | Supports inferred `var` and `let`, loops, and switch fallthrough. `let` is immutable; integer `const` values can provide case labels. Declare shared switch locals before the switch. |
| Entry points and resources | ✅ | Supports entry-point semantics and a subset of uniform buffers, storage buffers, and texture operations. |
| Return paths and barriers | ✅ | Checks are conservative; synchronized barriers must be unconditional. |
| Registry imports | ✅ | Named imports resolve through an application-supplied registry. |
| File imports and preprocessing | ❌ | File imports, includes, and macros are unsupported. |
| Advanced language features | ❌ | Namespaces, generics, interfaces, methods, and autodiff are unsupported. |

</div>

See the [complete supported-language list](https://github.com/visgl/luma.gl/blob/master/modules/slang/README.md#supported-language)
for resource conventions and target-specific limits. Compile generated source on the destination
device to validate remaining typing, layout, uniformity, and device limits.

## Bundle size

| Compiler | Version | Component | Uncompressed | Gzipped |
| --- | --- | --- | ---: | ---: |
| Slang | [v2026.20](https://github.com/shader-slang/slang/releases/tag/v2026.20) | WASM binary | 25.09 MB | 10.29 MB |
| Slang | [v2026.20](https://github.com/shader-slang/slang/releases/tag/v2026.20) | JavaScript wrapper | 154.53 kB | 41.52 kB |
| `@luma.gl/slang` | v10.0.0-alpha.8 | Minified browser bundle | 106.77 kB | 30.34 kB |

The luma.gl figure bundles all runtime exports from the package source with
esbuild 0.28.1, minified for browsers. The Slang figures measure the distributed
WASM and JavaScript files separately; gzip sizes were measured locally at level 9.
The Slang release ZIP is 10.45 MB and includes additional files. These are
not equivalent implementations: the TypeScript compiler supports a smaller Slang
subset, and actual application download sizes depend on bundling and compression.
