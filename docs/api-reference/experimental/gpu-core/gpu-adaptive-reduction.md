# Adaptive GPU reductions

A reduction maps many values to fewer partial values until one result remains. There is no single best hierarchy shape for every input size or GPU.

## Elements per thread

A baseline reduction may assign one input element to each invocation:

```text
256 threads × 1 element = 256 values/workgroup
```

For large inputs, each invocation can accumulate several values before participating in the workgroup reduction:

```text
256 threads × 4 elements = 1024 values/workgroup
```

This reduces the number of first-level partials and therefore the number of hierarchy levels and dispatches. The tradeoff is less parallelism, so small inputs should not blindly maximize elements per thread.

## Strategy

The initial planner chooses among 64/128/256-thread workgroups according to device limits and 1/2/4/8 elements per thread according to workload size. Subgroup acceleration is selected independently when supported.

```text
input length + device limits/features
                ↓
       reduction strategy
       ├─ workgroup size
       ├─ elements/thread
       ├─ hierarchy shape
       └─ subgroup path
```

The policy is intentionally simple and deterministic. It establishes a common strategy object that can later be selected by benchmark-backed autotuning without changing reduction APIs.

## Shared beneficiaries

Adaptive reduction is infrastructure rather than a single algorithm optimization:

```text
adaptive reduction
   ├─ sum / min / max
   ├─ dot product
   ├─ vector norms
   ├─ solver residuals
   └─ statistics / analytics
```

This is the compositional principle of the GPU core: improving one common execution substrate should improve many higher-level operations.
