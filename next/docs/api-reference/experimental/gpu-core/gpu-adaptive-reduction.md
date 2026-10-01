# Adaptive GPU reductions

## At a glance

| Question                 | Answer                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Problem**              | Choose an efficient reduction hierarchy for the input size and device.                       |
| **Reads / writes**       | The selected reduction reads packed values and writes partials plus a scalar result.         |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory. |
| **Output contract**      | The same reduction result independent of the chosen execution strategy.                      |
| **Expected work**        | Linear input work with strategy-selected workgroup size and elements per thread.             |
| **Chunks**               | Operates on explicit packed views; cross-chunk reduction remains explicit.                   |
| **Conditions / budgets** | Strategy selection is CPU-side; contributed reduction work remains graph-managed.            |
| **Neighborhood**         | input shape + device → reduction strategy → hierarchical reduction.                          |

**Cost**Memory traffic and hierarchy depth, tuned against available parallelism.

**Common mistake**Do not assume the largest workgroup or most elements per thread is always fastest.

## Overview[​](#overview "Direct link to Overview")

A reduction maps many values to fewer partial values until one result remains. There is no single best hierarchy shape for every input size or GPU.

## Elements per thread[​](#elements-per-thread "Direct link to Elements per thread")

A baseline reduction may assign one input element to each invocation:

```
256 threads × 1 element = 256 values/workgroup
```

For large inputs, each invocation can accumulate several values before participating in the workgroup reduction:

```
256 threads × 4 elements = 1024 values/workgroup
```

This reduces the number of first-level partials and therefore the number of hierarchy levels and dispatches. The tradeoff is less parallelism, so small inputs should not blindly maximize elements per thread.

## Strategy[​](#strategy "Direct link to Strategy")

The initial planner chooses among 64/128/256-thread workgroups according to device limits and 1/2/4/8 elements per thread according to workload size. Subgroup acceleration is selected independently when supported.

```
input length + device limits/features

                ↓

       reduction strategy

       ├─ workgroup size

       ├─ elements/thread

       ├─ hierarchy shape

       └─ subgroup path
```

The policy is intentionally simple and deterministic. It establishes a common strategy object that can later be selected by benchmark-backed autotuning without changing reduction APIs.

## Shared beneficiaries[​](#shared-beneficiaries "Direct link to Shared beneficiaries")

Adaptive reduction is infrastructure rather than a single algorithm optimization:

```
adaptive reduction

   ├─ sum / min / max

   ├─ dot product

   ├─ vector norms

   ├─ solver residuals

   └─ statistics / analytics
```

This is the compositional principle of the GPU core: improving one common execution substrate should improve many higher-level operations.
