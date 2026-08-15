import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUFFT1D

<GPUPrimitivesDocsTabs active="fft1d" />

## Overview

`GPUFFT1D` adds forward or inverse complex-to-complex radix-2 transforms to a
`GPUCommandGraph`. Batched transforms are first-class: each batch occupies one tightly packed,
independent run of complex values. Every stage remains GPU-resident, and the primitive does not
compile the graph, submit commands, or read values back.

The implementation shares bounded radix-2 planning, bit reversal, and complex arithmetic with
`GPUFFT2D`. It contributes one bit-reversal node and one butterfly node per stage, ping-ponging
through one graph-owned transient scratch view whose allocation is visible in graph statistics.

## When to use

Use `GPUFFT1D` when complex signals already live in GPU buffers, when many equal-length transforms
can be batched, or when the result feeds another command-graph operation without CPU readback.
It is also the reusable building block for separable multidimensional FFT algorithms. For short,
one-off signals that originate and finish on the CPU, transfer and dispatch overhead can outweigh
GPU execution; a CPU FFT is usually the simpler choice.

## Usage

Each complex value is one packed `GraphDataView<'float32x2'>` row: real followed by imaginary.

```ts
import {GPUFFT1D} from '@luma.gl/experimental';

new GPUFFT1D({
  id: 'spectrum',
  input,
  output,
  length: 1024,
  batchCount: 16,
  direction: 'forward'
}).addToGraph(graph);
```

`length` is the number of complex values in each transform and must be a power of two from 2
through 2048. `batchCount` defaults to one. Input and output must each contain at least
`length * batchCount` packed rows, use separate graph buffers, and belong to the graph passed to
`addToGraph()`.

The initial layout is deliberately narrow: batches are tightly packed, and values inside each
batch have no padding. Strided and interleaved batches remain future extensions.

## Direction and normalization

- `forward` uses a negative complex exponent and no normalization.
- `inverse` uses a positive complex exponent and divides the final stage by `length`.

Composing a forward transform with an inverse transform in one graph reconstructs the original
input without an intermediate submission or CPU synchronization.

## Subgroup strategy

`strategy` may be `auto`, `portable`, or `subgroups`. The default `auto` path selects subgroup
butterflies only when the WebGPU device exposes the `subgroups` feature and reports a usable
subgroup size. `portable` is useful for reproducible comparisons. Explicit `subgroups` rejects a
device that cannot support it.

Eligible early butterfly stages exchange partners with `subgroupShuffleXor`, reducing storage
reads. Later stages continue through the portable storage-buffer path when their butterfly span
exceeds the device's minimum subgroup size. The shader also checks the relationship between local
and subgroup invocation IDs and falls back to ordinary reads if a device uses an unexpected lane
mapping.

`getGPUFFT1DSupport(device, props)` reports the selected strategy and the number of subgroup-
eligible stages alongside buffer, workgroup, and bounded-dispatch checks.

## Statistics and resource ownership

`fft.stats` and `makeGPUFFT1DStats(length, batchCount)` expose element and byte counts, radix-2
stage and pass counts, the 256-invocation workgroup size, and the one-field scratch requirement.
The scratch view is allocated by the command graph, so compatible disjoint FFT lifetimes may alias
one physical transient buffer. Input and output storage remain caller-owned.

## Performance notes

Work grows as `batchCount * length * log2(length)`. Global storage traffic usually dominates for
long transforms because every stage reads and writes the full complex field. Larger batch counts
improve occupancy by exposing more independent transforms, especially when `length` is much
smaller than the 256-invocation workgroup.

Subgroup shuffles help most on the earliest stages, where both butterfly partners fit inside one
subgroup. They remove the second global read for eligible butterflies but do not reduce the number
of stage dispatches or writes, so the benefit becomes a smaller fraction of runtime as transforms
grow. Device subgroup width, batch alignment, storage bandwidth, and pipeline scheduling determine
the actual crossover; use explicit `portable` and `subgroups` strategies when benchmarking.

`runGPUFFT1DBenchmark(device, options)` correctness-gates an impulse transform and reports CPU
encode and available GPU timestamp distributions for both paths. Vary `length` and `batchCount`
across representative workloads; a single large transform and many short transforms stress
different occupancy and scheduling limits.

## Current limits

- WebGPU only; no WebGL fallback.
- Complex `float32x2` data only.
- Power-of-two lengths from 2 through 2048.
- Tightly packed batches and out-of-place input/output only.
- No hidden padding, real-input packing, submission, or readback.
