# fp64arithmetic

The `fp64arithmetic` shader module provides the low-level double-single
arithmetic used by [`fp64`](/docs/api-reference/shadertools/shader-modules/fp64).
Use it directly when you only need the arithmetic primitives and want to avoid
including the full `fp64` function library.

## Uniforms

```ts
{
  ONE: 'f32',
  SPLIT: 'f32'
}
```

These uniforms are supplied automatically by the module's `defaultUniforms`.

## Usage

```ts
import {fp64arithmetic} from '@luma.gl/shadertools';

const modules = [fp64arithmetic];
```

## WGSL fp64u32 Subtraction

WGSL also exposes:

```wgsl
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32
fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32
```

These helpers subtract two `fp64u32` values, i.e. raw IEEE-754 binary64 values
stored in `vec2u`, using integer arithmetic and round the exact result once to
`f32`. They are intended for WebGPU paths that need `f32(a64 - b64)`, rather
than `f32(a64) - f32(b64)`, without relying on emulated fp64 floating-point
arithmetic.

A full bitwise drop-in implementation of `fp64f32` arithmetic is intentionally
not exposed. That approach is too expensive for iterative fragment shaders and
can stress some GPU drivers.

`aBits` and `bBits` use canonical high/low word order:

- `.x` is the high word containing sign, exponent, and high fraction bits
- `.y` is the low 32 fraction bits

The existing high/low `vec2f` representation used by helpers like `sub_fp64` is
the `fp64f32` representation.

If the source data comes from a JavaScript `Float64Array` reinterpreted as
`Uint32Array`, convert from host word order before calling these helpers.

## Remarks

- `fp64` depends on `fp64arithmetic`, so applications that import `fp64` do not
  usually need to add this module separately.
- The helper uniforms are part of the module's implementation and should not
  normally need to be overridden by applications.
