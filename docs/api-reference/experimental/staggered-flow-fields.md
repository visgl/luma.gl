# Staggered flow fields (Experimental)

`ScientificFlowGraph` (RK2/RK4) and `ScientificFlowTracer` (RK45) accept native
rectilinear Cartesian Arakawa C-grids through `StaggeredVectorFieldInput`, exported
from `@luma.gl/graph/experimental-simulation`. No collocation or face averaging is
performed. Both resident snapshots must use the same layout.

```typescript
const tracer = new ScientificFlowTracer(device, {
  input: {
    layout: 'c-grid',
    shape: [1, 2], // cell rows, cell columns
    eastward: new Float32Array([1, 1, 1]), // one row of three x-normal faces
    northward: new Float32Array([0, 0, 0, 0]), // two rows of two y-normal faces
    eastwardValid: new Uint8Array([1, 1, 1]),
    northwardValid: new Uint8Array([1, 1, 1, 1])
  },
  bounds: [0, 0, 100, 50], // exterior cell faces, in distance units
  positions: new Float32Array([0.25, 0.5]), // normalized position
  tolerance: 0.001,
  maximumTimeStep: 1,
  dispatchesPerReadback: 4
});
let result = await tracer.advance(10);
while (!result.complete) result = await tracer.continue();
tracer.destroy();
```

## Face and mask conventions

Rows run from south/lower y to north/upper y; columns run west/lower x to east/upper x.
For `shape: [rows, columns]`, eastward values have `rows * (columns + 1)` entries,
and northward values have `(rows + 1) * columns` entries. Each component has its
own equally sized validity array. Nonzero mask values mean valid. A closed face
must contain a **valid zero velocity**; a missing face stops sampling of its
adjacent cells instead of silently behaving as a wall. Every face of the sampled
cell must be valid, even if its interpolation weight is zero.

Values are normal **velocities**, in bounds distance units per second, not volume
transports. Convert volume transport by face area before uploading. Cell widths
are uniform on each axis. Geographic metrics, nonuniform/curvilinear grids,
vertical transport and vector-basis rotation remain unsupported.

Within a cell, the x component interpolates only between its left/right faces;
the y component interpolates only between its bottom/top faces. This lowest-order
face reconstruction preserves normal continuity and the finite-volume divergence
`(uRight - uLeft) / cellWidth + (vTop - vBottom) / cellHeight`. Tangential components
may jump across cell boundaries. It does not claim high-order ocean transport.

`periodicLongitude` wraps normalized x even for Cartesian fields. Paired left/right
normal face velocities and validity must match exactly. The conservative mask
traversal follows C-grid cells and checks both temporal footprints where relevant.
Snapshot interpolation and rotation retain the original face layout and masks.

## Qualification

GPU tests compare RK2/RK4/RK45 trajectories for manufactured divergence-free strain
with analytic exponential positions, crossing multiple cells. Additional tests cover
component masks, zero-flow faces, periodic temporal interpolation/rotation and invalid
contracts. The opt-in scientific-flow benchmark reports sparse/dense C-grid tracing
at a fixed error threshold with batch sizes 1, 4 and 16, discarded warmup and reversed
sample order. It separates compute time, end-to-end stepping time, counter bytes,
dispatch counts and buffer memory. These tests do not establish real-ocean accuracy.

### Example measurement

A local Apple WebGPU/Metal-3 run on 2026-11-27 used 4096 particles, a uniform
1 × 1 C-grid, a 0.64-second horizon, 0.01-second maximum timestep and 1e-5
tolerance. Two samples per configuration followed discarded warmup, with reversed
order. Stepping wall time includes counter and optional timing readback, but excludes
allocation, final particle readback and rendering. The shared host was under load.

| Active slots | Dispatches per readback | Counter synchronizations | Submitted dispatches | Mean wall time |
| --- | --- | --- | --- | --- |
| 4096 | 1 | 65 | 65 | 107.05 ms |
| 4096 | 4 | 17 | 68 | 39.80 ms |
| 4096 | 16 | 5 | 80 | 24.25 ms |
| 64 | 1 | 65 | 65 | 80.15 ms |
| 64 | 4 | 17 | 68 | 37.50 ms |
| 64 | 16 | 5 | 80 | 23.15 ms |

All configurations had position error 7.95e-7 or less in bounds units. Larger
batches reduced synchronization here but increased counter bytes and idle dispatches;
they do not compact the inactive slots. These small samples do not establish a
hardware-independent speedup. [Raw measurements](https://github.com/visgl/luma.gl/blob/master/dev-docs/benchmarks/advection-cgrid-batches.json)
include compute timing, byte counts and device metadata.
