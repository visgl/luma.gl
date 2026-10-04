---
title: Slang
description: Transpile Slang shader source to GLSL and WGSL using TypeScript.
---

# Slang

This package is private and currently available only in the luma.gl repository.

`@luma.gl/slang` converts a self-contained Slang shader into GLSL or WGSL in TypeScript.
Compilation is synchronous and needs no native or WebAssembly compiler.

The current implementation supports a shader-authoring subset of Slang: scalar/vector/matrix
math, structures, overloaded functions, output parameters, initializer lists, loops, shader
entry-point semantics, uniform and storage buffers, and 2D/array/cube/3D texture sampling. It reports unsupported constructs with source diagnostics. It does
not provide full upstream Slang language compatibility.

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

## Diagnostics and compatibility

`SlangTranspileError.diagnostics` provides the source name, message, offset, line, and column.
Destination-device shader compilation remains necessary to check all typing, layout, and GPU limits.
Use `mapSlangDiagnostic(result.sourceMap, generatedLine, message)` to map destination compiler
errors to original statement starts; columns are approximate at statement granularity.

Uniform buffers support nested structs, arrays, bools, and matrices using a shared std140-compatible
layout. `reflection.bindings[].layout` includes relative member offsets, sizes, alignments, and
array/matrix strides. `packSlangUniforms(layout, values)` produces uploadable bytes from nested
objects/arrays. Supply matrices as flattened row-ordered values. Structured buffers also expose
`elementStride`; ordinary GLSL uniform globals are not buffer-backed and omit `layout`.

Texture reflection describes dimension, sample type, component count, and storage format/access.
Comparison samplers support depth sampling; storage texture writes require explicit formats and
WebGPU or GLSL 450. Applications own resource creation, device feature requests, and plugin registration. GLSL ES 300 texture
bindings are application-managed; explicit GLSL 450 output emits assigned texture binding qualifiers.

See the [package documentation](https://github.com/visgl/luma.gl/blob/master/modules/slang/README.md)
for the complete supported-language list, resource conventions, matrix packing rules, and target
limitations. Imports, generics, interfaces, autodiff, resource arrays, and atomics remain unsupported.

### Unified WGSL render programs

Use `transpileSlangWGSL(source, options?)` to emit multiple entry points in one WGSL shader
module. By default it selects all `[shader(...)]` functions; `entryPoints` can select a list
of source function names. Shared structs, resources, and helpers are emitted once. The result
contains `code` and `entryPoints`, keyed by source function name, with each generated
`entryPoint`, `stage`, and `reflection`. Pass the generated names to pipeline creation.
The `sourceName` and `locations` options have the same meaning as for `transpileSlang`.
