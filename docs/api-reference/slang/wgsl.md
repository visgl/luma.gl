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
Resources are outside this first subset, so `reflection.bindings` is empty.

`WGSLTranspileError` is an alias of the shared compiler diagnostic class. It carries source name,
line, column and offset. Use source maps to map destination compiler errors back to WGSL.

## Initial subset

- `f32`, `i32`, `u32`, `bool`, and 2–4 component vectors with explicit scalar types or shorthand
  names such as `vec3f` and `vec2u`.
- Structs, helper functions, function parameters and scalar/vector/struct constructors.
- Local `let` and `var`, explicit types and ordinary inference, nested blocks, assignments,
  returns, field access, swizzles, arithmetic, comparisons and logical/bitwise operations.
- Contextual materialization of numeric literals and bounded abstract constant arithmetic.
  Abstract integer arithmetic is limited to JavaScript's exact integer range before the final
  32-bit value is materialized. No full WGSL constant evaluator is provided.
- Scalar numeric conversions, with boolean and float-to-integer conversions outside the initial subset.
- Zero initialization of local scalar, vector and struct variables.
- Vertex and fragment entry points with explicit locations and supported interpolation attributes.
  Builtins: vertex output `position`, vertex input `vertex_index`/`instance_index`, fragment input
  `front_facing`, and fragment output `frag_depth`.

The frontend checks WGSL types independently of Slang's implicit conversion rules. Helper
parameters and `let` values are immutable. Recursion is rejected.

Vertex wrappers flip output Y and map clip depth from `[0, w]` to `[-w, w]` for OpenGL. Applications
must account for this convention when configuring winding/culling or combining translated stages
with shaders authored directly in GLSL. Fragment input `position` is rejected until viewport
adaptation is implemented.

## Deferred features

Uniforms and textures, storage resources, compute, general pointers, arrays, matrices, aliases,
module constants, overrides, built-in math functions, branching, loops, discard, extensions,
hexadecimal literals and zero-argument constructors are not implemented yet. Runtime remainder and integer
division are rejected until their WGSL edge-case semantics have target lowering.

This is a documented authoring subset, not a full WGSL conformance validator. Compile generated
shaders on the destination device to validate device limits, cross-stage linkage and target
capabilities. Unsupported syntax or lowering raises a source-located diagnostic.
