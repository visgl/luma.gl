# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl. This package owns prepared GPU splat
data, anisotropic Gaussian rendering, and backend-specific render models without depending on
Apache Arrow, loaders.gl, or deck.gl.

The package is a private luma.gl workspace and is not published to npm. Install dependencies from
the repository root and reference it from another workspace with `"@luma.gl/splats": "workspace:*"`.

## Usage

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

// Destroy borrowing renderers before destroying caller-owned prepared data.
renderer.destroy();
splatData.destroy();
nextSplatBatch.destroy();
```

`GPUSplatData` is caller-owned prepared data. Renderers borrow source buffers and release only their
own models and temporary resources. Streaming retains source batch boundaries instead of
concatenating or reuploading previously prepared batches.

Source colors can use normalized `Uint8Array` RGBA or linear `Float32Array` RGBA. Floating-point
colors preserve high-dynamic-range radiance without premature clamping or quantization. The
renderer automatically applies Reinhard highlight compression on standard dynamic range targets,
preserves extended WebGPU presentation output, and supports explicit `exposure` and `toneMapping`
controls.

## WebGPU command-graph rendering

`GPUSplatGraphRenderer` is a WebGPU-only alternative for large captured scenes. Its compiled GPU
command graph projects and culls each borrowed source batch, globally sorts camera-dependent depth
keys, and renders every visible Gaussian with one GPU-driven indirect draw:

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
  renderer.encode(commandEncoder);
  webgpuDevice.submit(commandEncoder.finish());
}

// Source batches belong to their caller and must outlive the borrowing renderer.
renderer.destroy();
for (const batch of preparedBatches) {
  batch.destroy();
}
```

The example reserves room for the complete 741,883-splat Train scene and its twelve Arrow batches.
The first nonempty batch compiles the graph and renders immediately; later batches replace their
reserved source bindings without replacing the graph. The resulting pipeline is:

```text
Caller-owned, independently allocated batches       One compiled GPU command graph

batch 0: five original GPU columns --------+
batch 1: five original GPU columns --------+--> reusable imported source slots
batch N: five original GPU columns --------+              |
                                                          v
initialize every reserved row ---------------> project and cull populated slots
identity indices + invalid depth keys           per-slot uniforms + 48-byte records
reset indirect visible count                              |
                                                          +--> global 16-bit radix sort --+
                                                          |                              |
                                                          +--> atomic visible count -----+
                                                                                         |
                                                                                         v
                                                                                one indirect draw
```

### Source batches and reusable graph slots

Parsing remains outside this package: `@loaders.gl/splats` recognizes file formats, `@luma.gl/arrow`
converts individual Apache Arrow record batches to `GPUSplatData`, and this renderer consumes the
resulting framework-neutral GPU objects. Source batches stay separate and retain their original
buffer allocations throughout loading, rendering, capacity growth, and destruction.

Each reserved graph slot represents exactly one source batch and imports five columns: positions,
scales, rotations, colors, and opacities. Graph topology is immutable after compilation, so every
slot initially has five distinct, renderer-owned placeholder buffers. Their minimum sizes are 12,
12, 16, 4, and 4 bytes respectively. At encoding time, populated slots override those imported
buffers with the original caller-owned allocations; unpopulated slots keep their harmless
placeholders and do not dispatch projection work. This changes bindings, not graph topology, and
never concatenates, repacks, copies, or reuploads existing source data.

A separate 128-byte uniform buffer per slot carries the camera transform, viewport, Gaussian
styling, batch offset, active row count, color format, exposure, and tone-mapping mode. Updating
these uniforms costs work proportional to the reserved batch-slot count, not the splat-row count.

### GPU execution phases

Each necessary `encode(commandEncoder)` records the following dependent graph operations into the
caller's command encoder. The caller still owns submission; no intermediate submissions or
synchronous GPU readbacks are required.

1. **Initialize reserved rows.** A compute pass writes stable identity indices across the entire
   reserved row capacity, initializes every depth key to the invalid sentinel `65,535`, and resets
   the indirect draw's visible-instance count to zero. Unfilled capacity therefore cannot be drawn.

