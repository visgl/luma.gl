# Base color

Base color sets the diffuse color of a dielectric and the reflected color of a metal, combining a factor, a texture, and vertex colors.

**CompareBaseColor** contrasts authored colors, **BoxTextured** supplies a color texture, and **BoxVertexColors** supplies vertex colors. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareBaseColor (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareBaseColor/glTF/CompareBaseColor.gltf)

### Base color

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

| Field                 | Type                                | Default        | Description                                         |
| --------------------- | ----------------------------------- | -------------- | --------------------------------------------------- |
| `baseColorFactor`     | `Readonly<Vector4 \| NumberArray4>` | `[1, 1, 1, 1]` | Linear RGBA multiplier, including opacity in alpha. |
| `baseColorMapEnabled` | `boolean`                           | `false`        | Enables the base-color texture slot.                |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture bindings accept `Texture | null`. `createPBRMaterial()` derives the map-enabled flag; the model still needs the corresponding shader define.

| Binding                | Model define             | Description                      |
| ---------------------- | ------------------------ | -------------------------------- |
| `pbr_baseColorSampler` | `HAS_BASECOLORMAP: true` | sRGB RGB color and linear alpha. |

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

    baseColorFactor: [0.8, 0.3, 0.1, 1],

    metallicRoughnessValues: [0, 0.7]

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material

});
```

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `pbrMetallicRoughness.baseColorFactor` and `baseColorTexture` map directly to these inputs. Base-color texture RGB is decoded from sRGB; alpha is linear. `COLOR_0` multiplies the factor and texture. No material extension is required. See [opacity and cutouts](https://luma.gl/docs/api-guide/engine/features/opacity.md) for alpha handling.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
