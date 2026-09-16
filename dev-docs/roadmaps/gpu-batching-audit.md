# GPU batching completion audit

This closes the general column-operation batching tranche. Physical chunks describe storage;
they do not implicitly introduce sort domains, CSR rows, runs, or index partitions. Source buffers
remain borrowed, and algorithm scratch is explicit graph-owned storage. This is not a claim that
every device-owned or specialized tree API accepts arbitrary vector topology.

## Completed in this consolidation

| Family | Contract |
| --- | --- |
| `GPUAdaptiveSpMV`, `GPUProgramSpMV` | Independent CSR offsets, columns, values, vector, and output chunks; all four strategies and conditional program lowering |
| `GPUCOOToCSR` | One sorted COO domain across independent input/output partitions, including empty rows and split rows |
| `GPUSort` | Stable global order across chunks, with equal-key ties ordered by original logical position |
| `GPUSegmentedSort` | Small explicit logical domains can cross storage seams; atomic width-bucket kernels remain |
| `GPURunLengthEncode`, `GPUUnique` | Runs bridge seams and empty chunks; run values/lengths route to independent outputs |
| `GPUScatter`, `GPUGather` | Global indices, independent partitions, and word-aligned strided gather sources |
| `GPUGridIndex`, `GPUGridIndexQuery` | Chunked cells, IDs, candidates, masks, and independent source IDs; capacity/count/overflow preserved |
| `GPUGallopingSearch` | Global segment ranges, split descriptor records, direct/indirect values, bounded query tiles, GPU validation |
| `GPUHierarchyLayout`, `GPUAncestorProjection` | Independent layout outputs and global parent IDs with bounded cross-chunk traversal |

Earlier landed work supplies scans, reductions, elementwise operations, compaction, dense matrix
operations, 1D FFT/convolution, projections, hash operations, binning, aggregation, and exact point
filtering. These changes use the existing `GPUVector`/`GPUVectorLike` and `GraphVectorView`
contracts. No compatibility contributor or second public vector wrapper is introduced.

## Deliberate domain boundaries

- Scalar counts, overflow words, predicates, dispatch arguments, and small query records stay atomic.
  Their physical binding is the operation's scalar/record contract.
- `GPUBatchSort` defines one independent sort per batch. `GPUSort` defines one global order.
- Partitioned CSR traversal, indexed-range compaction, scene resource groups, text/virtual geometry
  selection, and compressed-stream jobs carry explicit per-partition metadata. Their partition
  boundaries have semantic meaning. Do not erase those boundaries merely to accept a flat vector.
- Prepared compression streams and indirect draw buffers expose explicit physical byte/command
  layouts. They must not silently pack unrelated caller buffers.

## Remaining architectural debt

These are real limits, not completed vector support:

1. `GPUFFT2D` and device-owned CG/PCG/reduction execution helpers still expose physical buffer
   lifecycles. Move those APIs onto graph/program composition in the execution-unification tranche;
   extending their old buffer wrappers would create a second batching architecture.
2. `GPUBVH`, `GPUSegmentedBVH`, and `GPUBVHQuery` still bind packed tree storage. Tree paging,
   cross-page traversal, and chunked tree publication need one shared addressing contract. Existing
   explicit tree/segment domains remain usable; arbitrary split tree arrays are not implemented.
3. Specialized partitioned topology consumers still require compatible partition metadata. The
   generic vector contract does not automatically translate chunk-relative adjacency or job records
   into global IDs. Audit those adapters when migrating their execution/storage contracts.

Keep these grouped by architecture rather than opening one mechanical PR per operation.

## Performance work, separate from semantics

The portable global sort computes ranks against other sorted spans. Sparse multiplication visits
nonzero/vector chunk pairs. Grid index passes visit position/cell pairs. Chunked ancestor projection
composes parent jumps in at most 32 levels of source/output chunk pairs. Chunked search visits bounded query tiles and value chunks;
indirect search allocates a permutation with the order vector's topology. These preserve storage
and exact logical semantics, but heavily fragmented workloads can create many passes. Benchmark
before selecting hierarchical merging, routing indexes or cached query plans.

No automatic concatenation is an acceptable performance fallback. Every physical chunk must still
fit a WebGPU storage binding, including its alignment prefix. Logical addresses are uint32.
