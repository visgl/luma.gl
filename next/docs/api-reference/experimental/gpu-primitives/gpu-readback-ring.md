# GPUReadbackRing

[Guide](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives.md)[Command Graph](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-command-graph.md)[Scan](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scan.md)[Compaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-compaction.md)[Masks](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-mask.md)[Visibility](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow.md)[Virtual Geometry](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection.md)[Hierarchy](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout.md)[Traversal](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal.md)[Ancestors](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection.md)[Sort](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-sort.md)[FFT 2D](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-fft2d.md)[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-reduction.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-histogram.md)[Grid Binning](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning.md)[Grid Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation.md)[Grid Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index.md)[Grid Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query.md)[Point Filter](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter.md)[BVH](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh.md)[BVH Query](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query.md)[Spatial Benchmark](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark.md)[Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene.md)[Scene Adapters](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters.md)[Scene Draws](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation.md)[Scene Groups](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups.md)[Trace Scene](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene.md)[Trace Interaction](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction.md)[Trace Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation.md)[Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-index.md)[Batch Hash Index](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index.md)[Hash Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-hash-join.md)[Batch Join](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join.md)[Picking](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target.md)[Readback Ring](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring.md)[Indirect Draw](https://luma.gl/next/docs/api-reference/experimental/gpu-primitives/draw-command-buffer.md)

## Overview[​](#overview "Direct link to Overview")

`GPUReadbackRing` reuses a fixed number of `COPY_DST | MAP_READ` staging buffers for asynchronous GPU results. Each `GPUReadbackTicket` owns one slot from reservation through mapping, preventing an in-flight or mapped buffer from being overwritten by a later frame.

Readback is useful but easy to accidentally serialize: allocating every frame adds churn, while reusing one buffer forces the renderer to wait for mapping before encoding the next result. A small ring lets rendering continue while older picks, counters, timestamps, or analysis summaries cross the GPU/CPU boundary.

## Concepts[​](#concepts "Direct link to Concepts")

The ring separates three responsibilities:

1. The ring owns staging allocations and slot availability.
2. A ticket records or represents one copy and owns that slot until mapping settles.
3. The application owns command submission and decides whether pressure means drop or wait.

Use a ring for small answers that the CPU genuinely needs: hover picks, selection summaries, timestamps, validation counters, exported analysis values, or occasional screenshots copied through a bounded staging path. Interactive results often prefer `tryAcquire()` and dropping stale work; exports and diagnostics commonly prefer `acquire()` and waiting for capacity.

Do not read back data merely to feed the next GPU pass—keep that dependency in a command graph instead. A ring hides neither transfer latency nor bandwidth: it makes several in-flight transfers safe and makes overload policy explicit.

```
const ring = new GPUReadbackRing(device, {

  byteLength: resultBuffer.byteLength,

  slotCount: 3

});



const ticket = ring.tryAcquire();

if (ticket) {

  ticket.copyFrom(commandEncoder, resultBuffer);

  device.submit(commandEncoder.finish());

  const bytes = await ticket.read();

}
```

`tryAcquire()` returns `null` when all slots are busy, making frame-dropping backpressure explicit. `acquire()` instead returns a promise for the next completed slot; call it before constructing work whose encoder must remain current. Neither method submits commands or silently blocks encoding.

### Command graphs and texture copies[​](#command-graphs-and-texture-copies "Direct link to Command graphs and texture copies")

A graph can import `ticket.buffer` as a per-encoding buffer override. After the graph records its copy, call `markEncoded()` so the ticket can enforce its lifecycle:

```
const ticket = ring.tryAcquire();

if (ticket) {

  compiled.encode(commandEncoder, {

    parameters,

    buffers: {[readbackHandle.id]: ticket.buffer}

  });

  ticket.markEncoded({byteLength: 8});

  device.submit(commandEncoder.finish());

  const pick = decodeGPUIndexPickInfo(await ticket.read());

}
```

### Backpressure, cancellation, and loss[​](#backpressure-cancellation-and-loss "Direct link to Backpressure, cancellation, and loss")

An unused reservation can be cancelled immediately. Once a copy is encoded, its destination cannot be reused safely until GPU work and mapping finish. Start `read()` before cancelling an encoded ticket; cancellation then discards the value while the internal completion path releases the slot.

Mapping failures, including device loss, release active tickets before propagating the error. Destroying the ring rejects queued waiters and destroys idle buffers immediately; active buffers are destroyed when their ticket settles. This keeps resource lifetime observable without allowing use-after-map or use-after-destroy shortcuts.

`availableSlotCount` exposes current immediate capacity. It is intentionally a scheduling signal, not a completion callback: applications still decide how frequently to request results and whether stale interaction data should be discarded.
