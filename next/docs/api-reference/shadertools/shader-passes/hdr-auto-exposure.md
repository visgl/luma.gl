# HDR Auto Exposure

Continuously meter scene luminance and adapt camera exposure entirely on the GPU. `createHDRAutoExposureShaderPassPipeline` uses a center-weighted logarithmic luminance pyramid, persistent exposure history, and independent brightening and darkening response speeds.

### Deferred Rendering: Illumination Lab

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/deferred-rendering)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Export            | `createHDRAutoExposureShaderPassPipeline`                       |
| Backend           | WebGPU                                                          |
| Render passes     | Seven: extraction, four reductions, adaptation, and application |
| Persistent state  | One GPU-owned exposure-history texture                          |
| Recommended input | Linear `rgba16float` scene color                                |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {

  createBloomShaderPassPipeline,

  createHDRAutoExposureShaderPassPipeline,

  toneMapping

} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [

    createHDRAutoExposureShaderPassPipeline({meteringScale: 0.25, initialExposure: 1}),

    createBloomShaderPassPipeline({quality: 'high'}),

    toneMapping

  ]

});



renderer.renderToScreen({

  sourceTexture: hdrSceneTexture,

  uniforms: {

    hdrAutoExposureAdapt: {

      keyValue: 0.48,

      minimumExposure: 0.45,

      maximumExposure: 2.4,

      brightenSpeed: 1.6,

      darkenSpeed: 2.8,

      deltaTime: frameDeltaSeconds,

      enabled: 1

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter         | Default | Description                                                                           |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| `meteringScale`   | `0.25`  | Initial luminance-target scale; smaller values are clamped to `0.25`.                 |
| `initialExposure` | `1`     | Value used to initialize or recreate persistent exposure history.                     |
| `keyValue`        | `0.48`  | Target middle-gray response used to derive scene exposure.                            |
| `minimumExposure` | `0.45`  | Lower bound on the adapted exposure multiplier.                                       |
| `maximumExposure` | `2.4`   | Upper bound on the adapted exposure multiplier.                                       |
| `brightenSpeed`   | `1.6`   | Adaptation rate when the image needs to become brighter.                              |
| `darkenSpeed`     | `2.8`   | Adaptation rate when the image needs to become darker.                                |
| `deltaTime`       | `0.016` | Current frame duration in seconds; update this application-owned uniform every frame. |

## How It Works[​](#how-it-works "Direct link to How It Works")

1. Sample a 4-by-4 footprint and accumulate center-weighted logarithmic luminance.
2. Reduce four successively smaller floating-point pyramid levels.
3. Derive geometric-mean scene brightness without copying results back to the CPU.
4. Adapt and clamp the persistent exposure target with direction-specific response speeds.
5. Multiply the original HDR scene color by the current adapted exposure.

The pipeline can also expose a false-color luminance visualization through the application-stage debug uniform. Reset renderer history when a resize, camera cut, or scene replacement should discard the previous adaptation state.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) supports exposure-aware highlight thresholds and exposure-corrected temporal history.
* [Tone Mapping](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tone-mapping.md) converts the adapted HDR image into display-ready color.
* [Temporal Antialiasing](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) normally precedes exposure and bloom in the render stack.
