# GPU Point Cloud

`@luma.gl/gpgpu/gpu-pointcloud` provides experimental WebGPU voxel sampling and radius filtering
as operations in a caller-owned `GPUCommandGraph`.

| Operation | Result | Cost |
| --- | --- | --- |
| `GPUPointCloudVoxelDownsample` | Representative source IDs, voxel populations, representative positions | O(points + voxels) time; O(voxels) output storage |
| `GPUPointCloudRadiusFilter` | Exact other-point neighbor counts and an outlier selection mask | O(points²) time; O(points) output storage |

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
