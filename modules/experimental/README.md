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

`GPUConvolutionBloom` performs physically motivated optical convolution on WebGPU. It extracts
exposure-aware HDR highlights, transforms red, green, and blue into frequency space, multiplies
them by one cached aperture point-spread spectrum, applies inverse transforms, and composites the
result into a caller-owned `rgba16float` storage texture. Generated aperture kernels support blade
count, diffraction strength, and anamorphic stretch; applications can provide any nonnegative
`Float32Array` point-spread function and replace it with `setPointSpreadFunction()`.

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
  apertureBlades: 6,
  diffractionStrength: 0.3
});

const encoder = device.createCommandEncoder();
bloom.encode(encoder, {sourceTexture, outputTexture, exposure: 1});
device.submit(encoder.finish());
```

The caller owns source/output textures and command submission; the renderer owns reusable FFT
buffers and its cached optical spectrum. `bloom.stats` publishes exact transform dimensions,
complex-buffer allocation, steady-state dispatch count, and one-time kernel initialization work.
At 1920 x 1080 with quarter-resolution sampling, the power-of-two transform is 512 x 512 and
requires nine reusable complex buffers totaling 18 MiB, 123 steady-state dispatches, and 20
additional dispatches whenever the point-spread function changes. Prefer the fused multiscale
pipeline in `@luma.gl/effects` for routine real-time bloom; reserve FFT convolution for premium
optical fidelity or applications with measured compute headroom.

Optional algorithm entry points keep specialized workflows out of the default experimental bundle:

- `@luma.gl/experimental/geospatial` provides graph-native spatial operations and distance kernels.
- `@luma.gl/experimental/luproj` compiles arbitrary CPU coordinate transformations into
  precision-preserving, GPU-evaluated local projection patches.
- `@luma.gl/experimental/lutrace` keeps execution-trace scenes, process/thread interactions,
  dependency focus, and timeline picking separate from generic command-graph primitives.
