# GPUIndexPickingTarget

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUIndexPickingTarget` declares fixed-size WebGPU attachments for integer object picking. It can copy one pixel or reduce a rectangular region into capacity-bounded GPU storage. It does not render, submit, map buffers, choose selection semantics, manage highlight state, or own UI.

## Concepts[​](#concepts "Direct link to Concepts")

GPU picking renders stable object identity into an integer attachment alongside ordinary color and depth. Copying one device pixel to a mapped staging buffer reveals the front-most object and batch at that coordinate. Keeping identity separate from display color avoids color-space ambiguity and lets the same source IDs flow through visibility, rendering, and interaction.

A single pixel answers “what is under the pointer?” A region answers “which rendered fragments are inside this brush or lasso bound?” on the GPU, without transferring the full picking attachment. This matters when a selection covers thousands of pixels but the application needs only stable identities and an honest indication that its chosen result capacity was too small.

### Choosing a picking path[​](#choosing-a-picking-path "Direct link to Choosing a picking path")

Use single-pixel picking for hover, click, tooltip, and context-menu interactions where only the front-most fragment at one device coordinate matters. Use region picking for rectangle selection, the bounding box of a lasso, coverage sampling, or other interactions where transferring the full attachment would dominate the useful result. A `GPUReadbackRing` keeps either small result from serializing later frames.

The region result preserves one entry per covered pixel, not one entry per object. That is useful for coverage ranking and lets applications choose their own deduplication policy, but its required capacity grows with selected screen area. Use a spatial index or application-specific selection kernel when selection semantics are based on world-space bounds, occluded objects, nearest distance, or unique object identity rather than rendered fragments.

```
const target = new GPUIndexPickingTarget(graph, {
  id: 'objects',
  width,
  height,
  readbackBuffer
});

graph.addRenderPass({
  id: 'render-picking',
  attachments: target.attachments,
  compile: () => ({
    getRenderPassProps: () => target.renderPassProps,
    encode: ({renderPass}) => pickingModel.draw(renderPass)
  })
});

target.addReadbackPass({
  after: 'render-picking',
  getPixel: parameters => parameters.pickPixel
});
```

The target uses `rgba8unorm`, `rg32sint`, and `depth24plus` attachments. The integer attachment stores `(objectIndex, batchIndex)` and clears both components to `-1`. Picking models therefore declare color formats `['rgba8unorm', 'rg32sint']`, depth format `depth24plus`, and write stable IDs to fragment location 1. The existing `indexPicking` shader module supplies this convention.

The readback buffer is exactly 256 bytes with `COPY_DST | MAP_READ`, matching WebGPU copy-row alignment. After the caller submits the encoder, read its first eight bytes and pass them to `decodeGPUIndexPickInfo()`. Supplying different `buffers` overrides while encoding permits concurrent requests without writing a mapped staging buffer.

Coordinates are integer WebGPU device pixels with a top-left origin. The helper validates them against its compiled extent. Recreate and recompile the target after a canvas resize.

Color fallback, submission, callbacks, highlighting, tooltips, and region selection semantics remain application policy. Staging reuse is available separately through `GPUReadbackRing`.

### Region results[​](#region-results "Direct link to Region results")

`addRegionPass()` reads a GPU-resident `[x, y, width, height]` rectangle and writes a packed result:

| Word | Meaning                          |
| ---- | -------------------------------- |
| 0    | Total non-background pixel count |
| 1    | Overflow flag (`0` or `1`)       |
| 2…   | Signed object/batch index pairs  |

```
target.addRegionPass({
  after: 'render-picking',
  region,
  result
});
```

The pair capacity is `floor((result.length - 2) / 2)`. A valid object may use batch index `-1` to represent no batch; `decodeGPUIndexPickRegion()` maps that sentinel to `null`, matching single-pixel picking. Counting continues after capacity is reached, so `decodeGPUIndexPickRegion()` reports both the total count and whether the stored prefix was truncated. Rectangle coordinates are clipped to the target extent; zero width or height produces an empty result.

One covered pixel produces one pair. Duplicates are deliberately preserved because pixel frequency can represent coverage, while deduplication would impose a particular selection policy and extra storage cost. Atomic append order is unspecified. Callers that need unique IDs, nearest objects, coverage ranking, toggle behavior, or deterministic ordering should compose those rules above this primitive.

Use [`GPUReadbackRing`](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md) to move the small packed result to the CPU without allocating or remapping the same staging buffer every frame.
