import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# glTF Materials, Textures, and Lighting

<GltfDocsTabs active="materials" />

`@luma.gl/gltf` translates source glTF material and lighting data into the existing
`@luma.gl/shadertools` PBR modules. The same format-owned helpers are reused by retained-scene
importers, so sampler, UV, color-space, and extension interpretation stay in one place.

## Parse a physically based material

`createScenegraphsFromGLTF()` normally builds and caches materials automatically. Applications
implementing their own glTF integration can call the underlying parser directly:

```ts
import {parsePBRMaterial} from '@luma.gl/gltf';

const sourceMaterial: Parameters<typeof parsePBRMaterial>[1] = {
  pbrMetallicRoughness: {
    baseColorFactor: [0.8, 0.5, 0.2, 1],
    metallicFactor: 0.7,
    roughnessFactor: 0.25
  }
};

const material = parsePBRMaterial(device, sourceMaterial, primitive.attributes, {
  gltf,
  useTangents: true
});

material.uniforms;
material.bindings;
material.defines;
material.generatedTextures;
```

The resulting `ParsedPBRMaterial` contains canonical shader uniforms, texture bindings, feature
defines, and generated textures. Source `OPAQUE`, `MASK`, and `BLEND` modes, cutoff values,
double-sided materials, and unlit materials are preserved.

Core metallic-roughness factors and supported extension factors include emissive strength,
specular intensity/color, index of refraction, transmission, thickness/attenuation, ratified
chromatic dispersion, clearcoat, sheen, iridescence, and anisotropy. Additional experimental
material paths support `EXT_materials_bump`, release-candidate
`KHR_materials_diffuse_transmission`, and an explicitly approximate implementation of the
unratified `KHR_materials_volume_scatter` draft. Authored sRGB color textures use the exact
piecewise transfer function rather than an approximate gamma curve.

## Supported texture slots

```ts
import {getTextureTransformSlotDefinitions} from '@luma.gl/gltf';

for (const definition of getTextureTransformSlotDefinitions()) {
  console.log(definition.slot, definition.colorSpace);
}
```

The shared registry describes all 21 supported slots:

| Slot | glTF material source | Color space |
| --- | --- | --- |
| `baseColor` | `pbrMetallicRoughness.baseColorTexture` | sRGB |
| `metallicRoughness` | `pbrMetallicRoughness.metallicRoughnessTexture` | Linear |
| `normal` | `normalTexture` | Linear |
| `occlusion` | `occlusionTexture` | Linear |
| `emissive` | `emissiveTexture` | sRGB |
| `specularColor` | `KHR_materials_specular.specularColorTexture` | sRGB |
| `specularIntensity` | `KHR_materials_specular.specularTexture` | Linear |
| `transmission` | `KHR_materials_transmission.transmissionTexture` | Linear |
| `thickness` | `KHR_materials_volume.thicknessTexture` | Linear |
| `clearcoat` | `KHR_materials_clearcoat.clearcoatTexture` | Linear |
| `clearcoatRoughness` | `KHR_materials_clearcoat.clearcoatRoughnessTexture` | Linear |
| `clearcoatNormal` | `KHR_materials_clearcoat.clearcoatNormalTexture` | Linear |
| `sheenColor` | `KHR_materials_sheen.sheenColorTexture` | sRGB |
| `sheenRoughness` | `KHR_materials_sheen.sheenRoughnessTexture` | Linear |
| `iridescence` | `KHR_materials_iridescence.iridescenceTexture` | Linear |
| `iridescenceThickness` | `KHR_materials_iridescence.iridescenceThicknessTexture` | Linear |
| `anisotropy` | `KHR_materials_anisotropy.anisotropyTexture` | Linear |
| `bump` | `EXT_materials_bump.bumpTexture` | Linear, red channel |
| `diffuseTransmission` | `KHR_materials_diffuse_transmission.diffuseTransmissionTexture` | Linear, alpha channel |
| `diffuseTransmissionColor` | `KHR_materials_diffuse_transmission.diffuseTransmissionColorTexture` | sRGB |
| `multiscatterColor` | `KHR_materials_volume_scatter.multiscatterColorTexture` | sRGB |

