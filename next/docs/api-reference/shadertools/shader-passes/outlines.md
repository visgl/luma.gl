# Screen-Space Outlines

Reveal object silhouettes and hard surface transitions by comparing nearby depth and normal values. `createOutlineShaderPassPipeline` overlays a configurable edge color in one scene-aware fullscreen pass.

### Advanced Effects: Visualization City

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/advanced-effects)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property                 | Value                                                 |
| ------------------------ | ----------------------------------------------------- |
| Export                   | `createOutlineShaderPassPipeline`                     |
| Shader uniform namespace | `screenSpaceOutline`                                  |
| Backend                  | WebGPU                                                |
| Render passes            | One fullscreen depth/normal edge pass                 |
| Required binding         | `depthTexture`                                        |
| Optional binding         | `normalTexture` when `normalSource: 'normal-texture'` |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createOutlineShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  shaderPasses: [createOutlineShaderPassPipeline({normalSource: 'normal-texture'})]

});



renderer.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: gBuffer.getShaderPassBindings(),

  uniforms: {

    screenSpaceOutline: {

      color: [0.02, 0.08, 0.12, 0.48],

      thickness: 1.5,

      depthThreshold: 0.003,

      normalThreshold: 0.18

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter         | Default                    | Description                                                            |
| ----------------- | -------------------------- | ---------------------------------------------------------------------- |
| `normalSource`    | `'reconstruct-from-depth'` | Reconstruct geometric normals or use an explicit scene-normal texture. |
| `color`           | `[0.02, 0.08, 0.12, 0.48]` | RGBA outline color; alpha controls the overlay contribution.           |
| `thickness`       | `1.5`                      | Neighbor offset in depth-texture pixels.                               |
| `depthThreshold`  | `0.003`                    | Depth change needed to begin drawing an edge.                          |
| `normalThreshold` | `0.18`                     | Normal-direction difference needed to begin drawing an edge.           |

The pass samples four cardinal neighbors and combines smooth depth and normal edge responses. Supplying authored normals captures material or geometric detail that reconstructed depth normals cannot express.

## Performance and Composition[​](#performance-and-composition "Direct link to Performance and Composition")

Outlines use one render pass, allocate no history, and require scene attachments to remain aligned with the current color image. Apply them before image-space warps, or transform the auxiliary attachments by the same amount. For a purely color-derived illustrated treatment, compare [Ink](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/ink.md) or [Edge Work](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/edge-work.md).

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Ink](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/ink.md) derives graphic contours directly from image color.
* [Edge Work](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/edge-work.md) extracts image-frequency differences without scene attachments.
* [SSAO](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/ssao.md) can reuse the same depth and normal buffers.
