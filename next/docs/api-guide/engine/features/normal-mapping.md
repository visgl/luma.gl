# Normal mapping

A normal map changes the direction used for lighting to reveal fine surface detail while preserving the mesh silhouette.

**CompareNormal** contrasts a plain surface with normal mapping; the tangent tests exercise authored tangents and mirrored UVs. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareNormal (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareNormal/glTF/CompareNormal.gltf)

### Normal mapping

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

| Field              | Type      | Default | Description                                         |
| ------------------ | --------- | ------- | --------------------------------------------------- |
| `normalScale`      | `number`  | `1`     | Scales the tangent-space X and Y normal components. |
| `normalMapEnabled` | `boolean` | `false` | Enables normal-map sampling.                        |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture bindings accept `Texture | null`. `createPBRMaterial()` derives the map-enabled flag; the model still needs the corresponding shader define.

| Binding             | Model define          | Description                                     |
| ------------------- | --------------------- | ----------------------------------------------- |
| `pbr_normalSampler` | `HAS_NORMALMAP: true` | Linear tangent-space XYZ normal encoded in RGB. |

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

const normalTexture = device.createTexture({

  width: 1,

  height: 1,

  format: 'rgba8unorm',

  data: new Uint8Array([180, 128, 240, 255])

});

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    normalScale: 0.8

  },

  bindings: {pbr_normalSampler: normalTexture}

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, HAS_NORMALMAP: true}

});
```

This constant normal illustrates texture binding. Replace it with a linear tangent-space normal map for a detailed surface. The model needs UVs and a compatible tangent basis; the glTF importer can use authored tangents. See [normal and bump mapping](https://luma.gl/next/docs/api-guide/engine/features/surface-detail.md) for height-derived perturbations.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `normalTexture` supplies linear tangent-space normal data. Its `scale` maps to `normalScale`. A neutral texel is approximately `[128, 128, 255]`. `KHR_texture_transform` and texture coordinate selection are preserved per slot. No normal-mapping material extension is required.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
