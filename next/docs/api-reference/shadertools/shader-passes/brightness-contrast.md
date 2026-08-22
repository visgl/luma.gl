# Brightness and Contrast

Shape overall exposure and tonal separation with a compact, single-pass color adjustment. Use `brightnessContrast` for interactive image correction, restrained scene grading, or graphic high-contrast treatments.

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
| Export            | `brightnessContrast`             |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {brightnessContrast} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [brightnessContrast]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {brightnessContrast: {brightness: 0.08, contrast: 0.28}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter    | Default | Range       | Description                                                                        |
| ------------ | ------- | ----------- | ---------------------------------------------------------------------------------- |
| `brightness` | `0`     | `-1` to `1` | Adds or subtracts light uniformly; `-1` approaches black and `1` approaches white. |
| `contrast`   | `0`     | `-1` to `1` | Compresses or expands tonal separation around the image midpoint.                  |

Both defaults preserve the source image. Positive contrast emphasizes existing differences; negative contrast compresses the image toward neutral gray.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

This pass samples only the current source color and does not allocate history or named textures. Apply moderate adjustments after exposure or tone mapping for predictable display-space grading. When combined with edge extraction or halftones, placing contrast first gives the later effect a more distinct source signal.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Hue and Saturation](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/hue-saturation.md) rotates or expands the color palette.
* [Vibrance](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/vibrance.md) targets muted colors without treating every hue equally.
* [Tone Mapping](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tone-mapping.md) compresses scene-linear HDR highlights with a filmic curve.
