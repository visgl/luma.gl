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
Cartesian atlas coordinates. The separate `SphericalFlowGraph` and pole-crossing preset integrate unit Cartesian sphere positions with dense world-vector snapshots; adaptive spherical transport remains open.

The existing tests cover rotations, geographic units, temporal interpolation,
masks, snapshot rotation, dispatch budgets and periodic longitude. The opt-in
accuracy/cost benchmark reports GPU compute time, excluding readback and rendering.
A pinned quantized GFS model-wind fixture supplies independent CPU trajectory
references. No observational-data qualification or general speedup claim is established.

## Delivery tranches

Each row is independently reviewable. A1–A3 shipped in #3956. A4, B1a and B3a
shipped in #3963. The visual follow-up adds A5 and the B1b1
controlled model-wind sweeps; observational qualification and boundary policies remain separate deliverables.

| Tranche | Status | Deliverable and exit evidence |
| --- | --- | --- |
| A1 — Separate error sources | Shipped | Manufactured spatial shear and time-quadratic fields compare RK45 with exact solutions for both sampled and continuous fields. Grid/snapshot refinement reduces interpolation error independently of integrator tolerance. |
| A2 — Conservative mask footprint | Shipped in #3956, refined by B3a | `conservativeMask` checks the interpolation footprint enclosing each accepted chord. Tests distinguish stage-only and conservative behavior at diagonal masked corners. It may stop early and is not exact coastline collision. |
| A3 — Bounded trajectory history | Shipped | `FlowTrajectoryHistory` records GPU copies into a fixed-capacity ring, with chronological offsets/timestamps, stable particle slots and explicit oldest-frame overwrite. Tests verify GPU contents, wraparound, reset and borrowed-source ownership. No hidden submission/readback. |
| A4 — Explicit trajectory readback | Implemented | `readFrames()` returns chronological CPU snapshots with at most two contiguous reads of populated slots. Tests cover empty/partial/wrapped history, reset during readback and destruction protection. |
| B1a — Archived model-wind fixture | Implemented | Pinned six-hour GFS Atlantic fixture with retained ISC notice, source hashes and a regeneration script. Four releases at hourly horizons must agree with an independent refined CPU RK4 reference within 5 m. Tests run offline. |
| A5 — Visual trajectory playback and export | Implemented in visual follow-up | Archived GFS map with 73 bounded GPU captures, explicit CPU playback, UTC/physical-coordinate CSV export, reference overlays and RK45 Graph/Trace inspection. |
| B1b1 — Controlled accuracy/cost sweeps | Implemented in visual follow-up | Reproducible GFS tolerance/timestep, grid-decimation and frozen-snapshot variants, discarded warmup and two samples with reversed order. Reports common-horizon error, work, GPU/wall time, memory and backend metadata; browser table and JSON export. |
| B1b2 — Broader real-data qualification | Next | Publish grid/snapshot/tolerance-versus-cost sweeps, hardware details and observational/ocean fixtures. The quantized GFS fixture establishes agreement on that stored model field, not meteorological accuracy or Parcels parity. |
| B2a — Global spherical fields | Implemented in spherical follow-up | Dense Cartesian world-vector snapshots, explicit global seam/pole conventions, tangent projection and linear physical-time interpolation. Reject inconsistent seam and pole data. |
| B2b — Pole-crossing transport | Implemented in spherical follow-up | Unit-sphere RK2/RK4 with stable identities, bounded dispatches, snapshot rotation and Graph/Trace inspection. Manufactured rotation tests cover both poles, antimeridian, radius drift and grid refinement. Separate visual preset uses equal-area seeds. |
| B2c — Adaptive spherical qualification | Next | Adaptive spherical integration, broader fields and hardware accuracy/cost evidence; qualify sampling near poles independently of timestep and replace atlas trail clipping with geodesic rendering. |
| B3a — Crossed-cell mask traversal | Implemented | Bounded traversal checks cells actually entered by an accepted chord, detecting brief masked intersections between RK stages and avoiding adjacent-cell false positives at simultaneous corners. Periodic seams remain qualified. |
| B3b — Boundary policies | Planned after B3a | Explicit stop, reflect and slip semantics, segment/cell intersection and coastline event localization. Qualify thin barriers, diagonal corners, narrow channels and temporal mask changes; do not silently change defaults. |
| C1 — Staggered grids | Planned | Rectilinear Arakawa C-grid sampling with face locations, masks and flux semantics preserved. Compare against independent manufactured divergence-free fields before curvilinear grids and vector-basis rotation. |
| C2 — GPU scheduling | Planned after A3 | Active-particle compaction and adaptive work queues preserving stable IDs; batch counter synchronization. Compare sparse/dense releases at equal error and report dispatch, readback, memory and end-to-end costs separately. |
| C3 — 3D transport | Planned after C1 | Explicit vertical units, coordinate transforms and time-varying vertical grids. Validate vertical shear, analytic 3D flow and boundary crossings before adding diffusion. |
| C4 — Stochastic transport | Planned after C3 | Reproducible counter-based random streams keyed by particle ID, time step and seed. Qualify ensemble mean/variance and convergence; deterministic advection tests do not establish diffusion accuracy. |

Recommended order: B1b2, B2c. Ocean applications should prioritize B3b/C1;
large interactive releases should prioritize C2. Chord traversal does not complete
B3b, and retained/readable history does not complete C2. Broader real-data
qualification remains open after the GFS fixture.

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
