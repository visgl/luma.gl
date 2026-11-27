# GPU advection roadmap

Status: active, audited against the implementation on 2026-11-27.

The target is qualified GPU particle transport with inspectable execution and
predictable memory use. A visually convincing globe is not evidence of a
scientifically accurate spherical solver. SOTA claims require published accuracy,
interpolation, boundary and performance evidence for a stated class of fields.
This roadmap specializes [GPU graph tranche 8.5](gpugraph-roadmap.md).

## Current baseline

`@luma.gl/graph/experimental-simulation` provides regular collocated 2D sampling,
RK2/RK4 visual advection (`ScientificFlowGraph`) and forward adaptive RKF45
(`ScientificFlowTracer`). Both interpolate two resident snapshots and support
periodic longitude. RK45 has stable identities, explicit termination reasons,
bounded continuation, graph inspection and dispatch timings. Its local tolerance
is not a bound on total trajectory error. Geographic transport uses a local
metres-to-degrees conversion limited to ±85°; the weather globe uses illustrative
Cartesian atlas coordinates, not pole-crossing spherical transport.

The existing tests cover rotations, geographic units, temporal interpolation,
masks, snapshot rotation, dispatch budgets and periodic longitude. The opt-in
accuracy/cost benchmark reports GPU compute time, excluding readback and rendering.
No observational-data qualification or general speedup claim is established.

## Delivery tranches

Each row is independently reviewable. “Implemented” describes code in this change;
remaining portions are deliberately separate deliverables.

| Tranche | Status | Deliverable and exit evidence |
| --- | --- | --- |
| A1 — Separate error sources | Implemented | Manufactured spatial shear and time-quadratic fields compare RK45 with exact solutions for both sampled and continuous fields. Grid/snapshot refinement reduces interpolation error independently of integrator tolerance. |
| A2 — Conservative mask footprint | Implemented, RK45 opt-in | `conservativeMask` checks the interpolation footprint enclosing each accepted chord. Tests distinguish stage-only and conservative behavior at diagonal masked corners. It may stop early and is not exact coastline collision. |
| A3 — Bounded trajectory history | Implemented | `FlowTrajectoryHistory` records GPU copies into a fixed-capacity ring, with chronological offsets/timestamps, stable particle slots and explicit oldest-frame overwrite. Tests verify GPU contents, wraparound, reset and borrowed-source ownership. No hidden submission/readback. |
| B1 — Real-data qualification | Next | Commit a small redistributable, versioned ocean/wind fixture with source, license, checksum, units and preprocessing recipe. Compare retained trajectories against a pinned independent CPU/Parcels run; publish error versus grid, snapshot spacing and runtime. No live service required by CI. |
| B2 — True spherical transport | Planned after B1 | Integrate sphere positions and tangent velocities with a defined pole sampling convention. Exact solid-body rotations must cross both poles and the antimeridian without identity changes; report radius and trajectory drift. Keep atlas rendering separate from solver coordinates. |
| B3 — Boundary policies | Planned after A2 | Explicit stop, reflect and slip semantics, segment/cell intersection and coastline event localization. Qualify thin barriers, diagonal corners, narrow channels and temporal mask changes; do not silently change defaults. |
| C1 — Staggered grids | Planned | Rectilinear Arakawa C-grid sampling with face locations, masks and flux semantics preserved. Compare against independent manufactured divergence-free fields before curvilinear grids and vector-basis rotation. |
| C2 — GPU scheduling | Planned after A3 | Active-particle compaction and adaptive work queues preserving stable IDs; batch counter synchronization. Compare sparse/dense releases at equal error and report dispatch, readback, memory and end-to-end costs separately. |
| C3 — 3D transport | Planned after C1 | Explicit vertical units, coordinate transforms and time-varying vertical grids. Validate vertical shear, analytic 3D flow and boundary crossings before adding diffusion. |
| C4 — Stochastic transport | Planned after C3 | Reproducible counter-based random streams keyed by particle ID, time step and seed. Qualify ensemble mean/variance and convergence; deterministic advection tests do not establish diffusion accuracy. |

Recommended order: A1–A3, B1, B2. Ocean applications should prioritize B3/C1;
large interactive releases should prioritize C2. A2 does not complete B3, and A3
does not complete C2. Real-data qualification remains open after this PR.

## Architecture and acceptance gates

Keep sampling/integration/history in the graph simulation submodule. Format
loading and preprocessing belong in loaders.gl or application adapters; deck.gl
owns rendering, interaction and presentation. Shared graph operations should be
extracted only when two real consumers agree on field and boundary contracts.

For every numerical tranche, add an independent expected solution, failure cases,
and error-versus-cost evidence. Preserve explicit ownership, caller-controlled
submission, snapshot endpoint semantics and bounded workloads. Run the simulation
GPU tests, full build/tests and documentation build; do not label an unrun or
skipped GPU test as qualification. Benchmarks must identify hardware/backend,
particle count, field resolution, tolerance and readback inclusion.

## Reproduce the baseline

```bash
yarn test-headless --no-coverage modules/graph/test/experimental/simulation/scientific-flow
yarn test-headless --no-coverage modules/graph/test/experimental/simulation/flow-trajectory-history.spec.ts
LUMA_TEST_BROWSER_BENCHMARKS=true yarn test-headless --no-coverage --silent=false modules/graph/test/experimental/simulation/scientific-flow-benchmark.spec.ts
```

See the [tracer API](../../docs/api-reference/experimental/scientific-flow-tracer.md)
and [simulation notes](../../modules/graph/src/experimental/simulation/SCIENTIFIC-FLOW.md).
The [Parcels timestep/integrator guide](https://docs.oceanparcels.org/en/latest/user_guide/simulation_dt_integrators.html)
is a useful methodological reference for separating timestep, interpolation and
trajectory errors. The retained Parcels RKF45 attribution does not establish
whole-solver parity with Parcels.