2. **Project and cull active batches.** One compute node per reserved slot processes its source
   only when that slot contains a nonempty batch. Visible anisotropic Gaussians produce 48-byte
   camera-dependent records containing clip position, screen-space axes, and linear RGBA radiance.
   Invalid, clipped, transparent, or otherwise culled rows keep their sentinel keys. Valid rows
   receive far-to-near keys in the range `0` through `65,534`, and each increments the indirect
   visible-instance count atomically. Packed `Uint8Array` colors and floating-point HDR colors can
   coexist in different batches.

3. **Globally sort depth keys.** `GPUSort` performs a stable ascending radix sort using only the 16
   meaningful depth-key bits. Its values are global projected-record indices, so transparent
   Gaussians from different source batches share one correct back-to-front order. The maximum
   sentinel sorts culled and inactive rows after every visible record.

4. **Render once.** One graph-native indirect render pass consumes sorted projected-record indices
   and the GPU-written visible count. The fragment shader expands and blends anisotropic Gaussian
   quads, preserving source HDR radiance until exposure and display-appropriate tone mapping are
   applied. No source-batch rebinding or one-draw-per-batch ordering is required in this pass.

### Progressive capacity and graph lifetime

`expectedSplatCount` and `expectedBatchCount` are optional, positive-integer capacity hints. When
the complete source metadata is known, supplying both reserves the final row and batch-slot
capacities up front. The first nonempty `encode()` compiles one graph; appending any batch that
fits both capacities reuses the same `renderer.compiledGraph` object and only updates its imported
source bindings and uniforms.

Unknown or underestimated dimensions remain valid:

- Without a row hint, the initial capacity is at least four times the first nonempty batch size;
  without a batch hint, at least four source slots are reserved.
- If incoming rows or batch slots exceed their current capacity, the corresponding capacity
  doubles until it can accommodate the accumulated stream. A new graph is compiled only at that
  growth boundary; subsequent fitting batches reuse it.
- `renderer.capacity` exposes the current allocated row and slot counts, while `renderer.stats`
  reports actual loaded rows, actual loaded batches, and source-versus-renderer GPU memory.
- Appending a batch or changing camera/style properties marks the graph dirty. Once the stream and
  camera are stationary, another `encode()` returns `undefined` instead of repeating projection,
  sorting, and drawing.

The lifecycle is therefore: no source rows means no graph; the first nonempty batch compiles and
renders immediately; fitting batches stream through the same graph; capacity overflow occasionally
recompiles; and a stationary completed scene performs no repeated GPU work. Replacing the entire
source list with `setProps({data})` invalidates the old graph without destroying either the old or
new caller-owned batches.

### Ownership, precision, and performance tradeoffs

`GPUSplatData` and all original source-column allocations remain caller-owned and must outlive the
renderer. The renderer owns only derived projected records, depth keys, source indices, sorted
keys/indices, radix-sort scratch, uniform buffers, slot placeholders, the indirect command, and its
graph/model resources. Call `renderer.destroy()` before destroying the prepared source batches.

The baseline persistent working buffers require 64 bytes per reserved row: 48 bytes for each
projected record and four 4-byte key/index arrays. Reserving the complete 741,883-splat Train scene
therefore uses approximately 45.28 MiB before graph scratch, per-slot uniforms/placeholders, and
the separately owned source columns. `renderer.stats` and `renderer.graphStats` expose the actual
allocation and scheduling diagnostics without reading back source rows or visible counts.

The fixed-topology radix sort currently processes the **entire reserved row capacity on every dirty
frame**, even while only the first streamed batch is populated. Exact final-size hints eliminate
recompilation and improve CPU responsiveness, but front-load GPU memory and full-scene sorting
work; unknown-size geometric growth trades occasional recompilation for less initially reserved
capacity. Sixteen-bit keys reduce radix work but provide finite depth-ordering precision; the sort
is stable when rows quantize to the same key.

Projected records also must fit the adapter's `maxStorageBufferBindingSize`. For the common 128 MiB
binding limit, the 48-byte stride permits at most 2,796,202 projected rows in one graph; actual
available GPU memory or other implementation limits may lower that practical ceiling. Applications
should retain their existing fallback policy when an adapter cannot allocate the requested scene.

`GPUSplatGraphRenderer` requires WebGPU. Continue to use `SplatRenderer` for WebGL2 devices or for
explicit CPU-ordered comparison; both renderers preserve caller ownership and original source-batch
boundaries. Keep deck.gl-specific layers in downstream adapters instead of introducing framework
or file-format dependencies into `@luma.gl/splats`.
