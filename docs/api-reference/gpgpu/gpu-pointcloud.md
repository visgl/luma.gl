# GPU Point Cloud

`@luma.gl/gpgpu/gpu-pointcloud` provides experimental WebGPU voxel sampling, radius filtering and additive octree construction
as operations in a caller-owned `GPUCommandGraph`.

| Operation | Result | Cost |
| --- | --- | --- |
| `GPUPointCloudVoxelDownsample` | Representative source IDs, voxel populations, representative positions | O(points + voxels) time; O(voxels) output storage |
| `GPUPointCloudRadiusFilter` | Exact other-point neighbor counts and an outlier selection mask | O(points²) time; O(points) output storage |
| `GPUPointCloudOctree` | Source-ID ranges and sparse additive octree nodes | Stable sort + O(points × depth) work; O(points) scratch |

## Compose downsampling and filtering

```ts
import {GPUPointCloudVoxelDownsample, GPUPointCloudRadiusFilter} from '@luma.gl/gpgpu/gpu-pointcloud';

// Inputs and outputs are caller-allocated GraphDataViews in the same graph.
graph.add(new GPUPointCloudVoxelDownsample({
  positions, origin: [-1, -1, -1], voxelSize: 0.125, gridSize: [16, 16, 16],
  representatives, counts: voxelCounts, output: sampledPositions
}));
graph.add(new GPUPointCloudRadiusFilter({
  positions: sampledPositions, validity: voxelCounts,
  radius: 0.22, minimumNeighbors: 3, counts: neighborCounts, mask
}));
const compiled = graph.compile();
```

The resulting mask and sampled position buffer can drive instanced rendering directly. If compact
output is needed, explicitly compose `GPUCompaction` over representative IDs using the mask and a
caller-owned output count. Sampling preserves source provenance: every accepted representative ID
indexes the original input position view.

## Voxel contract

- Positions and output positions are packed `float32x3`; counts and IDs are packed `uint32`.
- `gridSize` contains three positive integer dimensions; all three voxel output views have exactly
  their product in rows. The grid is dense and bounded, not an unbounded spatial hash.
- Coordinates use `floor((position - origin) / voxelSize)` and x-fastest ordering:
  `(z * height + y) * width + x`.
- Bounds are half-open: the minimum is included and the maximum excluded. Non-finite positions
  and points outside the grid do not contribute.
- Each occupied voxel selects the minimum input row ID deterministically. This is representative
  sampling, not centroid averaging. Counts preserve the source population per cell (including the representative itself).
  Bind this count as a per-instance attribute to size reduced points: radius proportional to
  `sqrt(count)` makes their displayed area proportional to the represented population.
- Empty voxels have count zero, representative `0xffffffff`, and position `[0, 0, 0]`. Always use
  counts as validity; a real point may be at the origin.
- Outputs are reset on every encoding, so reusing a compiled graph does not accumulate stale counts.

## Radius contract

The radius is inclusive. The query point itself is excluded; distinct rows at identical coordinates
are neighbors. Optional validity flags exclude rows from both queries and candidate searches.
Non-finite query positions produce zero counts and a zero mask. The mask is one when a valid query
has at least `minimumNeighbors` other valid points within the radius; the default threshold is one.
Squared radius must be positive and finite in float32. Choose a coordinate scale that avoids
squared-distance overflow and expect float32 rounding near boundaries.

This initial radius implementation scans every candidate for every valid query. Use it for bounded
clouds or after voxel sampling. It is not a spatially accelerated million-point neighborhood query,
and there is no silent candidate truncation.

## Ownership and batching

Inputs and outputs are non-owning `GraphDataView`s with support for nonzero byte offsets. Output
buffers must be separate from input buffers. Writable output storage bindings must remain disjoint
after their start offsets are rounded down to 256-byte alignment; disjoint logical views alone are
not sufficient. Use separate buffers or leave sufficient aligned space between output views. The caller owns
allocation, graph compilation, encoding, submission, rendering and optional readback. Destroying
compiled kernels does not destroy imported buffers.

Initial operations accept one resident packed view per attribute, fitting device storage-binding
limits. They never concatenate streaming chunks. Sampling separately per batch produces per-batch
representatives; global voxel merging requires an explicit future operation.

[Run the cleanup lab](/examples/experimental/gpu-pointcloud) to compare original samples with voxel
representatives filtered by local density. Normal estimation and registration are future extensions.

## Additive octree

