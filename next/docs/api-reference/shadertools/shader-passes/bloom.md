# Bloom

Spread bright scene highlights into a controllable photographic glow. luma.gl provides a compact single-pass bloom effect, a composable HDR multiscale pipeline, and a separate WebGPU FFT convolution renderer for measured or generated optical point-spread functions.

### Bloom

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/bloom)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Implementation          | Export                                                  | Backends          | Suitable for                                                                        |
| ----------------------- | ------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| Compact bloom           | `bloom` from `@luma.gl/effects`                         | WebGPU and WebGL2 | A single inexpensive highlight-glow pass.                                           |
| Multiscale HDR bloom    | `createBloomShaderPassPipeline` from `@luma.gl/effects` | WebGPU and WebGL2 | Configurable HDR scattering, temporal stabilization, and photographic lens effects. |
| FFT optical convolution | `GPUConvolutionBloom` from `@luma.gl/experimental`      | WebGPU            | Full-image generated or measured RGB lens-response kernels.                         |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createBloomShaderPassPipeline, toneMapping} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [

    createBloomShaderPassPipeline({

      quality: 'high',

      blurAlgorithm: 'dual-kawase',

      downsample: 'auto',

      threshold: 0.8,

      intensity: 1,

      scatter: 0.55,

      reconstruction: 'bicubic',

      temporalStability: 0.75,

      lens: {starburstIntensity: 0.3, ghostIntensity: 0.15, dirtIntensity: 0.2}

    }),

    toneMapping

  ]

});



