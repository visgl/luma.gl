# WGSL frontend

**Experimental · Available from luma.gl v10.**

`@luma.gl/slang/wgsl` compiles a small WGSL rendering subset into GLSL. It uses the same
TypeScript backend as the Slang compiler and requires no native compiler or WASM runtime.
Import the frontend directly so applications using only WGSL do not include the Slang parser
or module registry. The root Slang entry point does not include the WGSL frontend.

```typescript
import {transpileWGSL} from '@luma.gl/slang/wgsl';

const shader = transpileWGSL(`
  @fragment fn shade(@location(0) color: vec3f) -> @location(0) vec4f {
    return vec4f(color, 1.0);
  }
`, {entryPoint: 'shade', sourceName: 'material.wgsl'});
```

## API

`transpileWGSL(source, options?)` returns generated `code`, `entryPoint`, `stage`, `target`,
reflection and a source map using the existing compiler result shape.

- `entryPoint`: select one vertex or fragment function from a module. Required when there are
  multiple stage functions; a module containing one stage function selects it automatically.
- `sourceName`: original source filename for diagnostics; defaults to `shader.wgsl`.
- `glslVersion`: `300 es` by default, or `450`.

GLSL entry points are named `main`. Reflection retains declared locations and builtins; generated
names use the compiler's existing private naming convention. `semantic` in the compatibility
reflection shape contains the source interface declaration name, rather than a Slang semantic.
`reflection.bindings` retains source group/binding numbers, target uniform block names and byte layouts,
and the sampler paired with each GLSL texture uniform. Bind uniform blocks and textures using
that reflection; GLSL ES 300 does not encode binding slots in shader declarations.

`WGSLTranspileError` is an alias of the shared compiler diagnostic class. It carries source name,
line, column and offset. Use source maps to map destination compiler errors back to WGSL.

## Supported subset

- `f32`, `i32`, `u32`, `bool`, and 2–4 component vectors with explicit scalar types or shorthand
  names such as `vec3f` and `vec2u`.
- Structs, aliases, helper functions, fixed arrays (1–65536 elements) and `mat2x2f` through
  `mat4x4f`, including non-square matrices. Matrix constructor arguments are columns, and `*`
  performs WGSL matrix multiplication. Arrays require explicit element types and counts; counts
  may name an abstract integer module constant.
- Local `let`, `const` and `var`, module constants and private variables, explicit types and ordinary inference, nested blocks, assignments,
  returns, field access, swizzles, arithmetic, comparisons and logical/bitwise operations.
- Contextual materialization of numeric literals and bounded abstract constant arithmetic.
  Abstract integer arithmetic is limited to JavaScript's exact integer range before the final
  32-bit value is materialized. No full WGSL constant evaluator is provided.
- Scalar numeric conversions, with boolean and float-to-integer conversions outside the initial subset.
- Zero initialization of scalar, vector, matrix, array and struct variables; zero-argument
  constructors for scalar/vector/matrix/array values.
- `if`/`else`, `switch` with integer constant labels and a required default, `for`, `while`,
  `break`, `continue`, integer increment/decrement and fragment `discard`. Switch cases do not fall through.
- Common floating math (`sin`, `cos`, `sqrt`, `pow`, `exp`, `log`, rounding, etc.), numeric
  `abs`/`sign`/`min`/`max`/`clamp`, `mix`, `smoothstep`, vector `dot`/`cross`/`length`/`distance`/
  `normalize`/`reflect`/`refract`, boolean `all`/`any`, derivatives, eager `select`, and equal-width
  32-bit numeric `bitcast`. Floating `round` uses ties-to-even; Y derivatives account for the
  framebuffer coordinate convention.
- Struct uniform buffers and module-bound `texture_2d<f32>`/`sampler` resources, with
  `textureSample`, `textureSampleLevel`, `textureSampleGrad`, `textureLoad` and `textureDimensions`.
  Sampling offsets and resource parameters are outside this subset.
- Vertex and fragment entry points with explicit locations and supported interpolation attributes.
  Builtins: vertex output `position`, vertex input `vertex_index`/`instance_index`, fragment input
  `front_facing`, and fragment output `frag_depth`.

Uniform buffers are accepted only when their WGSL physical member offsets, strides and total
size match the shared GLSL std140 representation. A mat4 followed by vec4 fields works directly;
arrays of scalars and matrices with two-row columns usually require different padding and are
rejected. Boolean fields and explicit `@align`/`@size` attributes are unsupported. Application
buffers are never implicitly repacked. Matrices use WGSL column-major input order. GLSL 450
currently requires resource group zero.

The Slang Shaders tutorial includes runnable WGSL previews for uniforms, texture sampling/load/
dimensions, arrays, matrices and control flow. Each preview displays the generated GLSL and
binds real WebGL resources. GPU tests compare those shaders against native WGSL execution.

The frontend checks WGSL types independently of Slang's implicit conversion rules. Helper
parameters and `let` values are immutable. Recursion is rejected.

Vertex wrappers flip output Y and map clip depth from `[0, w]` to `[-w, w]` for OpenGL. Applications
must account for this convention when configuring winding/culling or combining translated stages
with shaders authored directly in GLSL. Fragment input `position` is rejected until viewport
adaptation is implemented.

## Deferred features

Storage resources, compute, general pointers, runtime-sized arrays, array return values, inferred array/vector
constructors, overrides, `loop`/`continuing`, extensions, hexadecimal literals and explicit
layout attributes are not implemented. Runtime integer division/remainder, floating remainder
and float-to-integer conversion remain rejected pending their WGSL edge-case lowering.
Constant evaluation is bounded arithmetic rather than the full WGSL constant-expression language;
uncontextualized inferred constants must fit their default i32/f32 materialization.

This is a documented authoring subset, not a full WGSL conformance validator. Compile generated
shaders on the destination device to validate device limits, cross-stage linkage and target
capabilities. Unsupported syntax or lowering raises a source-located diagnostic.
