import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUElementwise

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUElementwise` applies the same scalar operation independently to every row in one or two packed GPU vectors.

## Motivation

Scans, reductions, sorting and grouping solve irregular data movement, but numerical pipelines also need a small vocabulary for dense arithmetic. Without a canonical elementwise primitive, higher-level algorithms repeatedly introduce tiny one-off kernels for addition, scaling, residual updates and vector combinations.

`GPUElementwise` establishes that dense-compute substrate. It is intentionally small: the initial API provides common unary/binary operations while leaving expression DSLs and arbitrary shader generation for later design work.

## Contract

The first implementation accepts packed `uint32`, `sint32`, and `float32` scalar views. `copy` consumes one input. `add`, `subtract`, `multiply`, `min`, and `max` consume two inputs. Inputs and output must have matching format and logical length.

```ts
new GPUElementwise({
  input: x,
  inputB: y,
  output: sum,
  operation: 'add'
}).addToGraph(graph);
```

Every output row depends only on the corresponding input row or rows. The operation performs no reduction, synchronization between rows, allocation, submission or readback.

## Composition

Elementwise arithmetic is the glue between larger numerical primitives:

```text
matvec / stencil / FFT
        ↓
  GPUElementwise
        ↓
 reduction / norm
        ↓
 iterative solver
```

A future AXPY helper (`a * x + y`) can either specialize this family or be represented by a fused elementwise expression. Conjugate gradient, Jacobi-style solvers, normalization, residual updates and vector-search preprocessing all need this class of operation.

## Why a primitive instead of handwritten WGSL?

The value is not the arithmetic itself. A graph-native operation exposes resource dependencies, workload estimates and operation identity to the command graph. That creates a future optimization surface for in-place eligibility, dispatch coalescing and especially fusion of consecutive elementwise nodes.

For example, three independent kernels for scale, add and clamp should eventually be candidates for one generated WGSL dispatch when graph analysis proves that intermediate values do not need materialization.

## Performance notes

The initial implementation issues one invocation per row using the existing bounded-dispatch utilities. Elementwise arithmetic is generally memory-bandwidth bound, so avoiding unnecessary intermediate buffers and dispatches is more important than elaborate per-kernel algorithms.

This makes `GPUElementwise` an important future graph-compiler target: operation fusion and safe in-place execution can reduce memory traffic substantially without changing application-level algorithms.

## Limitations and roadmap

The first API intentionally avoids an expression language. It supports a small set of scalar operations and does not yet provide scalar constants, fused multiply-add, transcendental functions, vector-width formats, broadcasting or arbitrary user expressions. Those should be added only where they preserve inspectability and allow the graph compiler to reason about the operation.

Once the lightweight engine `Kernel` abstraction lands, this primitive should use it instead of `Computation` so dense numerical compute does not depend on higher-level shader-input machinery.
