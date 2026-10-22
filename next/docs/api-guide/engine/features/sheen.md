# Sheen

Sheen adds a soft grazing-angle response for fabric, velvet, and other surfaces with fine fibers.

The **CompareSheen** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### CompareSheen

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

| Field                      | Type                                | Default     | Description                                     |
| -------------------------- | ----------------------------------- | ----------- | ----------------------------------------------- |
| `sheenColorFactor`         | `Readonly<Vector3 \| NumberArray3>` | `[0, 0, 0]` | RGB contribution of the sheen layer.            |
| `sheenRoughnessFactor`     | `number`                            | `0`         | Roughness of the sheen layer, in the range 0–1. |
| `sheenColorMapEnabled`     | `boolean`                           | `false`     | Enables sheen-color texture sampling.           |
| `sheenRoughnessMapEnabled` | `boolean`                           | `false`     | Enables sheen-roughness texture sampling.       |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                       | Model define                  | Description                                     |
| --------------------------- | ----------------------------- | ----------------------------------------------- |
| `pbr_sheenColorSampler`     | `HAS_SHEENCOLORMAP: true`     | Texture resource for the `sheenColor` slot.     |
| `pbr_sheenRoughnessSampler` | `HAS_SHEENROUGHNESSMAP: true` | Texture resource for the `sheenRoughness` slot. |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md).

The extended PBR shader path is disabled by default. Set `USE_MATERIAL_EXTENSIONS: true` in the `Model` construction `defines` to enable this feature; uniform values alone do not enable it. The glTF material parser supplies this define for imported extension materials.

## Usage[​](#usage "Direct link to Usage")

```
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    sheenColorFactor: [0.5, 0.1, 0.2],

    sheenRoughnessFactor: 0.7

  }

});



// modelProps contains your existing shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_sheen` maps color, roughness, and their optional textures into the shared sheen lobe.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
