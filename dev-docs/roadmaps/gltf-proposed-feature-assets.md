# Source assets for proposed glTF features

Audit date: October 20, 2026. These findings cover the six proposals selected in
[the implementation roadmap](gltf-proposed-features-roadmap.md).

## Selection summary

| Proposal | Verified source asset | License evidence | Integration decision |
| --- | --- | --- | --- |
| `KHR_billboard` | Khronos BillboardDemo (fortress, trees and labels) | Model metadata and repository REUSE attribution: CC BY 4.0 plus Apache 2.0 for Roboto | Suitable source asset with explicit compatibility for its older lowercase `rotationAxis: "y"`; geometry buffer is 67.9 MB |
| `KHR_lightmap` | `node-atlas.gltf`, `gpu-atlas.gltf`; Lightmapped Cornell Box GLB | Atlas fixtures declare Ben Houston, CC0-1.0; Cornell Box README declares repository MIT license | Prefer Cornell Box for the visual example and both small atlas files for integration checks |
| `EXT_lights_area` | Foundation Resources `head.gltf` and `living-room-3.gltf` declare rectangular area lights | Repository declares CC0 except where noted; subdirectory READMEs identify original PBRT/Bitterli sources | Candidates, pending confirmation against original-source licenses and full payload delivery; use Git LFS media URLs for buffers/images |
| `KHR_materials_scatter` | No compatible source-hosted glTF/GLB verified | NVIDIA has a reference implementation and authored C++ tests | Continue searching; do not relabel an older volume-scatter or diffuse-transmission model |
| `KHR_audio_graph` | Procedural Drum Kit | Asset declares CC0; generator synthesizes the MP3 one-shots and model geometry | Suitable pinned source candidate; map its exact graph operations and playback-control profile before claiming compatibility |
| `KHR_audio_environment` | Same Drum Kit | Same evidence | Suitable pinned source candidate; verify listener, scene environment selection and reverb semantics |

Finding an asset is not a runtime conformance result. Inspect the actual source document before
choosing an implementation profile. Preserve source extension records and load resources relative
to the original model URL. Offline regression fixtures remain independent of network availability.

## Billboard assets

Source revision: `KhronosGroup/glTF-External-Reference@d15ddd159493698a1c1ce2fab448abbfde56c312`.

