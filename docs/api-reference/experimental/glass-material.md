import {ExperimentalDocsTabs} from '@site/src/components/docs/experimental-docs-tabs';

# Glass Material

<ExperimentalDocsTabs active="glass-material" />

`glassMaterial` is an experimental cross-backend shader module for refractive translucent surfaces.
It combines captured scene-color transmission, Schlick Fresnel reflection, chromatic dispersion,
Beer-Lambert absorption, and roughness-dependent highlights.

```ts
import {
  glassMaterial,
  glassMaterialPlugin,
  opticalLighting,
  type GlassMaterialBindings,
  type GlassMaterialProps,
  type GlassMaterialUniforms
} from '@luma.gl/experimental';
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `viewportSize` | `[number, number]` | `[1, 1]` | Scene-color texture dimensions in physical pixels. |
| `sceneColorTexture` | `Texture` | Required for rendering. | Opaque scene color captured before translucent geometry. |
| `indexOfRefraction` | `number` | `1.48` | Optical refraction index; ordinary glass is approximately `1.5`. |
| `roughness` | `number` | `0.14` | Surface roughness between zero and one. |
| `dispersion` | `number` | `0.022` | Separation of red, green, and blue transmission samples. |
| `thickness` | `number` | `1.05` | Approximate optical distance used for transmission and absorption. |
| `reflectionStrength` | `number` | `1` | Multiplier for environment reflection and highlights. |

## Shader Helper

```wgsl
fn glassMaterial_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32>
```

GLSL exposes the equivalent `vec4 glassMaterial_getColor(...)` function. Add
`glassMaterialPlugin` to the model so the helper and its shared `opticalLighting` dependency are
installed before compilation.

For surfaces illuminated by nearby moving lights, install `opticalPointLightsPlugin` alongside
`glassMaterialPlugin` and call `glassMaterial_getIlluminatedColor(...)` with the same arguments.
Bind `opticalPointLights` through `ShaderInputs` with up to `MAX_OPTICAL_POINT_LIGHTS` world-space
light positions, colors, radii, and intensities. The original `glassMaterial_getColor(...)`
remains available for scenes without dynamic local lights.

## Usage

```ts
import {Model, ShaderInputs} from '@luma.gl/engine';
import {glassMaterial, glassMaterialPlugin} from '@luma.gl/experimental';

const shaderInputs = new ShaderInputs({glassMaterial});

shaderInputs.setProps({
  glassMaterial: {
    viewportSize: [width, height],
    sceneColorTexture,
    indexOfRefraction: 1.5,
    thickness: 1
  }
});

const model = new Model(device, {
  source: glassShader,
  plugins: [glassMaterialPlugin],
  shaderInputs,
  geometry
});
```

Capture scene color into a separate texture before drawing glass. Sampling the active render
attachment creates an invalid feedback loop on WebGPU.

For OIT composition and quality limitations, see
[Transparency](/docs/api-guide/shaders/transparency) and
[Glass Effects](/docs/api-guide/shaders/glass-effects).
