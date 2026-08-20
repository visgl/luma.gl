---
title: glTF
description: Load and render standards-first glTF scenes, materials, extensions, animation, crowds, and lossless interchange.
---

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

`@luma.gl/gltf` is a standards-first asset runtime for physically based materials, animated
characters, morph deformation, native animation pointers, and source-faithful `.gltf` / `.glb`
interchange across WebGPU and WebGL. It turns postprocessed glTF assets into ordinary luma.gl
scenegraphs and exports generic scene descriptors without depending on a particular renderer.

File loading, decompression, and glTF postprocessing belong to `@loaders.gl/gltf`; animation
primitives, geometry, and shader modules remain in their existing luma.gl packages.

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

## What loaders.gl already provides

`@loaders.gl/gltf` is the asset decoder for the complete luma.gl pipeline. Its `GLTFLoader`,
`postProcessGLTF()`, and `GLBWriter` already own these format-level capabilities:

| Loader capability | Existing behavior |
| --- | --- |
| `.gltf` and `.glb` containers | Parse JSON and binary glTF containers, linked binary buffers, embedded data URIs, and referenced images. |
| Postprocessed accessors | Resolve scene references and materialize typed accessor values, including interleaved buffer views and authored normalization metadata. |
| `KHR_draco_mesh_compression` | Decompress supported Draco mesh primitives before luma.gl builds GPU geometry. |
| `EXT_meshopt_compression` | Decode meshopt-compressed buffer views before their accessor values reach the renderer. |
| `KHR_texture_basisu` | Select Basis Universal/KTX2 texture sources and invoke the available image/texture decoding path. Final GPU format support remains device-dependent. |
| `EXT_texture_webp` | Select the WebP texture source when the current browser can decode it; otherwise preserve the authored fallback or reject an unsupported required extension. |
| `EXT_mesh_features` and `EXT_structural_metadata` | Decode supported feature identifiers and structural metadata. Application-specific visualization, picking, and queries are not created automatically. |
| Loader-normalized lights and unlit materials | Expose authored `KHR_lights_punctual` and `KHR_materials_unlit` data; luma.gl still owns scene lighting and runtime shading. |
| Legacy `KHR_texture_transform` preprocessing | Optionally bake supported source UV transforms. Runtime per-slot shader transforms and animated texture pointers remain renderer-owned. |
| Binary GLB output | Encode aligned GLB container headers and JSON/BIN chunks through the existing `GLBWriter`. |

Call `postProcessGLTF()` explicitly: loaders.gl v4 does not apply it automatically. Runtime
animation and geometry consume the resulting accessor `value` and `components`; luma.gl does not
need a second buffer-view decoder. `exportGLTF()` still owns scene-to-glTF descriptor mapping,
while `GLBWriter` owns the binary container envelope.

The installed loader supports `EXT_meshopt_compression`, **not** the newer
`KHR_meshopt_compression` release candidate. Generic browser AVIF decoding also does not imply
`EXT_texture_avif` source selection: the installed glTF loader does not implement that extension.
Both belong in the shared asset loader before the renderer can advertise them.

loaders.gl also has a legacy CPU `KHR_texture_transform` preprocessing path. luma.gl retains
shader-side per-material transforms because animated pointers and independent texture slots are
render-time concerns; an authored transform must not be applied twice across those layers.

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
| `variants` | Source-aware runtime controller for authored material variants. |
| `cameras` | Runtime camera projections updated by supported animation pointers. |
| `animator` | A `GLTFAnimator` backed by the shared engine animation mixer. |
| `animations` | Decoded source clips, including supported animation-pointer channels. |
| `skins` | Automatically updated source skin bindings and reusable joint palettes. |
| `lights` | World-space directional, point, and spot lights from `KHR_lights_punctual`. |
| `extensionSupport` | A map describing support for extensions reported by the asset. |
| `sceneBounds` | World-space bounds and camera-framing recommendations for each scene. |
| `modelBounds` | Combined world-space bounds for the complete asset. |
| `gltfNodeIdToNodeMap`, `gltfNodeIndexToNodeMap` | Source-node lookup tables for application integration. |
| `gltfMeshIdToNodeMap` | Source-mesh lookup table. |
| `gltf` | The original postprocessed glTF document. |
| `destroy()` | Idempotently releases scene-owned models, materials, buffers, and textures. |

Each bounds object contains `bounds`, `center`, `size`, `radius`, and
`recommendedOrbitDistance`.

### Asset lifetime

Release the returned scenegraphs when replacing or unloading an asset:

```ts
scenegraphs.destroy();
```

This includes hidden nodes, detached mesh templates, instancing buffers, and generated source-image
textures. The application-owned device and borrowed image-based-lighting textures are not destroyed.

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

The canonical PBR path preserves all 21 supported core and extension texture slots, authored
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
[GPU-animated crowd reference](/docs/api-reference/gltf/gltf-animated-crowd), the
[engine animation guide](/docs/api-guide/engine/animation), and
[glTF extension support](/docs/api-reference/gltf/gltf-extensions) for details and limitations.

### Independently animated GPU crowds

`createGLTFAnimatedCrowd()` shares one parsed asset and one GPU model per reachable source
primitive across actors with independently selected clips, phases, playback speeds, and poses.
WebGPU stores joint palettes in read-only storage buffers; WebGL 2 reads equivalent floating-point
palette textures. Distinct actions and crossfades do not split an instanced draw: 100 Robot
Expressive actors still use its 19 source-primitive draws instead of 1,900 separate draws.

See [GPU-animated glTF crowds](/docs/api-reference/gltf/gltf-animated-crowd) for the complete
render loop, actor lifecycle, batching, backend requirements, current morph and LOD limitations,
and Animation Studio controls.

## Source-faithful asset interchange

`exportGLTF()` serializes renderer-independent glTF scene descriptors as embedded JSON or binary
GLB. Existing hierarchy, skins, inverse bind matrices, morph targets, animation clips, material
pointers, variants, GPU instancing, cameras, punctual lights, sampler settings, and authored
physical materials remain available to the output asset.

```ts
import {exportGLTF, type GLTFExportScene} from '@luma.gl/gltf';

const scene: GLTFExportScene = {name: 'Exported scene', nodes: [{name: 'Root'}]};
const document: string = exportGLTF(scene);
const binary: ArrayBuffer = exportGLTF(scene, {binary: true});
```

See [glTF asset interchange](/docs/api-reference/gltf/gltf-interchange) for typed descriptors,
RGBA vertex colors, normalized joint weights, animation pointers, and resource ownership.

## Package ownership

- `@loaders.gl/gltf` owns container parsing, linked resources, codec decoding, accessor
  postprocessing, loader-supported extension decoding, and binary GLB container encoding.
- `@luma.gl/gltf` interprets glTF-specific scene, material, sampler, light, and animation data.
- `@luma.gl/engine` owns generic scenegraph, animation, and morph-target primitives.
- `@luma.gl/shadertools` owns the shared PBR, lighting, and skinning shader modules.
- `@luma.gl/scene/gltf`, when explicitly imported, adapts decoded glTF data to retained ANARI
  objects without making the core ANARI entry point a glTF loader.
