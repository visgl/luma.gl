---
title: Gaussian splat formats and loaders
description: Khronos glTF splats, 3D Tiles, SPZ, Arrow conversion, loaders, and package boundaries.
---

import {SplatsDocsTabs} from '@site/src/components/docs/splats-docs-tabs';

# Gaussian splat formats and loaders

<SplatsDocsTabs active="formats-loaders" />

## Khronos Gaussian splats, 3D Tiles, and SPZ

Decoded glTF primitives declaring `KHR_gaussian_splatting` can be prepared directly without adding
a loaders.gl or glTF dependency to the rendering package:

```ts
import {loadGPUSplatDataFromGLTF, makeGPUSplatDataFromGLTF} from '@luma.gl/splats';

const prepared = makeGPUSplatDataFromGLTF(device, decodedPrimitive, {
  sourceBatchIndex: tile.sourceBatchIndex,
  rowIndexBase: tile.firstSourceRow,
  maxSphericalHarmonicsDegree: 2
});

const compressed = await loadGPUSplatDataFromGLTF(device, compressedPrimitive, {
  signal,
  decodeCompressedPrimitive: (primitive, options) =>
    applicationOwnedSPZDecoder.decode(primitive, options)
});
```

The structural adapter validates POINTS primitives, the supported ellipse kernel, color space,
projection, and sorting method. It preserves source `POSITION`, decodes normalized scale/opacity
accessors, converts glTF XYZW quaternions to renderer WXYZ order, reconstructs spherical-harmonic
DC radiance, and packs complete degree-one through degree-three RGB coefficient bands. Authored
`EXT_mesh_features` feature identifiers become stable source semantic IDs. Compressed
`KHR_gaussian_splatting_compression_spz_2` payloads are handed to an explicitly caller-owned
decoder; this renderer does not claim to parse SPZ or fetch 3D Tiles itself.

