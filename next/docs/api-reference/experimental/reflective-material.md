# Reflective Material

[Spectral Caustics](https://luma.gl/next/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass](https://luma.gl/next/docs/api-reference/experimental/glass-material.md)[Reflective](https://luma.gl/next/docs/api-reference/experimental/reflective-material.md)[A-Buffer](https://luma.gl/next/docs/api-reference/experimental/a-buffer-renderer.md)[WBOIT](https://luma.gl/next/docs/api-reference/experimental/wboit-renderer.md)

`reflectiveMaterial` is a lightweight cross-backend shader module for glossy surfaces. It combines Fresnel-weighted environment reflection with roughness-adjusted key and fill highlights, without requiring the captured scene-color texture used by `glassMaterial`.

Environment reflections follow the camera-reflected view direction as the viewpoint moves. Output opacity is clamped to the full zero-to-one range, allowing translucent links and fully opaque metallic surfaces to share the same material.

```
import {

  reflectiveMaterial,

  reflectiveMaterialPlugin,

  type ReflectiveMaterialProps,

  type ReflectiveMaterialUniforms

} from '@luma.gl/experimental';
```

## Properties[​](#properties "Direct link to Properties")

| Property             | Type     | Default | Description                                           |
| -------------------- | -------- | ------- | ----------------------------------------------------- |
| `roughness`          | `number` | `0.62`  | Surface roughness between zero and one.               |
| `reflectionStrength` | `number` | `0.32`  | Intensity of Fresnel-weighted environment reflection. |
| `specularStrength`   | `number` | `0.42`  | Intensity of key and fill highlights.                 |
| `opacityScale`       | `number` | `1`     | Multiplier applied to the incoming surface opacity.   |

## Shader Helper[​](#shader-helper "Direct link to Shader Helper")

```
fn reflectiveMaterial_getColor(

  normal: vec3<f32>,

  worldPosition: vec3<f32>,

  baseColor: vec4<f32>,

  cameraPosition: vec3<f32>

) -> vec4<f32>
```

GLSL exposes the equivalent `vec4 reflectiveMaterial_getColor(...)` function. Install `reflectiveMaterialPlugin` when creating the model so the helper and shared optical-lighting dependency are present in the assembled shader.

Install `opticalPointLightsPlugin` as well and call `reflectiveMaterial_getIlluminatedColor(...)` to add bounded world-space point lights. Its arguments match `reflectiveMaterial_getColor(...)`, and the original helper retains its existing behavior when dynamic local lighting is unnecessary.

```
import {Model, ShaderInputs} from '@luma.gl/engine';

import {reflectiveMaterial, reflectiveMaterialPlugin} from '@luma.gl/experimental';



const shaderInputs = new ShaderInputs({reflectiveMaterial});



shaderInputs.setProps({

  reflectiveMaterial: {

    roughness: 0.45,

    reflectionStrength: 0.3,

    specularStrength: 0.35,

    opacityScale: 0.6

  }

});



const model = new Model(device, {

  source: reflectiveShader,

  plugins: [reflectiveMaterialPlugin],

  shaderInputs,

  geometry

});
```

For refractive surfaces and transparency composition, see [`glassMaterial`](https://luma.gl/next/docs/api-reference/experimental/glass-material.md) and [Glass Effects](https://luma.gl/next/docs/api-guide/shaders/glass-effects.md).
