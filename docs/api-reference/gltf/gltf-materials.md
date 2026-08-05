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
specular intensity/color, index of refraction, transmission, thickness/attenuation, clearcoat,
sheen, iridescence, and anisotropy.

## Supported texture slots

```ts
import {getTextureTransformSlotDefinitions} from '@luma.gl/gltf';

for (const definition of getTextureTransformSlotDefinitions()) {
  console.log(definition.slot, definition.colorSpace);
}
```

The shared registry describes all 17 supported slots:

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
  thickness, attenuation, index of refraction, and roughness-aware response.
- Standalone models produced by `createScenegraphsFromGLTF()` do not capture scene color and
  retain the established alpha/attenuation transmission approximation.

Captured transmission is a single screen-space opaque pass, not ray tracing or arbitrary layered
refraction. Advanced sheen, iridescence, and anisotropy also use the shared shader's existing
approximations. See [glTF extension support](/docs/api-reference/gltf/gltf-extensions) for
format-level coverage.