loaders.gl already provides `Tileset3D` and `Tiles3DSource` for 3D Tiles traversal, content
fetching, tile transforms, cache management, and request scheduling. Its glTF loader already
decodes `EXT_mesh_features` and `EXT_structural_metadata`. The existing `SPZLoader` currently
supports SPZ version 4, not SPZ version 2. End-to-end Gaussian 3D Tiles require loader-owned
`KHR_gaussian_splatting` and `KHR_gaussian_splatting_compression_spz_2` runtime handlers, SPZ v2
decoding, and an application bridge from selected tiles into prepared splat batches or the existing
`SplatLayer`. loaders.gl already computes `Tile3D.computedTransform`, but the paged splat renderer
currently exposes one global model-view-projection transform and no per-page model transform. The
remaining renderer-side integration must therefore apply loader-computed transforms per tile/page.
The tileset traversal and layer already exist; follow
[tracking issue #1245](https://github.com/visgl/loaders.gl/issues/1245) for the missing integration.

## Apache Arrow conversion

```ts
import {makeGPUSplatDataFromArrow, makeGPUSplatDataFromArrowStream} from '@luma.gl/arrow';
import {SplatRenderer} from '@luma.gl/splats';

const batches = makeGPUSplatDataFromArrow(device, arrowTable);
const renderer = new SplatRenderer(device, {data: batches});

for await (const batch of makeGPUSplatDataFromArrowStream(device, arrowBatchStream)) {
  renderer.appendData(batch);
}
```

Arrow conversion recognizes GraphDECO-style `POSITION`, `scale_0` through `scale_2`, `rot_0`
through `rot_3`, `opacity`, optional `f_dc_0` through `f_dc_2` columns, higher-order `f_rest_*`
coefficients, and common semantic-class columns. Set `maxSphericalHarmonicsDegree` to cap decoded
bands or `semanticColumn` to select an explicit semantic field. Native RAD/SPZ basis-major RGB and
KSPLAT band-major, channel-major layouts are normalized into renderer-ready RGB basis triplets, and
valid degree-four SPZ sources are safely capped at supported degree three. Field metadata selects
linear versus logarithmic scales and linear versus logit opacity. SH DC colors remain unclamped
linear `float32x4` radiance rather than being prematurely quantized into bytes. Each Arrow record
batch becomes one independently owned `GPUSplatData` object with stable source batch and row
identities. Paged source wrappers can supply `loaderData.base` and `loaderData.chunkIndex` to
preserve authored global row and chunk identities even when pages arrive out of source order.
Streamed tables prepare and yield one record batch at a time, keeping transient GPU
allocations compatible with residency budgets and releasing no caller-owned yielded buffers.
Arrow sources are recognized structurally, so loaders.gl 5 alpha can use a different installed
Apache Arrow version from luma.gl without breaking record-batch detection or source identity.

## Local loaders.gl 5 alpha showcase

The Gaussian Splats showcase normally generates a deterministic scene without depending on
loaders.gl. To exercise a neighboring loaders.gl 5 alpha checkout instead, expose its location
when starting the standalone example:

```sh
VITE_LOADERS_GL_ROOT=/path/to/loaders.gl \
  yarn workspace luma.gl-examples-showcase-gaussian-splats start
```

Open the example with `?loaders=local` to stream the complete 741,883-splat Train scene from the
same Hugging Face catalog used by the loaders.gl Gaussian splat example. Use
`?loaders=local&scene=drjohnson`, `scene=playroom`, or `scene=truck` to select the other catalog
scenes. If the Hugging Face CDN is unavailable, Train automatically falls back to its two
GitHub-hosted PLY segments; `scene=train-github` selects those segments directly.

Provide an authorized custom RAD source with `?source=https://example.com/scene.rad`. On WebGPU,
the showcase first range-fetches the root page, then uses the live camera and authored per-row
child links to request, cancel, and evict only the source pages needed by its current hierarchy frontier.
`GPUPagedSplatRenderer` projects the selected original rows and sorts them globally across bounded
GPU segments. The default residency window retains at most one million original source rows; set
`&residentSplats=250000` to choose another whole-page source budget. The overlay reports the
complete authored source count, current selected rows, and resident pages.

The website showcase ships a bounded module-worker pool for actual RAD chunk decoding. Abortable
source byte ranges are transferred to a background worker, parsed with the isolated loaders.gl 5
bundle, serialized as transferable Arrow IPC, and reconstructed without losing original child-row
links or global source identities. Unsupported worker environments retain an explicit main-thread
fallback. Compatible RAD sources use Spark-calibrated best-first angular refinement, nonlinear
coarse-level opacity, analytic covariance projection, and area-preserving Gaussian antialiasing.
Explicit CPU and non-hierarchical RAD sources retain their bounded whole-page path.

Use `?loaders=local&scene=fixture` for the lightweight 1,000-splat parser fixture, or provide
`source` to select a custom `.ply`, `.splat`, `.ksplat`, `.spz`, or `.rad` file. Full PLY scenes
are streamed through their original Arrow record batches, and the showcase reports download,
batch, and splat progress while retaining independently owned GPU buffers. The loader remains an
application-level dependency; `@luma.gl/splats` continues to own only GPU data and rendering.
Both the default WebGPU graph and the explicit `&renderer=cpu` comparison retain and evaluate
camera-dependent higher-order spherical harmonics.

GraphDECO captures do not embed a universal world-up direction. The showcase applies known
scene-specific up vectors and, for Truck, its published initial camera; unfamiliar custom sources
retain the existing Z-up default. Foreground-centered framing, preserved manual camera movement
during streaming, and idle redraw suppression keep large scenes easier to inspect.

## Package boundaries

- `@loaders.gl/splats` parses Gaussian splat file formats and produces application-level data.
- `@loaders.gl/tiles` and `@loaders.gl/3d-tiles` own tileset traversal, content transport,
  transforms, request scheduling, and caching.
- `@loaders.gl/gltf` owns glTF parsing, extension decoding, and feature metadata.
- `@luma.gl/arrow` maps Apache Arrow columns and metadata into GPU-ready splat data.
- `@luma.gl/splats` owns rendering, Gaussian projection, sorting, and GPU resource lifetimes.
- Applications or deck.gl layers own viewport integration, file selection, and interactive UI.

This separation keeps the renderer reusable from standalone luma.gl applications and deck.gl
adapters while preserving streaming batch boundaries.

## Related pages

- [Gaussian splats overview](/docs/api-reference/splats)
- [Gaussian splat showcase](/examples/showcase/gaussian-splats)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
