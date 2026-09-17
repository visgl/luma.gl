# Arisia: make fragmentation inexpensive

## Scope

This tranche reduces shared CPU planning costs and the multiplicative sparse-matrix routing cost.
It preserves the existing GPUVector, GPUProgram, graph.add and Kernel APIs, borrowed source buffers,
chunk boundaries, graph hazards and GPU-controlled execution. There is no implicit packing API,
compatibility facade or new public program wrapper.

## Shared planning

- GraphVectorView computes immutable chunk descriptors once. Range extraction seeks the first
  intersecting chunk with binary search, then visits only that range: O(log C + K) for C chunks
  and K intersecting chunks. Whole views retain identity; sliced views retain offsets and stride.
- Chunk validation groups writable intervals by buffer, then sorts those intervals. Separate-buffer
  inputs are checked with a set. Ownership checks still include empty chunks, and strided overlap
  remains conservative. This replaces all-pairs scans with O(C log C) worst-case work.
- Topological scheduling records outgoing dependency edges and decrements outstanding counts.
  It retains the prior insertion-ordered ready waves, forward references, hazard inference and
  cycle errors. Scheduling is O(E + C log C), rather than rescanning every remaining node after
  each completion. Texture hazard history itself is unchanged.
- Transient buffer planning uses separate priority queues for live and reusable allocations.
  Allocation choice retains the smallest-capacity policy and insertion-order tie breaking. Each
  lifetime costs O(log A) for A physical allocations instead of filtering and sorting the entire
  allocation list. Texture allocation is unchanged.

## Sparse multiplication

Direct chunk routing scans the product of row blocks, aligned matrix spans and vector chunks.
When there are enough row blocks to reuse the work, gather indexed vector entries once per matrix
span, then run the existing scalar/subgroup/workgroup/long-row reducer against those gathered
entries. Source columns are never concatenated. Explicit dependencies let the next gathered span
reuse physical scratch after every consumer of the current span finishes.

For scalar, subgroup and workgroup execution, dispatches fall from R × N × V to N × (R + V).
A structural test with 32 row blocks, 16 matrix spans and 16 vector chunks drops from 8,192 to
768 commands, with one reusable eight-byte gathered allocation. Single-chunk and small-row cases
retain direct routing. Long-row partial buffers retain their own reusable lifetimes.

The gather path carries exact dispatch metadata so semantic predicates and explicit PCG gates
control every dispatch. Tests cover independent boundaries, empty chunks and rows, duplicate
entries, invalid indices with non-finite matrix values, modified input buffers on repeated encoding,
all four execution strategies, and borrowed-buffer ownership.

## Reproducible evidence

Run the CPU benchmark explicitly:

```sh
LUMA_TEST_FRAGMENTATION_BENCHMARK=true yarn test-node --no-coverage --reporter=verbose modules/gpgpu/test/gpu-core/gpu-fragmentation-benchmark.node.spec.ts
```

It reports range lookup, validation and graph compilation at 1,024, 4,096 and 16,384 chunks.
The graph contains a dependency chain and overlapping transient lifetimes. Range measurements
include identity assertions and view construction; compilation includes NullDevice allocations.

Run the GPU benchmark explicitly:

```sh
yarn test-browser-benchmarks --reporter=verbose modules/gpgpu/test/gpu-core/gpu-fragmentation-benchmark.spec.ts
```

It holds data volume at 256 rows/nonzeros and varies contiguous, four-chunk, sixteen-chunk and
skewed/empty layouts. It reports lowering, compilation, encoding, dispatch count and physical
scratch. GPU timestamps are included only when the selected device profile exposes them. Every
run checks the result; no timing threshold gates CI. Compilation intervals do not imply completion
of native asynchronous shader compilation, and browser timer resolution limits small samples.

## Local observation (2026-09-17)

Identical benchmark fixtures were run against the previous solver branch (`e088dcece`) and this
change based on master `2b6e2aee2`. The Apple/Metal core WebGPU profile did not expose timestamp
queries, so these are **CPU wall times**, not GPU execution speedups. Other work was running on
this host; timer resolution and contention make the timings directional evidence only.

| Fixed 256-row workload | Dispatches before → after | Compile median (ms) before → after | Encode median (ms) before → after | Gather scratch after |
| --- | ---: | ---: | ---: | ---: |
| Contiguous | 1 → 1 | 0.1 → <0.1 | 0.1 → 0.1 | 0 B |
| Four chunks per operand | 64 → 32 | 0.4 → 0.3 | 0.8 → 0.4 | 256 B |
| Sixteen chunks per operand | 4,096 → 512 | 174.4 → 2.3 | 36.6 → 3.8 | 64 B |
| Sixteen nonempty, skewed chunks | 4,096 → 512 | 176.4 → 2.4 | 46.7 → 3.8 | 964 B |

In the CPU-only 4,096-chunk fixture, graph compilation medians changed from approximately 347 ms
to 22.3 ms, range lookup/construction from 144 ms to 25.4 ms, and validation from 84.3 ms to
0.42 ms. The 16,384-chunk old-path measurements were highly variable under concurrent host load;
use the benchmark's raw annotations when investigating scaling rather than treating these samples
as portable throughput claims. Structural tests independently enforce dispatch and scratch bounds.

## Remaining debt

- General gather/scatter, sort, joins, binning and other indirect operators can still visit pairs
  of chunks. SpMV's new cost is quadratic when all three chunk counts grow together, rather than
  cubic. GPU-side routing queues or bounded multi-buffer kernels need workload evidence of their own.
- Shader source still specializes many physical offsets and lengths. Uniform-driven dispatch
  parameters and batching compatible dispatches can reduce pipeline variants in a later change.
- Texture hazard history and texture allocation retain their existing algorithms.
- This tranche does not claim chunked execution costs the same as contiguous execution. Fragment
  count still affects binding changes, dispatch count and memory traffic. Source repacking remains
  an explicit application choice, not an automatic fallback.
