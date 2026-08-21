# Ground-Truth Ambient Occlusion

Estimate horizon-based ambient visibility with temporally reprojected history and edge-aware spatial denoising. `createGTAOShaderPassPipeline` can attenuate either the complete lit image or only a separately supplied ambient-light contribution.

### Deferred Rendering: Illumination Lab

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/deferred-rendering)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property          | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| Export            | `createGTAOShaderPassPipeline`                                                       |
| Backend           | WebGPU                                                                               |
| Render passes     | Six: evaluation, temporal resolve, depth history, two bilateral blurs, and composite |
| Required bindings | `depthTexture`, `normalTexture`, and `velocityTexture`                               |
| Optional binding  | `ambientLightingTexture` when `composition: 'ambient-only'`                          |
| Persistent state  | Occlusion and depth history textures                                                 |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createGTAOShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [

    createGTAOShaderPassPipeline({resolutionScale: 0.5, composition: 'ambient-only'})

  ]

});



renderer.renderToScreen({

  sourceTexture: litSceneTexture,

  bindings: {...gBuffer.getShaderPassBindings(), ambientLightingTexture},

  uniforms: {

    gtaoEvaluate: {projectionMatrix, inverseProjectionMatrix, radius: 2.2, intensity: 3.2},

    gtaoTemporal: {inverseProjectionMatrix, historyWeight: 0.88, depthThreshold: 0.015},

    gtaoAmbientComposite: {strength: 0.68}

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter         | Default   | Description                                                                                           |
| ----------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `resolutionScale` | `1`       | Resolution multiplier for visibility, temporal history, and bilateral denoising.                      |
| `composition`     | `'color'` | Apply visibility to full scene color, or use `'ambient-only'` with an explicit ambient-light texture. |
| `radius`          | `2.2`     | View-space sampling distance for the horizon evaluation.                                              |
| `bias`            | `0.04`    | Depth tolerance used to reduce self-occlusion.                                                        |
| `intensity`       | `3.2`     | Strength of the evaluated horizon occlusion.                                                          |
| `historyWeight`   | `0.88`    | Contribution from reprojected, depth-validated occlusion history.                                     |
| `depthThreshold`  | `0.015`   | Maximum accepted temporal depth disagreement.                                                         |
| `strength`        | `0.68`    | Final composite strength in `gtaoComposite` or `gtaoAmbientComposite`.                                |

## Ambient-Only Composition[​](#ambient-only-composition "Direct link to Ambient-Only Composition")

With `composition: 'ambient-only'`, the final stage subtracts only the occluded portion of the separate `ambientLightingTexture`. Direct lighting, emissive materials, and source alpha remain unchanged. The application owns that ambient texture and must provide it as an explicit binding; the effect does not reach across other pipelines to discover hidden render targets.

## Performance and Placement[​](#performance-and-placement "Direct link to Performance and Placement")

GTAO creates five intermediate targets, including persistent occlusion and depth history. Half-resolution evaluation reduces intermediate pixel count substantially but can soften narrow contact edges. Reset history after camera cuts or attachment-size changes. Compose after deferred lighting and before diffuse global illumination or reflective postprocessing.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [SSAO](https://luma.gl/docs/api-reference/shadertools/shader-passes/ssao.md) provides a four-pass, non-temporal ambient-occlusion path.
* [Screen-Space Global Illumination](https://luma.gl/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination.md) adds diffuse bounced light instead of removing ambient energy.
* [Screen-Space Reflections](https://luma.gl/docs/api-reference/shadertools/shader-passes/screen-space-reflections.md) resolves directional specular response.
