# PBR Materials

The optional `@luma.gl/engine/lighting` entry point creates reusable physically based
materials using the canonical `pbrMaterial` shader module. A `PBRMaterial` is a typed
`Material`, with material resources in binding group 3. Shader equations remain in
`@luma.gl/shaders`.

```typescript
import {createPBRMaterial, createPBRMaterialFactory} from '@luma.gl/engine/lighting';

const factory = createPBRMaterialFactory(device);
const material = createPBRMaterial(device, {
  factory,
  uniforms: {
    baseColorFactor: [0.8, 0.3, 0.1, 1],
    metallicRoughnessValues: [0.7, 0.25]
  },
  bindings: {pbr_baseColorSampler: baseColorTexture}
});

material.setProps({pbrMaterial: {metallicRoughnessValues: [0.2, 0.6]}});
// Pass the material to a Model composed with the pbrMaterial shader module.
// Model disposal does not dispose the shared material.
material.destroy();
// The application releases baseColorTexture after all consumers finish using it.
```

## Factories and bindings

`createPBRMaterialFactory(device)` returns a normal `MaterialFactory`. Reuse it for
materials with the same binding schema. Materials have separate uniforms even when
created by the same factory. Use a factory belonging to the supplied device.

`createPBRMaterial(device, {id?, uniforms?, bindings?, factory?})` creates one material.
It infers map-enable uniforms from supplied material texture bindings; explicit uniforms
override those defaults. Unknown and scene-level bindings are excluded. Missing maps do
not allocate fallback textures.

`PBRMaterialResources` accepts concrete core bindings and deferred `TextureBindingSource`
objects such as `DynamicTexture`. A deferred source resolves during binding preparation
and can replace its backing texture while retaining its source identity. Uploads and
resource replacement must finish before recording consuming render passes.

`getPBRMaterialMapUniforms(bindings)` returns map-enable defaults. If changing the set
of map slots, create a material with the new bindings and rebuild the model's corresponding
shader specialization. Updating uniform values or the contents/backing texture of an
existing slot does not require another material type.

## Ownership

Materials own their managed uniform buffers. Texture resources and deferred sources are
borrowed. Destroying a material releases its managed buffers without destroying textures,
a shared factory, other materials, or models. Dispose dependent models before releasing a
material, then release application-owned textures after all consumers are finished.

Environment textures are shared lighting resources in group 2; keep them separate from
material maps. See [PBR environment bindings](./pbr-environment.md).

## Baked lightmaps

Supply `pbr_lightmapSampler` to enable the lightmap slot and model specialization automatically.
Lightmaps store linear diffuse irradiance **E**, without surface albedo. The shader applies
intensity and divides by pi during diffuse shading. This differs from generated diffuse IBL
textures, which store E / pi. Do not use an sRGB texture format for linear lightmap data.

```typescript
const material = createPBRMaterial(device, {
  bindings: {pbr_lightmapSampler: lightmapTexture},
  uniforms: {lightmapIntensity: 1, lightmapUVSet: 1}
});
const model = createPBRModel(device, {geometry, material});
```

`lightmapUVSet: 1` uses `TEXCOORD_1`; the default is UV set 0. Supply
`lightmapUVTransform` for atlas scale/translation. Source geometry attributes remain unchanged.
`lightmapMapEnabled: false` explicitly disables the contribution while retaining the slot.
Intensity zero also removes its contribution. Direct lighting, emission and alpha remain
independent; screen-space ambient visibility attenuates the indirect lightmap contribution.

Textures are borrowed and may be shared. Destroy consuming models before their material,
then release the texture after all consumers finish. Adding/removing a lightmap slot requires
recreating the model specialization; replacing an existing slot's backing texture does not.
These APIs consume precomputed maps; progressive baking is a separate workflow.
