# SphericalFlowTracer

`SphericalFlowTracer` provides forward adaptive RKF45 on global unit-sphere
positions. Import it from `@luma.gl/graph/experimental-simulation`. It uses the
same [world-vector field contract](spherical-flow-graph.md#field-and-state-contract)
as fixed-step `SphericalFlowGraph`, with physical local-error control and bounded
continuation instead of a fixed substep count.

```typescript
import {SphericalFlowTracer} from '@luma.gl/graph/experimental-simulation';

const tracer = new SphericalFlowTracer(device, {
  input: {shape: [latitudeCount, longitudeCount], velocity},
  positions: new Float32Array([1, 0, 0]),
  radius: 6371000, // metres; input velocity must use metres/second
  tolerance: 1,   // local embedded chord-error estimate, metres
  maximumTimeStep: 60,
  maximumAttempts: 32
});
let result = await tracer.advance(3600);
while (!result.complete) result = await tracer.continue();
// Inspect result statuses: completion also includes explicitly stopped particles.
tracer.destroy();
```

## Integration and field contract

Each stage normalizes its Cartesian direction, samples the global world-vector
field, projects velocity into the tangent plane, and divides by `radius`.
The embedded fourth/fifth-order candidates are normalized; their chord-distance
difference times `radius` supplies the local error estimate. Rejected trials halve
the step; accepted estimates below one tenth of `tolerance` may double it. This
estimate is **not** a bound on global trajectory error or field interpolation error.

`maximumTimeStep` is required and is additionally capped by angular grid spacing
and maximum resident velocity. `minimumTimeStep` defaults to 1e-4 seconds,
`initialTimeStep` to the caller's maximum, and `maximumAttempts` to 32 (range 1–256).
Rejected trials consume the attempt budget. A failure at the minimum step reports
`ToleranceFailure`; it is never force-accepted. Non-finite arithmetic or an
unrepresentable progress increment reports `NumericalFailure`. Computation uses float32.

The dense field includes matching seam endpoints and one world vector at each pole;
masks and missing cells are unsupported. `nextInput` and `timeRange` enable linear
physical-time interpolation. At a completed resident endpoint, call
`setNextSnapshot(input, endTime)` with a matching grid. Extrapolation is rejected.

## Bounded execution and ownership

`advance(duration)` and `continue()` each submit one dense bounded dispatch and
explicitly read 36 bytes of counters. They return `ScientificFlowTraceResult`,
including statuses, accepted/rejected work, pending slots, committed/target clocks,
the actual graph encoding and optional GPU compute duration. No particle-state
readback occurs implicitly. `complete` means each slot reached the horizon or
terminated explicitly. The committed `time` stays unchanged until completion.

Calls must not overlap; finish pending work before starting another horizon or
rotating snapshots. Await outstanding readback before `destroy()`. A submission or
readback failure prevents further advancement. Constructor failures release allocated
resources. Particle indices remain stable; no respawning occurs. `lifetime` defaults
to 1e30 seconds and clips the final accepted step to the expiration age.

| Borrowed buffer | Four float32 values per stable slot |
| --- | --- |
| `output` | Unit Cartesian x/y/z and physical age in seconds |
| `previous` | State before the latest advance/continue call |
| `diagnostics` | Request elapsed seconds, proposed timestep, `ScientificParticleStatus`, last accepted timestep |

The spherical tracer currently uses dense scheduling and one dispatch per call.
Cartesian batching and survivor queues are not implicitly applied to this solver.

## Inspection and qualification

`commandGraph` exposes `reset-spherical-counters` and `trace-sphere-rk45`. Register
it with the graph inspector and record `result.encoding` for each call. Execute
through `advance()`/`continue()`; direct graph encoding bypasses request lifecycle.
GPU time covers integration, excluding counter readback and trail rendering.

Vector Observatory enables Adaptive RK45 in the **Pole-crossing globe · spherical**
preset, with tolerance, Diagnostics, Graph and Trace controls. It retains the bounded
Cartesian trail history and great-circle rendering used by RK2/RK4.

Tests use an exact projected uniform world-vector field, with `z = tanh(t)` on a
unit sphere, to check adaptive rejection and convergence without spatial sampling
error. Separate sampled solid-body rotations cross both poles and the seam and
qualify grid refinement at fixed tolerance. Temporal tests use the exact integral
of linearly changing velocity and a physical lifetime endpoint. These are
manufactured-field checks, not observational or multi-hardware qualification.