Color textures must be decoded from sRGB exactly once. Data textures must remain linear. The
existing canonical glTF shader path performs its established color conversion; importers that
create hardware sRGB textures should not decode those same samples again.

## Sampler addressing, filters, and mipmaps

`convertGLTFSampler()` normalizes both raw glTF sampler fields and postprocessed loaders.gl
sampler parameters:

```ts
import {convertGLTFSampler, convertSamplerToGLTF} from '@luma.gl/gltf';

const sampler = convertGLTFSampler({
  wrapS: 33071,
  wrapT: 33648,
  minFilter: 9986,
  magFilter: 9728
});

// {
//   addressModeU: 'clamp-to-edge',
//   addressModeV: 'mirror-repeat',
//   minFilter: 'nearest',
//   magFilter: 'nearest',
//   mipmapFilter: 'linear'
// }

const gltfSampler = convertSamplerToGLTF(sampler);
```

The conversion preserves `REPEAT`, `CLAMP_TO_EDGE`, `MIRRORED_REPEAT`, nearest/linear minification
and magnification, and the four glTF mipmapped minification combinations. Material parsing applies
repeat addressing and linear sampling defaults when the source omits sampler fields.

`createGLTFTexture()` uploads an existing loader-provided image and materializes the mip chain
requested by its sampler:

```ts
import {createGLTFTexture} from '@luma.gl/gltf';

const baseColorTexture = createGLTFTexture(device, image, {
  id: 'base-color',
  colorSpace: 'srgb',
  sampler: {
    addressModeU: 'repeat',
    addressModeV: 'repeat',
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: 'linear'
  }
});
```

For uncompressed images, `colorSpace: 'srgb'` selects a hardware sRGB texture; `colorSpace:
'linear'` selects a linear texture. A nearest or linear mipmap filter allocates and generates the
complete mip chain using the active WebGL or WebGPU backend. Compressed images preserve the source
mip levels instead of attempting to regenerate them.

## Texture transforms and secondary UV coordinates

Each slot preserves its own `texCoord` selector and `KHR_texture_transform` offset, rotation,
scale, and optional coordinate-set override:

```ts
import {
  getTextureTransformMatrix,
  resolveTextureCoordinateSet,
  resolveTextureTransform
} from '@luma.gl/gltf';

const coordinateSet = resolveTextureCoordinateSet(textureInfo);
const transform = resolveTextureTransform(textureInfo);
const textureMatrix = getTextureTransformMatrix(transform);
```

`TEXCOORD_0` and `TEXCOORD_1` are supported. A texture requiring a missing secondary coordinate
attribute, or `TEXCOORD_2` and higher, is skipped with a warning. `KHR_animation_pointer` can
animate offset, rotation, and scale for each supported slot; changing the selected coordinate set
at runtime is not supported.

## Experimental bump mapping

