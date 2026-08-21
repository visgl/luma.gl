# Hexagonal Pixelate

Replace fine image detail with a regular mosaic of hexagonal cells. `hexagonalPixelate` snaps source sampling positions to the nearest hexagonal center while preserving the broad scene composition and color palette.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                        |
| ----------------- | ---------------------------- |
| Export            | `hexagonalPixelate`          |
| Backends          | WebGPU and WebGL2            |
| Render passes     | One fullscreen sampling pass |
| Additional inputs | None                         |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {hexagonalPixelate} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [hexagonalPixelate]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {hexagonalPixelate: {center: [0.5, 0.5], scale: 12}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default      | Description                                               |
| --------- | ------------ | --------------------------------------------------------- |
| `center`  | `[0.5, 0.5]` | Normalized image origin used to align the hexagonal grid. |
| `scale`   | `10`         | Hexagonal cell size in image pixels; minimum is `1`.      |

Smaller cells preserve finer scene structure, while larger cells emphasize the mosaic geometry. Animating `center` moves the grid alignment without moving the original image.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The effect requires one fullscreen source-texture sample and no depth, history, or named targets. Place it before [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) when highlights should spread from the geometric mosaic, or after grading when the cells should preserve the finished scene palette.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Color Halftone](https://luma.gl/docs/api-reference/shadertools/shader-passes/color-halftone.md) uses rotated print-screen cells instead of a hexagonal grid.
* [Dot Screen](https://luma.gl/docs/api-reference/shadertools/shader-passes/dot-screen.md) creates a monochrome dot mosaic.
* [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) can soften bright cell boundaries and concentrated highlights.
