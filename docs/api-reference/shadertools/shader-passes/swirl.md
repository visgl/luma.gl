# Swirl

Rotate image samples around a configurable circular focal region. `swirl` creates a controllable vortex distortion whose angular displacement decreases away from the selected center.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                |
| ----------------- | ------------------------------------ |
| Export            | `swirl`                              |
| Backends          | WebGPU and WebGL2                    |
| Render passes     | One fullscreen texture-sampling pass |
| Additional inputs | None                                 |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {swirl} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [swirl]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {swirl: {center: [0.5, 0.5], radius: 300, angle: 1.05}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default      | Description                                                                               |
| --------- | ------------ | ----------------------------------------------------------------------------------------- |
| `center`  | `[0.5, 0.5]` | Normalized origin of the circular distortion.                                             |
| `radius`  | `200`        | Maximum affected distance from the center in source-image pixels.                         |
| `angle`   | `3`          | Rotation strength in radians; positive and negative values rotate in opposite directions. |

The image outside the chosen radius remains unwarped. Animating `angle` creates continuous rotation without changing the original scene geometry.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Swirl requires one fullscreen source-texture sampling pass and no auxiliary attachments. Because depth, normal, and velocity textures are not warped alongside the color result, run it after scene-aware effects and temporal reconstruction.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Bulge and Pinch](https://luma.gl/docs/api-reference/shadertools/shader-passes/bulge-pinch.md) applies radial rather than angular distortion.
* [Magnify](https://luma.gl/docs/api-reference/shadertools/shader-passes/magnify.md) creates an adjustable local inspection lens.
* [Zoom Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/zoom-blur.md) stretches samples toward a central focal point.
