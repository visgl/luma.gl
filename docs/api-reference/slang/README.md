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

`@luma.gl/slang` converts Slang shader source and named registry modules to GLSL or WGSL synchronously in
TypeScript. It runs in browsers and Node.js without runtime dependencies, a native compiler or
WebAssembly. The compiler is optional: applications import and register it themselves.

> **Experimental API.** Available from luma.gl v10. APIs and the supported language subset may
> change between releases. This package implements a practical shader-authoring subset and does
> not provide full upstream Slang language compatibility.

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
Select **Show shaders** to compare the main source and reusable modules with the generated WGSL
or GLSL ES 300 code used by the active renderer. **Native grain** controls a direct call into the existing `valueNoise` shader module. Native code
calls an explicitly exported Slang helper through a typed contract.

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
`entryPoint`, binding/interface `reflection`, and a generated-line `sourceMap`. Explicit public declarations also return `exports`.

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
The `sourceName`, `locations`, `modules` and `exports` options have the same meaning as for `transpileSlang`.

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

## Named imports and native shader contracts

Applications supply `modules`, a synchronous `SlangModuleRegistry` mapping exact names to
Slang strings or native contracts. Both compiler functions accept it. `import math.palette;`
looks up the literal key `math.palette`; there is no filesystem, network or package resolution.
Dependencies resolve in source order, once per compilation. Missing modules, cycles and duplicate
symbols produce diagnostics at the original module name and line. Imports must be at module scope.
This subset uses one shared namespace, including transitive dependencies; module visibility,
namespace syntax, quoted paths and upstream access modifiers are not implemented.

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

File imports, includes, macros, namespaces, generics, interfaces, methods and autodiff are unsupported.
Named imports resolve only through the application-supplied registry.
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

The optional compiler is guarded by bundle-size checks (about 30 KB gzip).
