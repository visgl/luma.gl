# Denoise

Reduce visible image grain while preserving local color boundaries. `denoise` applies a color-weighted 9-by-9 neighborhood filter in two fullscreen sampling passes.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                          |
| ----------------- | ---------------------------------------------- |
| Export            | `denoise`                                      |
| Backends          | WebGPU and WebGL2                              |
| Render passes     | Two fullscreen bilateral-style sampling passes |
| Samples           | 81 source-color candidates per pass            |
| Additional inputs | None                                           |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {denoise} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [denoise]});



renderer.renderToScreen({

  sourceTexture: noisySceneTexture,

  uniforms: {denoise: {strength: 0.55}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter  | Default | Range      | Description                                                                 |
| ---------- | ------- | ---------- | --------------------------------------------------------------------------- |
| `strength` | `0.5`   | `0` to `1` | Controls the color-difference weighting applied to the 9-by-9 neighborhood. |

The implementation derives an internal exponent from `strength`. Samples whose color differs substantially from the center contribute less than nearby colors with similar intensity.

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

Denoise is considerably more sample-intensive than a simple color adjustment: both configured passes evaluate an 81-pixel neighborhood. Apply it only where source cleanup is necessary, and consider lower-resolution processing for large render targets. For depth-buffer-aware lighting data, [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) preserves explicit scene boundaries more directly.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Noise](https://luma.gl/docs/api-reference/shadertools/shader-passes/noise.md) adds intentional grain instead of removing it.
* [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) preserves geometry boundaries using a scene depth texture.
* [Gaussian Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/gaussian-blur.md) smooths uniformly without color-similarity rejection.
