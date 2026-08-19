# @luma.gl/experimental

Experimental features for luma.gl.

:::warning
These are experimental features that may change or be removed at any time. Use at your own risk.
:::

The package currently includes experimental GPU command graphs and data-parallel primitives such
as scan, compaction, stable key/value sort, two-dimensional FFT, and spectral ocean simulation,
energy-conserving FFT aperture diffraction and photographic bloom,
order-independent transparency renderers, composable cross-backend glass and reflective-material
shader modules, packed pixel-format helpers, and v10 work-in-progress WebGPU/WebGL WebXR session
and frame helpers, with WebGL-only raw camera textures. See the
[luma.gl API reference](https://luma.gl/docs/api-reference/experimental) for documentation.

## FFT Convolution Bloom

`GPUConvolutionBloom` performs physically motivated optical convolution on WebGPU. Area-weighted
HDR extraction preserves subpixel emitters and centers the sampled image inside zero-padded guard
bands, preventing diffraction from wrapping onto the opposite edge. Packed RGB fields share one
forward and one inverse FFT schedule instead of six independent transforms. Each wavelength uses
its own cached aperture spectrum, with configurable blade count, diffraction strength, anamorphic
stretch, and spectral spread. Applications can provide either one nonnegative `Float32Array`
kernel or independently measured `{red, green, blue}` kernels and replace them with
`setPointSpreadFunction()`.

Set `energyConserving: true` for thresholdless normalized scattering. Optional chromatic ghosts,
radial halo, sampled dirt, and neighborhood-clamped temporal stabilization execute inside the
existing final compute dispatch. Supplying `exposureTexture` to `encode()` consumes GPU-resident
adapted exposure directly and automatically compensates temporal history without CPU readback.

```ts
import {Texture} from '@luma.gl/core';
import {GPUConvolutionBloom, getGPUConvolutionBloomSupport} from '@luma.gl/experimental';

const support = getGPUConvolutionBloomSupport(device, {width, height, resolutionScale: 0.25});
if (!support.supported) {
  throw new Error(support.reason);
}

const outputTexture = device.createTexture({
  width,
  height,
  format: 'rgba16float',
  usage: Texture.STORAGE | Texture.SAMPLE
});
const bloom = new GPUConvolutionBloom(device, {
  width,
  height,
  resolutionScale: 0.25,
  guardBand: 0.125,
  apertureBlades: 6,
  diffractionStrength: 0.3,
  spectralSpread: 0.65,
  temporalStability: 0.55,
  lens: {ghostIntensity: 0.25, haloIntensity: 0.15}
});

const encoder = device.createCommandEncoder();
bloom.encode(encoder, {sourceTexture, outputTexture, exposure: 1});
device.submit(encoder.finish());
```

The caller owns source/output textures and command submission; the renderer owns reusable FFT
buffers, its cached RGB optical spectrum, and optional history. `bloom.stats` publishes exact
sampled content bounds, transform dimensions, packed complex-buffer allocation, steady-state
dispatch count, and one-time kernel initialization work. At 1920 x 1080 with quarter-resolution
sampling and the default 12.5% guard band, the transform is 1024 x 512 and requires four packed RGB
buffers totaling 48 MiB, 45 steady-state dispatches, and 21 dispatches when the aperture changes.
Setting `guardBand: 0` reduces that to a 512 x 512 transform, 24 MiB, and 43 dispatches, while
trading away explicit wraparound protection. The previous independent-channel path required 123
steady-state dispatches. On devices with `timestamp-query`, create the command encoder with a
`timeProfilingQuerySet` to collect actual GPU timings for every FFT and optical compute pass.

Optional algorithm entry points keep specialized workflows out of the default experimental bundle:

- `@luma.gl/experimental/geospatial` provides graph-native spatial operations and distance kernels.
- `@luma.gl/experimental/gpu-project` compiles arbitrary CPU coordinate transformations into
  precision-preserving, GPU-evaluated local projection patches.
- `@luma.gl/experimental/gpu-trace` keeps execution-trace scenes, process/thread interactions,
  dependency focus, and timeline picking separate from generic command-graph primitives.
