# Adaptive CSR SpMV execution

`GPUAdaptiveSpMV` keeps sparse matrix-vector multiplication expressed as one operation while selecting an execution family appropriate to the matrix shape and device.

```text
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

## Scalar rows

For matrices with very short rows, synchronization and cooperative reduction can cost more than the arithmetic. One invocation therefore owns one complete row. A workgroup processes many independent rows.

## Subgroup rows

Medium rows can map naturally to one subgroup. Lanes walk the row cooperatively and `subgroupAdd` produces the row result without a full-workgroup reduction.

This path is selected only when the device exposes WebGPU subgroup support.

## Workgroup rows

Longer rows use one workgroup per row. Threads accumulate strided nonzeros and combine their partial sums through workgroup memory. This is the portable cooperative baseline.

## Very long rows

A single workgroup can underutilize the GPU when a row contains thousands of nonzeros. The long-row strategy splits each row across several workgroups:

```text
row
 ├── workgroup 0 ── partial 0
 ├── workgroup 1 ── partial 1
 ├── workgroup 2 ── partial 2
 └── workgroup 3 ── partial 3
                       │
                       ▼
                  finalize row
```

The partial buffer is a graph transient and can eventually participate in large-transient lifetime reuse.

## No tuning readback

Strategy selection does not read CSR row offsets back to JavaScript. Row count and total nonzero count are already graph construction metadata and provide average row length. Producers may optionally supply row-shape statistics when they already know them.

A future GPU classifier can bucket rows and generate indirect queues entirely on the GPU for mixed matrices.

## Why this matters beyond SpMV

Adaptive SpMV is the first irregular workload to exercise the common GPU strategy layer. Reduction chooses hierarchy shapes; SpMV chooses fundamentally different mappings of work to GPU lanes. If both fit the same strategy contract, that contract is a credible foundation for later FFT, MatMul, sort and graph-operation planning.
