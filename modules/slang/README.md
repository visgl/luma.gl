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

`transpileSlang(source, options)` returns `{code, target, entryPoint, stage, reflection}`.

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
This is binding reflection, not a byte-layout calculator. Use the target language's layout rules
when packing uniform or storage data.

## Supported language

- `float`, `int`, `uint`, `bool`, vectors of width 2–4, float matrices from 2x2 through 4x4,
  structures (including nested structures), and fixed-size array declarators.
- Functions, forward references, calls, scalar casts, vector/structure constructors, and
  row-ordered scalar matrix constructors. Only functions reachable from the selected entry point
  are emitted. Recursive functions and overloaded functions are rejected.
- Variables, constants, static globals, assignments, component access, indexing, arithmetic,
  comparisons of scalars, logical operators, and common mathematical intrinsics such as `mul`,
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
- `Texture2D<float4>`, `SamplerState`, `Sample`, `SampleLevel`, and `Load`.
- `[vk::binding(binding, group)]` and `register(bN|tN|sN|uN, spaceN)`. Bindings share a single
  namespace as required by WebGPU, so collisions between, for example, `t0` and `s0` require
  explicit distinct bindings. Unannotated resources receive unused bindings in group zero.

## Target differences and current limits

- GLSL structured buffers and compute require `450`. GLSL 450 supports binding group zero.
  WebGL uniforms are located by their generated names; reflected groups/bindings describe the
  source binding plan. Texture and sampler resources combine into GLSL `sampler2D` uniforms,
  and each texture may use only one sampler. The caller applies the sampler state to that texture.
- Float matrices are stored transposed relative to their mathematical Slang dimensions so
  matrix indexing retains row semantics. `mul` reverses matrix operands to preserve the result.
  Applications must pack externally supplied matrices using this row-as-column representation.
- WGSL rejects uniform arrays, bool uniforms, and matrices with two-component stored columns
  until uniform layout legalization is implemented. Storage bools are rejected on both targets.
- WGSL rejects conditional (`?:`) expressions, increments used as values, assignments used as
  values, writes to multiple-component swizzles, and component-wise matrix multiplication.
  These need additional lowering to preserve evaluation order and side effects.
- Imports/includes/macros, namespaces, generics/interfaces, extensions, methods, autodiff,
  function overloads, initializer lists, inferred types, `switch`, `do`/`while`, atomics,
  resource arrays, non-2D textures, and helper/entry `out`/`inout` parameters are not supported.
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
WGSL compute shaders with readback assertions for loops and rectangular matrix multiplication.

### Unified WGSL render programs

Use `transpileSlangWGSL(source, options?)` to emit multiple entry points in one WGSL shader
module. By default it selects all `[shader(...)]` functions; `entryPoints` can select a list
of source function names. Shared structs, resources, and helpers are emitted once. The result
contains `code` and `entryPoints`, keyed by source function name, with each generated
`entryPoint`, `stage`, and `reflection`. Pass the generated names to pipeline creation.
The `sourceName` and `locations` options have the same meaning as for `transpileSlang`.
