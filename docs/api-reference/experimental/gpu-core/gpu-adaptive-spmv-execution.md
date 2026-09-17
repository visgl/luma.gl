# Adaptive CSR SpMV execution

## At a glance

| Question                 | Answer                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Problem**              | Multiply a CSR matrix by a dense vector using a row-shape-aware execution family.            |
| **Reads / writes**       | Reads CSR offsets, columns, values, and the input vector; writes one value per row.          |
| **Ownership**            | Public inputs and outputs are caller-owned; scratch storage is graph-owned transient memory. |
| **Output contract**      | A dense float32 vector with one matrix-vector product result per CSR row.                    |
| **Expected work**        | Linear nonzero traversal plus optional long-row partial reduction.                           |
| **Chunks**               | One logical CSR domain with independently chunked offsets, nonzeros, vector, and output.     |
| **Conditions / budgets** | Selects scalar, subgroup, workgroup, or long-row graph passes before compilation.            |
| **Neighborhood**         | CSR matrix + vector → GPUAdaptiveSpMV → iterative sparse solver.                             |

**Cost**Nonzero count, row imbalance, memory locality, and reduction strategy dominate.

**Common mistake**Do not use one row kernel shape for both tiny and extremely long sparse rows.

## Overview[​](#overview "Direct link to Overview")

`GPUAdaptiveSpMV` keeps sparse matrix-vector multiplication expressed as one operation while selecting an execution family appropriate to the matrix shape and device.

```
CSR matrix + vector

        │

        ▼

strategy selection

   ┌────┼──────────────┬─────────────┐

   ▼    ▼              ▼             ▼

scalar subgroup     workgroup      long-row

 rows    rows           rows          split

   │      │              │             │

   └──────┴──────────────┴─────────────┘

                    │

                    ▼

               output vector
```

## Scalar rows[​](#scalar-rows "Direct link to Scalar rows")

For matrices with very short rows, synchronization and cooperative reduction can cost more than the arithmetic. One invocation therefore owns one complete row. A workgroup processes many independent rows.

## Subgroup rows[​](#subgroup-rows "Direct link to Subgroup rows")

Medium rows can map naturally to one subgroup. Lanes walk the row cooperatively and `subgroupAdd` produces the row result without a full-workgroup reduction.

This path is selected only when the device exposes WebGPU subgroup support.

## Workgroup rows[​](#workgroup-rows "Direct link to Workgroup rows")

Longer rows use one workgroup per row. Threads accumulate strided nonzeros and combine their partial sums through workgroup memory. This is the portable cooperative baseline.

## Very long rows[​](#very-long-rows "Direct link to Very long rows")

A single workgroup can underutilize the GPU when a row contains thousands of nonzeros. The long-row strategy splits each row across several workgroups:

```
row

 ├── workgroup 0 ── partial 0

 ├── workgroup 1 ── partial 1

 ├── workgroup 2 ── partial 2

 └── workgroup 3 ── partial 3

                       │

                       ▼

                  finalize row
```

The partial buffer is a graph transient and participates in lifetime-based allocation reuse.

## No tuning readback[​](#no-tuning-readback "Direct link to No tuning readback")

Strategy selection does not read CSR row offsets back to JavaScript. Row count and total nonzero count are already graph construction metadata and provide average row length. Producers may optionally supply row-shape statistics when they already know them.

A future GPU classifier can bucket rows and generate indirect queues entirely on the GPU for mixed matrices.

## Why this matters beyond SpMV[​](#why-this-matters-beyond-spmv "Direct link to Why this matters beyond SpMV")

Adaptive SpMV is the first irregular workload to exercise the common GPU strategy layer. Reduction chooses hierarchy shapes; SpMV chooses fundamentally different mappings of work to GPU lanes. If both fit the same strategy contract, that contract is a credible foundation for later FFT, MatMul, sort and graph-operation planning.

## Chunked storage[​](#chunked-storage "Direct link to Chunked storage")

CSR row offsets, column indices, values, input vector, and output accept independently partitioned graph vectors. Row boundaries, nonzero indices, and column IDs are global. Adjacent offsets can straddle chunks, and one row may consume nonzeros and vector entries from many chunks. All four strategies remain available; subgroup execution uses one subgroup per row without assuming a fixed subgroup width. Long-row partial scratch is bounded by a row block and the storage binding limit. Each encoding overwrites the previous result before accumulating contributions. `GPUProgramSpMV` uses the same lowering and preserves external `GPUData[]` bindings.

### Fragmentation-aware routing[​](#fragmentation-aware-routing "Direct link to Fragmentation-aware routing")

For `R` row blocks, `N` aligned nonzero spans and `V` nonempty vector chunks, direct routing requires `R × N × V` row dispatches. When `R × V > R + V`, the lowering first gathers `vector[columnIndices]` for each nonzero span and reuses those values across row blocks. Scalar, subgroup and workgroup paths then require `N × (V + R)` dispatches; long-row execution also finalizes each row block. A single vector chunk or a small row set keeps direct routing.

This is indexed algorithm scratch, not concatenation of the source vector. Source buffers and chunk boundaries remain unchanged. Gathered spans are sequenced so their storage can be reused; physical gather scratch is bounded by the largest aligned nonzero span (four bytes per entry). Long-row partials have their own allocation lifetimes. The gather executes again on every encoding, including when the operation is GPU-gated, so changes to vector or index contents are observed. Invalid column indices contribute nothing, even when the corresponding matrix value is non-finite.

The dispatch-count heuristic does not guarantee a speedup for every matrix. It trades an indexed scratch write/read for fewer kernels and repeated CSR scans. Floating-point addition order may change. Routing still grows with `N × (V + R)`; it is not constant-cost for arbitrarily fragmented inputs. No CPU readback is used to select the path.
