# GPU operation control flow

## Overview[​](#overview "Direct link to Overview")

`GPUConditionalOperation` and `GPULoopOperation` add **structured control-flow semantics** to the GPU operation IR.

The important distinction is that an operation describes the program while lowering decides how that program executes.

## At a glance

| Question                 | Answer                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Problem**              | Represent bounded loops and conditional branches in a backend-independent program.   |
| **Reads / writes**       | Predicates reference logical uint32 scalar state; child operations declare data use. |
| **Ownership**            | Control operations own semantic hierarchy but no buffers or command submission.      |
| **Output contract**      | A bounded operation subtree with explicit predicate and iteration semantics.         |
| **Expected work**        | Maximum iterations provide a static upper bound for backend planning.                |
| **Chunks**               | Child operations retain their declared logical shapes and chunk behavior.            |
| **Conditions / budgets** | WebGPU lowers runtime predicates to bounded GPU-gated indirect dispatch sequences.   |
| **Neighborhood**         | logical predicate + operation body → control-flow lowering → conditioned nodes.      |

**Cost**Bounded lowering may materialize commands for every possible iteration.

**Common mistake**Do not model an unbounded device loop or read predicates back between iterations.

```
GPULoopOperation

  predicate: residual² > tolerance²

  maximumIterations: 256

  body: PCG iteration

              │

              ▼

      operation-aware lowering

        ├─ bounded unroll

        └─ GPU-resident dynamic control

              │

              ▼

       GPUCommandGraph nodes
```

## Why control flow belongs above command nodes[​](#why-control-flow-belongs-above-command-nodes "Direct link to Why control flow belongs above command nodes")

A numerical algorithm such as conjugate gradient is naturally written as a loop:

```
while residual > tolerance and iteration < maximumIterations

    q = A p

    alpha = rho / dot(p,q)

    x = x + alpha p

    r = r - alpha q

    z = M^-1 r

    rhoNew = dot(r,z)

    beta = rhoNew / rho

    p = z + beta p
```

Encoding 64 copies of those operations into the semantic IR loses the fact that this is one iterative algorithm. `GPULoopOperation` preserves that fact.

## Bounded loops[​](#bounded-loops "Direct link to Bounded loops")

GPU loops always carry `maximumIterations`. This provides a finite static bound for scheduling, workload estimation, diagnostics and safety even when the actual exit condition is GPU-resident.

`minimumIterations` can express algorithms that must perform some work before convergence is tested.

## Predicates[​](#predicates "Direct link to Predicates")

A `GPUOperationPredicate` records semantic intent:

```
{

  id: 'pcg-converged',

  source: 'gpu',

  expression: 'residualSquared > toleranceSquared'

}
```

It intentionally does not contain an indirect-dispatch buffer or workgroup count. Those are properties of a concrete lowering, not of the mathematical program.

## Lowering[​](#lowering "Direct link to Lowering")

The first IR supports two lowering classes:

* `unroll`: duplicate a bounded body into command nodes;
* `dynamic-gpu`: preserve a GPU predicate and let an operation-aware compiler select a GPU-resident realization.

Dynamic lowering is deliberately not faked in this PR. WebGPU indirect conditions operate on concrete dispatch commands, and different child operations have different dispatch geometry. The following compiler tranche will map structured predicates to each lowered node correctly.

This separation is important:

```
semantic loop                  executable realization

-------------                  ----------------------

condition                      dispatch gates

maximumIterations      ->      node expansion / control

body operation tree            concrete compute passes
```

## Composite hierarchy[​](#composite-hierarchy "Direct link to Composite hierarchy")

Control-flow operations are specialized composites. The inspector can therefore retain:

```
PCG

└─ loop max=256

   ├─ predicate: residual² > tolerance²

   └─ iteration

      ├─ SpMV

      ├─ reductions

      ├─ scalar arithmetic

      ├─ vector updates

      └─ Jacobi
```

A loop body remains one semantic subtree even when an unrolled lowering produces many command nodes.

## What this does not imply[​](#what-this-does-not-imply "Direct link to What this does not imply")

Structured control flow does not introduce synchronization by itself, does not choose an execution strategy, and does not require a CPU readback. It gives planners enough semantic information to choose among legal realizations later.
