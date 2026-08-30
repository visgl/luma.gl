---
title: Reason about GPU memory
description: Understand allocation, transfer, synchronization, readback, and residency before choosing buffer and texture workflows.
---

import {GpuMemoryDocsTabs} from '@site/src/components/docs/gpu-memory-docs-tabs';

# Reason about GPU memory

<GpuMemoryDocsTabs active="gpu-memory" />

## Outcome

Performance depends less on whether a value is in a buffer or texture than on **where it lives,
how often it moves, and which processor must wait for it**. Keep durable data and intermediate
results GPU-resident, update only what changed, and read back only results JavaScript must use.

Use [buffers](/docs/api-guide/gpu/gpu-buffers) for linear data and
[textures](/docs/api-guide/gpu/gpu-textures) for sampled, renderable, or image-shaped data.
[Memory layouts](/docs/api-guide/gpu/gpu-memory-layouts) explains how values are arranged inside
those allocations.

## Mental model

The CPU records work faster and independently from the GPU that executes it. Data transfer and
completion therefore have two separate questions:

1. **When is the data copied or mapped?**
2. **Which earlier GPU work must complete before the copy, map, or read is valid?**

```text
CPU data ──upload──→ GPU resource ──GPU operations──→ GPU result
    ↑                                                    │
    └──────────── deliberate asynchronous readback ──────┘
```

Discrete GPUs often have physically separate memory; integrated GPUs may share physical memory
with the CPU. The API still preserves GPU ownership and ordering rules. Unified memory can reduce
transfer cost, but it does not make synchronization or resource usage disappear.

## Allocate for the durable contract

Choose a resource from its long-lived requirements:

- byte length or texture dimensions;
- format and element layout;
- every binding, copy, render, or storage usage it will need;
- update frequency and expected lifetime;
- device size and binding limits.

Reuse the allocation for contents-only changes. Recreate it when the structural contract changes,
such as a larger capacity, different format, or missing usage.

## Upload without stalling the frame

Small or infrequent updates can use resource write helpers. When an upload must be ordered with
other GPU operations, encode it with the same command sequence. Large streaming workloads should
use bounded batches so JavaScript preparation, temporary allocations, and queue work do not arrive
as one large spike.

Avoid keeping unnecessary full-size CPU and GPU copies indefinitely. Preserve CPU data when the
application needs recovery, editing, or another consumer; otherwise release staging data after a
safe upload boundary.

## Keep intermediate results GPU-resident

If one GPU operation produces data for another, bind or copy that result directly on the GPU.
Reading the value into JavaScript merely to decide a following dispatch or draw introduces an
avoidable round trip. WebGPU indirect dispatch and drawing are particularly useful for consuming
GPU-produced counts without CPU synchronization.

## Read back deliberately

Readback has both latency and ordering cost. The CPU cannot receive a valid result until all GPU
work that writes the requested range has completed.

- Prefer asynchronous reads.
- Read compact summaries rather than source-sized buffers.
- Allow only a bounded number of readbacks in flight.
- Associate each result with a generation so stale asynchronous output cannot overwrite newer
  state.
- Do not block a render path merely to update optional telemetry.

WebGL 2 readback is more constrained and may perform a synchronous GPU read internally even when
luma.gl exposes an asynchronous-compatible surface. Design performance-sensitive WebGL paths with
that limitation in mind.

## Decisions and tradeoffs

| Question | Prefer |
| --- | --- |
| Does the CPU need the result? | Keep it GPU-resident unless JavaScript must consume it. |
| Does only the contents change? | Update the existing allocation. |
| Must transfer order match compute or rendering? | Encode operations into one explicit command sequence. |
| Is the source much larger than the visible or analytical result? | Filter or aggregate on the GPU, then read back the bounded result. |
| Can a large upload monopolize startup? | Stream chunks and publish progress across bounded steps. |
| Is the resource temporary between graph stages? | Let GPU Core plan compatible transient reuse. |

## Common mistakes

- Assuming integrated GPU memory can be read by JavaScript without synchronization.
- Reallocating whole resources for small updates.
- Reading back source-sized data every frame.
- Allowing stale asynchronous readbacks to publish after the view or dataset changed.
- Ignoring `maxBufferSize`, binding-size, row-alignment, or texture-dimension limits.

## Next steps

- [GPU buffers](/docs/api-guide/gpu/gpu-buffers)
- [GPU textures](/docs/api-guide/gpu/gpu-textures)
- [GPU memory layouts](/docs/api-guide/gpu/gpu-memory-layouts)
- [Storage buffers](/docs/api-guide/gpu/gpu-storage-buffers)
- [Issuing GPU commands](/docs/api-guide/gpu/gpu-commands)
