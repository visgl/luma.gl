import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUBVHQuery

<GPUPrimitivesDocsTabs active="bvh-query" />

## Overview

`GPUBVHQuery` traverses a flat `GPUBVH` for exact point containment or axis-aligned bounds
intersection. It keeps the query and results on the GPU, rejects disjoint subtrees, and publishes
stable leaf IDs through the same capacity, count, overflow, and optional-mask contract used by the
grid-index query path.

This is useful for viewport and box selection, object-level visibility, simulation neighborhoods,
and the broad phase of picking. It is especially valuable when object sizes vary or the domain is
sparse: a uniform grid may then touch many empty cells or return many false positives. It is not a
ray tracer, and it does not make a source-order hierarchy spatially good. The exposed
`visitedCount` makes that distinction measurable.

## Concepts

### Level-ordered traversal

The complete-binary topology gives every node a known depth. The query begins with the root active,
then runs one compute pass per depth. An active internal node whose bounds match activates both
children; a disjoint node activates neither. Matching leaves append their stable IDs atomically.

This breadth-first design uses a bounded active-node mask instead of a hidden per-invocation stack.
Its work and memory are therefore explicit and portable across WebGPU implementations. Output ID
order is unspecified because parallel leaves append atomically; stable identity, not traversal
order, is the contract.

### Exact predicates

A point query returns leaves whose closed bounds contain the point. A bounds query returns leaves
whose closed bounds intersect the query bounds. Touching edges count as intersections. Non-finite
points, non-finite query bounds, and reversed query bounds match nothing. Empty BVH leaves and
invalid source bounds also match nothing.

Unlike a grid query, these tests are exact for axis-aligned leaf bounds. An application querying
circles, meshes, glyphs, or another shape should treat the result as a broad phase and apply its
shape-specific predicate afterward.

### Count, capacity, masks, and overflow

`count` reports every match in the stored BVH even when `output` is too small. `overflow` is set when
the BVH itself omitted source leaves or the query output capacity truncates matches. The optional
source-ID-addressed `outputMask` contains only IDs actually stored in `output`, so it is deliberately
incomplete when overflow is set. This prevents a truncated candidate set from looking complete.

All output state is reset on every graph encoding. The caller can update the packed query buffer and
encode the compiled graph again without rebuilding the hierarchy or recompiling the graph.

### Topology quality is observable

`visitedCount` reports how many node bounds were tested, including the root. A selective query on a
well-grouped hierarchy should visit substantially fewer nodes than the full tree. A source-order
hierarchy with heavily overlapping parents may visit nearly all nodes while still returning correct
results.

That metric supports an honest scan/grid/BVH comparison and a future topology-builder decision. A
BVH should be selected because measured pruning and query reuse repay its build or refit cost, not
because its asymptotic name sounds faster.

### Choosing scan, grid, or BVH

- Prefer an unindexed scan for small inputs, broad one-off queries, or data that changes before an
  index can be reused.
- Prefer a grid for similarly sized objects in a bounded domain when regular cell lookup and build
  throughput dominate.
- Prefer a BVH for sparse domains, widely varying object sizes, or queries that can reject coherent
  groups of bounds.

Always include build or refit time, query reuse, selectivity, memory, candidate refinement, and
overflow in the comparison.

## Usage

```ts
const query = new GPUBVHQuery({
  bvh,
  kind: 'bounds',
  query: queryMinimaAndMaxima,
  output: candidateIds,
  count: candidateCount,
  overflow: candidateOverflow,
  outputMask: candidateMask,
  visitedCount
});

query.addToGraph(graph);
```

The point query contains two or three packed `float32` values, matching the BVH dimension. The
bounds query contains minima followed by maxima and therefore contains four or six values. All
views must be packed and belong to the target command graph. The primitive does not allocate
caller-visible output, submit commands, read results back, or apply application-specific geometry
tests.
