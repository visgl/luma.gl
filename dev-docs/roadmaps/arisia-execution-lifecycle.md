# Arisia execution lifecycle

## FFT2D consolidation

`GPUFFT2D` now follows the ordinary primitive contract: CPU-only construction, graph views,
`getCommandNodes(graph)`, graph-owned scratch, and compiled-node lifetime for kernels and immutable
parameters. The standalone device/encode/destroy API and its encode-options type are removed.
Ocean, FFT bloom and Spectral Wave Lab use compiled graphs with explicit direction and normal
external buffer rebinding. No compatibility wrapper is retained.

The contiguous path preserves the existing 8-by-8 FFT kernel, pass order and packed batch dispatch.
Parameters now include input/output view offsets. Chunked or oversized packed batches use two
single-transform scratch fields and storage-only gather/scatter passes over borrowed spans.
Scratch does not grow with the logical batch count. A complete matrix must still fit one storage
binding; this is a bounded radix-2 FFT, not an out-of-core transform.

Forward and inverse are separate operations. Consumers retaining separate compiled graphs keep
one scratch allocation per direction; FFT bloom therefore reports five complex buffers instead
of four. A later shared execution planner can reuse scratch across separately compiled plans.

## Validation

Numerical tests compare rectangular and square forward transforms with a CPU DFT, then check
inverse round trips. They cover multiple transforms, independently split chunks, nonzero offsets,
sentinels around borrowed spans, repeated encoding, binding replacement, and partial compilation
failure cleanup. Ocean and bloom integration tests exercise the production callers.

## Remaining execution and solver work

The source audit corrected the earlier assumption that all solver/reduction helpers were
device-owned:

- `GPUJacobiPCG` already declares graph scratch and nodes. It still assumes a zero initial
  solution, uses single-view intermediates, and needs numerical convergence/breakdown coverage.
- `GPUFloat32HierarchicalReduction` already uses graph resources. Consolidate it with the
  vector-capable `GPUDotProductScalar` path, retaining hierarchical reduction performance and
  checking per-level gated dispatch geometry. Its optional second-input ownership check also
  needs a regression test for unary reductions.
- `createGPUConjugateGradientProgram` is the semantic solver path. Add coverage for an already
  converged initial guess before executing any division, and for repeated chunked bindings.
- The unexported `GPUConjugateGradientExecutable` is an unfinished duplicate with no-op
  initialization helpers. Remove it when consolidating solver execution and replace its import-only
  test with numerical solver tests.

The next substantial PR should consolidate these solver/reduction paths together. Subsequent
tranches can then focus on compiler optimization, fragmentation performance, DataFrame integration,
streaming, and reducing the remaining engine/device dependency.
