---
title: Slang
description: Transpile Slang shader source to GLSL and WGSL using TypeScript.
---

# Slang

<div style={{margin: '1rem 0'}}>
  <img className="docs-api-card__logo--on-light" src="/img/standards/slang-light.svg" alt="Slang" width="224" height="70" />
</div>

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

Local `var`/`let` declarations support type inference. `switch` preserves grouped labels and fallthrough,
and `do`/`while` preserves post-test evaluation through `continue`. Numeric scalar/vector promotions,
vector comparisons, integer shifts, floating-point remainder and component-wise float matrix arithmetic
work on both targets. Matrix constructors accept scalar broadcast, row vectors, matching matrices or
row-ordered elements. Integers are limited to 32 bits, and switch clause locals cannot be shared across
clauses. See the package documentation for the remaining syntax and validation limits.

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
limitations. Imports, generics, interfaces and autodiff remain unsupported.

### Compute and texture authoring

Compute supports integer atomics on shared integer scalars/arrays and RW integer buffers, byte-address
loads/stores and atomic methods, and unconditional synchronized workgroup/storage barriers. Compare
`reflection.workgroupSize` and `workgroupStorageSize` with device limits. Conditional/loop barriers and
early returns in synchronized functions are diagnosed; floating-point and struct-member atomics are
outside the subset. Byte-address offsets are four-byte aligned, including dynamic application offsets.

Textures support explicit gradients, bias, gathers, dimension/mip/layer/sample-count queries,
`Texture2DMS` loads, 1D and cube-array sampled views, and 1D/2D/2DArray/3D storage textures. Fixed texture
and sampler arrays flatten to at most 16 contiguous bindings, with `resourceArray` metadata and source
names such as `images[0]`. Dynamic texture selection uses individual bindings and explicit sampling
levels/gradients; sampler-array indices must be integer literals. GLSL reflects each texture/sampler pair
separately, so applications can bind multiple sampler states to the same texture.

GLSL ES 300 remains the WebGL target. Gathers, 1D/cube-array/multisampled views and mip-count queries
require explicit GLSL 450; unsupported WebGL operations raise source diagnostics. Dimension-only
queries and explicit gradients work on WebGL 2. Resources and device capabilities remain app-owned.

Set `omitUnusedResources: true` when native layout inference should see only active WGSL resources.
Reflection retains inactive source bindings with visibility zero. This option also works with unified
programs; default output retains all resource declarations.

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


The [Slang particle example](/examples/tutorials/slang-particles) simulates and renders a particle cloud
from one Slang source, using shared memory, integer atomics and the application-owned compiler plugin.
The optional compiler remains dependency-free and guarded by bundle-size tests (about 28 KB gzip).
