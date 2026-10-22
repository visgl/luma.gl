# Emissive strength

Emissive strength scales a surface’s emitted radiance beyond the core emissive color range for HDR highlights and bright displays.

**CompareEmissiveStrength** compares emission levels; **EmissiveStrengthTest** increases the multiplier across a row of cubes. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareEmissiveStrength (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareEmissiveStrength/glTF/CompareEmissiveStrength.gltf)

### Emissive strength

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

| Field                | Type                                | Default     | Description                                                |
| -------------------- | ----------------------------------- | ----------- | ---------------------------------------------------------- |
| `emissiveFactor`     | `Readonly<Vector3 \| NumberArray3>` | `[0, 0, 0]` | Linear RGB emissive color.                                 |
| `emissiveStrength`   | `number`                            | `1`         | Nonnegative multiplier; values above 1 allow HDR emission. |
| `emissiveMapEnabled` | `boolean`                           | `false`     | Enables emissive texture sampling.                         |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture bindings accept `Texture | null`. `createPBRMaterial()` derives the map-enabled flag; the model still needs the corresponding shader define.

| Binding               | Model define            | Description                                           |
| --------------------- | ----------------------- | ----------------------------------------------------- |
| `pbr_emissiveSampler` | `HAS_EMISSIVEMAP: true` | sRGB emissive RGB, multiplied by factor and strength. |

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
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    emissiveFactor: [0.1, 0.5, 0.9],

    emissiveStrength: 8

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material

});
```

Emission is visible without a scene light, but does not illuminate nearby objects in this raster viewer. Bloom is a separate effect; tone mapping and display headroom affect the apparent difference between high strengths. See [emissive surfaces](https://luma.gl/docs/api-guide/engine/features/emission.md) for core emissive textures.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_emissive_strength.emissiveStrength` multiplies core `emissiveFactor` and `emissiveTexture`. When the extension is absent the multiplier is 1. The parser preserves this scalar in `PBRMaterial`; this field does not require `USE_MATERIAL_EXTENSIONS` in the current shader.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
