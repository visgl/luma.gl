import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUElementwise

<GPUCoreDocsTabs active="reduction" />

## Overview

`GPUElementwise` applies the same scalar operation independently to every row in one, two, or three packed GPU vectors.

## Motivation

Scans, reductions, sorting and grouping solve irregular data movement, but numerical pipelines also need a small vocabulary for dense arithmetic. Without a canonical elementwise primitive, higher-level algorithms repeatedly introduce tiny one-off kernels for addition, scaling, residual updates and vector combinations.

`GPUElementwise` establishes that dense-compute substrate. It is intentionally small: the initial API provides common unary, binary, and ternary operations while leaving expression DSLs and arbitrary shader generation for later design work.

## Contract

The first implementation accepts packed `uint32`, `sint32`, and `float32` scalar views. `copy` consumes one input. `add`, `subtract`, `multiply`, `min`, and `max` consume two inputs. `multiply-add` consumes three and computes `a * b + c`. Inputs and output must have matching format and logical length.

```ts
new GPUElementwise({
  input: x,
  inputB: y,
  output: sum,
  operation: 'add'
}).addToGraph(graph);
```

Multiply-add is the general MADD operation rather than a BLAS-specific helper:

```ts
new GPUElementwise({
  input: a,
  inputB: b,
  inputC: c,
  output,
  operation: 'multiply-add'
}).addToGraph(graph);
```

Every output row depends only on the corresponding input row or rows. The operation performs no reduction, synchronization between rows, allocation, submission or readback.

`multiply-add` specifies the mathematical operation `a * b + c`; it does not currently promise fused floating-point rounding semantics. A future explicitly fused operation may lower float32 work to WGSL `fma` where that distinction matters.

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

AXPY (`alpha * x + y`) is a named BLAS pattern built from the same multiply-add operation. Once scalar constants or scalar broadcasting are supported, AXPY can be expressed directly without adding a separate core primitive. Until then, callers can provide a vector containing the coefficient or compose scale and add operations.

Conjugate gradient, Jacobi-style solvers, normalization, residual updates and vector-search preprocessing all need this class of operation.

## Why a primitive instead of handwritten WGSL?

The value is not the arithmetic itself. A graph-native operation exposes resource dependencies, workload estimates and operation identity to the command graph. That creates a future optimization surface for in-place eligibility, dispatch coalescing and especially fusion of consecutive elementwise nodes.

For example, independent multiply and add nodes should eventually be candidates for one multiply-add kernel when graph analysis proves equivalent semantics and the intermediate value does not need materialization. Likewise, longer chains such as scale, add and clamp can become one generated WGSL dispatch.

## Performance notes

The initial implementation issues one invocation per row using the existing bounded-dispatch utilities. Elementwise arithmetic is generally memory-bandwidth bound, so avoiding unnecessary intermediate buffers and dispatches is more important than elaborate per-kernel algorithms.

A direct `multiply-add` node already avoids the intermediate buffer required by separate multiply and add nodes. More generally, this makes `GPUElementwise` an important future graph-compiler target: operation fusion and safe in-place execution can reduce memory traffic substantially without changing application-level algorithms.

## Limitations and roadmap

The first API intentionally avoids an expression language. It supports a small set of scalar operations and does not yet provide scalar constants, explicitly fused floating-point multiply-add, transcendental functions, vector-width formats, broadcasting or arbitrary user expressions. Those should be added only where they preserve inspectability and allow the graph compiler to reason about the operation.

Once the lightweight engine `Kernel` abstraction lands, this primitive should use it instead of `Computation` so dense numerical compute does not depend on higher-level shader-input machinery.
