# Transmission, volume, and dispersion

Transparent materials transmit light through a surface; thickness, absorption, and wavelength separation describe glass and colored volumes.

The **CompareTransmission** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### CompareTransmission

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## PBRMaterial reference[​](#pbrmaterial-reference "Direct link to PBRMaterial reference")

`PBRMaterial` from `@luma.gl/experimental` is a typed engine `Material` backed by the shared `pbrMaterial` shader module. Its material fields are defined by `PBRMaterialUniforms` from `@luma.gl/shadertools`. Pass them through `createPBRMaterial(device, {uniforms})` or update them with `material.setProps({pbrMaterial: {...}})`.

The fields below are optional. Defaults are the shared shader defaults; imported assets can supply other values.

| Field                    | Type                                | Default     | Description                                                                |
| ------------------------ | ----------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `transmissionFactor`     | `number`                            | `0`         | Fraction of light transmitted through the surface, in the range 0–1.       |
| `transmissionMapEnabled` | `boolean`                           | `false`     | Enables transmission texture sampling.                                     |
| `ior`                    | `number`                            | `1.5`       | Index of refraction of the dielectric material.                            |
| `thicknessFactor`        | `number`                            | `0`         | Volume thickness scale in model-space units.                               |
| `attenuationColor`       | `Readonly<Vector3 \| NumberArray3>` | `[1, 1, 1]` | RGB transmittance color at the attenuation distance.                       |
| `attenuationDistance`    | `number`                            | `1e9`       | Distance through the volume associated with the attenuation color.         |
| `dispersion`             | `number`                            | `0`         | Chromatic transmission spread, expressed as 20 divided by the Abbe number. |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                     | Model define                | Description                                   |
| ------------------------- | --------------------------- | --------------------------------------------- |
| `pbr_transmissionSampler` | `HAS_TRANSMISSIONMAP: true` | Texture resource for the `transmission` slot. |
| `pbr_thicknessSampler`    | `HAS_THICKNESSMAP: true`    | Texture resource for the `thickness` slot.    |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/docs/api-reference/shadertools/shader-modules/pbr-material.md).

The extended PBR shader path is disabled by default. Set `USE_MATERIAL_EXTENSIONS: true` in the `Model` construction `defines` to enable this feature; uniform values alone do not enable it. The glTF material parser supplies this define for imported extension materials.

## Usage[​](#usage "Direct link to Usage")

```
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    metallicRoughnessValues: [0, 0.05],

    transmissionFactor: 1,

    ior: 1.5,

    thicknessFactor: 0.5,

    attenuationColor: [0.8, 0.95, 1],

    attenuationDistance: 2,

    dispersion: 0.1

  }

});



// modelProps contains your existing shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

Scene-color refraction requires the shared experimental `SceneRenderer` or ANARI capture path. The inline glTF viewer uses the scenegraph alpha approximation, so this embedded sample does not demonstrate full screen-space refraction or chromatic dispersion.

See the focused guides for [volume absorption](https://luma.gl/docs/api-guide/engine/features/volume.md) and [dispersion](https://luma.gl/docs/api-guide/engine/features/dispersion.md) for separate reference tables and curated sample subsets.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_transmission`, `KHR_materials_volume`, and `KHR_materials_dispersion` map to these shared material inputs. Volume thickness and attenuation tint transmitted light; dispersion separates transmitted RGB wavelengths in the shared experimental renderer and ANARI.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
