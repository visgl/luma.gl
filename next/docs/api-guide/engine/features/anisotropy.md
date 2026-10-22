# Anisotropic reflection

Anisotropic reflection stretches highlights along a surface direction, useful for brushed metal and directional surface finishes.

The **CompareAnisotropy** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### CompareAnisotropy

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

| Field                  | Type                                | Default  | Description                                           |
| ---------------------- | ----------------------------------- | -------- | ----------------------------------------------------- |
| `anisotropyStrength`   | `number`                            | `0`      | Strength of directional reflection, in the range 0–1. |
| `anisotropyRotation`   | `number`                            | `0`      | Rotation of the anisotropy direction in radians.      |
| `anisotropyDirection`  | `Readonly<Vector2 \| NumberArray2>` | `[1, 0]` | Two-component direction in the surface tangent frame. |
| `anisotropyMapEnabled` | `boolean`                           | `false`  | Enables anisotropy texture sampling.                  |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                   | Model define              | Description                                 |
| ----------------------- | ------------------------- | ------------------------------------------- |
| `pbr_anisotropySampler` | `HAS_ANISOTROPYMAP: true` | Texture resource for the `anisotropy` slot. |

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

    anisotropyStrength: 0.8,

    anisotropyRotation: 0.5,

    anisotropyDirection: [1, 0]

  }

});



// modelProps contains your existing shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

The shared shader approximates directional highlights and image-based lighting response; results depend on the surface tangent frame.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_anisotropy` supplies strength, rotation, and an optional direction map.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
