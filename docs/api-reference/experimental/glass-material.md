# Glass Material

[Spectral Caustics](https://luma.gl/docs/api-reference/experimental/spectral-caustics-renderer.md)[Glass](https://luma.gl/docs/api-reference/experimental/glass-material.md)[Reflective](https://luma.gl/docs/api-reference/experimental/reflective-material.md)[A-Buffer](https://luma.gl/docs/api-reference/experimental/a-buffer-renderer.md)[WBOIT](https://luma.gl/docs/api-reference/experimental/wboit-renderer.md)

`glassMaterial` is an experimental cross-backend shader module for refractive translucent surfaces. It combines captured scene-color transmission, Schlick Fresnel reflection, chromatic dispersion, Beer-Lambert absorption, and roughness-dependent highlights.

```
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

## Properties[​](#properties "Direct link to Properties")

| Property                     | Type               | Default                 | Description                                                                                                             |
| ---------------------------- | ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `viewportSize`               | `[number, number]` | `[1, 1]`                | Scene-color texture dimensions in physical pixels.                                                                      |
| `sceneColorTexture`          | `Texture`          | Required for rendering. | Opaque scene color captured before translucent geometry.                                                                |
| `indexOfRefraction`          | `number`           | `1.48`                  | Optical refraction index; ordinary glass is approximately `1.5`.                                                        |
| `roughness`                  | `number`           | `0.14`                  | Surface roughness between zero and one.                                                                                 |
| `dispersion`                 | `number`           | `0.33`                  | Wavelength-dependent refraction using the glTF `20 / Abbe number` convention; `0.33` approximates crown glass.          |
| `thickness`                  | `number`           | `1.05`                  | Approximate optical distance used for transmission and absorption.                                                      |
| `refractionStrength`         | `number`           | `1`                     | Camera-aligned background lens displacement.                                                                            |
| `reflectionStrength`         | `number`           | `1`                     | Multiplier for environment reflection and highlights.                                                                   |
| `fresnelStrength`            | `number`           | `1`                     | Grazing-angle reflection multiplier.                                                                                    |
| `clearcoatStrength`          | `number`           | `0.7`                   | Secondary polished surface highlight.                                                                                   |
| `iridescenceStrength`        | `number`           | `0.1`                   | Thin-film spectral edge variation.                                                                                      |
| `internalReflectionStrength` | `number`           | `0.42`                  | Internal environment-bounce multiplier.                                                                                 |
| `transmissionStrength`       | `number`           | `1`                     | Fraction of non-reflected scene light transmitted through the material; shading clamps this value between zero and one. |

Transmission and reflection share an energy budget derived from `indexOfRefraction`, matching the dielectric Fresnel model used by the canonical PBR material. A clearcoat consumes part of that budget before the underlying surface is shaded. Red and blue refraction rays use their own indices of refraction from `KHR_materials_dispersion`; the green channel retains the material's authored index. Screen-space normal derivatives widen subpixel GGX highlights to avoid unstable white glints on both WebGL and WebGPU.

## Shader Helper[​](#shader-helper "Direct link to Shader Helper")

```
fn glassMaterial_getColor(

  normal: vec3<f32>,

  worldPosition: vec3<f32>,

  baseColor: vec4<f32>,

  cameraPosition: vec3<f32>,

  fragmentPosition: vec4<f32>

) -> vec4<f32>
```

GLSL exposes the equivalent `vec4 glassMaterial_getColor(...)` function. Add `glassMaterialPlugin` to the model so the helper and its shared `opticalLighting` dependency are installed before compilation.

For surfaces illuminated by nearby moving lights, install `opticalPointLightsPlugin` alongside `glassMaterialPlugin` and call `glassMaterial_getIlluminatedColor(...)` with the same arguments. Bind `opticalPointLights` through `ShaderInputs` with up to `MAX_OPTICAL_POINT_LIGHTS` world-space light positions, colors, radii, and intensities. The original `glassMaterial_getColor(...)` remains available for scenes without dynamic local lights.

## Rasterized Volume Extension[​](#rasterized-volume-extension "Direct link to Rasterized Volume Extension")

Install `glassTransmissionPlugin` to add depth-aware, two-surface transmission without changing existing `glassMaterial_getColor(...)` consumers.

| Property                       | Type               | Default                 | Description                                                                                     |
| ------------------------------ | ------------------ | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `viewportSize`                 | `[number, number]` | `[1, 1]`                | Dimensions shared by the scene and backface textures.                                           |
| `depthRange`                   | `[number, number]` | `[0.1, 100]`            | Near and far perspective clip planes.                                                           |
| `sceneDepthTexture`            | `Texture`          | Required for rendering. | Sampleable opaque-scene depth attachment.                                                       |
| `backfaceTexture`              | `Texture`          | Required for rendering. | Encoded world-space backface normals and depth.                                                 |
| `environmentTexture`           | `Texture`          | Required for rendering. | Equirectangular studio or HDR environment.                                                      |
| `environmentIntensity`         | `number`           | `1`                     | Environment reflection multiplier.                                                              |
| `environmentMipLevels`         | `number`           | `1`                     | Number of initialized environment-probe mip levels available for roughness-selected reflection. |
| `environmentPrefilterStrength` | `number`           | `0`                     | Opt-in roughness-to-mip multiplier; zero preserves legacy bounded environment filtering.        |
| `thicknessStrength`            | `number`           | `1`                     | Measured optical-path multiplier.                                                               |
| `roughTransmissionStrength`    | `number`           | `0`                     | Thickness-aware rough transmission and filtered environment reflection strength.                |
| `spectralAbsorptionStrength`   | `number`           | `0`                     | Wavelength-dependent Beer-Lambert extinction inside the measured glass volume.                  |
| `thinFilmThickness`            | `number`           | `0`                     | Surface coating thickness in nanometers; zero disables coating interference.                    |
| `thinFilmStrength`             | `number`           | `0`                     | Intensity of angle-dependent red, green, and blue coating interference.                         |
| `volumeScatteringStrength`     | `number`           | `0`                     | Strength of restrained in-volume scattering and nearby point-light coupling.                    |
| `contactShadowStrength`        | `number`           | `0`                     | Depth-aware optical contact shadows around adjacent opaque network hardware.                    |
| `depthBias`                    | `number`           | `0.00008`               | Foreground depth-comparison tolerance.                                                          |
| `dynamicReflectionStrength`    | `number`           | `0`                     | Captured-scene reflection strength for nearby moving objects.                                   |
| `secondaryBounceStrength`      | `number`           | `0`                     | Additional reflected environment bounce inside the glass shell.                                 |
| `faultDistortionStrength`      | `number`           | `0`                     | Animated lens distortion and internal filaments on warm fault-tinted glass.                     |
| `time`                         | `number`           | `0`                     | Animation clock for optional fault-driven surface effects.                                      |

Use `glassTransmission_getColor(...)`, or add `opticalPointLightsPlugin` and use `glassTransmission_getIlluminatedColor(...)` for localized illumination. Both are available in matching WGSL and GLSL forms.

The optional volume controls preserve existing output when left at their zero defaults. Rough transmission adds bounded scene-color and environment samples; a prefiltered environment texture can replace repeated neighborhood sampling with explicit roughness-selected mip levels; spectral absorption uses the backface-measured optical path; thin-film interference evaluates representative red, green, and blue wavelengths from the coating thickness; volume scattering couples nearby optical point lights into the glass interior; and optional contact shadows use the opaque depth already captured for foreground rejection. No mode requires per-pixel ray tracing.

The volume extension refracts the red and blue wavelengths separately at both the front and rear glass boundaries, preserves total internal reflection, and derives its reflected/transmitted energy split from the same authored index as the base material.

`opticalCausticsPlugin` separately adds a bounded array of focused glass lenses for nearby reflective receiver surfaces. Call `opticalCaustics_getColor(normal, worldPosition, cameraPosition)` and add its RGB result to the receiver's existing material color. At most `MAX_OPTICAL_CAUSTIC_LENSES` entries are uploaded, and each entry specifies a world-space `position`, `radius`, `color`, and optional `intensity`.

## Usage[​](#usage "Direct link to Usage")

```
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

Capture scene color into a separate texture before drawing glass. Sampling the active render attachment creates an invalid feedback loop on WebGPU.

For OIT composition and quality limitations, see [Transparency](https://luma.gl/docs/api-guide/shaders/transparency.md) and [Glass Effects](https://luma.gl/docs/api-guide/shaders/glass-effects.md).