`GPUPointCloudOctree` partitions source row IDs into sparse octree tile ranges while preserving
original positions. Draw a node's range together with its ancestors' ranges for additive refinement.
Across the complete tree every accepted source row occurs exactly once, including distinct rows
with identical coordinates. No position or other attribute buffers are reordered.

```ts
import {GPUPointCloudOctree, GPU_POINT_CLOUD_OCTREE_NODE_STRIDE} from '@luma.gl/gpgpu/gpu-pointcloud';

// Caller-created, packed GraphDataViews in the same graph:
// positions: float32x3[N], pointIndices: uint32[N],
// nodes: uint32[nodeCapacity * GPU_POINT_CLOUD_OCTREE_NODE_STRIDE], status: uint32[4].
graph.add(new GPUPointCloudOctree({
  positions, pointIndices, nodes, status,
  origin: [-1, -1, -1], size: 2,
  maximumDepth: 6, nodePointLimit: 64, samplingLevels: 2
}));
```

The root is a cube from `origin` to `origin + size`, including both faces. Coordinates and extent
must be representable in float32; nonfinite or out-of-bounds points are rejected and counted.
`maximumDepth` is 0–10 (default 6), using at most 30 Morton bits. The root is depth zero.

Each nonterminal node samples the first Morton-ordered point in each occupied finer cell, up to
`nodePointLimit` (default 64). `samplingLevels` (1–10, default 2) controls the finer grid: up to
`2^samplingLevels` cells per axis, limited by the remaining depth. Stable sorting resolves equal
Morton keys by source row ID. If the cap is smaller than the occupied sample-cell count, earlier
Morton cells win; this is deterministic spatial sampling, not unbiased sampling. Nodes with at
most the point limit terminate early. At maximum depth leaves retain **all** remaining points,
even when that exceeds the limit. Unselected IDs pass to children without duplicating parent data.

### Outputs

`pointIndices` contains source row IDs in breadth-first node order. Each node owns one nonempty,
contiguous `[pointOffset, pointOffset + pointCount)` range. This is an indirection buffer that can
be bound as storage for attribute gathering, or as an index buffer when the rendering path supports
it and the caller allocated the corresponding usage. It does not contain gathered attributes.

`nodes` contains eight packed `uint32` words per node (`GPU_POINT_CLOUD_OCTREE_NODE_STRIDE = 8`):

| Word | Field | Meaning |
| --- | --- | --- |
| 0 | Morton prefix | Octant path, three bits per level; XYZ use bits 4/2/1 |
| 1 | Level | Root is zero |
| 2 | Parent | Node index; root uses `0xffffffff` |
| 3 | First child | First contiguous child node; leaf uses `0xffffffff` |
| 4 | Child mask | One bit per occupied child octant; children are in octant order |
| 5 | Point offset | Element offset into `pointIndices`, not bytes |
| 6 | Point count | Points owned by this tile only |
| 7 | Subtree count | This tile plus all descendants; excludes ancestor-owned points |

Recover bounds by starting with the root cube and halving it for each octant in the prefix, from
most significant to least significant. A child octant's node index is `firstChild` plus the number
of set mask bits below that octant. For a coarse conservative refinement error, use the node cube's
diagonal; a smaller sample-cell error is not guaranteed when the sample budget is capped.

`status` is exactly four words: **required node count, retained point count, rejected point count,
overflow flag**. Only consume the tree when overflow is zero. Node capacity may be smaller than
needed; writes are guarded and status reports the required capacity for an explicit retry.
Allocating `N` node records always suffices because every created node owns at least one source
row. `pointIndices` must have capacity at least `N`. An empty or wholly rejected input creates no
nodes. Every encoding resets metadata, counts and unused IDs (to `0xffffffff`).

### Cost and integration

Construction uses a stable Morton sort followed by fixed GPU scan/partition passes per depth:
O(N × depth) work after sorting, O(N) scratch, with no intermediate CPU readback or dense `8^depth`
allocation. Each level scans the original capacity, even after the active set shrinks. Storage
binding limits and graph scratch allocations bound the resident cloud size; this is not an
out-of-core or incremental streaming tiler. Changing bounds or construction options requires a
new graph; changed source values of the same size can reuse the compiled graph.

The additive ownership contract matches additive point-cloud tiling, but sample selection and
metadata are not a byte-compatible loaders.gl tile-source adapter. Serialization, network loading,
view-dependent traversal and integration with `PointCloudTileSource` remain separate work.

[Run the additive octree example](/examples/experimental/gpu-pointcloud-octree) to inspect tile
bounds and progressively reveal detail without rebuilding the tree.
