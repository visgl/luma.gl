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
  glassTransmission,
  glassTransmissionPlugin,
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
| `refractionStrength` | `number` | `1` | Camera-aligned background lens displacement. |
| `reflectionStrength` | `number` | `1` | Multiplier for environment reflection and highlights. |
| `fresnelStrength` | `number` | `1` | Grazing-angle reflection multiplier. |
| `clearcoatStrength` | `number` | `0.7` | Secondary polished surface highlight. |
| `iridescenceStrength` | `number` | `0.1` | Thin-film spectral edge variation. |
| `internalReflectionStrength` | `number` | `0.42` | Internal environment-bounce multiplier. |
| `transmissionStrength` | `number` | `1` | Amount of transmitted scene color. |

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

## Rasterized Volume Extension

Install `glassTransmissionPlugin` to add depth-aware, two-surface transmission without changing
existing `glassMaterial_getColor(...)` consumers.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `viewportSize` | `[number, number]` | `[1, 1]` | Dimensions shared by the scene and backface textures. |
| `depthRange` | `[number, number]` | `[0.1, 100]` | Near and far perspective clip planes. |
| `sceneDepthTexture` | `Texture` | Required for rendering. | Sampleable opaque-scene depth attachment. |
| `backfaceTexture` | `Texture` | Required for rendering. | Encoded world-space backface normals and depth. |
| `environmentTexture` | `Texture` | Required for rendering. | Equirectangular studio or HDR environment. |
| `environmentIntensity` | `number` | `1` | Environment reflection multiplier. |
| `thicknessStrength` | `number` | `1` | Measured optical-path multiplier. |
| `depthBias` | `number` | `0.00008` | Foreground depth-comparison tolerance. |
| `dynamicReflectionStrength` | `number` | `0` | Captured-scene reflection strength for nearby moving objects. |
| `secondaryBounceStrength` | `number` | `0` | Additional reflected environment bounce inside the glass shell. |
| `faultDistortionStrength` | `number` | `0` | Animated lens distortion and internal filaments on warm fault-tinted glass. |
| `time` | `number` | `0` | Animation clock for optional fault-driven surface effects. |

Use `glassTransmission_getColor(...)`, or add `opticalPointLightsPlugin` and use
`glassTransmission_getIlluminatedColor(...)` for localized illumination. Both are available in
matching WGSL and GLSL forms.

`opticalCausticsPlugin` separately adds a bounded array of focused glass lenses for nearby
reflective receiver surfaces. Call `opticalCaustics_getColor(normal, worldPosition,
cameraPosition)` and add its RGB result to the receiver's existing material color. At most
`MAX_OPTICAL_CAUSTIC_LENSES` entries are uploaded, and each entry specifies a world-space
`position`, `radius`, `color`, and optional `intensity`.

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
