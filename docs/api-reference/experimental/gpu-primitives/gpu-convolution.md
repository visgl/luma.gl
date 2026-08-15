import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUConvolution

<GPUPrimitivesDocsTabs active="convolution" />

## Overview

`GPUConvolution` adds a same-size, centered two-dimensional `float32` convolution to a
`GPUCommandGraph`. It accepts GPU-resident input, kernel, and output views and records either one
direct spatial pass or a graph-native frequency-domain pipeline. Neither path compiles, submits,
or reads data back by itself.

The spectral path reuses the radix-2 planning and complex arithmetic factored out for `GPUFFT1D`.
Packing, two forward transforms, spectral multiplication, the inverse transform, and cropping are
all explicit graph nodes. Their nine logical complex scratch fields are graph-owned transients, so
the compiler can alias fields whose lifetimes do not overlap.

## When to use

Use `GPUConvolution` when source data and results remain on the GPU, particularly for repeated
filters or kernels large enough for FFT convolution to amortize its packing, padding, and dispatch
costs. It is also useful when boundary behavior and intermediate resource accounting need to stay
explicit in a larger command graph. A CPU implementation is usually simpler for one-off, small
fields that originate and finish on the CPU. For separable kernels, two specialized one-dimensional
passes can also be substantially cheaper than either general strategy.

## Usage

```ts
import {GPUConvolution} from '@luma.gl/experimental';

new GPUConvolution({
  id: 'blur',
  input,
  kernel,
  output,
  width: 1024,
  height: 1024,
  kernelWidth: 15,
  kernelHeight: 15,
  boundary: 'zero',
  strategy: 'auto'
}).addToGraph(graph);
```

All three values are packed `GraphDataView<'float32'>` views belonging to the target graph. The
input and output contain at least `width * height` row-major values. The kernel contains at least
`kernelWidth * kernelHeight` values. Input, kernel, and output use separate graph buffers, and both
kernel dimensions must be positive odd integers so the center is unambiguous.

This operation computes convolution rather than correlation. For output coordinate `(x, y)`, a
kernel coordinate `(kx, ky)` samples the input at
`(x - (kx - centerX), y - (ky - centerY))`.

## Boundaries

- `zero` samples zero beyond the input field. The FFT strategy pads each axis to the next power of
  two that contains the full linear convolution, then crops the original field.
- `wrap` uses periodic sampling. FFT execution requires power-of-two input dimensions and a kernel
  that fits inside the field; `auto` falls back to direct execution when those constraints are not
  met.

## Strategy selection

`strategy` may be `auto`, `direct`, or `fft`. The initial `auto` heuristic selects direct execution
for kernel areas through `GPU_CONVOLUTION_AUTO_DIRECT_KERNEL_AREA` (currently 4096, approximately
a 64-by-64 square) and FFT execution above that cutoff when the FFT dimensions and device limits
are supported. Explicit strategies are useful for workload-specific measurements.

`getGPUConvolutionSupport(device, props)` reports the selected strategy, planned dimensions, and
any device or FFT constraint that prevents execution. `convolution.stats` and
`makeGPUConvolutionStats(props)` expose the direct multiply-add count, padded FFT field, transform
and dispatch counts, and logical transient byte requirement.

## Performance notes

Direct execution performs `width * height * kernelWidth * kernelHeight` multiply-adds. It avoids
padding and intermediate buffers, so small kernels usually win; performance is driven by kernel
area, input-cache reuse, boundary checks, and memory bandwidth. The current general shader does
not detect separable kernels.

FFT execution scales with the padded field size times its logarithm rather than kernel area, but it
performs three complete transforms plus packing, spectral multiplication, and cropping. Large
kernels can amortize that fixed work. Zero boundaries can round each padded dimension up sharply,
so a small change in field or kernel shape may move the crossover. Memory capacity and the graph
compiler's transient aliasing are also important for the nine logical complex scratch fields.

Subgroups offer limited benefit to the direct path because neighboring lanes do not exchange a
fixed reusable value pattern for arbitrary kernels. Early horizontal FFT butterflies could reuse
the optional subgroup machinery from `GPUFFT1D`, but vertical strided stages and the pack,
multiply, and crop passes would be unchanged. The spectral convolution path is therefore portable
for now; benchmark evidence across the complete pipeline should gate any subgroup specialization.

`runGPUConvolutionBenchmark(device, options)` correctness-gates direct and FFT paths for small,
medium, and large kernels, reports CPU encode and available GPU timestamp distributions, and
identifies the first measured kernel area where FFT wins. Measure representative field and kernel
shapes instead of treating the initial area cutoff as device-independent.

## Current limits

- WebGPU only; no WebGL fallback.
- Packed scalar `float32` fields and kernels only.
- Same-size output with centered, odd-sized kernels.
- Zero and wrap boundaries only.
- FFT dimensions are powers of two no larger than 2048.
- Out-of-place buffers only; no hidden submission or readback.
