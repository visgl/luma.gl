# Gaussian Blur

Soften an image with a smooth, bell-shaped Gaussian kernel. `gaussianBlur` applies independent horizontal and vertical passes to approximate a two-dimensional photographic blur without a full two-dimensional sampling loop.

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
| Export            | `gaussianBlur`                           |
| Backends          | WebGPU and WebGL2                        |
| Render passes     | Two separable fullscreen sampling passes |
| Additional inputs | None                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {gaussianBlur} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {shaderPasses: [gaussianBlur]});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  uniforms: {gaussianBlur: {radius: 10}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter | Default | Range       | Description                                      |
| --------- | ------- | ----------- | ------------------------------------------------ |
| `radius`  | `12`    | `0` to `32` | Gaussian sampling radius in source-image pixels. |

The internal `delta` uniform selects the horizontal and vertical direction automatically; callers should not manage it directly.

## Composition and Cost[​](#composition-and-cost "Direct link to Composition and Cost")

Two fullscreen passes are always used, and larger radii increase sampling work inside each pass. For very wide glow, the multiscale [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) pipeline reduces work by filtering smaller pyramid levels instead of sampling a large full-resolution neighborhood. Unlike [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md), Gaussian blur intentionally mixes across depth edges.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Triangle Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/triangle-blur.md) uses a triangular rather than Gaussian weight profile.
* [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) preserves depth discontinuities.
* [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) combines multiscale blur with highlight extraction and reconstruction.
