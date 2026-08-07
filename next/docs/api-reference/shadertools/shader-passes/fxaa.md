# FXAA

Reduce jagged high-contrast image edges with Fast Approximate Anti-Aliasing. `fxaa` operates on a single completed color image, making it suitable when multisampling, scene motion vectors, or temporal history are unavailable.

### Antialiasing Techniques

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/antialiasing)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property         | Value                                   |
| ---------------- | --------------------------------------- |
| Export           | `fxaa`                                  |
| Backends         | WebGPU and WebGL2                       |
| Render passes    | One fullscreen edge-aware sampling pass |
| Required inputs  | Current color texture only              |
| Persistent state | None                                    |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {fxaa, toneMapping} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [toneMapping, fxaa]

});



renderer.renderToScreen({sourceTexture: hdrSceneTexture});
```

## Parameters[​](#parameters "Direct link to Parameters")

`fxaa` currently exposes no runtime tuning uniforms. Its quality settings are compiled into the shader implementation. The pass derives luminance from source RGB, detects local edge direction, and searches along that edge before blending a smoother result.

## Performance and Placement[​](#performance-and-placement "Direct link to Performance and Placement")

FXAA requires one render pass but can sample multiple neighboring texels around candidate edges. It does not allocate temporal history, consume depth or velocity attachments, or eliminate frame-to-frame subpixel shimmer. Apply it close to final presentation so edge detection sees the display-referred contrast created by tone mapping and grading.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Temporal Antialiasing](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) accumulates jittered frames with velocity and depth rejection.
* [Camera-Reprojection Antialiasing](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/camera-reprojection-antialiasing.md) reconstructs camera motion without a velocity attachment.
* [Tone Mapping](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/tone-mapping.md) typically precedes display-space FXAA.
