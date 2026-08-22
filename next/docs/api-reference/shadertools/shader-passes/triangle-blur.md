# Triangle Blur

Blend neighboring pixels with a linearly weighted pyramid kernel. `triangleBlur` uses separable horizontal and vertical passes to produce an inexpensive, visibly soft image treatment.

### Effects: Image Processing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/showcase/postprocessing)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                    |
| ----------------- | ---------------------------------------- |
| Export            | `triangleBlur`                           |
| Backends          | WebGPU and WebGL2                        |
| Render passes     | Two separable fullscreen sampling passes |
| Additional inputs | None                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {triangleBlur} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [triangleBlur]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {triangleBlur: {radius: 14}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Suggested range | Description                                                 |
| --------- | ------- | --------------- | ----------------------------------------------------------- |
| `radius`  | `20`    | `0` to `100`    | Width of the triangular blur kernel in source-image pixels. |

The descriptor owns its horizontal and vertical direction uniforms. A radius of zero suppresses the visible blur but does not remove the two configured fullscreen passes.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

The pass performs two separable draws and requires no scene depth or persistent history. Its triangular weights differ from the smoother bell-shaped [Gaussian Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/gaussian-blur.md) kernel; choose between them based on the desired reconstruction profile rather than pass count alone.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Gaussian Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/gaussian-blur.md) produces a smoother photographic weight falloff.
* [Tilt Shift](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tilt-shift.md) varies blur strength around a selected focal line.
* [Zoom Blur](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/zoom-blur.md) samples radially toward an adjustable focal center.
