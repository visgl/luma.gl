# Screen-Space Ambient Occlusion

Darken tight creases and nearby surface contacts using the current scene depth buffer. `createSSAOShaderPassPipeline` evaluates screen-space ambient visibility, smooths it with a depth-aware bilateral blur, and composites the result into scene color.

### Advanced Effects: Visualization City

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/advanced-effects)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property         | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Export           | `createSSAOShaderPassPipeline`                                |
| Backend          | WebGPU                                                        |
| Render passes    | Four: evaluate, horizontal blur, vertical blur, and composite |
| Required binding | `depthTexture`                                                |
| Optional binding | `normalTexture` when `normalSource: 'normal-texture'`         |
| History          | None                                                          |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createSSAOShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [

    createSSAOShaderPassPipeline({

      normalSource: 'normal-texture',

      resolutionScale: 0.5

    })

  ]

});



renderer.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: gBuffer.getShaderPassBindings(),

  uniforms: {

    ssaoEvaluate: {

      nearPlane: 0.1,

      farPlane: 200,

      radius: 7,

      bias: 0.03,

      intensity: 1.35

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter         | Default                    | Description                                                            |
| ----------------- | -------------------------- | ---------------------------------------------------------------------- |
| `normalSource`    | `'reconstruct-from-depth'` | Reconstruct normals from depth or consume an explicit `normalTexture`. |
| `resolutionScale` | `1`                        | Relative resolution of all three occlusion intermediates.              |
| `nearPlane`       | `0.1`                      | Camera near plane used to linearize hardware depth.                    |
| `farPlane`        | `200`                      | Camera far plane used to linearize hardware depth.                     |
| `radius`          | `7`                        | Screen-space sampling radius around the current pixel.                 |
| `bias`            | `0.03`                     | Depth tolerance that reduces self-occlusion.                           |
| `intensity`       | `1.35`                     | Strength of the accumulated occlusion estimate.                        |

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

The evaluation stage visits 12 nearby depth samples; two subsequent [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) passes preserve foreground/background boundaries. `resolutionScale: 0.5` reduces intermediate pixel count to approximately one quarter. SSAO does not maintain temporal history and composites onto the complete source color.

Choose [GTAO](https://luma.gl/docs/api-reference/shadertools/shader-passes/gtao.md) when horizon integration, temporal stabilization, or ambient-only composition is required.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [GTAO](https://luma.gl/docs/api-reference/shadertools/shader-passes/gtao.md) adds horizon-based visibility, temporal history, and ambient-only composition.
* [Depth-Aware Blur](https://luma.gl/docs/api-reference/shadertools/shader-passes/depth-aware-blur.md) explains the bilateral denoising stages.
* [Outlines](https://luma.gl/docs/api-reference/shadertools/shader-passes/outlines.md) can consume the same depth and normal attachments.
