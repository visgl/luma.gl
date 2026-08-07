# Tilt Shift

Keep a chosen image-space line sharp while progressively blurring the surrounding scene. `tiltShift` creates a selective-focus miniature effect without requiring a scene depth texture.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                          |
| ----------------- | ---------------------------------------------- |
| Export            | `tiltShift`                                    |
| Backends          | WebGPU and WebGL2                              |
| Render passes     | Two directional fullscreen sampling passes     |
| Additional inputs | None; focus is defined entirely in image space |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {tiltShift} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [tiltShift]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {

    tiltShift: {

      start: [0.12, 0.36],

      end: [0.88, 0.64],

      blurRadius: 18,

      gradientRadius: 130

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter        | Default  | Range                        | Description                                                        |
| ---------------- | -------- | ---------------------------- | ------------------------------------------------------------------ |
| `start`          | `[0, 0]` | Normalized image coordinates | First endpoint of the line that remains in focus.                  |
| `end`            | `[1, 1]` | Normalized image coordinates | Second endpoint of the line that remains in focus.                 |
| `blurRadius`     | `15`     | `0` to `50`                  | Maximum blur radius in pixels away from the focal line.            |
| `gradientRadius` | `200`    | `0` to `400`                 | Distance in pixels over which blur grows from zero to its maximum. |

The focus model assumes the visible scene can be approximated by a planar image-space band. Objects at different real-world depths are not independently distinguished.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Tilt shift uses two directional sampling passes, with cost increasing as the selected blur radius grows. Choose [Depth of Field](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/depth-of-field.md) when a real depth attachment is available and foreground/background distance should determine focus instead of a manually positioned line.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Depth of Field](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/depth-of-field.md) derives blur from physical camera depth.
* [Gaussian Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/gaussian-blur.md) blurs the entire image evenly.
* [Zoom Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/zoom-blur.md) emphasizes motion toward a point rather than a focal band.
