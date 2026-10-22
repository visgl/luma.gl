# Dispersion

Dispersion separates transmitted wavelengths, producing colored fringes through refractive glass.

**CompareDispersion** compares authored dispersion settings; **DispersionTest** and **DragonDispersion** provide additional refractive assets. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareDispersion (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareDispersion/glTF/CompareDispersion.gltf)

### Dispersion

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

The embedded scenegraph viewer loads these assets with approximate alpha transmission. It cannot show the colored dispersion fringes; those require the scene-color refraction path described below.

## PBRMaterial reference[​](#pbrmaterial-reference "Direct link to PBRMaterial reference")

`PBRMaterial` from `@luma.gl/experimental` is a typed engine `Material` backed by the shared `pbrMaterial` shader module. Its material fields are defined by `PBRMaterialUniforms` from `@luma.gl/shadertools`. Pass them through `createPBRMaterial(device, {uniforms})` or update them with `material.setProps({pbrMaterial: {...}})`.

The fields below are optional. Defaults are the shared shader defaults; imported assets can supply other values.

| Field                | Type     | Default | Description                                                                  |
| -------------------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `dispersion`         | `number` | `0`     | Chromatic spread, expressed as 20 divided by the Abbe number; 0 disables it. |
| `transmissionFactor` | `number` | `0`     | Transmitted light fraction; dispersion requires transmission.                |
| `ior`                | `number` | `1.5`   | Base dielectric index of refraction.                                         |

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

    thicknessFactor: 0.5,

    ior: 1.5,

    dispersion: 0.5

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

The material must be drawn through the shared experimental `SceneRenderer` or ANARI capture path with scene-color refraction enabled to separate RGB transmission samples. Setting the uniform on the simple scenegraph viewer does not enable that capture path. See [transmission](https://luma.gl/docs/api-guide/engine/features/transmission.md) and [volume absorption](https://luma.gl/docs/api-guide/engine/features/volume.md).

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_dispersion.dispersion` maps to the shared dispersion scalar. The extension is used with `KHR_materials_transmission`, and commonly `KHR_materials_volume` and `KHR_materials_ior`. This property has no texture slot.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
