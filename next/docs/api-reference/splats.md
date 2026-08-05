# @luma.gl/splats

`@luma.gl/splats` provides experimental GPU-native Gaussian splat rendering. It owns prepared splat data, covariance projection, depth ordering, and render models without depending on Apache Arrow, loaders.gl, or deck.gl.

The module is currently a private, unpublished luma.gl workspace. Install dependencies from the repository root and add `"@luma.gl/splats": "workspace:*"` to another workspace package when developing against it locally.

## Rendering prepared splats[​](#rendering-prepared-splats "Direct link to Rendering prepared splats")

```
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

`GPUSplatData` owns one prepared source batch and its explicitly allocated GPU resources. A `SplatRenderer` borrows those batches: destroying the renderer releases its rendering resources, but never destroys caller-owned splat data. Appending new batches preserves their original order and does not concatenate source data or reupload existing batches.

## WebGPU command-graph renderer[​](#webgpu-command-graph-renderer "Direct link to WebGPU command-graph renderer")

`GPUSplatGraphRenderer` renders streamed Gaussian captures directly through a WebGPU command graph. The first prepared batch becomes visible without waiting for the entire scene, running a CPU preview, or relinquishing ownership of the original source buffers.

```
import {GPUSplatGraphRenderer, type GPUSplatData} from '@luma.gl/splats';



const renderer = new GPUSplatGraphRenderer(webgpuDevice, {

  viewportSize: [width, height],

  expectedSplatCount: 741_883,

  expectedBatchCount: 12

});

const preparedBatches: GPUSplatData[] = [];



for await (const batch of preparedBatchStream) {

  preparedBatches.push(batch);

  renderer.appendData(batch);



  const commandEncoder = webgpuDevice.createCommandEncoder();

  const encoding = renderer.encode(commandEncoder);

  if (encoding) {

    webgpuDevice.submit(commandEncoder.finish());



    console.log(renderer.capacity, renderer.stats, encoding.stats.nodeCount);

  }

}



renderer.destroy();

for (const batch of preparedBatches) batch.destroy();
```

The caller owns command submission. Within an existing animation loop, pass the loop's current command encoder to `renderer.encode(...)` and let the loop submit normally. The graph opens its own default-framebuffer render pass; do not open a second splat render pass around `encode()`.

### Constructor options[​](#constructor-options "Direct link to Constructor options")

`GPUSplatGraphRenderer` accepts the existing camera, viewport, radius, opacity, exposure, and tone-mapping options from `SplatRenderer`, plus the following graph-specific properties:

| Property             | Type                               | Behavior                                                                                              |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `expectedSplatCount` | `number`                           | Optional positive final row-count hint; reserves projected records and global sort buffers once.      |
| `expectedBatchCount` | `number`                           | Optional positive final batch-count hint; reserves one reusable graph source slot per streamed batch. |
| `clearColor`         | `[number, number, number, number]` | Color used when the graph opens its default-framebuffer render pass. Defaults to transparent black.   |

Provide both expected counts when source metadata is available. For example, a 741,883-row Train capture streamed in twelve Arrow record batches can reuse one compiled graph throughout its entire download. Omit either hint when the corresponding dimension is unknown. The renderer always uses stable global GPU depth ordering and requires a WebGPU device; use `SplatRenderer` for WebGL2, source ordering, or tile ordering.

### Progressive graph lifecycle[​](#progressive-graph-lifecycle "Direct link to Progressive graph lifecycle")

Construction retains optional initial data but does not compile the graph or project source rows. `appendData(batch)` borrows another live `GPUSplatData` allocation from the same WebGPU device. The first `encode(commandEncoder)` with at least one row reserves capacity, compiles the graph, and encodes the first visible frame. Later batches update existing source slots and reuse that graph while their row and batch counts remain within its reserved capacities.

```
Arrow batch 0 ──> borrowed GPU source slot 0 ─┐

Arrow batch 1 ──> borrowed GPU source slot 1 ─┼─> initialize padded rows

future batches ─> reusable source slots     ─┘            │

                                                          v

                         GPU project + cull each active source slot

                                                          │

                                                          v

                         stable global 16-bit GPU radix depth sort

                                                          │

                                                          v

                         one GPU-counted indirect Gaussian draw
