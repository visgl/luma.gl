# Large worlds and batching

Large simulations have at least two distinct forms: many interacting bodies in one world, and many independent worlds. They have different scheduling and convergence costs. Independent worlds expose more parallel work without creating one enormous contact island.

## One large world[​](#one-large-world "Direct link to One large world")

Use the specialized sphere world for large sphere-only workloads. General rigid bodies use hierarchical discovery and sparse contact storage to avoid allocating all possible body pairs. Dense piles still create real contact work; broad-phase acceleration cannot remove those physical interactions.

Plan pair capacity, contact density, collider size distribution, mesh traversal and device buffer limits. A body-count target alone is not a memory or frame-time guarantee.

## Independent instances[​](#independent-instances "Direct link to Independent instances")

`GPUPhysicsBatch` manages independent rigid-body instances with bounded residency and submission groups. Leases identify active slots. Reuse slots and world allocations rather than reconstructing everything when new independent data arrives.

Homogeneous ensembles can share GPU scheduling and compatible packed geometry. They have explicit restrictions, including constraints on joints, CCD and triggers. Consult the [batching reference](https://luma.gl/next/docs/api-reference/graph/gpu-physics.md#large-and-independently-batched-worlds) before selecting a layout.

Batching independent instances does not implement collisions across streamed partitions. If bodies can cross a boundary and interact, ownership, broad-phase discovery and contacts must account for that interaction explicitly.

## Streaming and origins[​](#streaming-and-origins "Direct link to Streaming and origins")

Bound resident instances and in-flight submissions. Stream data into available slots and preserve ownership until GPU work and consumers finish. Backpressure is preferable to silently replacing state that a submitted frame still references.

Use local coordinates and explicit origin shifts to preserve float32 contact precision. Keep the application/world origin separate from local simulation state and update the render mapping consistently when rebasing. Large absolute coordinates can erase small separations even when broad-phase discovery still finds the pair.

## Measure latency and throughput separately[​](#measure-latency-and-throughput-separately "Direct link to Measure latency and throughput separately")

An interactive world needs low per-frame latency. An ensemble may prioritize completed world-steps per second. Report active/resident counts, group sizes, memory reuse, queue depth and p50/p95 latency alongside throughput. A faster batched total is not evidence that one tightly connected stack has become faster.

Try [Physics Batch Lab](https://luma.gl/next/examples/experimental/physics-batch) and read [Performance and qualification](https://luma.gl/next/docs/api-guide/physics/performance.md) for measurement guidance.
