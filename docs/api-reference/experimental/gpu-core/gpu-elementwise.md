import {GPUCoreDocsTabs} from '@site/src/components/docs/gpu-core-docs-tabs';

# GPUElementwise

<GPUCoreDocsTabs active="reduction" />

## What is an elementwise operation?

An elementwise operation applies the same arithmetic independently at every vector position:

```text
a = [1, 2, 3]
b = [4, 5, 6]

add(a,b)      = [5, 7, 9]
multiply(a,b) = [4,10,18]
```

There is no communication between rows, which makes elementwise work naturally parallel on a GPU.

`GPUElementwise` provides canonical graph-visible forms of `copy`, `add`, `subtract`, `multiply`, `min`, `max`, and `multiply-add`.

## MADD: multiply-add

Multiply-add (MADD) is the general three-input operation:

```text
output[i] = a[i] * b[i] + c[i]
```

For example:

```text
a = [1,2]
b = [3,4]
c = [5,6]

MADD = [1*3+5, 2*4+6]
     = [8,14]
```

It appears throughout numerical computing: affine transforms, residual updates, polynomial evaluation, integration and iterative solvers.

MADD describes the mathematical expression `a*b+c`. It does **not** currently promise fused floating-point rounding. An explicitly fused FMA operation could later map to WGSL `fma` where single-rounding semantics matter.

## AXPY

AXPY is a classic BLAS operation whose name means “A times X plus Y”:

```text
y ← alpha*x + y
```

Example:

```text
alpha = 2
x = [1,2,3]
y = [4,5,6]

2*x+y = [6,9,12]
```

AXPY is therefore a special case of MADD where one multiplicand is a scalar broadcast across the vector. Jarnevon should expose the general MADD primitive rather than requiring a separate core operation for every BLAS naming pattern. First-class GPU scalars/broadcasting will allow AXPY to map directly onto MADD.

## Contract

```ts
new GPUElementwise({
  input: a,
  inputB: b,
  inputC: c,
  output,
  operation: 'multiply-add'
}).addToGraph(graph);
```

Inputs/output currently use matching packed scalar formats and logical lengths.

## Why graph-visible arithmetic?

The arithmetic itself is trivial; the important property is that the graph understands it. A sequence such as:

```text
multiply
   ↓
temporary buffer
   ↓
add
```

can eventually become:

```text
multiply-add
     ↓
one dispatch
```

Likewise longer chains can be candidates for generated fused kernels when intermediate results have no other consumers.

## Composition

```text
MatVec / SpMV / stencil / FFT
              ↓
        GPUElementwise
     MADD / residual update
              ↓
          dot / norm
              ↓
       iterative solver
```

Conjugate gradient uses exactly this pattern for `x = x + alpha*p`, `r = r - alpha*q`, and `p = r + beta*p`.

## Performance notes

Elementwise arithmetic is generally memory-bandwidth bound: very little arithmetic is performed per byte read/written. Avoiding temporary buffers and dispatches through fusion can therefore matter more than optimizing the individual arithmetic instruction.
