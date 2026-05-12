# @luma.gl/gpgpu

General-purpose GPU computation module for luma.gl.

The Arrow-facing v1 API provides out-of-place `ArrowGPUTransform` operations for
`add`, `interleave`, `segment`, `desegment`, and `fround`. `evaluateGPUComputeGraph()`
evaluates operation trees built with factories such as `arrowAdd`, `arrowInterleave`,
`arrowUpload`, `arrowDeinterleave`, `arrowSegment`, `arrowDesegment`, `arrowFround`, and
`arrowProjectWGS84ToPseudoMercator`, or explicit operation classes such as
`ArrowAddOperation`. Inputs are never mutated or destroyed; returned
`ArrowGPUVector`s own generated GPU buffers. In-place mutation helpers are available
only through underscored experimental exports until ownership and aliasing
semantics are finalized.

```ts
const result = evaluateGPUComputeGraph(arrowInterleave([arrowAdd(x, y), z], {name: 'packed'}));
```

See [luma.gl](https://luma.gl) for documentation.