- [BillboardDemo.gltf](https://raw.githubusercontent.com/KhronosGroup/glTF-External-Reference/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/glTF/BillboardDemo.gltf)
- [Asset attribution](https://github.com/KhronosGroup/glTF-External-Reference/blob/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/metadata.json)
- [Repository REUSE attribution](https://github.com/KhronosGroup/glTF-External-Reference/blob/d15ddd159493698a1c1ce2fab448abbfde56c312/.reuse/dep5)

BillboardDemo contains the actual `KHR_billboard` extension, including default camera-facing,
overlay and historic lowercase Y-axis nodes. It references `file_0.bin` (67,930,484 bytes), three
external PNGs, and embedded image views. Attribute Nik for the fortress, EFX for the trees,
Christian Robertson for Roboto, and UX3D/Khronos for composition, as listed upstream.

The smaller [VFXTest](https://github.com/KhronosGroup/glTF-External-Reference/tree/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/VFXTest)
also declares billboarding, but its particle sprite carries a noncommercial/no-derivatives license.
Exclude it from the default public example selection; do not infer the model's general CC BY label
covers that texture.

## Lightmap assets

Proposal fixtures, source revision `bhouston/glTF@c83154543c8a227bca17b5fe0eafdef2a6cb6efb`:

- [Node atlas](https://raw.githubusercontent.com/bhouston/glTF/c83154543c8a227bca17b5fe0eafdef2a6cb6efb/extensions/2.0/Khronos/KHR_lightmap/examples/node-atlas.gltf)
- [GPU atlas](https://raw.githubusercontent.com/bhouston/glTF/c83154543c8a227bca17b5fe0eafdef2a6cb6efb/extensions/2.0/Khronos/KHR_lightmap/examples/gpu-atlas.gltf)

Both are self-contained through data URIs, explicitly declare `KHR_lightmap` as required, and include
CC0-1.0 attribution in `asset.copyright`. The node sample exercises per-node primitive atlas
replacement. The GPU sample supplies the four `_LIGHTMAP_*` instance attributes.

Visual sample, source revision `bhouston/three.js@91de5714e5abaf1f7105f4f1c8858bed93171a25`:

- [LightmappedCornellBox.glb](https://raw.githubusercontent.com/bhouston/three.js/91de5714e5abaf1f7105f4f1c8858bed93171a25/examples/models/gltf/LightmappedCornellBox/LightmappedCornellBox.glb)
- [Asset README and license statement](https://github.com/bhouston/three.js/blob/91de5714e5abaf1f7105f4f1c8858bed93171a25/examples/models/gltf/LightmappedCornellBox/README.md)

The GLB is 709,344 bytes. Its README describes a procedural Cornell Box, a shared 1024-square linear
atlas on `TEXCOORD_1`, a ceiling punctual light, no external models/textures, and MIT licensing.
The runtime integration check must inspect its binary JSON and compare its bindings to the pinned
proposal before using it as reference evidence.

## Area-light candidates

Source revision: `mos9527/Foundation-Resources@3c8df40aece172360612d5a01177d91d6b4ab3e6`.

- [Head glTF](https://raw.githubusercontent.com/mos9527/Foundation-Resources/3c8df40aece172360612d5a01177d91d6b4ab3e6/head/head.gltf),
  [source attribution](https://github.com/mos9527/Foundation-Resources/blob/3c8df40aece172360612d5a01177d91d6b4ab3e6/head/README).
- [Living Room glTF](https://raw.githubusercontent.com/mos9527/Foundation-Resources/3c8df40aece172360612d5a01177d91d6b4ab3e6/living-room-3/living-room-3.gltf),
  [source attribution](https://github.com/mos9527/Foundation-Resources/blob/3c8df40aece172360612d5a01177d91d6b4ab3e6/living-room-3/README).

Both documents contain `EXT_lights_area` rectangle definitions with `size`, `rect.aspect`, color and
intensity. Head also uses vendor camera/subsurface extensions; Living Room is a simpler material
compatibility candidate. Their subdirectory READMEs explicitly call out nonstandard draft behavior.

Buffers and images are Git LFS objects: raw GitHub endpoints return pointer text, not renderable
payloads. A source-loader fetch policy must route those dependencies to
`https://media.githubusercontent.com/media/<repository>/<revision>/<path>` and verify CORS/payload
availability. Head geometry is 401,180 bytes; Living Room geometry is 33,217,588 bytes. The Living Room license is verified in the original
[PBRT archive](https://benedikt-bitterli.me/resources/pbrt-v4/living-room-3.zip),
entry `living-room-3/LICENSE.txt`: the scene is **The Modern Living Room by Wig42**,
licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Preserve artist
credit, the license link, and Benedikt Bitterli's scene-conversion attribution.
The archive license was inspected with HTTP range reads; no inference from the
Foundation repository's general CC0 statement was used. The pinned Foundation
geometry and texture media endpoints return HTTP 200 with CORS enabled. Head's
original-source licensing remains unverified.

## Layered audio assets

Source revision: `rudybear/gltf-webgpu@188965dd2ea0a1492c39dedf69f8e75f730baf9a`.

- [Drum Kit glTF](https://raw.githubusercontent.com/rudybear/gltf-webgpu/188965dd2ea0a1492c39dedf69f8e75f730baf9a/examples/drum-kit/drum-kit.gltf)
- [Source directory and audio files](https://github.com/rudybear/gltf-webgpu/tree/188965dd2ea0a1492c39dedf69f8e75f730baf9a/examples/drum-kit)
- [Procedural geometry and audio generator](https://github.com/rudybear/gltf-webgpu/blob/188965dd2ea0a1492c39dedf69f8e75f730baf9a/scripts/make-drum-kit.mjs)

The model declares `KHR_audio_emitter`, `KHR_audio_graph`, `KHR_audio_environment`,
`KHR_interactivity`, and `KHR_node_selectability`. Graph nodes include lowpass, gain, peaking EQ and
high-shelf processing with explicit source inputs and emitter outputs. The environment declares an
HRTF listener and a small-room reverb preset.

The asset's CC0 statement is supported by the committed generator, which synthesizes the drum
samples and MP3 output rather than copying an unexplained third-party music file. It references a
local binary and eight local MP3 files. Its selection graph writes a prototype source `playing`
property; that control path requires explicit compatibility work, not silent automatic adaptation.

## Scattering search result

No compatible committed `KHR_materials_scatter` glTF/GLB was verified in this pass. NVIDIA's
[vk_gltf_renderer](https://github.com/nvpro-samples/vk_gltf_renderer) has parser/rendering code and
unit tests, which are useful reference implementations, but those are not downloadable sample models.

DisplayXR's committed `material_grid.glb`, `transmission_test.glb`, and `diffuse_fuzz_test.glb` were
inspected through their GLB JSON chunks. None contains `KHR_materials_scatter`; exclude them as
positive fixtures even though the renderer supports that extension. Continue checking proposal-author
branches or seek an upstream-authored fixture before promising a source-loaded scattering example.

The audio environment preset loads this pinned Drum Kit unchanged. It uses the authored small-room preset through an approximate parametric response. Air absorption and prototype playing-pointer interaction remain explicitly unsupported; the gallery thumbnail is an actual luma.gl render.
