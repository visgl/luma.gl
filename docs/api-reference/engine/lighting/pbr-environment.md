# PBR Environment Bindings

`PBRLightingEnvironment` describes a complete set of borrowed lighting textures and
optional intensity/rotation controls. It creates no GPU resources and owns no textures.
Use the same descriptor shape for generated environments and compatible precomputed maps.

```typescript
import {
  createPrefilteredEnvironment,
  getPBREnvironmentBindings,
  getPBREnvironmentUniforms
} from '@luma.gl/engine/lighting';

const generated = createPrefilteredEnvironment(device, {source});
const environment = {...generated.textures, intensity: 1, rotation: 0};
const bindings = getPBREnvironmentBindings(environment);
const uniforms = getPBREnvironmentUniforms(environment);
// Supply bindings to the model's shared IBL slots and uniforms to pbrScene.
// Enable the model's IBL shader specialization and the material's IBLenabled flag.
// Destroy consuming models before releasing the generated environment.
generated.destroy();
// The source texture remains application-owned.
```

## Resource contract

The required resources are `diffuseTexture`, `specularTexture`, and `brdfLUTTexture`.
They must be live textures on one device, with cube, cube, and 2D dimensions respectively.
The consuming model must use that same device.

`getPBREnvironmentBindings(environment)` validates this resource contract and returns
`pbr_diffuseEnvSampler`, `pbr_specularEnvSampler`, and `pbr_brdfLUT`. Bindings belong to
shared IBL group 2, independently of material group 3.

`getPBREnvironmentUniforms(environment)` returns `pbrScene` values:

- `environmentIntensity`: defaults to 1; zero disables the environment contribution.
- `environmentRotation`: defaults to 0 radians, around the Y axis.
- `environmentMipCount`: the current specular texture's mip-level count.

These helpers return snapshots. Call them again and update model bindings/scene uniforms
when replacing textures or changing controls. They neither mutate inputs nor release resources.

## Filtering conventions

Textures must match the shader consumer's numerical conventions. The generated environment
uses linear-light normalized diffuse irradiance (`E / pi`), a GGX-prefiltered specular cube
with linear perceptual-roughness mip spacing, and a split-sum BRDF LUT. Its LUT coordinates
are `(N dot V, 1 - roughness)`.

The binding helpers do not filter, rotate, normalize, flip, or reinterpret texture pixels.
A precomputed environment must already match these conventions when consumed by the same
PBR shaders. Merely having cube textures does not establish interoperability with another
renderer's environment format.

## Loaded environments

The existing glTF environment loader retains its `PBREnvironment` return shape and dynamic
texture ownership. Resolve its uploads through the glTF adapter:

```typescript
import {loadPBREnvironment, resolveLoadedPBREnvironment} from '@luma.gl/engine/gltf';

const loaded = loadPBREnvironment(device, {
  brdfLutUrl,
  getTexUrl,
  loadImage,
  specularMipLevels: 5
});
const environment = await resolveLoadedPBREnvironment(loaded, {intensity: 0.8, rotation: 0});
// Use the lighting binding/uniform helpers with environment.
// After rendering consumers are disposed:
loaded.diffuseEnvSampler.destroy();
loaded.specularEnvSampler.destroy();
loaded.brdfLutTexture.destroy();
```

`resolveLoadedPBREnvironment` waits for all three textures, propagates loading failures,
and validates the completed resource set. It transfers no ownership and performs no
format conversion. It returns concrete texture references; resolve again if a dynamic
source replaces its backing texture. Callers remain responsible for cleanup after failures.

See [PrefilteredEnvironment](./prefiltered-environment.md) for filtering quality, capabilities,
HDR requirements, and explicit SDR fallback.
