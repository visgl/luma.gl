# GPU Floating-Point Precision Techniques

[Precision Guide](https://luma.gl/next/docs/api-guide/shaders/gpu-floating-point-precision.md)[fp32](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp32.md)[fp64](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md)[fp64arithmetic](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md)[Mandelbrot & Benchmarks](https://luma.gl/next/examples/experimental/fp64)

"fp64" is often used to mean "more precision than `f32`," but the available techniques do not all implement the same number system. A pair of `f32` values, raw IEEE 754 binary64 bits, fixed-point integers, and native 64-bit floating point have different precision, range, rounding, and portability guarantees.

That distinction matters on WebGPU. Classic double-single arithmetic can be fast, but its correctness depends on individual `f32` rounding points that WGSL does not require a compiler to preserve. luma.gl therefore uses an integer-controlled double-single path automatically on Apple WebGPU adapters, while retaining the classic path where it is known to work.

## Live Mandelbrot And Compute Benchmark[​](#live-mandelbrot-and-compute-benchmark "Direct link to Live Mandelbrot And Compute Benchmark")

The two Mandelbrot views follow the same deep zoom. The left view uses native `f32`; the right uses luma.gl's `fp64arithmetic` double-single representation. On WebGPU, use the benchmark below the canvases to compare native `f32`, automatic selection, the classic transforms, and the integer-controlled path on the active device.

Initializing device...

The benchmark is diagnostic rather than a CI performance test. It reports numerical error alongside runtime because the fastest implementation is not useful if the compiler has optimized away its residual terms.

## Start With The Required Contract[​](#start-with-the-required-contract "Direct link to Start With The Required Contract")

| Technique                 | Significant precision                                                               | Exponent or range    | IEEE binary64 semantics?          |
| ------------------------- | ----------------------------------------------------------------------------------- | -------------------- | --------------------------------- |
| Native `f32`              | 24 binary digits, about 7 decimal digits                                            | Binary32             | No                                |
| Native binary64           | 53 binary digits, about 15–16 decimal digits                                        | Binary64             | Only as guaranteed by the backend |
| Double-single (`hi + lo`) | Up to about 48 binary digits, about 14 decimal digits in its normal operating range | Essentially binary32 | No                                |
| Fixed point               | Chosen explicitly                                                                   | Chosen explicitly    | No                                |
| Software binary64         | 53 binary digits                                                                    | Binary64             | Only to the extent implemented    |

A double-single value is an *expansion*: two non-overlapping `f32` values whose real sum is the represented value. It increases significand precision, not exponent range. It also does not automatically reproduce binary64 rounding, subnormal, infinity, or NaN behavior.

Before choosing an implementation, answer three questions:

1. Is the problem loss of *relative precision*, loss caused by subtracting two large nearby values, or insufficient exponent range?
2. Does every intermediate need more precision, or only one boundary operation such as `position - origin`?
3. Must the GPU agree bit-for-bit with a CPU binary64 operation sequence, or is a numerically accurate result enough?

The cheapest robust solution is usually the narrowest contract that solves the actual problem.

## Storage Is Not Arithmetic[​](#storage-is-not-arithmetic "Direct link to Storage Is Not Arithmetic")

Two 32-bit words can store every bit of a binary64 value without loss. That only defines a transport format. Addition, multiplication, comparisons, rounding, and special values still need implementations.

Likewise, uploading `[high, low]` as two `f32` values does not by itself provide double-single arithmetic. Every operation must maintain a suitable expansion, and the error-free transforms used to do that need specific floating-point evaluation rules.

This gives luma.gl two useful but distinct representations:

* `fp64f32` is a `vec2f` expansion, normally interpreted as `high + low`.
* `fp64u32` is the canonical high and low words of an IEEE 754 binary64 value.

The first is convenient for expansion arithmetic. The second preserves the source value exactly and is suitable for integer-assisted operations.

## How Classic Double-Single Arithmetic Works[​](#how-classic-double-single-arithmetic-works "Direct link to How Classic Double-Single Arithmetic Works")

The building blocks are *error-free transforms*. They return a rounded result and a residual whose real sum equals the exact input operation.

Let `fl(x)` mean that `x` is evaluated as a distinct binary32 operation and rounded to nearest. The general addition transform was discovered by Møller and later proved and presented by Knuth; it is therefore often called the Møller–Knuth `TwoSum` transform:

```
s = fl(a + b)

v = fl(s - a)

e = fl(fl(a - fl(s - v)) + fl(b - v))
```

Under its assumptions, `s + e` is exactly equal to the real sum `a + b`. Dekker's shorter `FastTwoSum` uses:

```
s = fl(a + b)

e = fl(b - fl(s - a))
```

The shorter transform additionally requires the operands to be ordered, most commonly expressed as `abs(a) >= abs(b)` for binary arithmetic.

For multiplication without a fused multiply-add, Dekker splits each operand into shorter components. For binary32, whose precision is 24 bits, a common split is:

```
c = fl(4097 * a)              // 4097 = 2^12 + 1

aHigh = fl(c - fl(c - a))

aLow = fl(a - aHigh)
```

Products of the components can then recover the product residual. With a *genuinely fused* multiply-add, the residual has the much simpler form `fma(a, b, -fl(a * b))`.

These exactness statements are conditional. The usual binary proofs assume round-to-nearest evaluation, no reassociation or unintended contraction, finite intermediates without overflow, and the required handling of tiny values. The `4097 * a` split is not safe for every finite `f32`: it can overflow even when `a` does not, so a complete implementation must handle large inputs. Subnormals or flush-to-zero behavior require similar care. Parentheses alone do not establish any of these conditions.

Once `TwoSum`, `FastTwoSum`, and `TwoProd` are available, double-single add and multiply combine the high components, accumulate their residuals and the low components, then renormalize the result. Division and square root normally use an `f32` approximation followed by one or more compensated corrections.

## Why This Is Fragile In WGSL And Metal[​](#why-this-is-fragile-in-wgsl-and-metal "Direct link to Why This Is Fragile In WGSL And Metal")

An error-free transform is an algorithm over *rounding events*, not an algebraic identity. For example, the low term in `TwoSum` is algebraically zero over the real numbers. A compiler that reassociates the expression can therefore erase the information the algorithm was designed to recover.

The [WGSL floating-point evaluation rules](https://www.w3.org/TR/WGSL/#floating-point-evaluation) permit reassociation and fusion, and do not specify a single rounding direction for all floating-point evaluation. WGSL's [`fma`](https://www.w3.org/TR/WGSL/#fma-builtin) also does not provide the portable, correctly rounded fused-operation contract that Dekker-style `TwoProd` would need.

As a result, these source-level techniques are not portable precision barriers:

* assigning an intermediate to `let` or `var`;
* adding a runtime zero or multiplying by a runtime one;
* moving an expression into a helper function;
* adding parentheses or an identity `bitcast`;
* spelling the product residual with WGSL `fma`.

They may affect a particular compiler version, but they cannot turn an optimization-sensitive transform into a WebGPU guarantee. Native APIs or toolchains with a strict floating-point mode can make classic double-single a valid backend-specific fast path. WebGPU applications still need a fallback when correctness depends on it.

## luma.gl's Apple/Metal Path[​](#lumagls-applemetal-path "Direct link to luma.gl's Apple/Metal Path")

On Apple WebGPU adapters, `fp64arithmetic` replaces the rounding-sensitive transforms with integer-controlled operations. Each `f32` limb is decoded into sign, exponent, and significand fields. `TwoSum`, `TwoProd`, and the required renormalization use `u32` limbs with explicit round-to-nearest, ties-to-even packing back to `f32`. A 24-by-24-bit product needs only 48 exact bits, so this is considerably narrower than full software binary64.

The public representation and function names remain `vec2f` double-single, so existing `fp64arithmetic` WGSL callers do not need a second API. The shader assembler selects this path automatically when the backend is WebGPU and the adapter is Apple. Applications can force it for testing on another adapter, or explicitly disable it on Apple:

```
const computation = new Computation(device, {

  // ...

  modules: [fp64arithmetic],

  defines: {

    LUMA_FP64_INTEGER_ARITHMETIC: true // false overrides the Apple default

  }

});
```

This path favors reliable rounding points over throughput. It still represents an expansion with essentially the `f32` exponent range, not binary64. While both limbs are normal it provides approximately 48 significand bits. For result magnitudes between roughly `2^-126` and `2^-102`, the low limb is subnormal, so available precision gradually tapers from about 48 bits toward 24 bits as the result approaches `f32` underflow.

The portable contract covers finite, normalized double-single inputs and finite normal results within that representational range. It does not promise full binary64 special-value or subnormal semantics. Division and square root use native `f32` estimates followed by integer-controlled double-single corrections.

## The Main Alternatives[​](#the-main-alternatives "Direct link to The Main Alternatives")

| Approach                              | Typical cost                                                           | Portability                                                            | Best fit                                                             |
| ------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Native hardware binary64              | Lowest when supported, sometimes low throughput                        | Not a portable WGSL feature                                            | Native backends with a strict `f64` contract                         |
| Classic double-single                 | Lower than integer emulation; operation-dependent                      | Depends on preserved rounding points                                   | Controlled compilers and verified fast paths                         |
| Integer-assisted double-single        | Higher than classic double-single; implementation-dependent            | Robust with specified `u32` operations                                 | Portable expansion arithmetic when about 48 bits are enough          |
| Exact binary64 delta to `f32`         | Moderate, fixed integer cost                                           | Robust as result bits; direct `f32` is exact for normal finite results | Large-coordinate origin subtraction                                  |
| Full software binary64                | High; division, square root, and transcendentals are especially costly | Robust if complete                                                     | Binary64 range, special values, or CPU-compatible stepwise semantics |
| Fixed point                           | Very low for add; multiply and divide need wide intermediates          | Robust                                                                 | Bounded dynamic range and iterative kernels                          |
| CPU preprocessing and origin rebasing | Usually lowest GPU cost                                                | Robust                                                                 | Rendering and analytics that only need local values on the GPU       |

### Origin Rebasing And An Exact Delta[​](#origin-rebasing-and-an-exact-delta "Direct link to Origin Rebasing And An Exact Delta")

Large-coordinate rendering often does not need general fp64 arithmetic. It needs this operation:

```
localPosition = round_f32(exact(worldPosition - worldOrigin))
```

Converting both inputs to `f32` first loses the low bits before cancellation. Subtracting their raw binary64 significands and exponents with integer operations, then rounding the exact difference once to `f32`, retains them. After that boundary operation, transforms, interpolation, and rasterization can remain ordinary `f32`.

This is a targeted operation, not a binary64 arithmetic library. It is ideal when the output is known to fit in binary32 and later calculations only need binary32 precision. It does not help an iterative algorithm that must retain extra bits after every addition or multiplication.

There is also a subtle semantic choice. Directly rounding the exact difference implements `round_f32(exact(a - b))`. A CPU expression that first performs an IEEE binary64 subtraction and then converts to `f32` implements `round_f32(round_binary64(a - b))`. Those results normally agree, but double rounding means they are not universally identical. If bit-for-bit agreement with a particular CPU operation sequence is part of the contract, implement that sequence rather than assuming the exact-delta contract is the same one.

The subtraction can instead happen on the CPU when the origin changes infrequently. GPU integer subtraction is useful when both values arrive as columns of binary64 data, the origin changes frequently, or preprocessing would require an unwanted copy.

### Integer-Assisted Double-Single[​](#integer-assisted-double-single "Direct link to Integer-Assisted Double-Single")

A middle ground keeps the `high + low` representation while replacing the rounding-sensitive transforms with `u32` arithmetic. Decode each `f32` sign, exponent, and significand; align or multiply the integer significands; preserve guard, round, and sticky information; then emit a normalized high/low pair.

This is not a bit-at-a-time floating-point emulator. A binary32 significand is only 24 bits, so an exact product fits in 48 bits and can be represented by a small fixed set of `u32` limbs. It is substantially narrower than full software binary64 and can provide deterministic building blocks for expansion addition and multiplication.

Its scope should remain explicit. It still has essentially binary32 exponent range unless separate exponent state is added. NaNs, infinities, signed zero, and subnormal behavior require additional design. It also does not make arbitrary existing `vec2f` code safe: every rounding-sensitive transform and renormalization step in a supported operation must use the deterministic path.

### Full Software Binary64[​](#full-software-binary64 "Direct link to Full Software Binary64")

A complete implementation stores sign, 11-bit exponent, and 52 fraction bits in integer words. Each operation aligns significands, computes with extra guard, round, and sticky bits, normalizes, rounds, and handles zeros, subnormals, infinities, and NaNs.

This is the direct choice when binary64 range and behavior are requirements, not merely additional local precision. It is also the software route to step-by-step CPU agreement, provided the CPU contract is specified precisely: rounding mode, NaN policy, operation order, contraction, and transcendental functions all matter. Merely storing binary64 bits is insufficient, and an incomplete special-value or rounding implementation is not IEEE binary64.

Software binary64 is expensive, but cost varies by workload. Addition and subtraction are much cheaper than division, square root, or correctly rounded transcendentals. A small application-specific subset can therefore be reasonable even when a general library is not.

### Fixed Point[​](#fixed-point "Direct link to Fixed Point")

Fixed point stores an integer `n` and interprets it as `n * 2^-k` (or another chosen scale). Addition and subtraction are exact until integer overflow. Multiplication needs a wide intermediate followed by an explicit rounding shift; division needs an explicitly scaled numerator.

For a bounded domain, fixed point can deliver more useful fractional bits than double-single at much lower and more predictable cost. Deep-zoom fractals, geometric predicates over a known extent, counters, and reproducible accumulations are common fits. The tradeoff is manual range analysis and no automatic exponent, NaN, or infinity behavior.

### Native Binary64[​](#native-binary64 "Direct link to Native Binary64")

Native `f64` is the obvious answer on a backend that supports it with the required evaluation controls. It is not a portable WGSL/WebGPU shader type, and hardware throughput varies widely. Even where native `f64` exists, bit-for-bit CPU agreement still requires matching operation order, rounding, and contraction rules.

## Choosing By Workload[​](#choosing-by-workload "Direct link to Choosing By Workload")

| Workload                                                 | Preferred starting point                        | Reason                                                                     |
| -------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| World, geospatial, or astronomical coordinates           | CPU origin rebasing or exact `fp64u32` delta    | Preserves local detail, then returns to fast `f32`                         |
| Deep iterative calculation over a bounded interval       | Fixed point or integer-assisted double-single   | Deterministic precision and a cost below full binary64                     |
| General arithmetic needing roughly 14 decimal digits     | Integer-assisted double-single                  | More precision without implementing binary64's full range                  |
| Binary64 storage or data interchange without arithmetic  | Raw `fp64u32` words                             | Preserves every source bit without paying for software arithmetic          |
| Arithmetic requiring binary64 range and special values   | Full software binary64                          | The arithmetic semantics, not just the representation, are the requirement |
| Controlled native GPU backend                            | Native `f64`, or verified classic double-single | Can use backend guarantees unavailable to portable WGSL                    |
| A few high-precision constants followed by ordinary math | CPU preprocessing                               | Avoids paying an emulation cost per invocation                             |

Do not choose a representation from the label "fp64." Choose it from the failure mode. Origin rebasing cannot repair an iteration that loses bits on every step; software binary64 is unnecessary if one exact subtraction produces the only value that must reach the shader.

## luma.gl Precision Paths[​](#lumagl-precision-paths "Direct link to luma.gl Precision Paths")

The [`fp64`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64.md) module exposes the full established `fp64f32` function library in GLSL only. It has no WGSL source, so its exponential, logarithmic, and trigonometric functions are not available to WebGPU shaders.

Its lower-level [`fp64arithmetic`](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/fp64-arithmetic.md) dependency provides the add, subtract, multiply, divide, and square-root helpers in both GLSL and WGSL. Non-Apple WGSL uses the classic floating-point transforms by default. Apple WebGPU uses the integer-controlled implementation automatically, and callers can use `LUMA_FP64_INTEGER_ARITHMETIC` to test or override that choice.

WGSL also provides these targeted helpers for `fp64u32` values:

```
fn sub_fp64u32_to_f32_bits(aBits: vec2u, bBits: vec2u) -> u32

fn sub_fp64u32_to_f32(aBits: vec2u, bBits: vec2u) -> f32

fn sub_fp64u32_to_fp64_bits(aBits: vec2u, bBits: vec2u) -> vec2u

fn sub_fp64u32_to_fp64(aBits: vec2u, bBits: vec2u) -> vec2f
```

The words are in canonical order: `.x` contains the sign, exponent, and high fraction bits, and `.y` contains the low fraction bits. The `to_f32` helpers implement the exact-delta contract described above, including a single round-to-nearest, ties-to-even conversion to a binary32 encoding. The `to_f32_bits` helper returns that encoding as `u32`, including the module's defined handling of zeros, subnormals, infinities, and NaNs. WGSL's relaxed rules for those values mean that the direct `f32` helper has a portable exact-value guarantee only for normal finite results. These helpers are deliberately narrower than the general `fp64f32` arithmetic API.

The `to_fp64` variants implement the other rounding contract: they round the exact subtraction once to binary64 and then split that binary64 result into a normalized double-single pair. They preserve useful coordinate deltas that do not fit in one `f32`, but they do not extend the exponent range. The result has up to roughly 48 significand bits with an `f32` exponent range. Finite results above that range map to infinity and results below the `f32` subnormal range map to canonical zero. This makes the helpers a practical fit for terrestrial GIS coordinates and local metric deltas, not for arbitrary binary64-scale scientific values.

`normalize_fp64`, `sign_fp64`, and `compare_fp64` use integer-controlled normalization regardless of the selected arithmetic mode. Normalization handles stored subnormal limb bits and canonicalizes signed zero. NaN remains unordered: `sign_fp64` and `compare_fp64` return `0` for NaN, so callers must use `is_nan_fp64` or `is_finite_fp64` before interpreting `0` as finite zero or equality.

## Validation Is Part Of The Technique[​](#validation-is-part-of-the-technique "Direct link to Validation Is Part Of The Technique")

Precision code should be tested for its numerical contract, not merely for successful shader compilation.

* Compare result bits with an independent, correctly rounded reference. For exact-delta tests, do not use a host expression with a different intermediate rounding contract as the only oracle.
* Include cancellation, adjacent representable values, half-ULP ties, large exponent gaps, signed zero, the normal/subnormal boundary, underflow, overflow, infinities, and NaNs where the contract includes them.
* Test precision and range separately. A double-single result can carry many significant bits and still overflow at the binary32 limit.
* Exercise compute, vertex, and fragment paths that matter to the application. Optimizers and arithmetic lowering can differ by stage.
* Run on real hardware from multiple vendors, especially the Metal path. A software adapter or a compile-only test cannot demonstrate that residual terms survive execution.
* Inspect both the high component and a required nonzero low component. A final value can look plausible even after the expansion silently collapses to `f32`.
* Benchmark the representative shader. Instruction counts alone do not capture register pressure, occupancy, control flow, or driver lowering.

For CPU agreement, first write down the CPU semantics being matched. JavaScript `Number` storage is binary64, but an oracle such as `Math.fround(a - b)` includes a binary64 arithmetic step before the binary32 conversion. An arbitrary- precision integer or rational reference is often clearer for exact-rounding tests.

## Further Reading[​](#further-reading "Direct link to Further Reading")

* [IEEE 754-2019](https://standards.ieee.org/ieee/754/6210/) defines binary floating-point formats and arithmetic.
* Ole Møller's [*Quasi double-precision in floating point addition*](https://doi.org/10.1007/BF01975722) introduced the general sum-and-roundoff method later associated with Knuth's `TwoSum` presentation.
* T. J. Dekker's [*A Floating-Point Technique for Extending the Available Precision*](https://eudml.org/doc/132105) develops splitting and expansion arithmetic.
* Jonathan Shewchuk's [*Adaptive Precision Floating-Point Arithmetic and Fast Robust Geometric Predicates*](https://people.eecs.berkeley.edu/~jrs/papers/robustr.pdf) is a practical treatment of expansions and exact predicates.
* Berkeley [SoftFloat](https://www.jhauser.us/arithmetic/SoftFloat-3/doc/SoftFloat.html) illustrates the scope of a complete software IEEE floating-point implementation.
