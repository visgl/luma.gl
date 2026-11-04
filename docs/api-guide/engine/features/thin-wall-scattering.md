# Thin-Wall Scattering

Thin-wall scattering divides transmitted light between specular transmission and diffuse scattering at a surface. luma.gl implements an experimental thin-wall profile in its shared PBR shaders on WebGL2 and WebGPU.

## Example[​](#example "Direct link to Example")

### Gltf Scatter

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/gltf/features/app.ts)Info

InfoSource

Mobile quality

```
// Loading source…
```

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

This loads the authored Scatter Strength Thin-Walled asset. Model, Info, and Attributions tabs provide selection, interpretation, and source credits without rewriting the material.

## Material parameters[​](#material-parameters "Direct link to Material parameters")

| Field                     | Default     | Meaning                                                                        |
| ------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `transmissionFactor`      | `0`         | Energy available for transmission.                                             |
| `scatterStrengthFactor`   | `0`         | Fraction of transmission assigned to diffuse scattering, from zero to one.     |
| `multiscatterColorFactor` | `[0, 0, 0]` | Linear scattering color; set a nonblack color explicitly for native materials. |
| `scatterAnisotropy`       | `0`         | Directional preference; use values strictly between minus one and one.         |

Enable `USE_MATERIAL_EXTENSIONS: true` and `HAS_MATERIAL_SCATTER: true` on a compatible model. The scattering-strength texture reuses the linear alpha channel of `pbr_diffuseTransmissionSampler`; its sampling requires `HAS_DIFFUSETRANSMISSIONMAP: true` and `diffuseTransmissionMapEnabled: true`. The scattering-color texture uses the existing sRGB `pbr_multiscatterColorSampler` binding. Source conversion sets the associated uniforms, texture flags, and defines together.

The scattered energy exits through the forward and backward hemispheres in proportions `(1 + g) / 2` and `(1 - g) / 2`, where `g` is the scattering anisotropy. Scattering color is independent of base color.

## Limitations[​](#limitations "Direct link to Limitations")

This profile requires zero volume thickness. It does not implement volumetric transport, random walks, or spatial diffusion. The glTF converter rejects combinations with unlit, specular-glossiness, or diffuse transmission. The draft importer retains `loader-only` status; this implementation does not claim full draft conformance or strict required-extension support.

See [transmission](https://luma.gl/docs/api-guide/engine/features/transmission.md), [volume scattering](https://luma.gl/docs/api-guide/engine/features/volume-scattering.md), and [glTF scatter conversion](https://luma.gl/docs/api-reference/gltf/gltf-materials-scatter.md).
