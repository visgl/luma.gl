import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';
import {GPUOperationContract} from '@site/src/components/docs/gpu-operation-contract';

# GPUTranspose

<GPUCoreDocsTabs active="transpose" />

<GPUOperationContract operation="gpu-transpose" />

## Overview

`GPUTranspose` adds an out-of-place two-dimensional matrix transpose to a `GPUCommandGraph`.
It operates directly on packed graph data views, supports rectangular matrices and partial edge
tiles, and does not compile, submit, or read data back by itself.

The implementation moves 16-by-16 tiles through workgroup memory. The tile has one padded column
to reduce workgroup-memory bank conflicts, and both reads and writes remain coalesced. This makes
the primitive useful as a data-layout building block for multidimensional FFTs, tensor-like
algorithms, and tiled numerical kernels without introducing a tensor abstraction.

## When to use

Use `GPUTranspose` when a row-major GPU field must change axis order and the transposed result feeds
another GPU operation, especially for rectangular FFT stages or tiled numerical pipelines. It is
most useful when it avoids CPU readback or makes later memory access coalesced. For tiny matrices,
one-off CPU data, or consumers that can read the original strided layout efficiently, a separate
GPU transpose pass may cost more than it saves.

## Usage

```ts
import {GPUTranspose} from '@luma.gl/experimental';

new GPUTranspose({
  id: 'transpose-points',
  input,
  output,
  rows: 480,
  columns: 640
}).addToGraph(graph);
```

`input` and `output` must be packed, four-byte-aligned `GraphDataView` values with the same scalar
format. Supported formats are `float32`, `sint32`, and `uint32`. Each view must contain at least
`rows * columns` rows, and the source and destination must use separate graph buffers.

The input uses row-major indexing `input[row * columns + column]`. The output has shape
`columns` by `rows` and uses `output[column * rows + row]`.

## Empty matrices

`rows` and `columns` are non-negative integers. When either is zero, the transpose contributes no
graph node and allocates no transient resources. Non-empty dimensions do not need to be multiples
of 16; bounds checks handle every partial tile.

## Graph and ownership contract

Both views must belong to the graph passed to `addToGraph()`. The primitive contributes one compute
node that declares the input as storage-read and the output as storage-write. It uses no transient
buffers and performs no hidden copies. Compilation, physical resource resolution, command
encoding, submission, and optional readback stay with the graph and caller.

## Statistics and limits

`transpose.stats` and `makeGPUTransposeStats(rows, columns)` expose the logical element count,
tile grid, tile count, and fixed `[16, 16, 1]` workgroup size. The graph maps the tile count across
WebGPU's bounded three-dimensional dispatch space. The device must support 256 invocations per
workgroup and workgroup dimensions of at least 16 by 16.

The matrix element count must fit a `uint32` index range. Logical view capacity and the graph's
buffer descriptors apply their own byte-size and device-limit checks.

## Performance notes

Transpose is normally limited by global-memory bandwidth: every element is read once and written
once, with little arithmetic to hide memory latency. The 16-by-16 tile turns the otherwise strided
destination traffic into coalesced writes, while its padded workgroup-memory row reduces bank
conflicts. Matrices whose dimensions are multiples of 16 use every invocation; narrow matrices and
partial edge tiles spend some lanes only on synchronization and bounds checks.

Subgroups do not remove the need for a cross-row data reorder before coalesced writes, and subgroup
matrix shapes vary between devices. The portable workgroup tile is therefore the primary path. A
future device-specific subgroup specialization would need to beat the padded tile in the benchmark
before becoming an automatic strategy.

### Performance measurement

`runGPUTransposeBenchmark(device, props)` correctness-gates and compares the tiled implementation
against a simple one-invocation-per-element reference path. It reports CPU encoding distributions
and GPU timestamp distributions when the device exposes `timestamp-query`. Defaults exercise a
2048-by-2048 matrix; `rows`, `columns`, warmup iterations, and measured iterations are configurable.

The benchmark performs explicit readback for its correctness gate. `GPUTranspose` itself remains
free of CPU synchronization. Its node workload metadata also reports the exact logical bytes read
and written and the maximum tile and invocation counts for application-level profiling.
