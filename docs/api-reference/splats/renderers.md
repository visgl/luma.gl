---
title: Gaussian splat renderers
description: Prepared, command-graph, segmented, and paged Gaussian splat rendering contracts.
---

import {SplatsDocsTabs} from '@site/src/components/docs/splats-docs-tabs';

# Gaussian splat renderers

<SplatsDocsTabs active="renderers" />

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

`GPUSplatGraphRenderer` renders streamed Gaussian captures directly through a WebGPU command graph.
The first prepared batch becomes visible without waiting for the entire scene, running a CPU
preview, or relinquishing ownership of the original source buffers.

```ts
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

The caller owns command submission. Within an existing animation loop, pass the loop's current
command encoder to `renderer.encode(...)` and let the loop submit normally. The graph opens its own
default-framebuffer render pass; do not open a second splat render pass around `encode()`.

### Constructor options

`GPUSplatGraphRenderer` accepts the existing camera, viewport, radius, opacity, exposure, and
tone-mapping options from `SplatRenderer`, plus the following graph-specific properties:

| Property | Type | Behavior |
| --- | --- | --- |
| `expectedSplatCount` | `number` | Optional positive final row-count hint; reserves projected records and global sort buffers once. |
| `expectedBatchCount` | `number` | Optional positive final batch-count hint; reserves one reusable graph source slot per streamed batch. |
| `clearColor` | `[number, number, number, number]` | Color used when the graph opens its default-framebuffer render pass. Defaults to transparent black. |
| `cameraPosition` | `[number, number, number]` | World-space camera position used to evaluate directional source radiance directly on the GPU. |
| `sphericalHarmonicsDegree` | `0 \| 1 \| 2 \| 3` | Highest fully prepared spherical-harmonic band evaluated by graph projection. |
| `semanticFilter` | `SplatSemanticFilter` | GPU-resident include/exclude class selection and unlabeled-source visibility. |

`clearColor`, `expectedSplatCount`, and `expectedBatchCount` are constructor-only options.
`setProps(...)` accepts mutable camera, styling, semantic-filter, and borrowed-source updates.

Provide both expected counts when source metadata is available. For example, a 741,883-row Train
capture streamed in twelve Arrow record batches can reuse one compiled graph throughout its entire
download. Omit either hint when the corresponding dimension is unknown. The renderer always uses
stable global GPU depth ordering and requires a WebGPU device; use `SplatRenderer` for WebGL2,
source ordering, tile ordering, or JavaScript semantic predicates. Graph-native semantic selection
accepts numeric include/exclude sets and `includeUnlabeled`; arbitrary JavaScript predicates are
rejected because they cannot execute inside a GPU command graph.

### Progressive graph lifecycle

Construction retains optional initial data but does not compile the graph or project source rows.
`appendData(batch)` borrows another live `GPUSplatData` allocation from the same WebGPU device.
The first `encode(commandEncoder)` with at least one row reserves capacity, compiles the graph, and
encodes the first visible frame. Later batches update existing source slots and reuse that graph
while their row and batch counts remain within its reserved capacities.

```text
Arrow batch 0 ──> borrowed GPU source slot 0 ─┐
Arrow batch 1 ──> borrowed GPU source slot 1 ─┼─> initialize padded rows
future batches ─> reusable source slots     ─┘            │
                                                          v
                         GPU project + cull each active source slot
                                                          │
                                                          v
                         GPU directional SH + semantic feature pass
                                                          │
                                                          v
                         stable global 16-bit GPU radix depth sort
                                                          │
                                                          v
                         one GPU-counted indirect Gaussian draw
