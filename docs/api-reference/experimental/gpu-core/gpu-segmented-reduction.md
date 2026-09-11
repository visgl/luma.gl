import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUSegmentedReduction

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUSegmentedReduction` computes one scalar aggregate for every contiguous segment in a packed GPU
vector. Segments are described by CSR-style offsets, making the primitive a natural consumer of
columnar list offsets, group boundaries, adjacency lists, and `GPUSegmentedLayout` output.

## Motivation

`GPUReduction` answers a global question such as “what is the sum of this column?”. Many GPU data
pipelines instead need the same aggregate independently for thousands of variable-length groups:
counts or totals per category, weights per graph vertex, statistics per Arrow list row, or one value
per spatial bucket. Downloading boundaries or values to JavaScript defeats the command graph's
GPU-resident dataflow.

Segmented reduction makes that operation a reusable graph primitive rather than requiring each
higher-level algorithm to grow another private reduction kernel.

## Contract

Given packed input values and offsets `[o0, o1, ... oN]`, output row `i` reduces the half-open range
`input[oi..o(i+1))`.

```ts
new GPUSegmentedReduction({
  input: values,
  segmentOffsets,
  output: segmentTotals,
  operation: 'sum'
}).addToGraph(graph);
```

The initial implementation accepts packed `uint32`, `sint32`, and `float32` scalar values and
supports `sum`, `min`, and `max`. `segmentOffsets.length` must equal `output.length + 1`.

Offsets are expected to be monotonically nondecreasing, begin within the input, and terminate no
later than `input.length`. Those semantic properties are normally guaranteed by the producer of the
offsets; the GPU primitive does not read them back for host validation.

Empty segments produce zero. This gives list/group pipelines a stable output row for every segment,
including segments with no values.

## Composition

A common grouped pipeline is:

```text
keys / boundaries
      ↓
segment offsets
      ↓
GPUSegmentedReduction
      ↓
one aggregate per group
```

`GPUSegmentedLayout` can materialize dense segment offsets from slot-aligned segment-start flags.
Those offsets can feed `GPUSegmentedReduction` directly. CSR graph adjacency offsets are another
natural source: reducing edge weights by adjacency segment produces one aggregate per vertex.

This primitive complements rather than replaces `GPUReduction`: use `GPUReduction` for one global
aggregate and `GPUSegmentedReduction` when the same operation must be applied independently to many
contiguous ranges.

## Performance notes

The first implementation assigns one 256-thread workgroup to each segment. Threads stride through
the segment and then perform a workgroup-tree reduction. This is efficient for many small and
medium variable-length segments and keeps scheduling simple and deterministic.

Very large or highly skewed segments may benefit from a future hierarchical strategy that assigns
multiple workgroups to one segment and merges partials. A future subgroup path can also reduce
workgroup barriers on devices exposing WebGPU subgroup operations. Those optimizations can preserve
the same graph contract.

The primitive performs no CPU readback and contributes one ordinary compute node to the command
graph. Inputs and outputs remain caller-owned GPU resources.
