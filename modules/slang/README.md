# @luma.gl/slang

This package is private and currently available only in the luma.gl repository.

A synchronous, dependency-free TypeScript transpiler from Slang shader source to GLSL and WGSL.
It runs in browsers and Node.js, without a native compiler or WebAssembly runtime.

This package implements a **shader-authoring subset of Slang**. It is not the upstream Slang
compiler and does not claim full language compatibility. Unsupported syntax or lowering raises
`SlangTranspileError` with the source name, line, and column.

```typescript
import {transpileSlang} from '@luma.gl/slang';

const source = `
  [shader("fragment")]
  float4 shade(float2 coordinates : TEXCOORD0) : SV_Target0 {
    return float4(coordinates, 0.0, 1.0);
  }
`;

const shader = transpileSlang(source, {
  target: 'wgsl',
  entryPoint: 'shade',
  locations: {TEXCOORD0: 0}
});
// shader.code is ready for device.createShader({source: shader.code, stage: shader.stage}).
// Use shader.entryPoint when creating the pipeline.
```

## API

`transpileSlang(source, options)` returns `{code, target, entryPoint, stage, reflection, sourceMap}`.

- `target`: `wgsl` or `glsl`.
- `entryPoint`: source function to compile. Required when multiple functions carry `[shader]`.
  Otherwise a single `[shader]` function or a function called `main` is selected.
- `stage`: `vertex`, `fragment`, or `compute`. Required without `[shader]`; must agree with it.
- `glslVersion`: `300 es` (WebGL 2) or `450`. Compute defaults to `450`; rendering defaults to `300 es`.
- `sourceName`: filename used in diagnostics; defaults to `shader.slang`.
- `locations`: semantic-to-location mapping, case insensitive. Use the same explicit mapping when
  separately authored vertex and fragment sources need to link. Automatic locations are assigned
  from the sorted set of user semantics in the source, so unrelated source files may differ.

GLSL entry points are named `main`. WGSL entry points are named `_slang_entry_<source function>`.
Always use the returned `entryPoint`. Names of user types, fields, variables, and helpers are
prefixed to avoid collisions with target language keywords. `reflection.bindings[].shaderName`
identifies the generated resource variable. GLSL buffer bindings also include `blockName`, and
combined texture bindings include the source `sampler` name; standalone sampler bindings are
omitted from GLSL reflection.

Reflection contains flattened `inputs` and `outputs` with original paths, Slang types, semantics,
and target builtins or locations. `bindings` contains original resource names, shader names,
groups, binding indices, kind, and access. Compute reflection also includes `workgroupSize`.
Buffer-backed resources include `layout` with field offsets, sizes, alignments, array strides,
and matrix strides. Member offsets are relative to their containing aggregate. Structured-buffer
reflection describes one element and supplies `elementStride`; plain GLSL uniform globals have
no buffer layout. `texture` describes texture dimension, sample type, component count, and storage
format/access when applicable.

## Packing uniforms and mapping diagnostics

```typescript
import {packSlangUniforms, mapSlangDiagnostic} from '@luma.gl/slang';

const binding = shader.reflection.bindings.find(binding => binding.kind === 'uniform');
if (binding?.layout) {
  const bytes = packSlangUniforms(binding.layout, {
    material: {color: [1, 0.5, 0.25, 1], enabled: true},
    weights: [0.25, 0.75]
  });
  // Upload bytes to the uniform buffer associated with binding.group/binding.binding.
}
const diagnostic = mapSlangDiagnostic(shader.sourceMap, generatedLine, targetCompilerMessage);
```

Values must match the reflected structure: objects for structs, arrays for arrays, and numeric
arrays for vectors/matrices. Matrix values are flattened in Slang row order. Bool values are
stored as 32-bit 0/1 values. Packing is explicit and application-owned; the shader-module plugin
still requires application registration and introduces no static Slang imports or dependencies.

`sourceMap` maps one-based generated lines to original statement/declaration starts. Use
`mapSlangDiagnostic` with a destination compiler's line and message. It returns a source diagnostic
or `undefined` for an unknown line. Columns identify statement starts, not exact expression spans;
generated wrappers/helper lines may map to their associated declaration.

## Supported language

- `float`, `int`, `uint`, `bool`, vectors of width 2–4, float matrices from 2x2 through 4x4,
  structures (including nested structures), and fixed-size array declarators.
- Functions, forward references, overloads, calls, scalar/vector casts, vector/structure constructors,
  row-ordered scalar matrix constructors, and aggregate initializer lists with zero-filled omissions. Only functions reachable from the selected entry point
  are emitted. Recursive functions and overloaded entry points are rejected. Helper and entry-point `out`/`inout`
  parameters are supported; output arguments require an exact type and writable destination.
- Variables, constants, static globals, assignments, component access, indexing, arithmetic,
  comparisons of scalars, logical operators, lazy conditional expressions, writable swizzles, and common mathematical intrinsics such as `mul`,
  `lerp`, `saturate`, `dot`, `cross`, `normalize`, `transpose`, derivatives, and trigonometry.
- Blocks, `if`/`else`, `while`, `for`, `return`, `break`, `continue`, and fragment `discard`.
  Increment/decrement and assignment expressions are supported in statement and loop-update positions.
- `[shader("vertex"|"fragment"|"compute")]`, `[numthreads(x,y,z)]`, and ordinary entry parameters
  and return values. Structure interfaces are flattened into target entry-point wrappers.