[`EXT_materials_bump`](https://github.com/KhronosGroup/glTF/pull/2339) is an experimental material
proposal, not a ratified Khronos extension. The canonical PBR shaders derive a tangent-space
surface-normal perturbation from the linear red channel of `bumpTexture` and scale it with
`bumpFactor`:

```json
{
  "extensions": {
    "EXT_materials_bump": {
      "bumpFactor": 0.8,
      "bumpTexture": {"index": 2, "texCoord": 1}
    }
  }
}
```

Bump mapping composes with an existing normal map without moving mesh vertices. Its sampler,
texture-coordinate set, texture transform, and animated `bumpFactor` remain feature-specialized;
materials without a bump map allocate no additional GPU binding.

## Release-candidate diffuse transmission

[`KHR_materials_diffuse_transmission`](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_diffuse_transmission/README.md)
is a Khronos **release candidate**, not a ratified extension. It describes light transmitted
through the opposite hemisphere of a thin or translucent surface:

```json
{
  "extensions": {
    "KHR_materials_diffuse_transmission": {
      "diffuseTransmissionFactor": 0.75,
      "diffuseTransmissionTexture": {"index": 0},
      "diffuseTransmissionColorFactor": [1, 0.4, 0.2],
      "diffuseTransmissionColorTexture": {"index": 1}
    }
  }
}
```

Directional, point, spot, and image-based lights contribute from the opposite surface normal.
The alpha channel of the linear factor map controls transmitted energy; the optional color map
is decoded from sRGB. Front-facing diffuse reflection is reduced by the same transmission factor,
preserving the existing specular response. Metallic and specular-transmission terms reduce the
remaining diffuse-transmission energy, and authored volume thickness and attenuation tint the
result. Scalar and color factors and all texture-transform properties support
`KHR_animation_pointer`.

## Active-draft volume scattering

[`KHR_materials_volume_scatter`](https://github.com/KhronosGroup/glTF/pull/2453) is an active,
unratified draft and requires an accompanying `KHR_materials_volume` extension:

```json
{
  "extensions": {
    "KHR_materials_volume": {
      "thicknessFactor": 0.6,
      "attenuationDistance": 0.8,
      "attenuationColor": [1, 0.8, 0.65]
    },
    "KHR_materials_diffuse_transmission": {
      "diffuseTransmissionFactor": 0.7
    },
    "KHR_materials_volume_scatter": {
      "multiscatterColorFactor": [0.9, 0.35, 0.18],
      "multiscatterColorTexture": {"index": 3},
      "scatterAnisotropy": 0.25
    }
  }
}
```

The canonical shaders apply a local, thickness-aware single-scattering approximation with
Beer–Lambert volume attenuation and a bounded Henyey–Greenstein phase response. Both the newer
`multiscatterColorFactor` spelling and the older draft `multiscatterColor` spelling are accepted.
This is **not** spatial screen-space diffusion, a subsurface random walk, multi-surface
scattering, or a conformance claim for an unfinished specification. Draft field names and
behavior can change before standardization.

## Punctual lights

```ts
import {parseGLTFLights} from '@luma.gl/gltf';

const lights = parseGLTFLights(gltf, {useByteColors: false});
```

`parseGLTFLights()` resolves `KHR_lights_punctual` node hierarchy transforms and returns shared
directional, point, or spot light descriptions. Authored intensity, range attenuation, world-space
position/direction, and spotlight inner/outer cone angles are preserved. Set `useByteColors: false`
when the consumer expects source glTF linear RGB values in `[0, 1]`; the default retains luma.gl's
legacy byte-style light convention.

## Image-based lighting

`loadPBREnvironment()` loads an already prepared diffuse cubemap, specular cubemap mip chain, and
BRDF lookup texture:

```ts
import {createScenegraphsFromGLTF, loadPBREnvironment} from '@luma.gl/gltf';

const environment = loadPBREnvironment(device, {
  brdfLutUrl: '/environment/brdf-lut.png',
  getTexUrl: (kind, face, level) => `/environment/${kind}/${face}/${level}.png`,
  specularMipLevels: 6
});

const scenegraphs = createScenegraphsFromGLTF(device, gltf, {
  imageBasedLightingEnvironment: environment
});
```

This API loads precomputed resources; it does not convert arbitrary HDR images into prefiltered
lighting environments. To generate irradiance, roughness-prefiltered reflection mips, and a BRDF
lookup from an existing equirectangular texture, use the separate
[`PBREnvironmentGenerator`](/docs/api-reference/experimental/pbr-environment) owned by
`@luma.gl/experimental`.

## Transmission and rendering-path differences

Transmission and volume factors/textures are preserved across rendering paths, but physical
refraction depends on the renderer:

- The shared [experimental SceneRenderer](/docs/api-reference/experimental/scene-renderer) and
  retained ANARI path capture the opaque scene and sample it for screen-space refraction with
  thickness, attenuation, index of refraction, wavelength-dependent chromatic dispersion, and
  roughness-aware response. Opaque scene color stays linear and uses an HDR capture attachment
  when the device supports rendering and filtering `rgba16float`.
- Standalone models produced by `createScenegraphsFromGLTF()` do not capture scene color and
  retain the established alpha/attenuation transmission approximation.

Captured transmission is a single screen-space opaque pass, not ray tracing or arbitrary layered
refraction. Advanced materials use Charlie-distributed sheen, anisotropic GGX
distribution/visibility, spectral thin-film iridescence, and Fresnel-aware clearcoat/base-layer
energy compensation. See [glTF extension support](/docs/api-reference/gltf/gltf-extensions) for
format-level coverage.
