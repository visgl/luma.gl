# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl, without dependencies on Apache Arrow,
loaders.gl, or deck.gl.

`makeGPUSplatData(...)` prepares caller-owned GPU data. `SplatRenderer` supports WebGPU and WebGL2;
`GPUSplatGraphRenderer` progressively streams preserved batches through reusable WebGPU command
graphs, global GPU sorting, and one indirect draw. `GPUPagedSplatRenderer` projects sparse rows
from independently owned source pages into bounded GPU segments while preserving one global
cross-page depth order.

Prepared batches support degree-one through degree-three spherical harmonics, semantic class IDs,
and in-place row updates. Both rendering paths evaluate view-dependent radiance and filter semantic
classes. `SplatPicker` and `GPUSplatGraphPicker` resolve original source rows; their corresponding
mixed-scene helpers compose splats with caller-owned depth-tested meshes.

`SplatHierarchyManager` traverses frustum-culled, foveated source hierarchies while preserving
coarse parent fallback and bounded asynchronous loading. `SplatRADHierarchyManager` follows
Spark's authored per-row global child links, retaining mixed source-page leaves and parent
fallback until the complete child frontier is resident. `SplatResidencyManager` bounds intact
streamed batches by GPU bytes, rows, or chunks. Structural glTF adapters accept decoded
`KHR_gaussian_splatting` attributes, mesh feature IDs, and caller-owned SPZ v2 decoder handoffs.

Use optional `expectedSplatCount` and `expectedBatchCount` hints to reserve graph capacity.
Renderers borrow source batches, preserve HDR colors, and must be destroyed before their data.

Install the experimental package with `yarn add @luma.gl/splats`. Its APIs may evolve without a
9.4 semver compatibility promise.

See [luma.gl](https://luma.gl/docs/api-reference/splats) for documentation.
