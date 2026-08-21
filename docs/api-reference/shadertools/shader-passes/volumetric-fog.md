# Volumetric Fog

Add depth-aware height fog, directional atmospheric scattering, and temporally stabilized haze. `createVolumetricFogShaderPassPipeline` provides a compact participating-media treatment when a full scene-lighting integration is unnecessary.

### Advanced Effects: Visualization City

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/experimental/advanced-effects)Info

InfoSource

```
// Loading source…
```

Scroll page · Ctrl/⌘ + scroll to interact

## At a Glance[​](#at-a-glance "Direct link to At a Glance")

| Property                 | Value                                            |
| ------------------------ | ------------------------------------------------ |
| Export                   | `createVolumetricFogShaderPassPipeline`          |
| Shader uniform namespace | `volumetricFog`                                  |
| Backend                  | WebGPU                                           |
| Render passes            | Two: fog/history resolve and composed-color copy |
| Required binding         | `depthTexture`                                   |
| Persistent state         | One renderer-owned fog-history texture           |

## Usage[​](#usage "Direct link to Usage")

```
import {ShaderPassRenderer} from '@luma.gl/engine';

import {createVolumetricFogShaderPassPipeline} from '@luma.gl/effects';



const renderer = new ShaderPassRenderer(device, {

  colorFormat: 'rgba16float',

  shaderPasses: [createVolumetricFogShaderPassPipeline()]

});



renderer.renderToScreen({

  sourceTexture: gBuffer.colorTexture,

  bindings: {depthTexture: gBuffer.depthTexture},

  uniforms: {

    volumetricFog: {

      fogColor: [0.18, 0.34, 0.48, 0.6],

      density: 0.22,

      heightFalloff: 3,

      scattering: 0.35,

      historyWeight: 0.82,

      time: elapsedSeconds

    }

  }

});
```

## Parameters[​](#parameters "Direct link to Parameters")

| Parameter       | Default                   | Description                                                          |
| --------------- | ------------------------- | -------------------------------------------------------------------- |
| `fogColor`      | `[0.18, 0.34, 0.48, 0.6]` | Atmospheric RGB color and directional-scattering influence.          |
| `density`       | `0.22`                    | Overall participating-media density.                                 |
| `heightFalloff` | `3`                       | Rate at which the simulated fog density decreases with height.       |
| `scattering`    | `0.35`                    | Strength of the built-in directional light contribution.             |
| `historyWeight` | `0.82`                    | Contribution from the preceding temporally accumulated fog result.   |
| `time`          | `0`                       | Application-owned animation value used to vary the sampling pattern. |

## Performance and Limitations[​](#performance-and-limitations "Direct link to Performance and Limitations")

The main stage takes 20 depth-dependent integration samples and blends against one persistent history texture; the second stage copies the stabilized result back into the shared pass chain. This compact model does not inspect application point-light buffers or clustered light lists. Choose [Clustered Volumetric Lighting](https://luma.gl/docs/api-reference/shadertools/shader-passes/clustered-volumetric-lighting.md) when the atmosphere must react to actual scene lights, physically oriented anisotropy, or depth-occluded light shafts.

## Related Effects[​](#related-effects "Direct link to Related Effects")

* [Clustered Volumetric Lighting](https://luma.gl/docs/api-reference/shadertools/shader-passes/clustered-volumetric-lighting.md) integrates real directional and clustered point lights.
* [Temporal Antialiasing](https://luma.gl/docs/api-reference/shadertools/shader-passes/temporal-antialiasing.md) explains scene-history reset and reprojection.
* [Bloom](https://luma.gl/docs/api-reference/shadertools/shader-passes/bloom.md) can soften intense atmospheric highlights before tone mapping.