```

The initialization pass assigns `65535` to every padded or unoccupied depth key and resets the indirect instance counter. Each active batch slot projects its original positions, anisotropic scales, rotations, colors, and opacity; culls invalid, transparent, offscreen, or clipped splats; writes a valid depth key from `0` through `65534`; and atomically increments the visible instance count. Inactive source slots do not dispatch projection work. One stable GPU radix sort orders every active batch together, leaving invalid padding at the end; one indirect draw consumes only the visible prefix. The complete Train graph contains 126 scheduled nodes: one initialization pass, twelve reusable source-slot passes, 112 radix and hierarchical scan passes, and one render pass.

No source batches are concatenated, previously uploaded source columns are not reuploaded, and no frame requires a CPU source-row walk, CPU depth sort, sorted-index upload, or implicit GPU readback. Floating-point HDR radiance, mixed source color formats, opacity thresholds, exposure, and display tone mapping remain valid from the first streamed frame.

`encode()` returns a `GPUCommandGraphEncoding` when it records work, or `undefined` when the source is empty, the renderer is destroyed, or neither its data nor its camera/style properties changed. Calling `setProps(...)` or `appendData(...)` marks the next frame dirty; a stationary, unchanged scene is not repeatedly projected or sorted.

### Reserved capacity and unknown-size streams[​](#reserved-capacity-and-unknown-size-streams "Direct link to Reserved capacity and unknown-size streams")

The graph must reserve both row storage and immutable source-slot nodes before its first frame:

| Stream information                   | Initial row capacity                                                    | Initial batch capacity                   | Graph rebuilds                                                       |
| ------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Final row and batch counts are known | `expectedSplatCount`                                                    | `expectedBatchCount`                     | None while both hints remain sufficient.                             |
| Final size is unknown                | At least four times the first nonempty batch, bounded by device limits. | At least four batch slots.               | Only when accumulated rows or batches exceed their current capacity. |
| A supplied hint is too small         | The supplied row hint grows as needed.                                  | The supplied batch hint grows as needed. | Only at an exceeded row or batch capacity boundary.                  |

Unknown or exceeded capacities double geometrically. Growing capacity recompiles the graph and replaces renderer-owned working allocations, but existing `GPUSplatData` objects and their original GPU source buffers remain borrowed and intact. Inspect the currently allocated limits with `renderer.capacity`, which returns `{splatCount, batchCount}`; both values are zero before the first successful encoding.

### Ownership, replacement, and diagnostics[​](#ownership-replacement-and-diagnostics "Direct link to Ownership, replacement, and diagnostics")

Every source batch remains caller-owned and must stay alive while the renderer references it. `renderer.destroy()` releases the compiled graph, projected records, global sort buffers, graph scratch, source-slot placeholders, uniforms, and indirect commands; it never destroys source batches. Destroy the renderer before independently destroying those batches.

`renderer.setProps({data: replacementBatch})` replaces the borrowed source collection and invalidates its graph. The previous source batches are not destroyed; the caller remains responsible for their lifetime. The next nonempty `encode()` builds a graph for the replacement.

The renderer exposes lightweight diagnostics without synchronizing GPU work:

* `renderer.capacity` reports currently allocated row and source-slot limits.
* `renderer.stats` reports loaded rows and batches, source and renderer GPU bytes, global ordering, and the single indirect draw.
* `renderer.graphStats` reports compiled node order and logical versus physically reused graph resources; it is `undefined` before compilation.
* `renderer.compiledGraph` and `renderer.lastEncoding` expose the current compiled graph and most recent encoding for graph inspectors.
* `renderer.sortedIndexBuffer` exposes the GPU-owned projected-row permutation after compilation.
* `renderer.drawCommands` contains the GPU-written indirect command and exact visible instance count.

`renderer.stats.visibleSplatCount` currently reports the loaded row count without mapping a GPU buffer. The exact culled count is the indirect command's GPU-resident `instanceCount`; reading it back requires an explicit asynchronous buffer read after command submission.

### Memory, ordering, and device limits[​](#memory-ordering-and-device-limits "Direct link to Memory, ordering, and device limits")

The renderer allocates one 48-byte projected record and four 4-byte sort/index entries for every reserved row: **64 bytes per reserved splat**, before transient radix-sort scratch, source-slot placeholders, 128-byte per-slot uniforms, and caller-owned source columns. For the 741,883-splat Train scene, the primary renderer buffers use approximately 45.3 MiB and graph scratch uses approximately 19.8 MiB; packed source columns add approximately 36.8 MiB separately.

The projected-record allocation must fit the device's `maxStorageBufferBindingSize`. A 128 MiB storage-binding limit supports at most 2,796,202 splats in one graph. Larger scenes or constrained adapters require a different rendering strategy; the showcase falls back to `SplatRenderer` when graph compilation fails synchronously.

Reserving the final scene size avoids repeated graph compilation, but the global radix sort processes the entire reserved capacity on every dirty progressive frame, even while most source rows are still inactive. Oversized hints therefore trade higher early GPU work and memory for stable graph identity. The radix sort intentionally processes 16 significant depth bits; stable equal-key ties may be less precise than the CPU renderer's higher-precision depth ordering.

## Source columns and rendering[​](#source-columns-and-rendering "Direct link to Source columns and rendering")

`SplatSource` contains framework-independent, decoded typed arrays. Positions and linear one-standard-deviation scales are packed XYZ `Float32Array` values; rotations are packed `[w, x, y, z]` quaternions; colors are normalized RGBA `Uint8Array` values or linear RGBA `Float32Array` values; and opacities are linear `Float32Array` values. Floating-point colors preserve high-dynamic-range spherical-harmonic DC radiance, including values above one and below zero, until rendering. Prepared GPU columns use the `float32x3`, `float32x4`, `unorm8x4`, and `float32` memory formats provided by [`@luma.gl/tables`](https://luma.gl/next/docs/api-reference/tables.md).

`SplatRenderer` supports `none`, `global`, and `tile` depth-ordering modes alongside camera matrix, viewport, radius, opacity, and visibility controls; `GPUSplatGraphRenderer` always uses global GPU ordering. WebGPU uses GPU-ready splat buffers and WGSL; WebGL2 uses an attribute-backed GLSL fallback. Higher-order spherical harmonics and dedicated WebGPU picking are not part of the initial API. When globally sorted source batches are densely interleaved, `SplatRenderer` bounds draw-call growth by grouping the rows into depth-ordered batch runs without changing or repacking their source buffers.

The `exposure` property scales linear color before display mapping. Floating-point source colors automatically enable Reinhard highlight compression on standard dynamic range targets; set `toneMapping` to `'none'` or `'reinhard'` to override the automatic choice. On a WebGPU canvas configured with `rgba16float` and extended tone mapping, the renderer preserves unclamped positive radiance for the presentation target instead of applying SDR highlight compression.

## Apache Arrow conversion[​](#apache-arrow-conversion "Direct link to Apache Arrow conversion")

```
import {makeGPUSplatDataFromArrow, makeGPUSplatDataFromArrowStream} from '@luma.gl/arrow';

