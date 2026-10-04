# @luma.gl/slang

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../website/static/img/standards/slang.svg" />
  <img src="../../website/static/img/standards/slang-light.svg" alt="Slang" width="224" height="70" />
</picture>

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
- `omitUnusedResources`: omit inactive resource declarations from WGSL, for automatic pipeline
  scanners. Reflection still includes their source bindings with zero visibility. Defaults to false.
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
groups, binding indices, kind, and access. Compute reflection also includes `workgroupSize` and declared `workgroupStorageSize` in bytes
(WGSL rounds each shared allocation to 16 bytes). Compare these with the device limits.
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
  row-ordered scalar matrix constructors, and aggregate initializer lists with zero-filled omissions.
  A single scalar in a vector initializer list broadcasts to every component. Only functions reachable from the selected entry point
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
  `RWStructuredBuffer<T>`, `groupshared`, `ByteAddressBuffer` and `RWByteAddressBuffer`.
  Integer `InterlockedAdd`, `And`, `Or`, `Xor`, `Min`, `Max`, `Exchange`, `CompareExchange` and
  `CompareStore` operate on groupshared `int`/`uint` scalars/arrays and RW integer buffer elements.
  Original-value output arguments are supported. WGSL retries weak compare/exchange failures to
  preserve Slang's strong compare/exchange behavior. Ordinary reads/writes of atomic-backed storage
  use atomic load/store; compound assignments remain ordinary load/modify/store operations.
- Byte-address buffers expose `Load`/`Load2`/`Load3`/`Load4`, `Store` variants, `GetDimensions`,
  and RW `Interlocked` methods. Offsets are bytes and must be four-byte aligned; literal misaligned
  offsets are diagnosed and the application must align dynamic offsets. `asfloat`, `asint` and
  `asuint` reinterpret 32-bit scalar/vector bits.
- `GroupMemoryBarrierWithGroupSync`, `DeviceMemoryBarrierWithGroupSync` and
  `AllMemoryBarrierWithGroupSync` provide compute synchronization. Barriers, including helper calls
  that contain them, must be unconditional: conditional/loop barriers, short-circuit barrier calls,
  and early returns in synchronized functions are diagnosed. This conservative subset avoids a full
  uniformity-analysis dependency. Non-synchronizing memory barriers are not supported.
- `Texture1D<T>`, `Texture2D<T>`, `Texture2DArray<T>`, `TextureCube<T>`, `TextureCubeArray<T>`, `Texture3D<T>`, `SamplerState`,
  `Sample`, `SampleLevel`, `SampleBias`, `SampleGrad`, and `Load` (except cube loads). Elements can be numeric scalars or vectors.
  Integer textures use `Load` or gathers, not filtered sampling. 1D textures support `SampleLevel`
  and loads; implicit sampling and gradients on 1D textures are outside the portable subset. `SamplerComparisonState`, `SampleCmp`, and
  `SampleCmpLevelZero` provide depth comparison sampling.
- `Texture2DMS<T>` supports `Load(int2 coordinates, int sample)` and dimension/sample-count queries.
  `GetDimensions` supports integer output parameters: dimensions/layers, optional mip plus level count
  for sampled textures, and sample count for multisampled textures. `Gather`/`GatherRed`/`GatherGreen`/
  `GatherBlue`/`GatherAlpha` return four selected channel values on 2D/cube textures, including array
  views; `GatherCmp` compares four depth values. Optional texel offsets and LOD queries are unsupported.
- Fixed texture and sampler resource arrays (at most 16 elements) become contiguous individual
  bindings, with names such as `images[0]` and `resourceArray: {name, index, length}` in reflection.
  Literal sampler indices are supported. Dynamic texture selection dispatches to individual bindings
  and requires `SampleLevel`, `SampleGrad`, loads, queries or storage writes. Out-of-range dynamic
  reads return zero and writes/queries do nothing. Dynamic sampler selection is unsupported.
- `WTexture` and `RWTexture` resources with 1D, 2D, 2DArray and 3D dimensions support indexed storage
  writes and read/write loads.
  Declare a matching `[format("rgba8")]` attribute. Supported formats are `rgba8`, `rgba8_snorm`,
  `rgba16f`, `rgba32f`, `rgba32i`, `rgba32ui`, `r32f`, `r32i`, and `r32ui`.
- `[vk::binding(binding, group)]` and `register(bN|tN|sN|uN, spaceN)`. Bindings share a single
  namespace as required by WebGPU, so collisions between, for example, `t0` and `s0` require
  explicit distinct bindings. Unannotated resources receive unused bindings in group zero.

## Target differences and current limits

- GLSL structured buffers and compute require `450`. GLSL 450 supports binding group zero.
  WebGL uniforms are located by their generated names; reflected groups/bindings describe the
  source binding plan. Texture and sampler resources combine into GLSL sampler uniforms,
  with a separate generated uniform for each texture/sampler pair. The first source pair retains
  the texture name; additional pairs use reflected names such as `image#linearSampler` and include
  the original `sampler`. Pair names/bindings remain stable across separately compiled stages.
  The caller binds the texture view and sampler state to each reflected uniform.
  Unused GLSL texture declarations are omitted so stages link without conflicting inactive sampler types.
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
- Comparison sampling requires a scalar float texture and a comparison sampler. Texture usage is
  inferred from the selected entry point and its resolved helpers. A shared texture cannot mix
  comparison and ordinary sampling, including across unified entry points. `SampleCmp` is
  fragment-only; explicit zero-level comparison outside fragment shaders supports 2D textures.
  GLSL depth samplers cannot also perform `Load`, and GLSL zero-level comparisons require 2D textures.
  Array sampling coordinates contain the layer in the final component; loads include a final mip level.
