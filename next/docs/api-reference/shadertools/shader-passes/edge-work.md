# Edge Work

Extract image contours by comparing neighborhood frequencies at different blur widths. `edgeWork` transforms a source image into a high-contrast line-oriented treatment without requiring scene depth or surface normals.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                          |
| ----------------- | ------------------------------ |
| Export            | `edgeWork`                     |
| Backends          | WebGPU and WebGL2              |
| Render passes     | Two fullscreen sampling passes |
| Additional inputs | None                           |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {edgeWork} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [edgeWork]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {edgeWork: {radius: 3}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Suggested range | Description                                                              |
| --------- | ------- | --------------- | ------------------------------------------------------------------------ |
| `radius`  | `2`     | `1` to `50`     | Neighborhood size in pixels used to isolate image-frequency differences. |

The descriptor selects its two internal `mode` values automatically. That implementation detail is not intended as a public control.

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

Edge work uses two sampling passes, and larger radii increase the amount of neighborhood work. Because contours come entirely from visible color, it can respond to textures and lighting as well as geometry. Choose [Screen-Space Outlines](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/outlines.md) when object depth and normal boundaries should determine the result instead.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Ink](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/ink.md) provides a one-pass color-neighborhood illustration effect.
* [Screen-Space Outlines](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/outlines.md) detects geometric depth and normal discontinuities.
* [Brightness and Contrast](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/brightness-contrast.md) can strengthen source-edge separation.
