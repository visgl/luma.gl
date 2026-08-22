# GPUIndexPickingTarget

[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scene-resource-groups.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-index-picking-target.md)

## Overview[​](#overview "Direct link to Overview")

`GPUIndexPickingTarget` declares fixed-size WebGPU attachments for integer object picking. It can copy one pixel or reduce a rectangular region into capacity-bounded GPU storage. It does not render, submit, map buffers, choose selection semantics, manage highlight state, or own UI.

## At a glance

| Question                 | Answer                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Problem**              | Capture integer object identities and resolve a pixel or bounded rectangle selection.                       |
| **Reads / writes**       | Receives renderer-written integer attachments; copies or reduces into bounded picking storage.              |
| **Ownership**            | The target owns attachments; the application owns rendering, request state, readback, and highlight policy. |
| **Output contract**      | One pixel identity or a capacity-bounded region of identities and counts.                                   |
| **Expected work**        | One picking render plus a small copy or region reduction.                                                   |
| **Chunks**               | Picking preserves the canonical IDs encoded by the renderer.                                                |
| **Conditions / budgets** | Pairs with a readback ring and generation checks; it does not submit or map automatically.                  |
| **Neighborhood**         | rendered IDs → GPUIndexPickingTarget → GPUReadbackRing → hover/selection uniform.                           |

**Cost**Latency includes render, copy, queue completion, and mapping.

**Common mistake**Do not allow an older asynchronous pick result to overwrite a newer pointer generation.

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

Use [`GPUReadbackRing`](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-readback-ring.md) to move the small packed result to the CPU without allocating or remapping the same staging buffer every frame.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

### Subgroup acceleration[​](#subgroup-acceleration "Direct link to Subgroup acceleration")

When the device exposes WebGPU subgroups, valid region hits in each subgroup reserve one contiguous result block with a single global atomic operation. Each hit still publishes one object/batch pair, the total count and overflow contract are unchanged, and output order remains unspecified. Devices without subgroup support use the portable per-hit atomic append path automatically.
