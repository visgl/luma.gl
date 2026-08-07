# Ink

Emphasize local image contrast as dark illustrated contours. `ink` produces a graphic, hand-drawn treatment directly from scene color without requiring depth, normals, or a separate object-identification buffer.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                          |
| ----------------- | ------------------------------ |
| Export            | `ink`                          |
| Backends          | WebGPU and WebGL2              |
| Render passes     | One neighborhood-sampling pass |
| Additional inputs | None                           |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {brightnessContrast, ink} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [brightnessContrast, ink]

});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {

    brightnessContrast: {brightness: 0.04, contrast: 0.28},

    ink: {strength: 0.36}

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter  | Default | Suggested range | Description                                                                 |
| ---------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `strength` | `0.25`  | `0` to `1`      | Weight of the dark contour response derived from neighboring source colors. |

Higher strengths reveal more aggressive illustrative lines. A value of zero suppresses the visible treatment but does not remove the configured fullscreen pass.

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

Ink performs one render pass but reads nearby pixels to derive its local contrast response. Increase contrast beforehand for stronger edge separation. Use [Screen-Space Outlines](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/outlines.md) when geometric silhouettes should remain independent of surface texture or illumination patterns.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Edge Work](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/edge-work.md) isolates frequency differences in two configurable passes.
* [Screen-Space Outlines](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/outlines.md) uses scene depth and normals instead of color alone.
* [Brightness and Contrast](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/brightness-contrast.md) strengthens the source image before contour extraction.