renderer.renderToScreen({

  sourceTexture: hdrSceneTexture,

  bindings: {lensDirtTexture}

});
```

For the compact implementation, place `bloom` directly in the `shaderPasses` array and provide `uniforms: {bloom: {radius: 4, threshold: 0.8, intensity: 1}}` when rendering.

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter            | Default      | Description                                                                             |
| -------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `quality`            | `'high'`     | Pyramid depth: `low`, `medium`, `high`, and `ultra` create two through five levels.     |
| `radius`             | `8`          | Blur radius for the configurable HDR pipeline; compact `bloom` defaults to `4`.         |
| `threshold`          | `0.8`        | Scene-referred luminance at which highlights begin contributing to glow.                |
| `intensity`          | `1`          | Strength of the reconstructed bloom contribution.                                       |
| `scatter`            | `0.55`       | Relative contribution from progressively wider pyramid levels.                          |
| `softKnee`           | `0.5`        | Width of the smooth highlight-threshold transition.                                     |
| `blurAlgorithm`      | `'gaussian'` | Separable Gaussian filtering or the lower-pass-count `'dual-kawase'` pyramid.           |
| `reconstruction`     | `'tent'`     | Normalized tent filtering or four-bilinear-fetch `'bicubic'` reconstruction.            |
| `downsample`         | `'auto'`     | Select fused WebGPU compute when available; `'render'` forces portable fragment stages. |
| `resolutionScale`    | `1`          | Multiplier applied to every extraction and reconstruction target.                       |
| `fireflyReduction`   | `0`          | Suppression strength for isolated, unusually bright source samples.                     |
| `anamorphicRatio`    | `0`          | Horizontal or vertical stretching, clamped between `-1` and `1`.                        |
| `energyConserving`   | `false`      | Replace additive thresholded glow with normalized, thresholdless scene scattering.      |
| `temporalStability`  | `0`          | Contribution from neighborhood-clamped persistent glow history.                         |
| `reuseRenderTargets` | `true`       | Reuse expired extraction targets for compatible reconstruction stages.                  |

`exposure`, `exposureCompensation`, `previousExposure`, `tint`, `temporalReprojection`, and `temporalDepthThreshold` provide additional control over camera response and motion-aware history. The default intermediate format is `rgba16float` to preserve unclamped highlight energy.

## Performance by Quality[​](#performance-by-quality "Direct link to Performance by Quality")

| Quality  | Pyramid levels | Gaussian portable | Gaussian WebGPU       | Dual-Kawase portable | Dual-Kawase WebGPU   |
| -------- | -------------- | ----------------- | --------------------- | -------------------- | -------------------- |
| `low`    | `2`            | 8 render passes   | 6 render + 1 compute  | 4 render passes      | 2 render + 1 compute |
| `medium` | `3`            | 12 render passes  | 9 render + 1 compute  | 6 render passes      | 3 render + 1 compute |
| `high`   | `4`            | 16 render passes  | 12 render + 1 compute | 8 render passes      | 4 render + 1 compute |
| `ultra`  | `5`            | 20 render passes  | 15 render + 1 compute | 10 render passes     | 5 render + 1 compute |

Counts describe the bloom pipeline itself; renderer presentation, optional lens artifacts, and optional history stages are additional. The fused compute path requires WebGPU, storage-write support for the chosen format, and sufficient storage bindings. Unsupported configurations automatically retain the portable render implementation.

## Lens Effects and Temporal History[​](#lens-effects-and-temporal-history "Direct link to Lens Effects and Temporal History")

`lens.starburstIntensity`, `lens.ghostIntensity`, and `lens.haloIntensity` enable aperture-style diffraction streaks, mirrored lens-element reflections, and radial halos. When any of these are positive, all three effects share one additional half-resolution pass. Each starburst ray uses eight samples; a ghost uses one sample, or three with chromatic aberration.

`lens.dirtIntensity` samples an application-provided `lensDirtTexture` during the existing composite. Dirt alone therefore adds neither a render pass nor an intermediate target.

Enabling `temporalStability` adds one persistent half-resolution history texture and one extra resolve pass. `temporalReprojection: true` additionally requires caller-provided `velocityTexture` and `depthTexture` bindings, rejects disocclusions, and stores prior depth in the existing history alpha channel. `previousExposure` corrects accumulated history after camera-exposure changes.

## FFT Optical Convolution[​](#fft-optical-convolution "Direct link to FFT Optical Convolution")

`GPUConvolutionBloom` applies a complete point-spread function in the frequency domain rather than approximating broad optical response with a local pyramid. It accepts a shared generated or measured kernel, or independent red, green, and blue kernels. Its packed FFT schedule processes the three channels together, while zero-padded guard bands prevent highlights from wrapping around opposite image edges.

At 1920 by 1080 with quarter-resolution sampling and the default 12.5% guard band:

| Configuration      | FFT dimensions | Complex buffers | Steady-state compute dispatches |
| ------------------ | -------------- | --------------- | ------------------------------- |
| Default guard band | `1024 x 512`   | `48 MiB`        | `45`                            |
| `guardBand: 0`     | `512 x 512`    | `24 MiB`        | `43`                            |

Changing the optical kernel requires 21 additional initialization dispatches for the guarded configuration. Chromatic ghosts, radial halo, lens dirt, temporal history, and optional GPU-resident exposure execute in the existing final compute stage.

## Composition and Integration[​](#composition-and-integration "Direct link to Composition and Integration")

Keep bloom in linear floating-point scene color after lighting and adaptive exposure, but before [Tone Mapping](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tone-mapping.md). A typical HDR order is temporal reconstruction, auto exposure, bloom, and then the display transform.

deck.gl's existing `PostProcessEffect` can execute the compact `bloom` shader-pass descriptor. It does not execute named-target `ShaderPassPipeline` graphs or the separate WebGPU FFT renderer, and its default intermediate format is `rgba8unorm`; retaining unclamped HDR highlights therefore requires an integration that arranges floating-point scene and postprocessing targets.

## Technical References[​](#technical-references "Direct link to Technical References")

* [Unreal Engine bloom documentation](https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine) describes convolution kernels, lens dirt, energy conservation, and edge-padding controls.
* [AMD FidelityFX Single Pass Downsampler](https://gpuopen.com/manuals/fidelityfx_sdk/techniques/single-pass-downsampler/) documents single-dispatch workgroup-local image reduction.
* [Google Filament imaging pipeline](https://google.github.io/filament/main/filament.html) explains scene-linear bloom, camera exposure, and processing before tone mapping.
* [deck.gl PostProcessEffect](https://deck.gl/docs/api-reference/core/post-process-effect) documents deck.gl's existing shader-module postprocessing interface.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [HDR Auto Exposure](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hdr-auto-exposure.md) supplies adaptive camera response before bloom.
* [Gaussian Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/gaussian-blur.md) documents the standalone separable blur kernel.
* [Tone Mapping](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tone-mapping.md) converts composed HDR lighting into display-ready color.
