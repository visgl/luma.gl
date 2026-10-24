# GPUElementwise

[Elementwise](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-elementwise.md)[MatVec](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matvec.md)[MatMul](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-matmul.md)

## Overview[​](#overview "Direct link to Overview")

An elementwise operation applies the same arithmetic independently at every vector position:

```
a = [1, 2, 3]

b = [4, 5, 6]



add(a,b)      = [5, 7, 9]

multiply(a,b) = [4,10,18]
```

There is no communication between rows, which makes elementwise work naturally parallel on a GPU.

`GPUElementwise` provides canonical graph-visible forms of `copy`, `add`, `subtract`, `multiply`, `min`, `max`, and `multiply-add`.

## At a glance

| Question                 | Answer                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Problem**              | Apply one canonical arithmetic operation independently to every packed scalar row.                                 |
| **Reads / writes**       | Reads one to three matching scalar inputs; writes one source-aligned output.                                       |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory.                       |
| **Output contract**      | One value per input row in the shared uint32, sint32, or float32 format.                                           |
| **Expected work**        | One bounded invocation per row with no cross-row communication.                                                    |
| **Chunks**               | Equal logical lengths with independent input/B/C/output chunk boundaries; alignment borrows views without packing. |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned.      |
| **Neighborhood**         | vectors and coefficients → GPUElementwise → residuals, updates, or dense operators.                                |

**Cost**Usually memory-bandwidth bound; graph fusion can avoid intermediate traffic.

**Common mistake**Do not mix formats, lengths, or omit the third input for multiply-add.

## MADD: multiply-add[​](#madd-multiply-add "Direct link to MADD: multiply-add")

Multiply-add (MADD) is the general three-input operation:

```
output[i] = a[i] * b[i] + c[i]
```

For example:

```
a = [1,2]

b = [3,4]

c = [5,6]



MADD = [1*3+5, 2*4+6]

     = [8,14]
```

It appears throughout numerical computing: affine transforms, residual updates, polynomial evaluation, integration and iterative solvers.

MADD describes the mathematical expression `a*b+c`. It does **not** currently promise fused floating-point rounding. An explicitly fused FMA operation could later map to WGSL `fma` where single-rounding semantics matter.

## AXPY[​](#axpy "Direct link to AXPY")

AXPY is a classic BLAS operation whose name means “A times X plus Y”:

```
y ← alpha*x + y
```

Example:

```
alpha = 2

x = [1,2,3]

y = [4,5,6]



2*x+y = [6,9,12]
```

AXPY is therefore a special case of MADD where one multiplicand is a scalar broadcast across the vector. Jarnevon should expose the general MADD primitive rather than requiring a separate core operation for every BLAS naming pattern. First-class GPU scalars/broadcasting will allow AXPY to map directly onto MADD.

## Contract[​](#contract "Direct link to Contract")

```
graph.add(new GPUElementwise({

  input: a,

  inputB: b,

  inputC: c,

  output,

  operation: 'multiply-add'

}));
```

Inputs/output use matching packed scalar formats and logical lengths. Each operand accepts either `GraphDataView` or `GraphVectorView`, with independent chunk boundaries. Lowering borrows aligned subviews without concatenating or allocating storage. Empty vectors emit no commands, and each encoding overwrites the output using the current input contents.

The output must use separate buffers from every input, and its chunks must not overlap.

## Why graph-visible arithmetic?[​](#why-graph-visible-arithmetic "Direct link to Why graph-visible arithmetic?")

The arithmetic itself is trivial; the important property is that the graph understands it. A sequence such as:

```
multiply

   ↓

temporary buffer

   ↓

add
```

can eventually become:

```
multiply-add

     ↓

one dispatch
```

Likewise longer chains can be candidates for generated fused kernels when intermediate results have no other consumers.

## Composition[​](#composition "Direct link to Composition")

```
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

## Performance notes[​](#performance-notes "Direct link to Performance notes")

Elementwise arithmetic is generally memory-bandwidth bound: very little arithmetic is performed per byte read/written. Avoiding temporary buffers and dispatches through fusion can therefore matter more than optimizing the individual arithmetic instruction.
