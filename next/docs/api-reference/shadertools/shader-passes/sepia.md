# Sepia

Blend a warm, reddish-brown photographic treatment into the source image. `sepia` provides an adjustable archival look while retaining the underlying composition and brightness structure.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                            |
| ----------------- | -------------------------------- |
| Export            | `sepia`                          |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {sepia} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [sepia]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {sepia: {amount: 0.7}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Range      | Description                                                                  |
| --------- | ------- | ---------- | ---------------------------------------------------------------------------- |
| `amount`  | `0.5`   | `0` to `1` | Interpolates from the untouched image to the complete sepia color transform. |

Lower values retain more of the source palette. Higher values make the warm monochromatic color bias increasingly prominent.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The effect is one source-color filter with no extra textures or temporal state. Combining it with [Vignette](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vignette.md) and a small amount of [Noise](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/noise.md) produces a photographic finishing stack. Run the sepia transform before those finishing effects when the grain and edge darkening should remain neutral.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Hue and Saturation](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hue-saturation.md) offers freeform hue rotation and desaturation.
* [Noise](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/noise.md) adds controllable monochrome grain.
* [Vignette](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vignette.md) concentrates attention toward the image center.
