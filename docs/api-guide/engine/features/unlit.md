# Unlit surfaces

Unlit surfaces preserve their surface color without evaluating scene lighting, useful for signs, diagrams, and baked artwork.

The **UnlitTest** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### UnlitTest

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

| Field                 | Type                                | Default        | Description                                                                |
| --------------------- | ----------------------------------- | -------------- | -------------------------------------------------------------------------- |
| `unlit`               | `boolean`                           | `false`        | Bypasses the lighting response while retaining the material surface color. |
| `baseColorFactor`     | `Readonly<Vector4 \| NumberArray4>` | `[1, 1, 1, 1]` | RGBA base color multiplied by the base-color texture when enabled.         |
| `baseColorMapEnabled` | `boolean`                           | `false`        | Enables base-color texture sampling.                                       |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                  | Model define             | Description                                |
| ---------------------- | ------------------------ | ------------------------------------------ |
| `pbr_baseColorSampler` | `HAS_BASECOLORMAP: true` | Texture resource for the `baseColor` slot. |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/docs/api-reference/shadertools/shader-modules/pbr-material.md).

## Usage[​](#usage "Direct link to Usage")

```
import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    unlit: true,

    baseColorFactor: [0.2, 0.6, 1, 1]

  }

});



// Pass material to a compatible Model through its material prop.
```

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_unlit` selects unlit shading on imported materials. It does not require a separate engine material family.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
