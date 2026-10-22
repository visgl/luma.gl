# Ambient occlusion

An occlusion texture darkens creases and cavities using precomputed visibility, adding local surface shading without additional geometry.

**CompareAmbientOcclusion** compares baked occlusion with the unoccluded surface; **DamagedHelmet** uses an occlusion map on a detailed prop. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareAmbientOcclusion (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareAmbientOcclusion/glTF/CompareAmbientOcclusion.gltf)

### Ambient occlusion

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

| Field                 | Type      | Default | Description                                                     |
| --------------------- | --------- | ------- | --------------------------------------------------------------- |
| `occlusionStrength`   | `number`  | `1`     | Blend between unoccluded shading (0) and sampled occlusion (1). |
| `occlusionMapEnabled` | `boolean` | `false` | Enables occlusion-map sampling.                                 |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture bindings accept `Texture | null`. `createPBRMaterial()` derives the map-enabled flag; the model still needs the corresponding shader define.

| Binding                | Model define             | Description                                        |
| ---------------------- | ------------------------ | -------------------------------------------------- |
| `pbr_occlusionSampler` | `HAS_OCCLUSIONMAP: true` | Linear red-channel occlusion (1 means unoccluded). |

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
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const occlusionTexture = device.createTexture({

  width: 1,

  height: 1,

  format: 'rgba8unorm',

  data: new Uint8Array([128, 255, 255, 255])

});

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    occlusionStrength: 0.7

  },

  bindings: {pbr_occlusionSampler: occlusionTexture}

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, HAS_OCCLUSIONMAP: true}

});
```

The one-pixel map above shows the binding and strength adjustment. Supply a spatially varying baked map for cavities on a real model. This is separate from screen-space ambient occlusion and dynamic shadows. The current shared PBR shader applies this factor to its accumulated surface color.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `occlusionTexture` uses the red channel of a linear texture. `strength` maps to `occlusionStrength`. A packed occlusion/roughness/metallic image can be shared across slots: occlusion reads red, roughness green, and metallic blue. The slot preserves its own texture coordinates and `KHR_texture_transform` when present.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
