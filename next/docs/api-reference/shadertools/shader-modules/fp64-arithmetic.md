# fp64arithmetic

[Precision guide](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)[fp64](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md)[fp64 arithmetic](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)

[Precision Guide](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)[fp32](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp32.md)[fp64](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md)[fp64arithmetic](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)[Mandelbrot & Benchmarks](https://luma.gl/next/examples/experimental/fp64)

The `fp64arithmetic` shader module provides the low-level double-single arithmetic used by [`fp64`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md). Use it directly when you only need the arithmetic primitives and want to avoid including the full `fp64` function library.

See [GPU Floating-Point Precision Techniques](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md) for the numerical guarantees and tradeoffs of classic and integer-assisted double-single, native and software binary64, fixed point, and exact deltas. The [Mandelbrot and compute benchmark](https://luma.gl/next/examples/experimental/fp64) runs these paths on the active GPU.

## Live WebGPU benchmark[​](#live-webgpu-benchmark "Direct link to Live WebGPU benchmark")

The Mandelbrot views below compare native `f32` and double-single precision on your current device. Select **Run WebGPU benchmark** to measure native `f32`, automatic selection, classic double-single, and integer-controlled double-single across add, multiply, divide, and square-root workloads. Each result reports its measured GPU timestamp or queue-completion timing alongside numerical error; the benchmark runs only when requested.

Optional interactive GPU benchmark**Explore floating-point precision.**&#x43;ompare Mandelbrot rendering and compute precision when you are ready to use your GPU.Launch precision benchmark →

## Uniforms[​](#uniforms "Direct link to Uniforms")

```
{

  ONE: 'f32',

  SPLIT: 'f32'

}
```

These uniforms are supplied automatically by the module's `defaultUniforms`.

## Usage[​](#usage "Direct link to Usage")

```
import {fp64arithmetic} from '@luma.gl/shadertools';



const modules = [fp64arithmetic];
```

## Apple/Metal WGSL arithmetic[​](#applemetal-wgsl-arithmetic "Direct link to Apple/Metal WGSL arithmetic")

On Apple WebGPU adapters, shadertools automatically selects an optimizer-independent implementation of the double-single arithmetic helpers. It decodes each `f32` limb into integer sign, exponent, and significand fields, performs the exact `twoSum` and `twoProd` transforms with integer operations, and rounds each result back to the existing `vec2f` representation. This avoids depending on floating-point expressions that Metal may reassociate or contract.

The selection is a shader define, so it can also be forced on for another adapter or disabled on Apple:

```
const computation = new Computation(device, {

  // ...

  modules: [fp64arithmetic],

  defines: {

    LUMA_FP64_INTEGER_ARITHMETIC: true // false overrides the Apple default

  }

});
```

The integer path favors correctness over throughput. It preserves the public double-single API and provides approximately 48 significand bits while both limbs are normal, but it is not an IEEE-754 binary64 implementation: the exponent range remains that of `f32`. For result magnitudes between roughly `2^-126` and `2^-102`, the low limb is subnormal, so available precision gradually tapers from about 48 toward 24 bits as the result approaches `f32` underflow.

The portable contract covers finite, normalized double-single inputs and finite normal results within that representational limit. Exact subnormal rounding and binary64 special-value semantics are not guaranteed. Division and square root normalize their inputs into a safe exponent range, use native `f32` seed operations, and apply integer-controlled double-single corrections before rescaling the result.

## WGSL fp64u32 Subtraction[​](#wgsl-fp64u32-subtraction "Direct link to WGSL fp64u32 Subtraction")

WGSL also exposes:

```
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32

fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f
```

These helpers subtract two `fp64u32` values, i.e. raw IEEE-754 binary64 values stored in `vec2u`, using integer arithmetic. The `to_f32` variants round the exact mathematical difference directly and once to `f32`. They are intended for WebGPU paths that need `f32(a64 - b64)`, rather than `f32(a64) - f32(b64)`, without relying on emulated fp64 floating-point arithmetic.

The `to_fp64` variants first round the exact difference to binary64, matching a binary64 subtraction, and then split that value into normalized `f32` high and low limbs. This sequencing is intentional: direct exact-to-`f32` rounding and binary64-then-`f32` rounding can differ at double-rounding boundaries.

The returned double-single value provides up to approximately 48 significand bits, but retains the `f32` exponent range. A finite binary64 result whose magnitude is above that range maps to an infinity high limb and zero low limb; a result below the `f32` subnormal range maps to canonical positive zero limbs. Callers that require a finite result must establish that the expected delta is representable in the `f32` exponent range. Terrestrial longitude/latitude, projected metre coordinates, and their local deltas are comfortably inside that range; this helper is not a general replacement for binary64 arithmetic.

A full bitwise drop-in implementation of `fp64f32` arithmetic is intentionally not exposed. That approach is too expensive for iterative fragment shaders and can stress some GPU drivers.

`aBits` and `bBits` use canonical high/low word order:

* `.x` is the high word containing sign, exponent, and high fraction bits
* `.y` is the low 32 fraction bits

The existing high/low `vec2f` representation used by helpers like `sub_fp64` is the `fp64f32` representation.

If the source data comes from a JavaScript `Float64Array` reinterpreted as `Uint32Array`, convert from host word order before calling these helpers.

WGSL additionally exposes normalized comparison helpers:

```
fn normalize_fp64(value: vec2f) -> vec2f

fn is_nan_fp64(value: vec2f) -> bool

fn is_finite_fp64(value: vec2f) -> bool

fn sign_fp64(value: vec2f) -> i32

fn compare_fp64(a: vec2f, b: vec2f) -> i32
```

`normalize_fp64` uses integer accumulation in both arithmetic modes, including for `f32` subnormal limbs, and canonicalizes every signed-zero pair to `vec2f(+0.0, +0.0)`. `sign_fp64` and `compare_fp64` return `0` for an unordered NaN input. Code where `0` must mean finite zero or equality must first call `is_nan_fp64` or `is_finite_fp64`; NaN is never implied to be equal.

## Remarks[​](#remarks "Direct link to Remarks")

* `fp64` depends on `fp64arithmetic`, so GLSL applications that import `fp64` do not usually need to add this module separately.
* The helper uniforms are part of the module's implementation and should not normally need to be overridden by applications.
