# Motion Blur

Integrate scene color along per-pixel motion vectors while reducing bleed across depth discontinuities. `createMotionBlurShaderPassPipeline` produces directional shutter blur from the same depth and velocity attachments used by temporal reconstruction.

### Advanced Effects: Visualization City

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/advanced-effects)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                     |
| ----------------- | ----------------------------------------- |
| Export            | `createMotionBlurShaderPassPipeline`      |
| Backend           | WebGPU                                    |
| Render passes     | One depth-aware directional sampling pass |
| Required bindings | `depthTexture` and `velocityTexture`      |
| Sample limit      | At most 16 samples per pixel              |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createMotionBlurShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [createMotionBlurShaderPassPipeline()]

});



renderer.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: gBuffer.getShaderPassBindings(),

  uniforms: {motionBlur: {strength: 1, sampleCount: 10}}

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter     | Default | Range       | Description                                                        |
| ------------- | ------- | ----------- | ------------------------------------------------------------------ |
| `strength`    | `1`     | Minimum `0` | Multiplier applied to the encoded per-pixel screen-space velocity. |
| `sampleCount` | `10`    | `2` to `16` | Number of source/depth samples distributed along the motion path.  |

Each candidate sample is exponentially down-weighted when its depth differs from the current pixel, reducing foreground/background mixing across object silhouettes.

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

Motion blur performs one fullscreen pass, but its cost rises directly with `sampleCount`. Both the source color and depth attachment are sampled at each step. Place it after temporal antialiasing and before exposure, bloom, or tone mapping when it should operate on stabilized HDR scene color.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Temporal Antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) consumes the same depth and velocity attachments.
* [Zoom Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/zoom-blur.md) creates an image-only radial effect without scene-authored velocity.
* [Persistence](https://luma.gl/docs/api-reference/shadertools/shader-passes/persistence.md) accumulates fading trails across complete frames.