import {SplatRenderer} from '@luma.gl/splats';



const batches = makeGPUSplatDataFromArrow(device, arrowTable);

const renderer = new SplatRenderer(device, {data: batches});



for await (const batch of makeGPUSplatDataFromArrowStream(device, arrowBatchStream)) {

  renderer.appendData(batch);

}
```

Arrow conversion recognizes GraphDECO-style `POSITION`, `scale_0` through `scale_2`, `rot_0` through `rot_3`, `opacity`, and optional `f_dc_0` through `f_dc_2` columns. Field metadata selects linear versus logarithmic scales and linear versus logit opacity. SH DC colors remain unclamped linear `float32x4` radiance rather than being prematurely quantized into bytes. Each Arrow record batch becomes one independently owned `GPUSplatData` object with stable source batch and row identities. Arrow sources are recognized structurally, so loaders.gl 5 alpha can use a different installed Apache Arrow version from luma.gl without breaking record-batch detection or source identity.

## Local loaders.gl 5 alpha showcase[​](#local-loadersgl-5-alpha-showcase "Direct link to Local loaders.gl 5 alpha showcase")

The Gaussian Splats showcase normally generates a deterministic scene without depending on loaders.gl. To exercise a neighboring loaders.gl 5 alpha checkout instead, expose its location when starting the standalone example:

```
VITE_LOADERS_GL_ROOT=/path/to/loaders.gl \

  yarn workspace luma.gl-examples-showcase-gaussian-splats start
```

Open the example with `?loaders=local` to stream the complete 741,883-splat Train scene from the same Hugging Face catalog used by the loaders.gl Gaussian splat example. Use `?loaders=local&scene=drjohnson`, `scene=playroom`, or `scene=truck` to select the other catalog scenes. If the Hugging Face CDN is unavailable, Train automatically falls back to its two GitHub-hosted PLY segments; `scene=train-github` selects those segments directly.

Use `?loaders=local&scene=fixture` for the lightweight 1,000-splat parser fixture, or provide `source` to select a custom `.ply`, `.splat`, `.ksplat`, `.spz`, or `.rad` file. Full PLY scenes are streamed through their original Arrow record batches, and the showcase reports download, batch, and splat progress while retaining independently owned GPU buffers. The loader remains an application-level dependency; `@luma.gl/splats` continues to own only GPU data and rendering.

GraphDECO captures do not embed a universal world-up direction. The showcase applies known scene-specific up vectors and, for Truck, its published initial camera; unfamiliar custom sources retain the existing Z-up default. Foreground-centered framing, preserved manual camera movement during streaming, and idle redraw suppression keep large scenes easier to inspect.

## Package boundaries[​](#package-boundaries "Direct link to Package boundaries")

* `@loaders.gl/splats` parses Gaussian splat file formats and produces application-level data.
* `@luma.gl/arrow` maps Apache Arrow columns and metadata into GPU-ready splat data.
* `@luma.gl/splats` owns rendering, Gaussian projection, sorting, and GPU resource lifetimes.
* Applications or deck.gl layers own viewport integration, file selection, and interactive UI.

This separation keeps the renderer reusable from standalone luma.gl applications and deck.gl adapters while preserving streaming batch boundaries.