- User varying semantics, `SV_Position`, `SV_VertexID`, `SV_InstanceID`, `SV_IsFrontFace`,
  `SV_Depth`, `SV_Target[N]`, `SV_DispatchThreadID`, `SV_GroupID`, `SV_GroupThreadID`, and
  `SV_GroupIndex`. Builtin types and stage/direction are checked.
- Uniform globals, `cbuffer`, `ConstantBuffer<Struct>`, `StructuredBuffer<T>`,
  `RWStructuredBuffer<T>`, `groupshared`, and `GroupMemoryBarrierWithGroupSync`.
- `Texture2D<T>`, `Texture2DArray<T>`, `TextureCube<T>`, `Texture3D<T>`, `SamplerState`,
  `Sample`, `SampleLevel`, and `Load` (except cube loads). Elements can be numeric scalars or vectors.
  Integer textures use `Load`, not filtered sampling. `SamplerComparisonState`, `SampleCmp`, and
  `SampleCmpLevelZero` provide depth comparison sampling.
- `WTexture2D<T>` and `RWTexture2D<T>` support indexed storage writes and read/write loads.
  Declare a matching `[format("rgba8")]` attribute. Supported formats are `rgba8`, `rgba8_snorm`,
  `rgba16f`, `rgba32f`, `rgba32i`, `rgba32ui`, `r32f`, `r32i`, and `r32ui`.
- `[vk::binding(binding, group)]` and `register(bN|tN|sN|uN, spaceN)`. Bindings share a single
  namespace as required by WebGPU, so collisions between, for example, `t0` and `s0` require
  explicit distinct bindings. Unannotated resources receive unused bindings in group zero.

## Target differences and current limits

- GLSL structured buffers and compute require `450`. GLSL 450 supports binding group zero.
  WebGL uniforms are located by their generated names; reflected groups/bindings describe the
  source binding plan. Texture and sampler resources combine into GLSL sampler uniforms,
  and each texture may use only one sampler. The caller applies the sampler state to that texture.
  GLSL ES 300 keeps sampler bindings application-managed; explicit GLSL 450 output emits each
  texture's assigned `layout(binding = N)`, including automatically assigned bindings.
- Float matrices are stored transposed relative to their mathematical Slang dimensions so
  matrix indexing retains row semantics. `mul` reverses matrix operands to preserve the result.
  Applications must pack externally supplied matrices using this row-as-column representation.
- Uniform buffers use a shared std140-compatible layout. WGSL legalizes nested structs, arrays,
  bools, and matrices through separate uniform representations, preserving ordinary local/storage
  value types. Storage bools remain unsupported on both targets.
- WGSL still rejects increments or assignments used as values and component-wise matrix multiplication.
  Aggregate initializer lists require a declared destination type; passing lists directly to overloaded
  functions is unsupported. Overload resolution covers the supported scalar/vector numeric conversions.
- Comparison sampling requires a scalar float texture and a comparison sampler. `SampleCmp` is
  fragment-only; explicit zero-level comparison outside fragment shaders supports 2D textures.
  GLSL depth samplers cannot also perform `Load`, and GLSL zero-level comparisons require 2D textures.
  Array sampling coordinates contain the layer in the final component; loads include a final mip level.
- Storage textures require GLSL 450 and therefore are unavailable on WebGL. WebGPU read/write storage
  formats depend on device capabilities, which the application must request. Compound storage-texture
  assignments and storage-texture elements as `out`/`inout` arguments require explicit load/store steps.
- Imports/includes/macros, namespaces, generics/interfaces, extensions, methods, autodiff,
  inferred types, `switch`, `do`/`while`, atomics, resource arrays, multisampled textures, and
  storage textures other than 2D are not supported.
- This is a transpiler rather than a complete Slang semantic validator. Compile generated source
  on the destination device to validate remaining typing, resource-layout, uniformity, and limits.

The language follows the [Slang language guide](https://shader-slang.org/slang/user-guide/)
and [WGSL target mapping](https://shader-slang.org/slang/user-guide/wgsl-target-specific).

## Development

From the repository root:

```sh
yarn test-node --no-coverage modules/slang
yarn test-headless --no-coverage modules/slang
yarn build
yarn lint fix
```

The GPU tests compile and link a WebGL shader pair, validate WGSL render shaders, and execute
WGSL compute shaders with readback assertions for evaluation order, output parameters, aggregate
initialization, matrix multiplication, and shared uniform packing. Texture tests verify sampling on
both backends and storage writes on WebGPU.

Committed differential fixtures come from official Slang **2026.19** and run without a native compiler.
They compare execution results and uniform offsets/strides. To regenerate them using that compiler:

```sh
SLANGC=/path/to/slangc node scripts/slang/generate-reference.mjs
```

The reference uniform fixture uses numeric `uint` flags because that upstream version emits
non-host-shareable WGSL bool uniform fields. Its numeric ABI and results are compared using the same
packed bytes; separate GPU tests cover this transpiler's bool legalization. These fixtures verify
specific supported cases, not full Slang compatibility.

### Unified WGSL render programs

Use `transpileSlangWGSL(source, options?)` to emit multiple entry points in one WGSL shader
module. By default it selects all `[shader(...)]` functions; `entryPoints` can select a list
of source function names. Shared structs, resources, and helpers are emitted once. The result
contains `code` and `entryPoints`, keyed by source function name, with each generated
`entryPoint`, `stage`, and `reflection`. Pass the generated names to pipeline creation.
The `sourceName` and `locations` options have the same meaning as for `transpileSlang`.
