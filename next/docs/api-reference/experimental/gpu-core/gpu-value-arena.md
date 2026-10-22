# GPUValueArena

[Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-reduction.md)[Segmented Reduction](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-segmented-reduction.md)[RLE and Unique](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-run-length-encode.md)[Histogram](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-histogram.md)[Group Aggregation](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)

## At a glance

| Question                 | Answer                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Problem**              | Pack many small GPU-produced values into one graph-owned buffer.                     |
| **Reads / writes**       | Scalar operations read and write stable typed slots in the shared arena buffer.      |
| **Ownership**            | The command graph owns the arena buffer; GPUScalar objects borrow logical slots.     |
| **Output contract**      | Stable word-aligned offsets for float32, uint32, and sint32 logical values.          |
| **Expected work**        | Allocation is CPU-side graph construction; consumers contribute the GPU work.        |
| **Chunks**               | Not applicable; the arena stores individual fixed-width scalar slots.                |
| **Conditions / budgets** | The graph materializes the arena before compilation and owns its execution lifetime. |
| **Neighborhood**         | GPUScalar declarations → GPUValueArena → scalar, reduction, and control operations.  |

**Cost**One bounded storage buffer and four bytes per declared scalar.

**Common mistake**Do not allocate one physical buffer per logical scalar.

## Overview[​](#overview "Direct link to Overview")

A `GPUCommandGraph` has one default `GPUValueArena` for small GPU-produced values. Algorithms declare logical values in a shared logical buffer; graph compilation materializes the transient storage.

The central invariant is:

> **Logical value count must not imply storage-binding count.**

## Why an arena?[​](#why-an-arena "Direct link to Why an arena?")

Numerical and control algorithms produce many values that are logically scalars:

```
rr      = r · r

pDotQ   = p · q

alpha   = rr / pDotQ

beta    = newRR / rr

active  = residual > tolerance
```

They must remain GPU-resident to avoid CPU synchronization. Giving every four-byte scalar its own storage buffer would waste one of WebGPU's limited storage-buffer bindings for each value.

Instead the graph packs them together:

```
CG declares:       rr, pDotQ, alpha, beta

control declares:  active, iteration

other nodes:       counters / small state

                         │

                         ▼

                  graph value arena

                         │

                         ▼

              one storage-buffer binding
```

## Graph ownership[​](#graph-ownership "Direct link to Graph ownership")

The normal API does not ask each algorithm to create or size an arena. Every contributor obtains the graph's shared arena:

```
const values = getGPUValueArena(graph);



const rr = values.allocate('cg-rr', 'float32');

const alpha = values.allocate('cg-alpha', 'float32');

const active = values.allocate('cg-active', 'uint32');
```

Repeated calls to `getGPUValueArena(graph)` return the same arena. Algorithms therefore contribute logical value requirements to one graph-wide packing problem rather than creating solver-, sorting-, or control-specific buffers.

## Allocation and capacity[​](#allocation-and-capacity "Direct link to Allocation and capacity")

The arena exposes a stable logical buffer handle immediately. Each allocation reserves a four-byte slot; offsets remain stable for the graph lifetime. Graph compilation materializes the physical transient storage. There is no `seal()` method.

The shared arena has 16 KiB of capacity (4096 values). Allocation rejects duplicate IDs, unsupported formats, and exhausted capacity. `byteLength` reports used bytes; `capacityByteLength` reports reserved bytes; `availableByteLength` reports remaining capacity.

Use `getView(slot)` for a one-row graph view. Bind the shared arena once per shader rather than binding every scalar separately. A compiled graph owns the physical allocation; scalar consumers borrow it.

## Current limits[​](#current-limits "Direct link to Current limits")

Slots are not recycled or lifetime-packed. Each value uses one of `float32`, `uint32`, or `sint32`; a logical scalar does not own a standalone GPU buffer.

## Related APIs[​](#related-apis "Direct link to Related APIs")

* [Arena materialization](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-value-arena-finalization.md)
* [GPUScalar](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scalar.md)
* [Scalar operations](https://luma.gl/next/docs/api-reference/experimental/gpu-core/gpu-scalar-operation.md)
