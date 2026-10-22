# Texture coordinates and transforms

Independent texture coordinate sets and transforms let each surface map use its own placement, rotation, and scale.

The **TextureTransformMultiTest** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### TextureTransformMultiTest

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

| Field                  | Type                                | Default           | Description                                                   |
| ---------------------- | ----------------------------------- | ----------------- | ------------------------------------------------------------- |
| `baseColorUVSet`       | `number`                            | `0`               | Selects UV set 0 or 1 for the base-color texture.             |
| `baseColorUVTransform` | `Readonly<NumberArray9 \| Matrix3>` | `Identity matrix` | Column-major 3×3 transform of base-color texture coordinates. |

Each supported texture slot has its own `UVSet` and `UVTransform` fields, including `normalUVSet`, `normalUVTransform`, `metallicRoughnessUVSet`, and `metallicRoughnessUVTransform`. Transforms and coordinate-set selection are independent per slot.

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

    baseColorUVSet: 0,

    baseColorUVTransform: [2, 0, 0, 0, 2, 0, 0.25, 0, 1]

  }

});



// Pass material to a compatible Model through its material prop.
```

The example matrix doubles texture tiling and offsets U by 0.25. Runtime transforms must not be combined with duplicate loader-side UV baking. Animated texture-set switches and `TEXCOORD_2+` slots are unsupported.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF texture `texCoord` selects a coordinate set. `KHR_texture_transform` supplies offset, rotation, scale, and an optional coordinate-set override. Supported material slots retain independent transforms. `KHR_animation_pointer` can animate supported transform components.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
