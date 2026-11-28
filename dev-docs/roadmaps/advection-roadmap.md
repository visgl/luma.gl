# GPU advection roadmap

Status: active, audited against the implementation on 2026-11-28.

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
Cartesian atlas coordinates. The separate `SphericalFlowGraph` and pole-crossing preset integrate unit Cartesian sphere positions with dense world-vector snapshots; `SphericalFlowTracer` now provides bounded adaptive RKF45 with physical chord-error control (#4007). Broader spherical qualification remains open.

The existing tests cover rotations, geographic units, temporal interpolation,
masks, snapshot rotation, dispatch budgets and periodic longitude. The opt-in
accuracy/cost benchmarks distinguish compute timing from end-to-end simulation
wall time, including synchronization but excluding rendering. Whole-frame
comparative qualification remains open.
A pinned quantized GFS model-wind fixture supplies independent CPU trajectory
references. No observational-data qualification or general speedup claim is established.

The [pinned source audit](advection-source-audit.md) examines Mapbox, wind-layer,
MapLibre, Cesium, deck.gl-community, earth and Parcels implementations. It separates
weather presentation, deterministic transport and scientific ocean/dispersion goals.
No head-to-head performance ranking has been measured. See the audit for source
revisions, review limits and the comparison protocol.

## Delivery tranches

Each row is independently reviewable. A1–A3 shipped in #3956. A4, B1a and B3a
shipped in #3963. A5 and B1b1 shipped in #3974, and B2a/B2b shipped in #3975; observational qualification and boundary policies remain separate deliverables.

| Tranche | Status | Deliverable and exit evidence |
| --- | --- | --- |
| A1 — Separate error sources | Shipped | Manufactured spatial shear and time-quadratic fields compare RK45 with exact solutions for both sampled and continuous fields. Grid/snapshot refinement reduces interpolation error independently of integrator tolerance. |
| A2 — Conservative mask footprint | Shipped in #3956, refined by B3a | `conservativeMask` checks the interpolation footprint enclosing each accepted chord. Tests distinguish stage-only and conservative behavior at diagonal masked corners. It may stop early and is not exact coastline collision. |
| A3 — Bounded trajectory history | Shipped | `FlowTrajectoryHistory` records GPU copies into a fixed-capacity ring, with chronological offsets/timestamps, stable particle slots and explicit oldest-frame overwrite. Tests verify GPU contents, wraparound, reset and borrowed-source ownership. No hidden submission/readback. |
| A4 — Explicit trajectory readback | Implemented | `readFrames()` returns chronological CPU snapshots with at most two contiguous reads of populated slots. Tests cover empty/partial/wrapped history, reset during readback and destruction protection. |
| B1a — Archived model-wind fixture | Implemented | Pinned six-hour GFS Atlantic fixture with retained ISC notice, source hashes and a regeneration script. Four releases at hourly horizons must agree with an independent refined CPU RK4 reference within 5 m. Tests run offline. |
| A5 — Visual trajectory playback and export | Shipped in #3974 | Archived GFS map with 73 bounded GPU captures, explicit CPU playback, UTC/physical-coordinate CSV export, reference overlays and RK45 Graph/Trace inspection. |
| B1b1 — Controlled accuracy/cost sweeps | Shipped in #3974 | Reproducible GFS tolerance/timestep, grid-decimation and frozen-snapshot variants, discarded warmup and two samples with reversed order. Reports common-horizon error, work, GPU/wall time, memory and backend metadata; browser table and JSON export. |
| B1b2 — Broader real-data qualification | Next | Publish grid/snapshot/tolerance-versus-cost sweeps, hardware details and observational/ocean fixtures. The quantized GFS fixture establishes agreement on that stored model field, not meteorological accuracy or Parcels parity. |
| B2a — Global spherical fields | Shipped in #3975 | Dense Cartesian world-vector snapshots, explicit global seam/pole conventions, tangent projection and linear physical-time interpolation. Reject inconsistent seam and pole data. |
| B2b — Pole-crossing transport | Shipped in #3975 | Unit-sphere RK2/RK4 with stable identities, bounded dispatches, snapshot rotation and Graph/Trace inspection. Manufactured rotation tests cover both poles, antimeridian, radius drift and grid refinement. Separate visual preset uses equal-area seeds. |
| B2c1 — Independent polar sampling | Shipped in #3988 | Direct GPU sampling tests cover both poles, small polar offsets, seam-adjacent queries and spatial refinement without an integrator. `atan2` latitude preserves float32 near-pole offsets. |
| B2c2 — Geodesic globe trails | Shipped in #3988 | Bounded GPU Cartesian history renders subdivided great-circle arcs with camera reprojection and back-face clipping. GPU image assertions cover pole/seam continuity, ring wrap and paused orbiting. No atlas pole cutoff. |
| B2c3a — Adaptive spherical solver | Shipped in #4007 | Bounded Cartesian RKF45 with physical chord-error control, continuation, explicit lifetime/tolerance termination, temporal snapshot rotation and Graph/Trace inspection. Exact projected-flow and pole/seam rotation tests separate integrator and grid errors. |
| B2c3b — Broader spherical qualification | Next | Reversing time-dependent rotation now joins the manufactured cases. Broader fields and multi-adapter accuracy/cost evidence remain open. Manufactured adaptive tests do not establish observational accuracy or general solver parity. |
| B3a — Crossed-cell mask traversal | Implemented | Bounded traversal checks cells actually entered by an accepted chord, detecting brief masked intersections between RK stages and avoiding adjacent-cell false positives at simultaneous corners. Periodic seams remain qualified. |
| B3b1 — Localized boundary events | Next for ocean work | Locate the first mask/domain crossing with a bounded error; preserve termination reasons. Test thin barriers, corners, channels and temporal masks. |
| B3b2 — Slip-aware interpolation | After B3b1 and geographic grid contracts | Free/partial-slip field reconstruction with explicit land masks. Compare independent coastal references; endpoint reflection is not slip interpolation. |
| B3b3 — Reflection policy | Optional after B3b1 | Define normals, remaining-step integration and repeated collisions; test corners and curved boundaries. Never change default termination implicitly. |
| C1 — Rectilinear staggered grids | Shipped in #3999 | Native Cartesian C-grid normal-face velocities and separate masks. Lowest-order face reconstruction preserves cell divergence. Analytic strain, periodic temporal transport and mask-contract tests; geographic metrics, curvilinear grids and vector-basis rotation remain open. |
| C2a — Batched counter synchronization | Shipped in #3999 | Configurable bounded RK45 dispatch batches with immutable uniforms, one contiguous counter readback, aggregate work and per-dispatch graph inspection. Sparse/dense accuracy-cost benchmark and equivalence tests preserve stable particle slots. |
| C2b1 — Active GPU scheduling | Shipped in #4003 | Opt-in bounded stable-ID queue and GPU-written indirect RK45 dispatch. All-slot lifecycle/status accounting, empty-queue suppression, mixed completion, continuation and adaptive-rejection equivalence tests. Queue construction still scans all slots. |
| C2b2 — Scheduling qualification and inspection | Shipped in #4003 | Sparse/dense matched-error sweeps with 1/16-dispatch batches, actual integration-slot/workgroup telemetry, memory and end-to-end costs including queue construction. Vector Observatory exposes scheduling/batch controls and both GPU graph passes. Dense remains the default. |
| C2b3 — Persistent adaptive work queues | Shipped in #4007 | Ping-pong survivor queues scan all slots once per horizon, preserve stable IDs and cumulative statuses across continuation, and rebuild at snapshot/request boundaries. Dense/active/persistent matched-error wall-time measurements include queue maintenance, previous-state copies and readback. |
| C1b — Geographic C-grid metrics | Next for ocean work | Physical face metrics and local vector bases; seam-aware flux reconstruction on a geographic rectilinear grid. Compare divergence and trajectories with pinned references. |
| C1c — Curvilinear grids | After C1b | Cell localization, inverse mapping, basis rotation and local cell-travel limits. Validate warped cells and coastal model fixtures. |
| C1d — Unstructured mesh sampling | Deferred after C1c | Explicit node/face/edge placement and bounded neighbor search; qualify mesh-edge crossings. Not implied by C-grid support. |
| C2c1 — Spherical batching | Implemented | One counter readback per bounded dense batch, with per-dispatch graph inspection and equivalent state/work across snapshot rotation. |
| C2c2 — Spherical survivor queues | Implemented | Persistent queues match dense state/work on reversing flow. The initial globe comparison reached the same display cadence in both modes. |
| C3 — 3D transport | Planned after C1 | Explicit vertical units, coordinate transforms and time-varying vertical grids. Validate vertical shear, analytic 3D flow and boundary crossings before adding diffusion. |
| C4a — Uniform 2D diffusion | After explicit stochastic time contract; does not require C3 | Counter-based random streams, stable IDs and a defined physical noise timestep. Qualify mean/variance, scheduling invariance and boundary behavior. |
| C4b — Variable diffusivity | After C4a | Diffusivity-gradient drift, selected Euler–Maruyama/Milstein scheme and retry/noise semantics. Qualify strong/weak convergence; extend to 3D only after C3. |
| C5 — Backward deterministic transport | Planned | Signed physical horizons, reverse snapshot residency and explicit age/lifetime semantics. Test time-dependent forward/backward references; exclude stochastic time reversal. |
| C6 — Cell-local integration limits | After grid contracts | Local cell-travel caps independent of RK tolerance; investigate analytical C-grid transport separately with explicit temporal assumptions. Compare boundary accuracy and cost before adoption. |

## Web delivery and qualification tranches

These additions follow the source audit. Rendering remains in engine/deck.gl;
loading remains in loaders.gl/application adapters. They do not all belong in graph.

| Tranche | Scope and owner | Exit evidence |
| --- | --- | --- |
| D1 — Bounded temporal residency | Graph defines resident intervals/readiness; adapters load and prefetch | Byte budgets, cancellation, out-of-order completion, snapshot-boundary continuity and pause/backpressure on unavailable data. No silent extrapolation. |
| D2 — Tiled field sampling | Graph sampling plus adapter-owned residency | RK-stage stencil halos, stable particle identity across tiles, dateline edges and missing-neighbor behavior. Start at a fixed resolution; qualify LOD changes separately. Visual tile-edge dropout is not scientific transport. |
| D3 — Presentation quality | Engine/deck.gl | Density consistency, explicit visual reseeding/prewarm, speed-color legends, trail width/fading, depth and camera reprojection. Reuse existing geodesic ribbons; fixed-camera and orbit/zoom image tests plus mobile frame budgets. |
| D4 — Existing layer integration | deck.gl-community/application adapters | Reuse FlowParticleLayer's borrowed-resource lifecycle with an explicit texture/buffer state adapter; optional graph-backed station-field transport. Preserve WebGL2 visual support and expose scientific-mode requirements rather than replacing every backend. |
| Q1 — Comparative qualification harness | Tests, fixtures and reports | Pinned upstream versions, matched data/interpolation/termination policies and error. Report compute, full simulation and whole-frame times separately, with memory, uploads, percentiles, warmup and multi-adapter evidence. |

## Recommended sequence and claim boundaries

1. **Next numerical PR: Further B2c3b/Q1 qualification.** Extend spherical survivor qualification and measure complete globe frames at heavier loads and on other adapters, including trails and
   counter synchronization. Publish failures and unsupported adapters as well as wins.
2. **Next web delivery PR: D1 + a B1b2 fixture slice.** Stream a reproducible global
   weather sequence through bounded residency, with units/provenance and independent
   trajectories. Keep observational validation distinct from agreement on model data.
3. **Next visual PR: D3 + D4.** Reuse existing renderer/layer contracts and compare
   equivalent camera paths and visible quality. Do not count aesthetic reseeding as
   scientific accuracy. Then tackle D2 fixed-resolution tiles and later LOD transitions.
4. **Ocean track: B3b1 + C1b, then B3b2/C1c.** Match grid and boundary semantics
   before comparing with Parcels. C3 follows vertical-coordinate contracts; C1d is
   a separate, larger scope. C5 is useful for source attribution independently of 3D.
5. **Dispersion track: C4a, then C4b.** Two-dimensional diffusion need not wait for
   3D transport, but it does require a reproducible stochastic time discretization.

A web-visualization claim needs D1–D4/Q1 evidence for its stated data/device class;
a deterministic transport claim needs B1b2/B2c3b and the relevant grid/boundary
qualifications. General Parcels parity would additionally require much broader
model/grid/process coverage and is not the immediate target. In particular, Parcels'
pinned RK45 accepts over-tolerance trials at its minimum step; ours terminates with
`ToleranceFailure`. Reference comparisons must record this intentional difference.

The [survivor measurements](../benchmarks/advection-survivor-scheduling.md) establish
an internal scheduling improvement on one adapter (1.45× initial, 2.57× repeat),
not a win over another library or an application frame-rate improvement. The
[spherical accuracy/cost report](../benchmarks/spherical-rk45-cost.md) qualifies a
manufactured field, not global observational accuracy.

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
