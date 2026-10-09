# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl, without dependencies on Apache Arrow,
loaders.gl, or deck.gl.

`makeGPUSplatData(...)` prepares caller-owned GPU data. `SplatRenderer` supports WebGPU and WebGL2;
`GPUSplatGraphRenderer` progressively streams preserved batches through reusable WebGPU command
graphs, global GPU sorting, and one indirect draw. `GPUPagedSplatRenderer` projects sparse rows
from independently owned source pages into bounded GPU segments while preserving one global
cross-page depth order.

For host render loops, call `GPUPagedSplatRenderer.prepare(commandEncoder)` before opening the
host pass, then `draw(renderPass)` inside it. The renderer does not clear, end, or submit a
borrowed pass. `encode(commandEncoder)` remains available for renderer-owned presentation.

Prepared batches support degree-one through degree-three spherical harmonics, semantic class IDs,
and in-place row updates. Both rendering paths evaluate view-dependent radiance and filter semantic
classes. `SplatPicker` and `GPUSplatGraphPicker` resolve original source rows; their corresponding
mixed-scene helpers compose splats with caller-owned depth-tested meshes.

`SplatHierarchyManager` traverses frustum-culled, foveated source hierarchies while preserving
coarse parent fallback and bounded asynchronous loading. `SplatRADHierarchyManager` follows
Spark's authored per-row global child links, retaining mixed source-page leaves and parent
fallback until the complete child frontier is resident. It retargets the retained coherent tree
across camera changes so resolved visible detail does not collapse while bounded traversal
reprioritizes and discovers branches. `SplatResidencyManager` bounds intact streamed batches by
GPU bytes, rows, or chunks. Structural glTF adapters accept decoded `KHR_gaussian_splatting`
attributes, mesh feature IDs, and caller-owned SPZ v2 decoder handoffs.

`selectView(view)` selects a fresh best-first complete cut; `refineView(view)` reprioritizes the
retained cut and publishes coherent intermediate sibling replacements. Both reserve required
ancestor/sibling pages and bound page demand. Progressive camera retargeting walks the retained
tree synchronously; run selection in a worker when large cuts would block the render loop.
Generic `SplatResidencyData` and `SplatRADHierarchyData` allow CPU-only worker metadata without
allocating a GPU device. The host still owns GPU admission and must acknowledge it before the
worker treats decoded pages as resident.

Use optional `expectedSplatCount` and `expectedBatchCount` hints to reserve graph capacity.
Renderers borrow source batches, preserve HDR colors, and must be destroyed before their data.

This private package is not published to npm. Reference it from another luma.gl workspace with
`"@luma.gl/splats": "workspace:*"`.

See [luma.gl](https://luma.gl/docs/api-reference/splats) for documentation.
