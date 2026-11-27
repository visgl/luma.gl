# SphericalFlowGraph

`SphericalFlowGraph` performs fixed-step RK2/RK4 particle transport on a sphere with
WebGPU. Import it from `@luma.gl/graph/experimental-simulation`. Particle state is
Cartesian, so crossing a pole or the antimeridian neither terminates nor respawns
a particle. This experimental API is separate from the geographic, latitude-bounded
[`ScientificFlowTracer`](scientific-flow-tracer.md).

```typescript
import {SphericalFlowGraph} from '@luma.gl/graph/experimental-simulation';

const flow = new SphericalFlowGraph(device, {
  input: {shape: [latitudeCount, longitudeCount], velocity},
  positions: new Float32Array([1, 0, 0]),
  radius: 6371000,
  integrator: 'rk4',
  maximumTimeStep: 60
});
flow.advance(60);
// Borrow flow.output for rendering; readAsync() is an explicit application choice.
flow.destroy();
```

## Field and state contract

`shape` is `[latitude rows, longitude columns]`, with at least three of each.
Rows span −90° to +90° and columns span −180° to +180°, including both endpoints.
`velocity` contains interleaved world Cartesian x/y/z values, row-major; z points
north and x points toward longitude zero on the equator. Velocity uses distance
units per second and `radius` uses the same distance unit. Convert east/north
components into this fixed Cartesian basis before upload.

Both seam endpoints must match. Every column at a pole must describe the same
world vector. These invariants are checked with a relative float tolerance.
Missing cells and masks are unsupported. Bilinear interpolation acts on world
vectors; the solver projects each sample into the particle's tangent plane.

`positions` contains interleaved Cartesian directions, normalized at upload.
`output` and `previous` are borrowed buffers containing four float32 values per
stable particle slot: unit x/y/z and elapsed age in seconds. The last buffer is
the state before the most recently encoded batch, not its last substep. No
lifetime or automatic reseeding applies.

## Time, recording and ownership

Use `nextInput` together with `timeRange: [startSeconds, endSeconds]` for linear
snapshot interpolation. Advance only within the resident interval. At its endpoint,
`setNextSnapshot(input, endSeconds)` retains the endpoint field, installs the next
one and preserves particle states and identities. Steady fields omit both options.

`maximumTimeStep` is the smaller of the caller cap (default 1/30 second) and an
angular-grid travel cap based on the maximum snapshot speed. This is not an error
tolerance or a guarantee of resolving every longitudinal cell near the poles.
Qualify both spatial resolution and timestep for each field.

`advance(duration)` submits at most 4096 substeps in one dispatch and performs no
CPU readback. For caller-owned submission, use
`record(encoder, deltaTime, substeps)`, then submit before recording again or
rotating snapshots. `commandGraph` exposes the actual compute pass for graph
inspection and profiling. The graph owns its two particle buffers, snapshots,
uniforms and kernel; `destroy()` releases them. Finish using recorded commands
before destruction.

## Qualification and limits

The GPU tests compare solid-body rotations against analytic positions through both
poles and the antimeridian, check unit-radius drift and stable slots, and separate
grid refinement from integration using time-varying angular speed. These tests
qualify dense manufactured global fields, not weather forecast accuracy. Adaptive
spherical RK45, masked boundaries, staggered grids and observational qualification
remain follow-ups.

The Vector Observatory's **Pole-crossing globe · spherical** preset uses an
illustrative evolving rotation and equal-area release. Its separate atlas renderer
suppresses very long longitude segments at pole crossings; this visual limitation
does not alter solver positions.
