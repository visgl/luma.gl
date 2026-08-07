# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl, without dependencies on Apache Arrow,
loaders.gl, or deck.gl.

`makeGPUSplatData(...)` prepares caller-owned GPU data. `SplatRenderer` supports WebGPU and WebGL2;
`GPUSplatGraphRenderer` progressively streams preserved batches through reusable WebGPU command
graphs, global GPU sorting, and one indirect draw.

Prepared batches support degree-one through degree-three spherical harmonics, semantic class IDs,
and in-place row updates. Both rendering paths evaluate view-dependent radiance and filter semantic
classes. `SplatPicker` and `GPUSplatGraphPicker` resolve original source rows; their corresponding
mixed-scene helpers compose splats with caller-owned depth-tested meshes.

`SplatHierarchyManager` traverses frustum-culled, foveated source hierarchies while preserving
coarse parent fallback and bounded asynchronous loading. `SplatResidencyManager` bounds intact
streamed batches by GPU bytes, rows, or chunks. Structural glTF adapters accept decoded
`KHR_gaussian_splatting` attributes, mesh feature IDs, and caller-owned SPZ v2 decoder handoffs.

Use optional `expectedSplatCount` and `expectedBatchCount` hints to reserve graph capacity.
Renderers borrow source batches, preserve HDR colors, and must be destroyed before their data.

This private package is not published to npm. Reference it from another luma.gl workspace with
`"@luma.gl/splats": "workspace:*"`.

See [luma.gl](https://luma.gl/docs/api-reference/splats) for documentation.