```

The initialization pass assigns `65535` to every padded or unoccupied depth key and resets the
indirect instance counter. Each active batch slot projects its original positions, anisotropic
scales, rotations, colors, and opacity; culls invalid, transparent, offscreen, or clipped splats;
writes a valid depth key from `0` through `65534`; and atomically increments the visible instance
count. A separate bounded-storage feature pass evaluates camera-dependent degree-one through
degree-three coefficients and applies source semantic visibility before sorting. Keeping this pass
separate preserves the baseline WebGPU guarantee of eight storage bindings per shader stage.
Inactive source slots do not dispatch projection or feature work. One stable GPU radix sort orders
every active batch together, leaving invalid padding at the end; one indirect draw consumes only
the visible prefix.

No source batches are concatenated, previously uploaded source columns are not reuploaded, and no
frame requires a CPU source-row walk, CPU depth sort, sorted-index upload, or implicit GPU readback.
Floating-point HDR radiance, mixed source color formats, opacity thresholds, exposure, and display
tone mapping remain valid from the first streamed frame.

`encode()` returns a `GPUCommandGraphEncoding` when it records work, or `undefined` for an initially
empty source, a destroyed renderer, or unchanged data/camera/style properties. When a previously
visible hierarchy frontier becomes empty, the first encoding clears the existing presentation and
indirect count once while retaining the compiled graph; subsequent empty frames return `undefined`.
Calling `setProps(...)`, `appendData(...)`, or `updateRows(...)` on a retained source batch marks
the next frame dirty; a stationary, unchanged scene is not repeatedly projected or sorted. Source
row updates and compatible frontier restoration reuse the compiled graph and caller-owned buffers.

### Reserved capacity and unknown-size streams

The graph must reserve both row storage and immutable source-slot nodes before its first frame:

| Stream information | Initial row capacity | Initial batch capacity | Graph rebuilds |
| --- | --- | --- | --- |
| Final row and batch counts are known | `expectedSplatCount` | `expectedBatchCount` | None while both hints remain sufficient. |
| Final size is unknown | At least four times the first nonempty batch, bounded by device limits. | At least four batch slots. | Only when accumulated rows or batches exceed their current capacity. |
| A supplied hint is too small | The supplied row hint grows as needed. | The supplied batch hint grows as needed. | Only at an exceeded row or batch capacity boundary. |

Unknown or exceeded capacities double geometrically. Growing capacity recompiles the graph and
replaces renderer-owned working allocations, but existing `GPUSplatData` objects and their original
GPU source buffers remain borrowed and intact. Inspect the currently allocated limits with
`renderer.capacity`, which returns `{splatCount, batchCount}`; both values are zero before the
first successful encoding.

### Ownership, replacement, and diagnostics

Every source batch remains caller-owned and must stay alive while the renderer references it.
`renderer.destroy()` releases the compiled graph, projected records, global sort buffers, graph
scratch, source-slot placeholders, uniforms, and indirect commands; it never destroys source
batches. Destroy the renderer before independently destroying those batches.

`renderer.setProps({data: replacementBatches})` replaces the borrowed source collection without
destroying previous caller-owned batches. Frontier replacements that remain inside the reserved
row and source-slot capacities reuse their compiled graph and update only its borrowed bindings;
exceeding either capacity recompiles the graph before the next nonempty encoding.

The renderer exposes lightweight diagnostics without synchronizing GPU work:

- `renderer.capacity` reports currently allocated row and source-slot limits.
- `renderer.stats` reports loaded rows and batches, source and renderer GPU bytes, global ordering,
  and the single indirect draw.
- `renderer.graphStats` reports compiled node order and logical versus physically reused graph
  resources; it is `undefined` before compilation.
- `renderer.compiledGraph` and `renderer.lastEncoding` expose the current compiled graph and most
  recent encoding for graph inspectors.
- `renderer.sortedIndexBuffer` exposes the GPU-owned projected-row permutation after compilation.
- `renderer.projectedRecordBuffer` and `renderer.uniformBuffer` expose the shared graph-owned
  records and render uniforms used by graph-native interaction and composition.
- `renderer.drawCommands` contains the GPU-written indirect command and exact visible instance
  count.

`renderer.stats.visibleSplatCount` currently reports the loaded row count without mapping a GPU
buffer. The exact culled count is the indirect command's GPU-resident `instanceCount`; reading it
back requires an explicit asynchronous buffer read after command submission.

### Memory, ordering, and device limits

The renderer allocates one 48-byte projected record and four 4-byte sort/index entries for every
reserved row: **64 bytes per reserved splat**, before transient radix-sort scratch, source-slot
placeholders, 128-byte per-slot uniforms, and caller-owned source columns. For the 741,883-splat
Train scene, the primary renderer buffers use approximately 45.3 MiB and graph scratch uses
approximately 19.8 MiB; packed source columns add approximately 36.8 MiB separately.

The projected-record allocation must fit the device's `maxStorageBufferBindingSize`. A 128 MiB
storage-binding limit supports at most 2,796,202 splats in one `GPUSplatGraphRenderer` graph. Use
`GPUPagedSplatRenderer` when independent source pages or a larger active hierarchy frontier would
exceed that projected-record limit. The original progressive graph remains useful when one known
scene fits its single allocation.

Reserving the final scene size avoids repeated graph compilation, but the global radix sort processes
the entire reserved capacity on every dirty progressive frame, even while most source rows are
still inactive. Oversized hints therefore trade higher early GPU work and memory for stable graph
identity. The radix sort intentionally processes 16 significant depth bits; stable equal-key ties
may be less precise than the CPU renderer's higher-precision depth ordering.

## Segmented paged WebGPU rendering

`GPUPagedSplatRenderer` projects independently owned source pages into bounded GPU segments while
preserving one globally correct depth order across the entire active frontier:

```ts
import {GPUPagedSplatRenderer} from '@luma.gl/splats';

