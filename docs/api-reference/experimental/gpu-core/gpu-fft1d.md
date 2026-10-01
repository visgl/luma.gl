# GPUFFT1D

[Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-sort.md)[Segmented Sort](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-sort.md)[Transpose](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-transpose.md)[FFT 1D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft1d.md)[FFT 2D](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-fft2d.md)[Convolution](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-convolution.md)

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Compute one bounded out-of-place complex transform along packed rows.                                         |
| **Reads / writes**       | Reads complex row values; writes transformed values through graph-owned scratch.                              |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                  |
| **Output contract**      | Exact complex transform for each configured power-of-two row.                                                 |
| **Expected work**        | Bit reversal plus radix-2 butterfly stages per row.                                                           |
| **Chunks**               | Independent packed input/output chunks may split transforms; bounded scratch preserves caller storage.        |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | complex rows → GPUFFT1D → GPUFFT2D, filtering, or inverse transform.                                          |

**Cost**O(rows × width × log width) passes and bandwidth.

**Common mistake**Do not omit normalization or complex layout conventions when composing transforms.

## Overview[​](#overview "Direct link to Overview")

`GPUFFT1D` adds forward or inverse complex-to-complex radix-2 transforms to a `GPUCommandGraph`. Batched transforms are first-class: each batch occupies one tightly packed, independent run of complex values. Every stage remains GPU-resident, and the primitive does not compile the graph, submit commands, or read values back.

The implementation shares bounded radix-2 planning, bit reversal, and complex arithmetic with `GPUFFT2D`. Atomic views retain one bit-reversal node and one butterfly node per stage with one graph-owned scratch view. Chunked views run complete transforms in reusable scratch blocks.

## When to use[​](#when-to-use "Direct link to When to use")

Use `GPUFFT1D` when complex signals already live in GPU buffers, when many equal-length transforms can be batched, or when the result feeds another command-graph operation without CPU readback. It is also the reusable building block for separable multidimensional FFT algorithms. For short, one-off signals that originate and finish on the CPU, transfer and dispatch overhead can outweigh GPU execution; a CPU FFT is usually the simpler choice.

## Usage[​](#usage "Direct link to Usage")

Each complex value is one packed `float32x2` row: real followed by imaginary. Input and output accept either `GraphDataView<'float32x2'>` or `GraphVectorView<'float32x2'>`.

```
import {GPUFFT1D} from '@luma.gl/experimental';



graph.add(new GPUFFT1D({

  id: 'spectrum',

  input,

  output,

  length: 1024,

  batchCount: 16,

  direction: 'forward'

}));
```

`length` is the number of complex values in each transform and must be a power of two from 2 through 2048. `batchCount` defaults to one. Input and output must each contain at least `length * batchCount` packed rows, use separate graph buffers, and belong to the graph passed to `getCommandNodes()`.

## Physical chunks[​](#physical-chunks "Direct link to Physical chunks")

`batchCount` counts independent mathematical transforms. Physical chunks can split anywhere, including inside a transform, and input/output partitions can differ. Empty chunks, nonzero vec2-aligned byte offsets, and spare capacity are supported. Only the first `length * batchCount` rows are processed; output tails remain unchanged. Output chunks must not overlap. Each chunk is packed; strided and interleaved layouts remain future extensions.

The chunked path borrows source spans and bit-reverses them directly into algorithm scratch. It never concatenates caller buffers. One or two scratch buffers hold at most 4096 complex rows, reduced to a whole number of transforms that fits the device's buffer limits. The same scratch is reused across blocks, and the final butterfly writes directly to destination chunks. Atomic views exceeding a binding limit use this path too; each transform must fit in scratch.

## Direction and normalization[​](#direction-and-normalization "Direct link to Direction and normalization")

* `forward` uses a negative complex exponent and no normalization.
* `inverse` uses a positive complex exponent and divides the final stage by `length`.

Composing a forward transform with an inverse transform in one graph reconstructs the original input without an intermediate submission or CPU synchronization.

## Subgroup strategy[​](#subgroup-strategy "Direct link to Subgroup strategy")

`strategy` may be `auto`, `portable`, or `subgroups`. The default `auto` path selects subgroup butterflies only when the WebGPU device exposes the `subgroups` feature and reports a usable subgroup size. `portable` is useful for reproducible comparisons. Explicit `subgroups` rejects a device that cannot support it.

Eligible early butterfly stages exchange partners with `subgroupShuffleXor`, reducing storage reads. Later stages continue through the portable storage-buffer path when their butterfly span exceeds the device's minimum subgroup size. The shader also checks the relationship between local and subgroup invocation IDs and falls back to ordinary reads if a device uses an unexpected lane mapping. Cropped final-output passes use portable loads because a chunk boundary may exclude a shuffle partner; complete scratch stages remain eligible.

`getGPUFFT1DSupport(device, props)` reports the selected strategy and the number of subgroup- eligible stages alongside buffer, workgroup, and bounded-dispatch checks. Include `input` and `output` to check the actual chunked plan. Omitting them checks the contiguous-plan requirements.

## Statistics and resource ownership[​](#statistics-and-resource-ownership "Direct link to Statistics and resource ownership")

`fft.stats` and `makeGPUFFT1DStats(length, batchCount)` expose element and byte counts, radix-2 stage and pass counts, the 256-invocation workgroup size, and the contiguous plan's one-field scratch requirement. These are logical baseline statistics, not the chunk-lowered dispatch or allocation counts. Inspect the compiled graph for actual resource and node counts. Scratch is graph-owned, so disjoint lifetimes may alias physical transient buffers. Input and output storage remain caller-owned.

## Performance notes[​](#performance-notes "Direct link to Performance notes")

Work grows as `batchCount * length * log2(length)`. Global storage traffic usually dominates for long transforms because every stage reads and writes the full complex field. Larger batch counts improve occupancy by exposing more independent transforms, especially when `length` is much smaller than the 256-invocation workgroup.

Subgroup shuffles help most on the earliest stages, where both butterfly partners fit inside one subgroup. They remove the second global read for eligible butterflies but do not reduce the number of stage dispatches or writes, so the benefit becomes a smaller fraction of runtime as transforms grow. Device subgroup width, batch alignment, storage bandwidth, and pipeline scheduling determine the actual crossover; use explicit `portable` and `subgroups` strategies when benchmarking.

`runGPUFFT1DBenchmark(device, options)` correctness-gates an impulse transform and reports CPU encode and available GPU timestamp distributions for both paths. Vary `length` and `batchCount` across representative workloads; a single large transform and many short transforms stress different occupancy and scheduling limits.

Fragmentation adds source-reordering and destination passes. Planning currently scans chunk metadata for each scratch block; routing and crossover tuning remain performance work.

## Current limits[​](#current-limits "Direct link to Current limits")

* WebGPU only; no WebGL fallback.
* Complex `float32x2` data only.
* Power-of-two lengths from 2 through 2048.
* Tightly packed batches and out-of-place input/output only.
* No hidden padding, real-input packing, submission, or readback.
