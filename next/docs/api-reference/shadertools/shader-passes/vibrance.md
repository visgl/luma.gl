# Vibrance

Adjust subdued colors while protecting hues that are already strongly saturated. `vibrance` offers a more selective color-grade control than a uniform saturation adjustment.

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
| Export            | `vibrance`                       |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {vibrance} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [vibrance]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {vibrance: {amount: 0.45}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Range       | Description                                                                        |
| --------- | ------- | ----------- | ---------------------------------------------------------------------------------- |
| `amount`  | `0`     | `-1` to `1` | Decreases or increases saturation in proportion to how muted each source color is. |

The zero default leaves the source unchanged. Positive values reveal quieter color detail without applying the same increase to already vivid pixels.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Vibrance is a single color-only pass and requires no intermediate history or scene attachments. It works well after a broad hue rotation, after a color halftone, or as a late finishing grade. Use [Hue and Saturation](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hue-saturation.md) when all colors should change with the same global saturation control.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Hue and Saturation](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hue-saturation.md) adjusts all colors uniformly.
* [Brightness and Contrast](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/brightness-contrast.md) controls the tonal range instead of chroma.
* [Color Halftone](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/color-halftone.md) provides a complementary print-style color treatment.