const renderer = new GPUPagedSplatRenderer(webgpuDevice, {
  viewportSize: [width, height],
  pages: [
    {id: 'rad:0', data: rootPage, activeRows: new Uint32Array([0, 4, 12])},
    {id: 'rad:8', data: detailPage, activeRows: new Uint32Array([2, 7])}
  ]
});

renderer.setFrontier(cameraSelectedSourcePages);
const encoding = renderer.encode(commandEncoder);
if (encoding) webgpuDevice.submit(commandEncoder.finish());

console.log(renderer.stats.segmentCount, renderer.stats.activeRowCount);
```

`activeRows` contains original batch-local row indices; omit it to render every row in one source
page. No source page or GPU column is concatenated, rewritten, or transferred to the renderer.
Each sparse source segment projects only its selected rows, evaluates degree-one through
degree-three directional harmonics, and applies GPU semantic include/exclude selections. Source
bindings, including large harmonic columns, are split into legal device-sized ranges while every
compute shader stays within the standard eight-storage-binding WebGPU guarantee.

Set `lodOpacity: true` for Spark RAD sources whose encoding declares coarse-level opacity. The
paged renderer then reconstructs authored parent support and nonlinear opacity, preserves
Gaussian energy when adding screen-space antialiasing, and converts display-domain RAD colors
correctly when presenting to a linear high-dynamic-range target. Ordinary Gaussian batches retain
their existing opacity and floating-point color behavior. Use explicit `toneMapping: 'none'` for
already display-referred RAD scenes on standard-dynamic-range canvases.

A global GPU radix sort orders compact four-byte source-row references across every page. The
sorted permutation is scattered into separate 48-byte projected output segments, and one shared
render pass draws those segments in global depth order using GPU-written indirect commands. This
preserves transparency ordering even when rows from different pages overlap or interleave in
depth; sorting pages independently would not.

On a device with a 128 MiB storage-binding limit, the previous single-record graph supports at
most 2,796,202 active rows; the paged renderer instead supports up to 33,554,432 simultaneously
active four-byte global-sort references. Source datasets may be larger because original pages can
enter and leave bounded residency. The four-byte global sort still has its own binding limit, and
this renderer does not yet provide a dedicated segmented GPU picker or mixed-mesh helper.

`maxProjectedSplatsPerSegment` can tighten the per-segment limit explicitly. `renderer.stats`
reports original versus active rows, source/output segment counts, global sort capacity, exact
borrowed-source and renderer-owned GPU bytes, and one indirect draw per output segment. The
caller owns command submission and every source batch; destroy the renderer before releasing
source pages.

## Related pages

- [Gaussian splats overview](/docs/api-reference/splats)
- [Gaussian splat showcase](/examples/showcase/gaussian-splats)
- GPU scheduling
