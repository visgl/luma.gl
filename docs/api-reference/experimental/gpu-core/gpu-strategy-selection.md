# GPU execution strategies

## At a glance

| Question                 | Answer                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Problem**              | Select a deterministic GPU implementation from workload and device capabilities.       |
| **Reads / writes**       | Consumes CPU-known workload metadata and device features; it touches no GPU resources. |
| **Ownership**            | Candidates and workload metadata remain caller-owned.                                  |
| **Output contract**      | One immutable strategy decision with identifier, score, reason, and details.           |
| **Expected work**        | Evaluates each supported candidate once during graph construction.                     |
| **Chunks**               | Chunk behavior is defined by the selected operation implementation.                    |
| **Conditions / budgets** | Selection precedes graph compilation and performs no encoding or submission.           |
| **Neighborhood**         | workload + device → strategy selector → operation-specific graph contributor.          |

**Cost**Linear CPU work in the small candidate list.

**Common mistake**Do not hide strategy selection inside a public API that changes the operation contract.

## Overview[​](#overview "Direct link to Overview")

A high-level GPU operation describes **what** should be computed. It should not permanently encode one execution shape.

```
operation intent

     │

     ▼

workload metadata + device capabilities

     │

     ▼

strategy candidates

     │

     ▼

selected execution plan

     │

     ▼

kernel / dispatch configuration
```

The strategy layer gives reduction, SpMV and future MatMul/FFT/sort implementations one vocabulary for making those decisions.

## Why a common strategy layer?[​](#why-a-common-strategy-layer "Direct link to Why a common strategy layer?")

Different operations face the same architectural problem:

```
Reduction      64 vs 128 vs 256 threads, elements/thread, subgroups

SpMV           scalar row vs subgroup row vs workgroup row vs long row

MatMul         tile dimensions and workgroup shape

FFT            radix / workgroup / transpose strategy

Sort           radix width / histogram shape / subgroup path
```

Without a shared contract, every operation grows its own ad-hoc heuristic system. A common selector makes decisions deterministic, inspectable and eventually autotunable.

## Heuristics first, autotuning later[​](#heuristics-first-autotuning-later "Direct link to Heuristics first, autotuning later")

Initial strategies use deterministic scores derived from workload shape and device capabilities. This is intentionally simple:

```
candidate A ─ score 60

candidate B ─ score 110  ← selected

candidate C ─ unsupported
```

The important API boundary is that callers do not depend on the heuristic. Later, cached benchmark results can influence candidate scores without changing `GPUReduction`, `GPUSpMV`, or solver APIs.

## Adaptive CSR SpMV[​](#adaptive-csr-spmv "Direct link to Adaptive CSR SpMV")

CSR SpMV is unusually sensitive to row-length distribution.

```
short rows       scalar / several rows per workgroup

medium rows      subgroup-per-row

long rows        workgroup-per-row

very long rows   multiple workgroups + partial reduction
```

A single fixed kernel wastes lanes on short rows and under-parallelizes extreme rows.

### What can be known without readback?[​](#what-can-be-known-without-readback "Direct link to What can be known without readback?")

The graph normally knows:

* number of rows
* total number of nonzeros
* device capabilities

Therefore average row length is available without touching GPU data.

Detailed statistics such as maximum row length or short-row fraction may be supplied when the matrix producer already knows them. Jarnevon should **not** introduce a CPU readback merely to choose a kernel.

```
CSR metadata already known on CPU ──┐

                                    ├─ strategy selection

rows + nnz always known ────────────┘



GPU rowOffsets ──X── CPU readback solely for tuning
```

Longer term, a GPU profiling/classification pass can itself generate indirect work queues for row buckets.

## Inspectability[​](#inspectability "Direct link to Inspectability")

Every strategy decision carries:

* stable strategy id
* score
* human-readable reason
* operation-specific details

This is important because adaptive execution must remain debuggable. A trace should be able to say:

```
GPUSpMV

strategy: subgroup-row

reason: subgroups available; medium CSR rows can reduce within a subgroup

workgroupSize: 128

rowsPerWorkgroup: 4
```

## Direction[​](#direction "Direct link to Direction")

The strategy system is deliberately smaller than the existing graph autotuner. It defines the **operation-level candidate contract** that the autotuner can eventually feed.

The desired evolution is:

```
heuristic strategy scores

        ↓

benchmark candidate implementations

        ↓

cache by adapter + workload class

        ↓

strategy selector consumes measured scores
```

This separates algorithm semantics from execution policy and is a key step from a GPU primitive library toward a GPU compiler/runtime.
