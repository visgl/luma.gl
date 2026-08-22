# Hue and Saturation

Rotate the image palette and control overall color intensity without changing the basic image geometry. `hueSaturation` is useful for color grading, thematic recoloring, and reducing a scene to monochrome.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                            |
| ----------------- | -------------------------------- |
| Export            | `hueSaturation`                  |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {hueSaturation} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [hueSaturation]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {hueSaturation: {hue: -0.08, saturation: 0.32}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter    | Default | Range       | Description                                                                                     |
| ------------ | ------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `hue`        | `0`     | `-1` to `1` | Rotates RGB around the grayscale axis; the endpoints represent a half-turn in either direction. |
| `saturation` | `0`     | `-1` to `1` | Pulls colors toward gray or pushes them farther from their channel average.                     |

A saturation value of `-1` produces a grayscale treatment. Hue rotation leaves perfectly neutral colors on the grayscale axis unchanged.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The implementation operates directly on the current pixel and requires no neighboring samples, depth attachments, or history. Place it before color-dependent stylization when the rotated palette should affect printed channels, or after bloom when the entire composed image should be graded together.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Vibrance](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vibrance.md) selectively boosts less saturated colors.
* [Sepia](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/sepia.md) applies a specific warm photographic color transform.
* [Color Halftone](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/color-halftone.md) converts a graded image into separated print channels.
