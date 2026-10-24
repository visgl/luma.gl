# GPU scalar operations

[Reduction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-reduction.md)[Segmented Reduction](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-segmented-reduction.md)[RLE and Unique](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-run-length-encode.md)[Histogram](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-histogram.md)[Group Aggregation](https://luma.gl/docs/api-reference/experimental/gpu-core/gpu-group-aggregation.md)

## At a glance

| Question                 | Answer                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Problem**              | Perform arithmetic and comparisons on arena-backed scalar values.                                             |
| **Reads / writes**       | Reads one or two scalar slots and writes one compatible output slot.                                          |
| **Ownership**            | All scalars borrow one caller-selected graph arena.                                                           |
| **Output contract**      | One typed arithmetic value or uint32 comparison result.                                                       |
| **Expected work**        | One single-invocation compute pass per scalar expression.                                                     |
| **Chunks**               | Not applicable to scalar operations.                                                                          |
| **Conditions / budgets** | May be conditioned with its dependent branch; encoding, submission, and publication remain application-owned. |
| **Neighborhood**         | GPUScalar operands → GPUScalarCompute → coefficients, predicates, or counters.                                |

**Cost**One dispatch per unfused expression in the baseline implementation.

**Common mistake**Do not mix scalar arenas or incompatible operand and output formats.

## Overview[​](#overview "Direct link to Overview")

`GPUScalarCompute` performs arithmetic and comparisons on small values that were produced by GPU work and remain resident in the graph-owned `GPUValueArena`.

The initial operations are:

```
arithmetic:  copy add subtract multiply divide sqrt min max

comparison:  == != < <= > >=
```

Comparisons produce a `uint32` scalar containing `1` for true and `0` for false.

## Why scalar arithmetic is different from vector arithmetic[​](#why-scalar-arithmetic-is-different-from-vector-arithmetic "Direct link to Why scalar arithmetic is different from vector arithmetic")

A vector operation applies arithmetic independently to many elements:

```
x = [1, 2, 3]

y = [4, 5, 6]



x + y = [5, 7, 9]
```

A scalar operation combines individual graph values:

```
rr    = 12.5

pDotQ = 4.0



alpha = rr / pDotQ

      = 3.125
```

The arithmetic itself is trivial. The important property is that `rr`, `pDotQ`, and `alpha` can all have been produced by earlier GPU commands and never need to cross back into JavaScript.

## Conjugate-gradient example[​](#conjugate-gradient-example "Direct link to Conjugate-gradient example")

CG provides the motivating dependency chain:

```
r ──┐

    ├── dot ──▶ rr ─────┐

r ──┘                   │

                        ├── divide ──▶ alpha

p ──┐                   │

    ├── dot ──▶ pDotQ ──┘

Ap ─┘
```

Mathematically:

```
alpha = (r · r) / (p · Ap)
```

`GPUScalarCompute` supplies the division without requiring a CPU readback between the dot products and the following vector update.

## Comparisons and GPU control[​](#comparisons-and-gpu-control "Direct link to Comparisons and GPU control")

Scalar comparisons turn numerical state into graph-control state:

```
residualSquared ─┐

                 ├── less-than ──▶ converged : u32

 tolerance² ─────┘
```

That `converged` value can eventually feed the command graph's GPU conditional/indirect execution machinery. This is the bridge from numerical scalar state to GPU-resident control flow.

## One arena binding[​](#one-arena-binding "Direct link to One arena binding")

All operands and results live in the same graph-owned value arena:

```
GPUValueArena

┌──────────────────────┐

│ rr          f32      │

│ pDotQ       f32      │

│ alpha       f32      │

│ residualSq  f32      │

│ toleranceSq f32      │

│ converged   u32      │

└──────────────────────┘

           │

           ▼

 one storage-buffer binding
```

A scalar operation therefore does not bind its left input, right input and output as three independent storage buffers. It binds the arena once and accesses the three slots by word offset.

This preserves the central invariant:

> Logical scalar count must not imply storage-buffer binding count.

## Representation[​](#representation "Direct link to Representation")

The arena is exposed to WGSL as an `array<u32>`. Typed scalar loads/stores bitcast words as required:

```
@group(0) @binding(0)

var<storage, read_write> gpuValues: array<u32>;
```

A `float32` scalar is loaded as `bitcast<f32>(gpuValues[offset])`; a signed integer as `bitcast<i32>(...)`; `uint32` is read directly.

This gives all supported scalar types one stable physical arena representation.

## Contract[​](#contract "Direct link to Contract")

```
graph.add(new GPUScalarCompute({

  operation: 'divide',

  left: rr,

  right: pDotQ,

  output: alpha

}));
```

Binary arithmetic requires matching input/output formats. `sqrt` currently supports `float32`. Comparisons accept matching input formats and require a `uint32` output.

All scalars must belong to the same graph-owned arena.

## Why comparisons return uint32 instead of bool[​](#why-comparisons-return-uint32-instead-of-bool "Direct link to Why comparisons return uint32 instead of bool")

WGSL `bool` is useful inside shaders but is not a host-shareable storage-buffer scalar type. A `uint32` value gives graph state an explicit stable representation:

```
0u = false

1u = true
```

It can also participate naturally in counters, masks and indirect-control preparation.

## Performance and fusion[​](#performance-and-fusion "Direct link to Performance and fusion")

A standalone scalar operation currently contributes one one-invocation compute dispatch. That is intentionally a correctness/architecture baseline, not the final performance model.

A solver may contain several dependent scalar expressions:

```
rr / pDotQ

newRR / rr

sqrt(rr)

rr < toleranceSquared
```

Dispatching a separate kernel for every trivial arithmetic expression can become command-overhead dominated. Because the graph knows the operation and scalar dependencies, these nodes are excellent candidates for future scalar-expression fusion into one generated compute kernel where dependencies permit it.

The semantic API should therefore remain operation-oriented even if the compiler later combines several nodes physically.

## Roadmap[​](#roadmap "Direct link to Roadmap")

The next step is scalar broadcast into `GPUElementwise`, allowing expressions such as:

```
x = x + alpha * p

r = r - alpha * Ap
```

After that, the conjugate-gradient solver can be completed as a composition of SpMV, dot products, scalar operations and vector MADDs. Comparisons can then connect residual convergence to existing GPU-conditioned graph execution.
