# Screen-Space Reflections

Reflect visible scene lighting from glossy and rough surfaces using depth, surface normals, roughness, and temporal reprojection. `createSSRShaderPassPipeline` traces reflection rays through the current frame and resolves them into a stabilized specular contribution.

### Deferred Rendering: Illumination Lab

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/deferred-rendering)Info

InfoSource

```
// Loading source…
```

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property            | Value                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Export              | `createSSRShaderPassPipeline`                                                              |
| Backend             | WebGPU                                                                                     |
| Render passes       | Six: reflection trace, temporal resolve, depth history, two spatial filters, and composite |
| Required bindings   | `depthTexture`, `normalTexture`, and `velocityTexture`                                     |
| Persistent state    | `rgba16float` reflection and depth history                                                 |
| Reflection coverage | Visible scene color and first-layer screen depth                                           |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createSSGIShaderPassPipeline, createSSRShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [

    createSSGIShaderPassPipeline({resolutionScale: 0.5}),

    createSSRShaderPassPipeline({resolutionScale: 0.5})

  ]

});



renderer.renderToScreen({

  sourceTexture: litSceneTexture,

  bindings: gBuffer.getShaderPassBindings(),

  uniforms: {

    ssrTrace: {

      projectionMatrix,

      inverseProjectionMatrix,

      intensity: 1.35,

      maxDistance: 60,

      thickness: 0.45,

      sampleCount: 48,

      maxRoughness: 0.88,

      frameIndex

    },

    ssrTemporal: {inverseProjectionMatrix, historyWeight: 0.86, depthThreshold: 0.018}

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter         | Default | Range or purpose                                                           |
| ----------------- | ------- | -------------------------------------------------------------------------- |
| `resolutionScale` | `1`     | Relative resolution of reflection tracing, history, and spatial filtering. |
| `intensity`       | `1.35`  | Strength of traced specular reflection before final composition.           |
| `maxDistance`     | `60`    | Maximum view-space reflection-ray travel distance.                         |
| `thickness`       | `0.45`  | Accepted depth thickness when testing a possible screen-space hit.         |
| `sampleCount`     | `48`    | Ray-march budget; supported range is `8` to `96`.                          |
| `maxRoughness`    | `0.88`  | Highest surface roughness that can contribute reflections.                 |
| `historyWeight`   | `0.86`  | Contribution from depth-validated reflection history.                      |
| `depthThreshold`  | `0.018` | Temporal rejection threshold for disoccluded reflected surfaces.           |
| `strength`        | `1`     | Final `ssrComposite` contribution blended into scene color.                |

## Quality and Limitations[​](#quality-and-limitations "Direct link to Quality and Limitations")

SSR cannot reflect geometry outside the current viewport, hidden behind the first visible depth layer, or absent from the already-lit source color. Roughness-aware spatial filtering broadens reflections and rejects unrelated depth/normal surfaces. Lowering `sampleCount` or `resolutionScale` saves GPU work but can increase missed intersections or soften thin details.

Trace reflections after direct lighting and [Screen-Space Global Illumination](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination.md) when the reflected image should include their contributions. Reset history after camera cuts or changes to attachment dimensions.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Screen-Space Global Illumination](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination.md) gathers diffuse rather than specular light.
* [GTAO](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/gtao.md) provides complementary ambient visibility.
* [Bloom](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/bloom.md) spreads intense reflected highlights later in the HDR pipeline.
