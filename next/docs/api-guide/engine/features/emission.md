# Emissive surfaces

Emission makes a surface contribute its own visible radiance, including values above the display white level.

**BoomBox** and **DamagedHelmet** use core emissive textures. Select **Sample model** to compare them. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

BoomBox (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/BoomBox/glTF/BoomBox.gltf)

### Emissive surfaces

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

| Field                | Type                                | Default     | Description                                                                   |
| -------------------- | ----------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `emissiveFactor`     | `Readonly<Vector3 \| NumberArray3>` | `[0, 0, 0]` | RGB color of the emitted radiance.                                            |
| `emissiveStrength`   | `number`                            | `1`         | Multiplier for emissive radiance; values above 1 support bright HDR emission. |
| `emissiveMapEnabled` | `boolean`                           | `false`     | Enables emissive texture sampling.                                            |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                 | Model define            | Description                               |
| --------------------- | ----------------------- | ----------------------------------------- |
| `pbr_emissiveSampler` | `HAS_EMISSIVEMAP: true` | Texture resource for the `emissive` slot. |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md).

## Usage[​](#usage "Direct link to Usage")

```
import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    emissiveFactor: [1, 0.2, 0.05],

    emissiveStrength: 4

  }

});



// Pass material to a compatible Model through its material prop.
```

See [emissive strength](https://luma.gl/next/docs/api-guide/engine/features/emissive-strength.md) for HDR extension comparison samples.

Emission alone does not create a scene light or illuminate nearby geometry. Bloom is a separate rendering effect.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF supplies emissive color and texture. `KHR_materials_emissive_strength` scales emission beyond the core range.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
