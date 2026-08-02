import {GPUPrimitivesDocsTabs} from '@site/src/components/docs/gpu-primitives-docs-tabs';

# GPUGridIndexQuery

<GPUPrimitivesDocsTabs active="grid-index-query" />

## Overview

`GPUGridIndexQuery` selects stable object IDs from cells intersecting a GPU-resident point, bounds,
or radius query. It publishes a capacity-bounded candidate list, the full stored-index candidate
count, an overflow flag, and an optional source-ID-addressed mask. The result feeds visibility,
compaction, picking policy, or an exact application predicate without CPU readback.

The word **candidate** is essential. A uniform grid indexes cells, not exact object geometry. A
point query returns every object in the containing cell; bounds and radius queries return every
object in an intersecting cell. This deliberately permits false positives so the index remains
independent of whether an ID represents a point, label, particle, span, polygon, or object with its
own bounds.

## Concepts

### Narrow first, test exactly second

Spatial acceleration is usually a two-stage operation:

```text
grid cell query → conservative candidate IDs → exact object predicate → visibility or picking
```

The grid stage should be cheap and reusable. An exact stage can then fetch application-owned data
for only those candidates: point distance for a radius, object bounds for an intersection, or
screen-space geometry for picking. Keeping those contracts separate prevents `GPUGridIndexQuery`
from embedding one object representation or claiming that cell overlap is an exact hit.

This matters most for large, selective queries. If a query covers most cells—or runs only once—an
unindexed GPU scan may do less total work because it avoids index construction and candidate
materialization.

### Query kinds

The packed `float32` query view is mutable between graph encodings:

| Kind | Query layout | Cell rule | Typical use |
| --- | --- | --- | --- |
| `point` | 2D: `[x, y]`; 3D: `[x, y, z]` | The one cell containing the point | Nearby labels, cursor candidates, simulation lookup |
| `bounds` | Minima followed by maxima | Every cell touching the query bounds | Rectangle selection, viewport candidates, box neighborhoods |
| `radius` | Center followed by radius | Every cell whose bounds intersect the circle or sphere | Proximity, collision broad phase, local influence |

Point coordinates use the same boundary rule as construction: a point on an internal boundary
selects the upper cell, while the domain maximum selects the final cell. Invalid point, reversed
bounds, non-finite values, and negative radii produce no candidates.

### Lists, masks, and overflow

The candidate `output` preserves stable IDs from `GPUGridIndex`, but atomic append order is
unspecified. `count` reports how many candidates exist in the stored index prefix even if the
output list is smaller. `overflow` becomes `1` when either the source index was truncated or the
candidate output lacks capacity. Source-index overflow is propagated even when the stored prefix
contains no match, because that apparently empty result may be incomplete.

An optional `outputMask` is cleared on every encoding and sets row `objectId` to `1` when that ID
fits the mask length. This form composes directly with `GPUMask` and `GPUVisibilityWorkflow` when
IDs address source rows. Sparse or application-global IDs may exceed the mask; they remain present
in the candidate list but do not write outside it.

### When to use it

Use candidate lists when the next pass should visit only spatially plausible IDs. Use the mask when
the next workflow already operates source-aligned over every row. A list is usually better for a
selective exact test; a mask is convenient for intersecting spatial membership with time, LOD,
hierarchy, or selection decisions.

Cell size remains the dominant tradeoff. Very small cells increase index offsets, clearing, and
the number of cells touched by broad queries. Very large cells return many false positives. The
right size depends on object density, query radius, update rate, and how many queries amortize one
build; the API does not pretend one grid is universally optimal.

## Usage

```ts
const index = new GPUGridIndex({
  positions,
  gridSize: [64, 64],
  bounds: [-180, -90, 180, 90],
  cellOffsets,
  objectIds: indexedObjectIds,
  count: indexCount,
  overflow: indexOverflow
});
index.addToGraph(graph);

new GPUGridIndexQuery({
  index,
  kind: 'radius',
  query: centerAndRadius, // packed float32 [x, y, radius]
  output: candidateIds,
  count: candidateCount,
  overflow: candidateOverflow,
  outputMask: candidateMask
}).addToGraph(graph);
```

For three dimensions, a radius query contains `[x, y, z, radius]`; bounds contain
`[minX, minY, minZ, maxX, maxY, maxZ]`. Updating the query buffer and encoding the compiled graph
again changes the candidates without rebuilding graph structure.

The primitive neither builds the index nor applies exact object tests. It does not submit, grow
capacity, sort or deduplicate IDs, or download results. Queries over an overflowed source index are
explicitly marked incomplete.
