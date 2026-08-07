# Bulge and Pinch

Push image coordinates outward or pull them inward inside a circular region. `bulgePinch` simulates an adjustable local lens distortion without changing geometry or requiring scene depth.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                |
| ----------------- | ------------------------------------ |
| Export            | `bulgePinch`                         |
| Backends          | WebGPU and WebGL2                    |
| Render passes     | One fullscreen texture-sampling pass |
| Additional inputs | None                                 |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {bulgePinch} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [bulgePinch]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {bulgePinch: {center: [0.5, 0.5], radius: 240, strength: 0.45}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter  | Default      | Range or purpose                                                |
| ---------- | ------------ | --------------------------------------------------------------- |
| `center`   | `[0.5, 0.5]` | Normalized image position at the center of the lens distortion. |
| `radius`   | `200`        | Circular effect radius in source-image pixels; minimum is `1`.  |
| `strength` | `0.5`        | Distortion direction and magnitude, from `-1` through `1`.      |

Positive and negative strengths bend the sampling field in opposite directions; a zero strength preserves the original image geometry.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Bulge and pinch uses one texture-sampling pass and owns no intermediate history. Because it moves color coordinates without moving scene depth, normal, or velocity attachments, place it after scene-aware lighting, outlines, motion blur, and temporal reconstruction.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Magnify](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/magnify.md) enlarges pixels inside an adjustable circular lens.
* [Swirl](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/swirl.md) rotates sample positions around a focal center.
* [Zoom Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/zoom-blur.md) produces radial motion streaks around a selected point.
