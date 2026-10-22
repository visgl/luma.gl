# Metallic and rough surfaces

Base color, metallic response, and roughness describe surfaces ranging from matte dielectrics to polished metals.

The **DamagedHelmet** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### DamagedHelmet

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

| Field                         | Type                                | Default        | Description                                                        |
| ----------------------------- | ----------------------------------- | -------------- | ------------------------------------------------------------------ |
| `baseColorFactor`             | `Readonly<Vector4 \| NumberArray4>` | `[1, 1, 1, 1]` | RGBA base color multiplied by the base-color texture when enabled. |
| `metallicRoughnessValues`     | `Readonly<Vector2 \| NumberArray2>` | `[1, 1]`       | Metallic factor followed by roughness, each in the range 0–1.      |
| `baseColorMapEnabled`         | `boolean`                           | `false`        | Enables base-color texture sampling.                               |
| `metallicRoughnessMapEnabled` | `boolean`                           | `false`        | Enables metallic-roughness texture sampling.                       |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                          | Model define                  | Description                                        |
| ------------------------------ | ----------------------------- | -------------------------------------------------- |
| `pbr_baseColorSampler`         | `HAS_BASECOLORMAP: true`      | Texture resource for the `baseColor` slot.         |
| `pbr_metallicRoughnessSampler` | `HAS_METALROUGHNESSMAP: true` | Texture resource for the `metallicRoughness` slot. |

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

    baseColorFactor: [0.8, 0.5, 0.2, 1],

    metallicRoughnessValues: [0.7, 0.25]

  }

});



// Pass material to a compatible Model through its material prop.
```

See [base color](https://luma.gl/next/docs/api-guide/engine/features/base-color.md), [ambient occlusion](https://luma.gl/next/docs/api-guide/engine/features/occlusion.md), and [opacity and cutouts](https://luma.gl/next/docs/api-guide/engine/features/opacity.md) for independent surface inputs.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `pbrMetallicRoughness` supplies these values without an extension. The adapter maps `metallicFactor` and `roughnessFactor` into the canonical pair. The metallic-roughness texture uses blue for metallic and green for roughness. Legacy `KHR_materials_pbrSpecularGlossiness` data is preserved by the loader but is not converted into this shader path.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
