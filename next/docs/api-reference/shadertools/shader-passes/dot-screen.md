# Dot Screen

Convert source-image luminance into a rotated monochrome dot pattern. `dotScreen` produces a graphic halftone treatment whose orientation, origin, and cell size remain fully adjustable.

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
| Export            | `dotScreen`                      |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {dotScreen} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [dotScreen]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {dotScreen: {center: [0.5, 0.5], angle: 0.42, size: 5}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default      | Description                                      |
| --------- | ------------ | ------------------------------------------------ |
| `center`  | `[0.5, 0.5]` | Normalized origin of the rotated screen pattern. |
| `angle`   | `1.1`        | Dot-screen rotation in radians.                  |
| `size`    | `3`          | Dot-cell size in image pixels; minimum is `1`.   |

Fine cells preserve more source detail, while larger cells make the underlying print structure more prominent.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The effect runs in one fullscreen pass and derives its pattern from current color and image coordinates. Raising [Brightness and Contrast](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/brightness-contrast.md) before the dot screen can sharpen tonal separation; [Color Halftone](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/color-halftone.md) preserves multiple color channels when a monochrome treatment is not desired.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Color Halftone](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/color-halftone.md) creates independent full-color print patterns.
* [Brightness and Contrast](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/brightness-contrast.md) controls the luminance entering the screen.
* [Ink](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/ink.md) produces a complementary contour-oriented illustrated style.
