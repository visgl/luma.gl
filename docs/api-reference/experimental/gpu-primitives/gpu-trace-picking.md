import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';
import {GPUTraceSceneExample} from '@site/src/examples';

# GPU Trace Picking

<GPUPrimitivesDocsTabs active="trace-picking" />

## Overview

`getGPUTracePickingShader` generates a small WebGPU compute shader that resolves a timeline
coordinate into the lowest matching visible canonical span row. It belongs to the optional
[`@luma.gl/experimental/lutrace`](/docs/api-reference/experimental/lutrace) submodule because its
inputs understand execution-span timing, process/thread lane topology, hierarchy collapse, and
trace-specific visibility policies.

The motivating use case is a dense execution timeline whose visible rows move whenever a process
or thread expands. A generic screen-space object ID cannot recover the original timeline span
without knowing which canonical spans survived filtering and how their original thread lanes were
projected into the current display layout. The shader resolves those domain-specific details while
keeping dispatch, command submission, result ownership, and asynchronous readback application-owned.

Click a span in the live trace explorer, collapse one of its neighboring processes, and click the
updated row again. Picking follows the GPU-computed effective lane rather than the span's original
uncompacted position, and hidden spans cannot steal the visible selection.

<GPUTraceSceneExample embedded />

## Concepts

### Timeline coordinates are different from source identity

Every canonical span has a stable source row, an application object ID, an original timeline lane,
and a time interval. Display lanes are not stable: process/thread collapse changes exclusive-scanned
thread offsets, while filtering removes rows from visibility. The generated shader compares the
requested time and effective lane against canonical span data and publishes the original source row.

This distinction is important for overlapping spans. The shader uses `atomicMin` so competing
matches resolve deterministically to the lowest canonical row, not whichever GPU invocation happens
to complete first. Applications may translate that row to the stable application object ID through
`GPUTraceSceneView.objectIds` when updating their inspector or selection state.

### Picking consumes the existing interaction outputs

[`GPUTraceInteraction`](./gpu-trace-interaction) already produces exclusive-scanned thread offsets
and a source-aligned final visibility mask. The picking shader consumes those buffers directly; it
does not recompute hierarchy layout, traverse dependencies, or create its own filtering policy.

The effective lane is:

```text
threadOffsets[threadId] + originalLane % lanesPerThread
```

A source row is eligible only when the pick request is active, its final visibility-mask entry is
nonzero, its interval includes the requested time, and its effective lane contains the requested
vertical coordinate.

### The result is caller-owned and sentinel-based

Initialize the result buffer to `0xffffffff` before dispatch. Matching rows atomically minimize that
value to their canonical source index. An inactive request or a coordinate outside all visible spans
leaves the sentinel unchanged. Reinitialize the result before every independent request.

The generated entry point uses 256 invocations per workgroup. Dispatch enough workgroups to cover
the canonical source-row count; the shader bounds-checks the final partial workgroup automatically.
The application owns command-graph ordering, queue submission, staging-buffer reuse, readback, and
any UI synchronization.

## Usage

```ts
import {getGPUTracePickingShader} from '@luma.gl/experimental/lutrace';

const lanesPerThread = 4;
const source = getGPUTracePickingShader(trace.stats.spanCount, lanesPerThread);
const shader = device.createShader({stage: 'compute', source});
const workgroupCount = Math.ceil(trace.stats.spanCount / 256);
```

The caller binds the generated shader into its own compute pipeline. Queue the pick pass after
hierarchy and visibility generation so it observes the same effective rows that rendering uses.

## Storage-binding contract

All five bindings belong to bind group zero:

| Binding | Access | Contents |
| --- | --- | --- |
| 0 | Read-only storage | Packed eight-word canonical span records from `GPUTraceScene` |
| 1 | Read-only storage | Exclusive-scanned effective thread offsets from `GPUTraceInteraction` |
| 2 | Read-only storage | Source-aligned final visibility mask from `GPUTraceInteraction` |
| 3 | Read-only storage | Pick request: `time: f32`, `lane: f32`, `enabled: u32`, `padding: u32` |
| 4 | Read/write storage | One `atomic<u32>` result initialized to `0xffffffff` |

`spanCount` must be a nonnegative safe integer, and `lanesPerThread` must be a positive safe
integer. Both values specialize the generated WGSL; changing either requires generating a new
shader. Changing the request, expansion state, or visibility policy does not.

## Ownership and scope

The helper returns WGSL source only. It does not allocate resources, compile pipelines, import
buffers into a command graph, schedule dispatches, submit work, read results back, or destroy
caller-owned buffers.

General-purpose picking infrastructure remains independent from the trace domain. Use this helper
when a selection must interpret trace time, hierarchy-projected lanes, and canonical span identity;
use a renderer-specific picking target when object selection has no execution-timeline semantics.
