# @luma.gl/splats

`@luma.gl/splats` provides experimental GPU-native Gaussian splat rendering. It owns prepared
splat data, covariance projection, depth ordering, and render models without depending on Apache
Arrow, loaders.gl, or deck.gl.

The module is currently a private, unpublished luma.gl workspace. Install dependencies from the
repository root and add `"@luma.gl/splats": "workspace:*"` to another workspace package when
developing against it locally.

## Rendering prepared splats

```ts
import {makeGPUSplatData, SplatRenderer} from '@luma.gl/splats';

const splatData = makeGPUSplatData(device, {
  positions: new Float32Array([0, 0, -2]),
  scales: new Float32Array([0.25, 0.12, 0.08]),
  rotations: new Float32Array([1, 0, 0, 0]),
  colors: new Uint8Array([235, 150, 80, 255]),
  opacities: new Float32Array([0.8])
});

const renderer = new SplatRenderer(device, {data: splatData});

renderer.draw(renderPass);
renderer.appendData(nextSplatBatch);

// Destroy the renderer before destroying the prepared data it borrows.
renderer.destroy();
splatData.destroy();
nextSplatBatch.destroy();
```

`GPUSplatData` owns one prepared source batch and its explicitly allocated GPU resources. A
`SplatRenderer` borrows those batches: destroying the renderer releases its rendering resources,
but never destroys caller-owned splat data. Appending new batches preserves their original order
and does not concatenate source data or reupload existing batches.

## WebGPU command-graph renderer

`GPUSplatGraphRenderer` is a WebGPU-only renderer designed for large streamed captures:

```ts
import {GPUSplatGraphRenderer} from '@luma.gl/splats';

const renderer = new GPUSplatGraphRenderer(webgpuDevice, {
  data: preparedBatches,
  viewportSize: [width, height]
});

const commandEncoder = webgpuDevice.createCommandEncoder();
const encoding = renderer.encode(commandEncoder);
webgpuDevice.submit(commandEncoder.finish());

console.log(encoding?.stats.nodeCount, renderer.stats);
```

The compiled command graph projects and culls each original source batch into explicitly
renderer-owned, camera-dependent records. One stable global radix sort orders all batches together,
while GPU-written indirect draw arguments ensure that one render pass draws only visible rows. The
graph processes 16 significant depth-key bits instead of executing the full 32-bit radix schedule.
There are no per-frame CPU row projections, CPU depth sorts, sorted-index uploads, or implicit GPU
readbacks.

Source `GPUSplatData` objects remain borrowed, retain their original batch boundaries, and must
outlive the renderer. Derived projected records, sort keys, graph scratch, per-batch uniforms, and
indirect commands are explicitly owned by the graph renderer. HDR floating-point source colors,
anisotropic covariance, opacity thresholds, exposure, and tone mapping are preserved. Continue to
use `SplatRenderer` for WebGL2 devices or when comparing against CPU-based ordering.

## Source columns and rendering

`SplatSource` contains framework-independent, decoded typed arrays. Positions and linear
one-standard-deviation scales are packed XYZ `Float32Array` values; rotations are packed
`[w, x, y, z]` quaternions; colors are normalized RGBA `Uint8Array` values or linear RGBA
`Float32Array` values; and opacities are linear `Float32Array` values. Floating-point colors
preserve high-dynamic-range spherical-harmonic DC radiance, including values above one and below
zero, until rendering. Prepared GPU columns use the `float32x3`, `float32x4`, `unorm8x4`, and
`float32` memory formats provided by [`@luma.gl/tables`](/docs/api-reference/tables).

The renderer supports `none`, `global`, and `tile` depth-ordering modes alongside camera matrix,
viewport, radius, opacity, and visibility controls. WebGPU uses GPU-ready splat buffers and WGSL;
WebGL2 uses an attribute-backed GLSL fallback. Higher-order spherical harmonics and dedicated
WebGPU picking are not part of the initial API. When globally sorted source batches are densely
interleaved, the renderer bounds draw-call growth by grouping the rows into depth-ordered batch
runs without changing or repacking their source buffers.

The `exposure` property scales linear color before display mapping. Floating-point source colors
automatically enable Reinhard highlight compression on standard dynamic range targets; set
`toneMapping` to `'none'` or `'reinhard'` to override the automatic choice. On a WebGPU canvas
configured with `rgba16float` and extended tone mapping, the renderer preserves unclamped positive
radiance for the presentation target instead of applying SDR highlight compression.

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
through `rot_3`, `opacity`, and optional `f_dc_0` through `f_dc_2` columns. Field metadata selects
linear versus logarithmic scales and linear versus logit opacity. SH DC colors remain unclamped
linear `float32x4` radiance rather than being prematurely quantized into bytes. Each Arrow record
batch becomes one independently owned `GPUSplatData` object with stable source batch and row
identities.
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

Use `?loaders=local&scene=fixture` for the lightweight 1,000-splat parser fixture, or provide
`source` to select a custom `.ply`, `.splat`, `.ksplat`, `.spz`, or `.rad` file. Full PLY scenes
are streamed through their original Arrow record batches, and the showcase reports download,
batch, and splat progress while retaining independently owned GPU buffers. The loader remains an
application-level dependency; `@luma.gl/splats` continues to own only GPU data and rendering.

GraphDECO captures do not embed a universal world-up direction. The showcase applies known
scene-specific up vectors and, for Truck, its published initial camera; unfamiliar custom sources
retain the existing Z-up default. Foreground-centered framing, preserved manual camera movement
during streaming, and idle redraw suppression keep large scenes easier to inspect.

## Package boundaries

- `@loaders.gl/splats` parses Gaussian splat file formats and produces application-level data.
- `@luma.gl/arrow` maps Apache Arrow columns and metadata into GPU-ready splat data.
- `@luma.gl/splats` owns rendering, Gaussian projection, sorting, and GPU resource lifetimes.
- Applications or deck.gl layers own viewport integration, file selection, and interactive UI.

This separation keeps the renderer reusable from standalone luma.gl applications and deck.gl
adapters while preserving streaming batch boundaries.
