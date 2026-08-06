import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';
import {GLTFExample} from '@site/src/examples';

<a
  href="https://www.khronos.org/gltf/"
  aria-label="Learn about the Khronos glTF 3D asset format"
>
  <img src="/img/standards/gltf.svg" alt="glTF" width="180" />
</a>

# Overview

<GltfDocsTabs active="overview" />

`@luma.gl/gltf` turns postprocessed glTF assets into ordinary luma.gl scenegraphs, physically
based materials, punctual lights, and animated mesh data. File loading, decompression, and glTF
postprocessing belong to `@loaders.gl/gltf`; animation primitives, geometry, and shader modules
remain in their existing luma.gl packages.

<GLTFExample embedded showStats={false} />

## Installation

```bash
npm install @luma.gl/gltf @loaders.gl/core @loaders.gl/gltf
```

A rendering application also needs a configured `Device` from `@luma.gl/core`, backed by
`@luma.gl/webgl` or `@luma.gl/webgpu`.

## Load and animate an asset

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';

const asset = await load('/models/model.glb', GLTFLoader);
const gltf = postProcessGLTF(asset);

const scenegraphs = createScenegraphsFromGLTF(device, gltf, {
  useTangents: true,
  useByteColors: false
});

for (const scene of scenegraphs.scenes) {
  root.add(scene);
}

function renderFrame(timeMilliseconds: number): void {
  scenegraphs.animator.setTime(timeMilliseconds);
  requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);
```

`GLTFAnimator.setTime()` takes an absolute clock value in **milliseconds**. The shared
`AnimationMixer` exposed as `scenegraphs.animator.mixer` uses **seconds**. See
[glTF animation and deformation](/docs/api-reference/gltf/gltf-animation) before mixing the
legacy wall-clock API with direct mixer controls.

## `createScenegraphsFromGLTF()`

```ts
const scenegraphs = createScenegraphsFromGLTF(device, gltf, options);
```

`gltf` is the object returned by calling `postProcessGLTF()` on the loaded asset. loaders.gl v4
does not postprocess automatically. The returned `GLTFScenegraphs`
bundle contains:

| Property | Contents |
| --- | --- |
| `scenes` | One `@luma.gl/engine` `GroupNode` root per source scene. |
| `materials` | Shared engine materials in source glTF material order. |
| `animator` | A `GLTFAnimator` backed by the shared engine animation mixer. |
| `animations` | Decoded source clips, including supported animation-pointer channels. |
| `lights` | World-space directional, point, and spot lights from `KHR_lights_punctual`. |
| `extensionSupport` | A map describing support for extensions reported by the asset. |
| `sceneBounds` | World-space bounds and camera-framing recommendations for each scene. |
| `modelBounds` | Combined world-space bounds for the complete asset. |
| `gltfNodeIdToNodeMap`, `gltfNodeIndexToNodeMap` | Source-node lookup tables for application integration. |
| `gltfMeshIdToNodeMap` | Source-mesh lookup table. |
| `gltf` | The original postprocessed glTF document. |

Each bounds object contains `bounds`, `center`, `size`, `radius`, and
`recommendedOrbitDistance`.

### Options

```ts
type ParseGLTFOptions = {
  modelOptions?: Partial<ModelProps>;
  pbrDebug?: boolean;
  imageBasedLightingEnvironment?: PBREnvironment;
  lights?: boolean;
  useTangents?: boolean;
  useByteColors?: boolean;
};
```

- `modelOptions` supplies additional props to generated primitive models.
- `pbrDebug` enables shader-level material debugging.
- `imageBasedLightingEnvironment` supplies existing diffuse, specular, and BRDF lookup textures.
- `lights` controls the generated material's punctual-light shader configuration. The returned
  `lights` array is still parsed from the source asset.
- `useTangents` enables existing authored `TANGENT` attributes; it does not generate missing
  tangent data.
- `useByteColors: false` keeps authored punctual-light colors in the linear `[0, 1]` range. The
  default preserves luma.gl's legacy byte-style light-color convention.

Parsed CPU geometry retains source semantics such as `POSITION`, `NORMAL`, `TANGENT`, `COLOR_0`,
`TEXCOORD_0`, `TEXCOORD_1`, `JOINTS_0`, and `WEIGHTS_0`. Shader-facing attribute names are
resolved only at model boundaries.

## Materials, textures, and lights

The canonical PBR path preserves all 17 supported core and extension texture slots, authored
sampler addressing/filtering, generated or supplied mipmaps, per-slot UV transforms, secondary UV
coordinates, advanced material factors, alpha modes, and punctual lights.

Useful low-level exports include `parsePBRMaterial`, `createGLTFTexture`, `convertGLTFSampler`,
`convertSamplerToGLTF`, `getTextureTransformSlotDefinitions`, `resolveTextureTransform`,
`resolveTextureCoordinateSet`, `parseGLTFLights`, and `loadPBREnvironment`. See the
[glTF materials, textures, and lighting reference](/docs/api-reference/gltf/gltf-materials)
for examples, color-space rules, and current transmission limitations.

## Animation and deformation

`parseGLTFAnimations()` decodes translation, rotation, scale, morph weights, selected material
factors, and supported `KHR_texture_transform` pointers. `GLTFAnimator` applies `STEP`, `LINEAR`,
and `CUBICSPLINE` tracks through the format-independent engine mixer. Existing shared skinning
and morph-target helpers preserve authored joint attributes, target deltas, and per-node weights.

See [glTF animation and deformation](/docs/api-reference/gltf/gltf-animation), the
[engine animation guide](/docs/api-guide/engine/animation), and
[glTF extension support](/docs/api-reference/gltf/gltf-extensions) for details and limitations.

## Package ownership

- `@loaders.gl/gltf` loads and decompresses `.gltf` and `.glb` assets.
- `@luma.gl/gltf` interprets glTF-specific scene, material, sampler, light, and animation data.
- `@luma.gl/engine` owns generic scenegraph, animation, and morph-target primitives.
- `@luma.gl/shadertools` owns the shared PBR, lighting, and skinning shader modules.
- `@luma.gl/anari/gltf`, when explicitly imported, adapts decoded glTF data to retained ANARI
  objects without making the core ANARI entry point a glTF loader.
