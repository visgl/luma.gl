# Arisia solver and reduction consolidation

## Changes

- `GPUDotProductScalar` now uses the hierarchical reduction implementation for both graph and
  semantic program callers. Chunks are aligned by borrowed views, oversized bindings are sliced,
  and partial reductions use graph scratch. Norms use the same dot operation with identical inputs.
- Reductions expose exact per-level 3D dispatch metadata. Explicit gates are regenerated for each
  lowered node and the command graph supplies indirect encoding; primitives do not issue a second
  indirect dispatch through the graph's conditional pass.
- `GPUJacobiPCG` accepts independently chunked CSR/vector operands, preserves scratch topology,
  initializes `r = b - A*x`, and gates updates on convergence and positive curvature/preconditioned
  products. Scalar diagnostics distinguish breakdown from successful convergence.
- Semantic CG checks its initial residual before any division and publishes its last residual and
  breakdown status. Updating the residual precedes the final convergence predicate.
- Jacobi diagonal extraction sums duplicate entries across CSR chunks. Applying the diagonal uses
  the existing elementwise multiply.

## Removed parallel paths

The unfinished, unexported `GPUConjugateGradientExecutable`, thin hierarchical dot/norm wrappers,
`GPUApplyJacobiPreconditioner`, duplicate `GPUScalarConstant`, and unused reduction compatibility
module are removed. Their import-only tests are replaced with numerical solver and reduction tests.
No compatibility facade or new public program wrapper is added.

## Validation and remaining limits

Tests cover warm starts, already-solved initial guesses, independently partitioned CSR fields,
duplicate diagonal entries, zero/negative curvature, repeated execution, disabled/enabled GPU gates,
portable/subgroup reductions, and multi-level 3D dispatch.

The solvers remain float32 SPD methods with an absolute tolerance and bounded unrolled iteration
budget. No condition-number estimator, relative-tolerance policy, GMRES/BiCGSTAB solver, or general
preconditioner interface is introduced. Highly fragmented CSR multiplication retains the existing
chunk-intersection cost; compiler fusion, gate sharing and fragmentation benchmarks are the next
performance tranche. Native WebGPU independence and streaming are later boundaries.
