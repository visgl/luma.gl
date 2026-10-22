# Opacity and cutouts

Material alpha supports partially transparent surfaces and binary cutouts such as foliage, fences, and decals.

**AlphaBlendModeTest** and **CompareAlphaCoverage** place opaque, masked, and blended surfaces side by side. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

AlphaBlendModeTest (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf)

### Opacity and cutouts

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

| Field                | Type                                | Default        | Description                                                                 |
| -------------------- | ----------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `baseColorFactor`    | `Readonly<Vector4 \| NumberArray4>` | `[1, 1, 1, 1]` | Alpha multiplies texture and vertex alpha.                                  |
| `alphaCutoffEnabled` | `boolean`                           | `false`        | Enables the cutoff uniform in compatible shader paths.                      |
| `alphaCutoff`        | `number`                            | `0.5`          | Discard fragments below this alpha threshold when ALPHA\_CUTOFF is defined. |

### Model render state[​](#model-render-state "Direct link to Model render state")

`Model.parameters` controls blending and depth writes. `Model.defines.ALPHA_CUTOFF` compiles alpha rejection into the shader. Alpha blending is distinct from [light transmission](https://luma.gl/next/docs/api-guide/engine/features/transmission.md), which models light passing through a dielectric.

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

    baseColorFactor: [0.2, 0.6, 1, 0.35]

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  parameters: {

    ...modelProps.parameters,

    blend: true,

    blendColorOperation: 'add',

    blendColorSrcFactor: 'src-alpha',

    blendColorDstFactor: 'one-minus-src-alpha',

    blendAlphaOperation: 'add',

    blendAlphaSrcFactor: 'one',

    blendAlphaDstFactor: 'one-minus-src-alpha',

    depthWriteEnabled: false

  }

});
```

For cutouts, use an opaque render pass with depth writes and set both the shader define and material threshold. Here `baseColorTexture` is a loaded texture with a varying alpha channel:

```
const cutoutMaterial: PBRMaterial = createPBRMaterial(device, {

  uniforms: {alphaCutoffEnabled: true, alphaCutoff: 0.4},

  bindings: {pbr_baseColorSampler: baseColorTexture}

});

const cutoutModel = new Model(device, {

  ...modelProps,

  material: cutoutMaterial,

  defines: {...modelProps.defines, HAS_BASECOLORMAP: true, ALPHA_CUTOFF: true}

});
```

Render blended geometry after opaque geometry and sort it from back to front; blend parameters alone do not solve overlapping transparent surfaces.

## glTF support[​](#gltf-support "Direct link to glTF support")

Core glTF `alphaMode` selects `OPAQUE` (default), `MASK`, or `BLEND`. `MASK` uses `alphaCutoff`; `BLEND` uses base-color alpha. The importer configures shader defines and blend parameters, but its simple scenegraph draw path does not sort transparent meshes. Alpha coverage samples can also be used to inspect edge aliasing; this viewer does not automatically enable alpha-to-coverage.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
