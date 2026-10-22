# Diffuse transmission and scattering

Diffuse transmission lets light emerge from the opposite side of a thin or scattering surface, useful for leaves, paper, and translucent ceramics.

The **DiffuseTransmissionPlant** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### DiffuseTransmissionPlant

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

| Field                                | Type                                | Default     | Description                                                                     |
| ------------------------------------ | ----------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `diffuseTransmissionFactor`          | `number`                            | `0`         | Fraction of dielectric diffuse energy transmitted into the opposite hemisphere. |
| `diffuseTransmissionColorFactor`     | `Readonly<Vector3 \| NumberArray3>` | `[1, 1, 1]` | RGB tint of transmitted diffuse light.                                          |
| `diffuseTransmissionMapEnabled`      | `boolean`                           | `false`     | Enables diffuse-transmission factor texture sampling.                           |
| `diffuseTransmissionColorMapEnabled` | `boolean`                           | `false`     | Enables diffuse-transmission color texture sampling.                            |
| `thicknessFactor`                    | `number`                            | `0`         | Volume thickness scale in model-space units.                                    |
| `multiscatterColorFactor`            | `Readonly<Vector3 \| NumberArray3>` | `[0, 0, 0]` | Experimental volume-scattering albedo.                                          |
| `multiscatterColorMapEnabled`        | `boolean`                           | `false`     | Enables scattering-albedo texture sampling.                                     |
| `scatterAnisotropy`                  | `number`                            | `0`         | Henyey–Greenstein scattering anisotropy, ranging from -1 to 1.                  |

### PBRMaterialBindings[​](#pbrmaterialbindings "Direct link to PBRMaterialBindings")

Texture resources are supplied separately through `PBRMaterialBindings`. Each field below is optional and accepts `Texture | null`. `createPBRMaterial()` derives map-enabled flags from these resources. Enable the corresponding `Model` shader define listed below when supplying a texture; the helper does not choose the model shader defines.

| Field                                 | Model define                            | Description                                               |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| `pbr_diffuseTransmissionSampler`      | `HAS_DIFFUSETRANSMISSIONMAP: true`      | Texture resource for the `diffuseTransmission` slot.      |
| `pbr_diffuseTransmissionColorSampler` | `HAS_DIFFUSETRANSMISSIONCOLORMAP: true` | Texture resource for the `diffuseTransmissionColor` slot. |
| `pbr_multiscatterColorSampler`        | `HAS_MULTISCATTERCOLORMAP: true`        | Texture resource for the `multiscatterColor` slot.        |

## Supporting APIs[​](#supporting-apis "Direct link to Supporting APIs")

### createPBRMaterial[​](#createpbrmaterial "Direct link to createPBRMaterial")

`createPBRMaterial(device, {uniforms, bindings, factory})` from `@luma.gl/experimental` returns a `PBRMaterial`. `uniforms` sets the fields listed above, `bindings` supplies material textures, and the optional `factory` shares a compatible binding schema across materials. The helper derives map-enabled flags from the supplied bindings; explicit uniform values take precedence.

### MaterialFactory[​](#materialfactory "Direct link to MaterialFactory")

`createPBRMaterialFactory(device)` from `@luma.gl/experimental` creates a reusable engine `MaterialFactory` configured with the `pbrMaterial` shader module. Pass this factory to `createPBRMaterial()` when creating several compatible materials.

### Material[​](#material "Direct link to Material")

`Material` from `@luma.gl/engine` owns material uniforms and texture resources. `setProps({pbrMaterial: {...}})` updates uniform values. Pass the material to a compatible `Model` through its `material` prop; models sharing it observe the same updates. Use `clone({bindings: {...}})` when an appearance needs separate texture resources. Adding a texture or changing a shader feature may require matching defines and a compatible model shader layout.

See the [materials guide](https://luma.gl/docs/api-guide/engine/materials.md) and [`pbrMaterial` reference](https://luma.gl/docs/api-reference/shadertools/shader-modules/pbr-material.md).

The extended PBR shader path is disabled by default. Set `USE_MATERIAL_EXTENSIONS: true` in the `Model` construction `defines` to enable this feature; uniform values alone do not enable it. The glTF material parser supplies this define for imported extension materials.

## Usage[​](#usage "Direct link to Usage")

```
import {Model} from '@luma.gl/engine';

import {createPBRMaterial, type PBRMaterial} from '@luma.gl/experimental';



// device is an initialized Device.

const material: PBRMaterial = createPBRMaterial(device, {

  uniforms: {

    diffuseTransmissionFactor: 0.7,

    diffuseTransmissionColorFactor: [0.6, 0.9, 0.4],

    thicknessFactor: 0.2,

    multiscatterColorFactor: [0.8, 0.9, 0.6],

    scatterAnisotropy: 0.2

  }

});



// modelProps contains your existing shaders, geometry, and buffer layout.

const model = new Model(device, {

  ...modelProps,

  material,

  defines: {...modelProps.defines, USE_MATERIAL_EXTENSIONS: true}

});
```

Scattering is a local, thickness-aware single-scattering approximation. Screen-space diffusion and random-walk multiple scattering are not implemented.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_materials_diffuse_transmission` is a release candidate rather than a ratified extension. The unratified `KHR_materials_volume_scatter` draft requires `KHR_materials_volume`. The plant sample demonstrates diffuse transmission; ScatteringSkull is a separate sample for the scattering draft.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
