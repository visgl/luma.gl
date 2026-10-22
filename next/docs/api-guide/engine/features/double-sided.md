# Double-sided surfaces

Double-sided materials render both faces of thin surfaces and orient their shading normals for the visible face.

**TwoSidedPlane** shows a textured sheet from both sides; **AlphaBlendModeTest** includes double-sided transparent geometry. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

TwoSidedPlane (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/TwoSidedPlane/glTF/TwoSidedPlane.gltf)

### Double-sided surfaces

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

This property is controlled by `Model` shader defines and render parameters, rather than a `PBRMaterial` uniform.

### Model reference[​](#model-reference "Direct link to Model reference")

| Setting                | Type                          | Default  | Description                                                                                            |
| ---------------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `defines.DOUBLE_SIDED` | `boolean`                     | `false`  | Enables back-face normal correction in the PBR shader.                                                 |
| `parameters.cullMode`  | `'none' \| 'front' \| 'back'` | `'none'` | Device render-state default; the glTF importer explicitly chooses `'back'` for single-sided materials. |

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

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    baseColorFactor: [0.3, 0.7, 0.2, 1],

    metallicRoughnessValues: [0, 0.8]

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, DOUBLE_SIDED: true},

  parameters: {...modelProps.parameters, cullMode: 'none'}

});
```

Disabling culling keeps back faces visible. `DOUBLE_SIDED` also flips back-facing shading normals; use both settings together. This does not add thickness to the mesh.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `material.doubleSided` defaults to `false`. The material parser maps `true` to `cullMode: 'none'` and `DOUBLE_SIDED: true`. It can be combined with opaque, masked, or blended materials without an extension.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
