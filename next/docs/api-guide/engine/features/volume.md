# Volume absorption

Volume thickness and absorption tint transmitted light according to the distance it travels through a material.

**CompareVolume** contrasts thin transmission with volume; **DragonAttenuation** supplies colored absorbing volumes. Select **Sample model** to compare the supplied examples. Drag to orbit and scroll to zoom.

Sample model

<!-- -->

CompareVolume (https\://raw\.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareVolume/glTF/CompareVolume.gltf)

### Volume absorption

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

The embedded scenegraph viewer approximates transmission with alpha; it loads these authored volume materials but does not reproduce full scene-color refraction. Use the renderer path described below to assess physical volume appearance.

## PBRMaterial reference[​](#pbrmaterial-reference "Direct link to PBRMaterial reference")

`PBRMaterial` from `@luma.gl/experimental` is a typed engine `Material` backed by the shared `pbrMaterial` shader module. Its material fields are defined by `PBRMaterialUniforms` from `@luma.gl/shadertools`. Pass them through `createPBRMaterial(device, {uniforms})` or update them with `material.setProps({pbrMaterial: {...}})`.

The fields below are optional. Defaults are the shared shader defaults; imported assets can supply other values.

| Field                 | Type                                | Default     | Description                                                                              |
| --------------------- | ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `transmissionFactor`  | `number`                            | `0`         | Fraction of light transmitted through the surface.                                       |
| `thicknessFactor`     | `number`                            | `0`         | Volume thickness in model-space units; 0 describes a thin surface.                       |
| `attenuationColor`    | `Readonly<Vector3 \| NumberArray3>` | `[1, 1, 1]` | Color transmitted after the attenuation distance.                                        |
| `attenuationDistance` | `number`                            | `1e9`       | Distance associated with attenuationColor; the large default approximates no absorption. |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture bindings accept `Texture | null`. `createPBRMaterial()` derives the map-enabled flag; the model still needs the corresponding shader define.

| Binding                | Model define             | Description                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| `pbr_thicknessSampler` | `HAS_THICKNESSMAP: true` | Linear green-channel multiplier for thicknessFactor. |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/next/docs/api-reference/shadertools/shader-modules/pbr-material.md).

The extended PBR shader path is disabled by default. Set `USE_MATERIAL_EXTENSIONS: true` in the `Model` construction `defines` to enable this feature; uniform values alone do not enable it. The glTF material parser supplies this define for imported extension materials.

## Usage[​](#usage "Direct link to Usage")

```
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    metallicRoughnessValues: [0, 0.05],

    transmissionFactor: 1,

    thicknessFactor: 0.5,

    attenuationColor: [0.8, 0.95, 1],

    attenuationDistance: 2

  }

});



// modelProps contains your shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

Use the shared experimental `SceneRenderer` or ANARI capture path when the material needs scene-color refraction. See [transmission](https://luma.gl/next/docs/api-guide/engine/features/transmission.md) for the rendering-path requirements.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_volume` supplies thickness, attenuation color, attenuation distance, and an optional thickness texture (green channel). It complements `KHR_materials_transmission`. The adapter converts glTF’s infinite attenuation-distance default into the shader’s large finite default.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md) and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for import details.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
