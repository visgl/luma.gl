# @luma.gl/experimental/lutrace

## Overview

`lutrace` provides optional GPU-resident execution-trace models, interactive timeline policies,
and trace-aware picking. It builds on the generic experimental command graph and scene primitives
without adding spans, processes, threads, or dependency links to their public APIs.

```ts
import {GPUCommandGraph} from '@luma.gl/experimental';
import {
  GPUTraceInteraction,
  GPUTraceScene,
  getGPUTracePickingShader
} from '@luma.gl/experimental/lutrace';
```

## Concepts

### Trace topology remains domain-specific

`GPUTraceScene` stores canonical span identity, timing, process/thread ownership, hierarchy
parents, explicit source partitions, dependency links, and bidirectional adjacency in GPU buffers.
It projects those rows into an ordinary `GPUScene` instead of adding trace-specific fields to the
generic renderer.

Use it for distributed service timelines, browser performance recordings, build-system schedules,
GPU captures, or scientific workflows whose operations need both hierarchy and cross-process
dependency relationships.

### Interaction policies reuse generic graph primitives

`GPUTraceInteraction` composes process/thread expansion, row layout, time and classification
filters, linked-span focus, visible-ancestor projection, stable compaction, and indirect scene
draws. Its control buffers remain caller-owned, so applications can change policies and encode the
same compiled graph without rebuilding CPU span lists or submitting work implicitly.

Generic hierarchy layout, graph traversal, visibility, scene storage, renderer resource groups,
and command scheduling remain available from `@luma.gl/experimental`.

### Trace picking preserves canonical identity

`getGPUTracePickingShader(spanCount, lanesPerThread)` produces a bounded compute shader that tests
only visible canonical spans against a requested timeline coordinate. It applies GPU-scanned
thread offsets, respects the caller's process/thread lane topology, and atomically publishes the
lowest matching source-row identity.

This helper is trace-specific; general-purpose picking targets, readback ownership, graph
encoding, and command submission remain outside the `lutrace` module.

The generated shader uses five group-zero storage bindings: packed canonical spans, scanned
thread offsets, the final visibility mask, a `{time, lane, active, padding}` request, and an atomic
result initialized to `0xffffffff`. Matching visible spans atomically publish their lowest
canonical source-row index, which can feed dependency selection without translating through a
compacted display position.

### Use cases and composition boundaries

- Service latency investigations: focus a slow request's upstream and downstream dependencies.
- Browser or GPU captures: collapse noisy processes while preserving stable operation identity.
- Build-system schedules: filter short tasks and inspect cross-worker critical-path relationships.
- Scientific workflows: retain explicit batch boundaries and cross-stage dependency topology.

Applications own command graphs, queue submission, rendering policy, interaction controls, and
readback. `GPUTraceScene` owns only its uploaded trace and projected scene allocations;
`GPUTraceInteraction` borrows caller-owned graph views and registers reusable passes.

See the [lutrace API reference](https://luma.gl/docs/api-reference/experimental/lutrace) for
complete usage examples and the live trace explorer.