- 1D/cube-array/multisampled textures and gathers require GLSL 450 and are unavailable on WebGL 2.
  Mip-count queries require GLSL 450; dimension-only queries and explicit gradients work in ES 300.
- Storage textures require GLSL 450 and therefore are unavailable on WebGL. WebGPU read/write storage
  formats depend on device capabilities, which the application must request. Compound storage-texture
  assignments and storage-texture elements as `out`/`inout` arguments require explicit load/store steps.
- Imports/includes/macros, namespaces, generics/interfaces, extensions, methods, autodiff,
  inferred types, `switch`, `do`/`while`, floating-point/struct-member atomics, typed byte-address
  loads, dynamic sampler arrays, and multisampled array textures are not supported.
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

## Optional luma reflection helpers

Import these helpers from `@luma.gl/slang/luma`. This separate entry point consumes existing
compiler reflection; it does not parse generated WGSL, import luma at runtime, or add any
package dependencies. The compiler entry point does not import these helpers.

- `getSlangShaderLayout(compiled, options?)` returns a structurally compatible luma `ShaderLayout`:
  vertex attributes, active resource bindings, stage visibility, uniform buffer sizes,
  storage access, texture dimensions/sample types/formats, and comparison sampler types.
- `getSlangBindingNames(compiled)` maps active source resource names to generated binding names,
  including GLSL block names and combined texture/sampler uniforms.
- `getSlangUniformBufferLayouts(compiled)` returns each active source uniform buffer's generated
  `name`, `byteLength`, and packing `layout`. Use the existing `packSlangUniforms` to upload values.
- `getSlangShaderRequirements(compiled)` reports compute/storage buffer usage, the actual GLSL
  version, declared storage texture formats/access, required WGSL language features, and
  optional WebGPU device features. `unsupportedStorageTextures` lists active bindings with
  unsupported WebGPU storage access.

`compiled` may be a `transpileSlang` result, a unified `transpileSlangWGSL` result, or an array
of separately compiled render stages using the same target/version and compatible resource slots.
For pipeline layouts, select one entry point per stage and compile compute separately from render.
Shared bindings combine visibility without modifying source reflection. Reflection visibility is
`1` for vertex, `2` for fragment, `4` for compute, or `0` when unused by that entry point.
Usage includes resolved reachable helper overloads and respects local variable shadowing; it does
not perform constant-condition elimination.

```typescript
import {transpileSlang, packSlangUniforms} from '@luma.gl/slang';
import {
  getSlangShaderLayout,
  getSlangBindingNames,
  getSlangUniformBufferLayouts,
  getSlangShaderRequirements
} from '@luma.gl/slang/luma';

const compiled = transpileSlang(source, {target: 'wgsl', stage: 'compute'});
const requirements = getSlangShaderRequirements(compiled);
// Check requirements.deviceFeatures before device creation and request them explicitly.
// Check requirements.wgslLanguageFeatures against navigator.gpu.wgslLanguageFeatures.
// Reject requirements.unsupportedStorageTextures when nonempty.
// Check storage texture format/access support on the destination device.
const uniform = getSlangUniformBufferLayouts(compiled).settings;
const uniformBuffer = device.createBuffer({
  byteLength: uniform.byteLength,
  usage: Buffer.UNIFORM | Buffer.COPY_DST
});
uniformBuffer.write(packSlangUniforms(uniform.layout, values));
const shader = device.createShader({stage: compiled.stage, source: compiled.code});
const pipeline = device.createComputePipeline({
  shader,
  entryPoint: compiled.entryPoint,
  shaderLayout: getSlangShaderLayout(compiled)
});
pipeline.setBindings({[getSlangBindingNames(compiled).settings]: uniformBuffer});
```

Applications still import/register their compiler and own resources, sampler state, feature
requests, and device-limit checks. Requirements are compiler-known facts, not a full device
compatibility validator. WGSL storage declarations need their language features even when unused
by a selected entry point. Active read/write `rgba8unorm`, `rgba16float`, and `rgba32*`
storage bindings require `texture-formats-tier2`; `r32*` read/write storage is available in core
WebGPU. Read/write `rgba8snorm` storage is unsupported on WebGPU and is reported separately.
These distinctions follow the [WebGPU format capabilities](https://www.w3.org/TR/webgpu/#texture-format-caps).
Concrete sampled texture formats are not knowable from source types:
use `textureSampleTypes: {sourceName: 'unfilterable-float'}` and
`samplerTypes: {sourceName: 'non-filtering'}` when appropriate. Comparison samplers stay comparison.
GLSL ES 300 remains the WebGL target, and binding groups must be zero for the layout helper.
Plain GLSL uniform globals remain application-managed with `setUniforms` and are omitted from
uniform-buffer layouts. Pass the returned layout explicitly to a native pipeline, `Model`, or
`Computation`; registering a transpiler alone does not install the helpers in the framework.

The [Slang sculpture example](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/slang-shaders)
keeps compiler registration application-owned and uses reflection to allocate and pack its shared
uniform buffer on WebGPU and WebGL 2.


## Compute-to-render example and bundle size

The [Slang particle vortex](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/slang-particles)
uses one source for compute and rendering. Shared workgroup positions and integer atomics feed a
ping-pong particle simulation, whose output is rendered directly with no CPU readback. The application
owns compiler registration and uses reflection for layouts, bindings and uniform packing. It selects
`omitUnusedResources` so native interface scanners see only the resources for each pipeline.

The compiler remains private and has no runtime dependencies. It is an optional import and does not
increase core/engine/shadertools bundles. Bundle-size tests guard the compiler and separate luma helpers;
the compute/texture extensions add approximately 5 KB gzip, for a compiler around 26 KB gzip.
