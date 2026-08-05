# @luma.gl/splats

Experimental Gaussian splat rendering utilities for luma.gl, without dependencies on Apache Arrow,
loaders.gl, or deck.gl.

`makeGPUSplatData(...)` prepares caller-owned GPU data. `SplatRenderer` supports WebGPU and WebGL2;
`GPUSplatGraphRenderer` progressively streams preserved batches through reusable WebGPU command
graphs, global GPU sorting, and one indirect draw.

Use optional `expectedSplatCount` and `expectedBatchCount` hints to reserve graph capacity.
Renderers borrow source batches, preserve HDR colors, and must be destroyed before their data.

This private package is not published to npm. Reference it from another luma.gl workspace with
`"@luma.gl/splats": "workspace:*"`.

See [luma.gl](https://luma.gl/docs/api-reference/splats) for documentation.
