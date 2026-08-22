# Color Halftone

Rebuild an image as rotated, offset print-screen patterns for its individual color channels. `colorHalftone` creates a configurable full-color halftone treatment reminiscent of traditional printed imagery.

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
| Export            | `colorHalftone`                  |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {colorHalftone} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [colorHalftone]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {colorHalftone: {center: [0.5, 0.5], angle: 0.32, size: 5}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default      | Description                                                                   |
| --------- | ------------ | ----------------------------------------------------------------------------- |
| `center`  | `[0.5, 0.5]` | Normalized image position used as the print-screen pattern origin.            |
| `angle`   | `1.1`        | Pattern rotation in radians; individual channels receive offset orientations. |
| `size`    | `4`          | Dot-cell size in source-image pixels; minimum is `1`.                         |

Increasing `size` makes the individual printed dots more visible. Moving the center changes the pattern alignment without moving scene geometry.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Color halftone is one source-color pass and owns no auxiliary textures. Apply [Hue and Saturation](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hue-saturation.md) first when palette rotation should affect the separated print channels, or apply [Vibrance](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vibrance.md) afterward to emphasize the resulting colors.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Dot Screen](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/dot-screen.md) creates a monochrome luminance-based print pattern.
* [Hexagonal Pixelate](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hexagonal-pixelate.md) replaces dots with a geometric mosaic.
* [Vibrance](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vibrance.md) selectively emphasizes quieter print colors.
