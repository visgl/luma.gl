# Camera-Reprojection Antialiasing

Reconstruct previous-frame image coordinates from scene depth and camera transforms when a per-pixel velocity buffer is unavailable. `createCameraReprojectionTAAShaderPassPipeline` powers the camera-aware temporal antialiasing path in luma.gl's ANARI rendering runtime.

[ANARI Scene Lab](/standalone-examples/scene/playground.html)

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property         | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| Export           | `createCameraReprojectionTAAShaderPassPipeline`                        |
| Backend          | WebGPU                                                                 |
| Render passes    | Three: temporal resolve, resolved-color copy, and depth-history copy   |
| Required binding | `depthTexture`                                                         |
| Persistent state | Full-resolution `rgba16float` color and depth history                  |
| Motion model     | Camera motion and static-world geometry; no object-velocity attachment |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createCameraReprojectionTAAShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [createCameraReprojectionTAAShaderPassPipeline()]

});



renderer.renderToScreen({

  sourceTexture: sceneColorTexture,

  bindings: {depthTexture: sceneDepthTexture},

  uniforms: {

    cameraReprojectionTaaResolve: {

      inverseViewProjectionMatrix,

      previousViewProjectionMatrix,

      historyWeight: 0.9,

      depthThreshold: 0.0025,

      currentJitter,

      previousJitter

    }

  },

  resetHistory: cameraCut || sceneTopologyChanged

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter                      | Default  | Description                                                                      |
| ------------------------------ | -------- | -------------------------------------------------------------------------------- |
| `inverseViewProjectionMatrix`  | Identity | Inverse current unjittered camera transform used to reconstruct world position.  |
| `previousViewProjectionMatrix` | Identity | Previous unjittered camera transform used to project that position into history. |
| `historyWeight`                | `0.9`    | Fraction of accepted previous-frame color blended into the current pixel.        |
| `depthThreshold`               | `0.0025` | Maximum normalized-device-depth disagreement before history is discarded.        |
| `currentJitter`                | `[0, 0]` | Current projection jitter expressed in normalized image coordinates.             |
| `previousJitter`               | `[0, 0]` | Previous projection jitter expressed in normalized image coordinates.            |

## Limitations and History Management[​](#limitations-and-history-management "Direct link to Limitations and History Management")

Camera reprojection can follow static-world surfaces as the view changes, but it cannot infer independent object motion without a velocity texture. Reset history when moving-object topology, render resolution, or camera continuity changes. Use velocity-aware [Temporal Antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) for animated scenes that already publish per-pixel motion vectors.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Temporal Antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) supports application-provided object velocity.
* [FXAA](https://luma.gl/docs/api-reference/shadertools/shader-passes/fxaa.md) requires no history, depth, jitter, or camera transforms.
* [ANARI Rendering](https://luma.gl/docs/api-guide/engine/anari-rendering.md) documents the renderer that consumes this pipeline.
