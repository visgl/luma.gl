import {ShaderModuleDocsTabs} from '@site/src/components/docs/shader-module-docs-tabs';

# fp64arithmetic

<ShaderModuleDocsTabs group="precision" active="fp64-arithmetic" />

The `fp64arithmetic` shader module provides the low-level double-single
arithmetic used by [`fp64`](/docs/api-reference/shadertools/shader-modules/fp64).
Use it directly when you only need the arithmetic primitives and want to avoid
including the full `fp64` function library.

See [GPU Floating-Point Precision Techniques](/docs/api-guide/shaders/gpu-floating-point-precision)
for the numerical guarantees and tradeoffs of classic and integer-assisted
double-single, native and software binary64, fixed point, and exact deltas. The
[Mandelbrot and compute benchmark](/examples/experimental/fp64) runs these
paths on the active GPU.

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

## Apple/Metal WGSL arithmetic

On Apple WebGPU adapters, shadertools automatically selects an
optimizer-independent implementation of the double-single arithmetic helpers.
It decodes each `f32` limb into integer sign, exponent, and significand fields,
performs the exact `twoSum` and `twoProd` transforms with integer operations,
and rounds each result back to the existing `vec2f` representation. This avoids
depending on floating-point expressions that Metal may reassociate or contract.

The selection is a shader define, so it can also be forced on for another
adapter or disabled on Apple:

```ts
const computation = new Computation(device, {
  // ...
  modules: [fp64arithmetic],
  defines: {
    LUMA_FP64_INTEGER_ARITHMETIC: true // false overrides the Apple default
  }
});
```

The integer path favors correctness over throughput. It preserves the public
double-single API and provides approximately 48 significand bits while both
limbs are normal, but it is not an IEEE-754 binary64 implementation: the
exponent range remains that of `f32`. For result magnitudes between roughly
`2^-126` and `2^-102`, the low limb is subnormal, so available precision
gradually tapers from about 48 toward 24 bits as the result approaches `f32`
underflow.

The portable contract covers finite, normalized double-single inputs and
finite normal results within that representational limit. Exact subnormal
rounding and binary64 special-value semantics are not guaranteed. Division and
square root normalize their inputs into a safe exponent range, use native `f32`
seed operations, and apply integer-controlled double-single corrections before
rescaling the result.

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

- `fp64` depends on `fp64arithmetic`, so GLSL applications that import `fp64`
  do not usually need to add this module separately.
- The helper uniforms are part of the module's implementation and should not
  normally need to be overridden by applications.
