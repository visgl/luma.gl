import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUMatMul

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUMatMul` multiplies two dense row-major `float32` matrices using a tiled WebGPU compute kernel and contributes the work to a `GPUCommandGraph`.

## Motivation

Matrix multiplication is a foundational dense-compute primitive, but unlike simple elementwise arithmetic it is only useful as infrastructure if the implementation reuses data effectively. A naive kernel reloads matrix values from storage for each output element and leaves much of the GPU's arithmetic capability waiting on memory.

`GPUMatMul` therefore starts with workgroup tiling rather than a serial correctness kernel. It establishes a graph-native GEMM substrate for numerical transforms, batched scientific workloads and future compute pipelines while leaving room for device-specific optimization.

## Contract

The first API deliberately uses explicit dimensions rather than introducing a tensor framework. `left` is a packed row-major MxK `float32` matrix, `right` is a packed row-major KxN matrix, and `output` is a caller-owned packed row-major MxN matrix.

```ts
new GPUMatMul({
  left: a,
  right: b,
  output: c,
  m: 1024,
  k: 512,
  n: 1024
}).addToGraph(graph);
```

The mathematical operation is `C[M,N] = A[M,K] * B[K,N]`. Input and output buffers remain GPU-resident and caller-owned. Output aliasing with either input is rejected.

## Execution strategy

The baseline kernel uses 16x16 workgroups. Each workgroup computes one 16x16 output tile. For every 16-wide slice of K, lanes cooperatively load one tile from A and one from B into workgroup memory, synchronize, accumulate products from the shared tiles, then advance to the next K tile.

```text
A tile 16x16 ─┐
              ├─ workgroup memory ─ multiply/accumulate ─ C tile 16x16
B tile 16x16 ─┘
```

Out-of-range lanes on edge tiles contribute zero, so M, K and N do not need to be multiples of 16.

## Composition

Dense matrix multiplication extends the numerical layer established by `GPUElementwise` and `GPUMatVec`:

```text
GPUElementwise ─┐
GPUMatVec       ├─ dense numerical substrate
GPUMatMul       ┘
        ↓
transforms / solvers / simulation / data analysis
```

Higher-level operations should compose these primitives rather than embedding private matrix kernels when the standard layout and semantics are sufficient.

## Performance notes

A fixed 16x16 tile is a portable baseline, not a claim of universally optimal GEMM performance. Competitive matrix multiplication is highly device-sensitive. Tile dimensions, per-thread output blocking, vectorized loads, workgroup-memory bank behavior, register pressure and matrix aspect ratio all affect throughput.

The command graph already has device/workload inspection and autotuning concepts, making GEMM an attractive future strategy-selection workload. Candidate kernels can include 8x8, 16x16 and asymmetric tiles, multiple output elements per invocation, subgroup-assisted variants and specialized small-matrix paths.

Benchmarks should report dimensions and shape classes rather than one square-matrix number. Important cases include square matrices, tall/skinny matrices, short K, and sizes that do not align to tile boundaries.

## Limitations and roadmap

The initial API supports packed row-major `float32` only. It does not yet expose transpose flags, batching, strided matrices, `float16`, mixed accumulation precision, bias/activation fusion or arbitrary matrix views.

Likely follow-ups are benchmark coverage, device strategy selection, `float16` variants where supported, batched matmul, and explicit layout/transpose support driven by real workloads. Sparse matrix multiplication belongs in a separate sparse substrate rather than complicating this dense primitive.

Once the lightweight engine `Kernel` abstraction lands, this primitive should use it instead of `Computation`.
