# Temporal Antialiasing

Accumulate jittered samples from successive frames while following scene motion and rejecting invalid history. `createTAAShaderPassPipeline` combines velocity reprojection, depth validation, and neighborhood clamping to reduce spatial aliasing and temporal shimmer.

### Advanced Effects: Visualization City

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/advanced-effects)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| Export            | `createTAAShaderPassPipeline`                                        |
| Backend           | WebGPU                                                               |
| Render passes     | Three: temporal resolve, resolved-color copy, and depth-history copy |
| Required bindings | `depthTexture` and `velocityTexture`                                 |
| Persistent state  | Renderer-owned color and depth history textures                      |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createTAAShaderPassPipeline, toneMapping} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [createTAAShaderPassPipeline(), toneMapping]

});



renderer.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: gBuffer.getShaderPassBindings(),

  uniforms: {

    taaResolve: {

      historyWeight: 0.9,

      depthThreshold: 0.01,

      currentJitter,

      previousJitter

    }

  },

  resetHistory: cameraCut

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter        | Default  | Description                                                                |
| ---------------- | -------- | -------------------------------------------------------------------------- |
| `historyWeight`  | `0.9`    | Fraction of valid accumulated history retained in the resolved color.      |
| `depthThreshold` | `0.01`   | Maximum allowed difference between current and reprojected previous depth. |
| `currentJitter`  | `[0, 0]` | Current projection jitter in normalized image coordinates.                 |
| `previousJitter` | `[0, 0]` | Previous projection jitter in normalized image coordinates.                |

The history weight is limited to `0.98`. The application must render the source scene with the same projection jitter and provide matching velocity and depth attachments every frame.

## How It Works[​](#how-it-works "Direct link to How It Works")

1. Move each current pixel into the previous frame with its velocity and jitter delta.
2. Reject history outside the screen or across a depth disocclusion.
3. Clamp valid history to the current 3-by-3 color neighborhood.
4. Blend the current color and bounded history, then save current depth for the next frame.

Call `renderer.resetHistory()` or pass `resetHistory: true` after resize, camera cuts, abrupt scene replacement, or invalid velocity generation.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [FXAA](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/fxaa.md) smooths one display image without history or auxiliary attachments.
* [Camera-Reprojection Antialiasing](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/camera-reprojection-antialiasing.md) derives motion from camera matrices rather than a velocity texture.
* [Motion Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/motion-blur.md) uses the same depth and velocity attachments for directional shutter blur.
