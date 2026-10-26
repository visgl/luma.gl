import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUValueArena

<GPUCoreDocsTabs active="reduction" />

<GPUOperationContract operation="gpu-value-arena" />

## Overview

A `GPUCommandGraph` has one default `GPUValueArena` for small GPU-produced values. Algorithms declare logical values in a shared logical buffer; graph compilation materializes the transient storage.

The central invariant is:

> **Logical value count must not imply storage-binding count.**

## Why an arena?

Numerical and control algorithms produce many values that are logically scalars:

```text
rr      = r · r
pDotQ   = p · q
alpha   = rr / pDotQ
beta    = newRR / rr
active  = residual > tolerance
```

They must remain GPU-resident to avoid CPU synchronization. Giving every four-byte scalar its own storage buffer would waste one of WebGPU's limited storage-buffer bindings for each value.

Instead the graph packs them together:

```text
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

## Graph ownership

The normal API does not ask each algorithm to create or size an arena. Every contributor obtains the graph's shared arena:

```ts
const values = getGPUValueArena(graph);

const rr = values.allocate('cg-rr', 'float32');
const alpha = values.allocate('cg-alpha', 'float32');
const active = values.allocate('cg-active', 'uint32');
```

Repeated calls to `getGPUValueArena(graph)` return the same arena. Algorithms therefore contribute logical value requirements to one graph-wide packing problem rather than creating solver-, sorting-, or control-specific buffers.

## Allocation and capacity

The arena exposes a stable logical buffer handle immediately. Each allocation reserves a
four-byte slot; offsets remain stable for the graph lifetime. Graph compilation materializes
the physical transient storage. There is no `seal()` method.

The shared arena has 16 KiB of capacity (4096 values). Allocation rejects duplicate IDs,
unsupported formats, and exhausted capacity. `byteLength` reports used bytes;
`capacityByteLength` reports reserved bytes; `availableByteLength` reports remaining capacity.

Use `getView(slot)` for a one-row graph view. Bind the shared arena once per shader rather
than binding every scalar separately. A compiled graph owns the physical allocation; scalar
consumers borrow it.

## Current limits

Slots are not recycled or lifetime-packed. Each value uses one of `float32`, `uint32`, or
`sint32`; a logical scalar does not own a standalone GPU buffer.

## Related APIs

- [Arena materialization](/docs/api-reference/experimental/gpu-core/gpu-value-arena-finalization)
- [GPUScalar](/docs/api-reference/experimental/gpu-core/gpu-scalar)
- [Scalar operations](/docs/api-reference/experimental/gpu-core/gpu-scalar-operation)
