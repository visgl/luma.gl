# Noise

Add controllable monochrome grain to the current image. `noise` provides a simple tactile finishing effect for photographic grading, stylized presentation, and deliberately imperfect rendered imagery.

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
| Export            | `noise`                          |
| Backends          | WebGPU and WebGL2                |
| Render passes     | One fullscreen color-filter pass |
| Additional inputs | None                             |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {noise, sepia} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [sepia, noise]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {sepia: {amount: 0.6}, noise: {amount: 0.2}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Range      | Description                                        |
| --------- | ------- | ---------- | -------------------------------------------------- |
| `amount`  | `0.5`   | `0` to `1` | Strength of the added black-and-white image grain. |

The zero setting leaves the image visually unchanged. Small positive values are usually enough for a subtle photographic finish.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Noise uses one source-color pass and does not allocate scene attachments or temporal history. Place it late in the effect chain when grain should remain sharp; blurring or temporal accumulation afterward will soften or average it. Use [Denoise](https://luma.gl/docs/api-reference/shadertools/shader-passes/denoise.md) for the inverse operation on already noisy imagery.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Denoise](https://luma.gl/docs/api-reference/shadertools/shader-passes/denoise.md) reduces existing grain with color-weighted neighborhood filtering.
* [Sepia](https://luma.gl/docs/api-reference/shadertools/shader-passes/sepia.md) supplies a complementary warm photographic grade.
* [Vignette](https://luma.gl/docs/api-reference/shadertools/shader-passes/vignette.md) adds a radial photographic finishing treatment.
