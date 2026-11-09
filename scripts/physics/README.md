# GPU physics qualification

The executable profile in `qualification-profile.json` tracks the pinned, unratified
physics proposals separately from engine quality requirements. Import, GPU behavior,
work budgets, and performance are separate checks. Loading a sample is not evidence
that all its physics features work.

Generate Vitest JSON reports using the repository test projects, for example:

```sh
yarn exec vitest run --project node modules/engine/test/gltf/physics --reporter=json --outputFile=/tmp/physics-import.json
yarn exec vitest run --project node modules/graph/test/gpu-physics --reporter=json --outputFile=/tmp/physics-node.json
yarn exec vitest run --project headless modules/graph/test/gpu-physics --reporter=json --outputFile=/tmp/physics-gpu.json
node --test scripts/physics/qualification-report.test.mjs
```

GPU tests must explicitly skip when WebGPU is unavailable. A skipped or absent test
is missing evidence, never a behavior pass. A failed run takes precedence over a
passing retry supplied in the same report set.

Start the glTF Physics example's Vite server, then run the isolated broad-phase
benchmark against its local URL:

```sh
node scripts/physics/benchmark-broad-phase.mjs --url http://127.0.0.1:5197/ --count 10000 --samples 20 > /tmp/physics-discovery.json
node scripts/physics/qualification-report.mjs /tmp/physics-import.json /tmp/physics-node.json /tmp/physics-gpu.json /tmp/physics-discovery.json
```

The benchmark disables the example entry point in its own browser page. It reports
adapter identity, device limits, software fallback, logical allocated buffer bytes,
graph node count, compilation time, CPU encoding, completion/readback latency, and
GPU timestamps when supported. Three warmup steps precede the requested samples.
`--software` requests a software baseline; it cannot satisfy hardware qualification.
Use `--fixture sparse` for separated objects and `--fixture dense` to exercise output
and traversal budgets. Incomplete discovery exits with status 2 and reports its
counters. Pair identity is checked outside the timed region.

These timings cover **broad-phase discovery only**. They do not qualify full rigid-body
simulation, a contact solver, rendering, or continuous collision detection. Keep raw
reports with the device and browser information when comparing measurements.

The combined qualification report exits with status 2 until every required G1–G3
check has evidence. It also reports the remaining G4–G7 features, without allowing
them to be mistaken for implemented support. Update selectors when tests change;
missing selectors deliberately fail qualification instead of silently passing.

## Complete rigid-body steps

Start the Rigid Body Lab server, then run its isolated full-step benchmark:

```sh
node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5198/ --fixture deep --solver parallel --iterations 64 --warmup 120 --samples 30 > /tmp/rigid-step.json
```

Fixtures match the lab: `stack`, `deep`, `massRatio`, `support`, `friction`, `mesh`, `mixed`,
`impact`, `torque`. Compare ordered and parallel modes at the same timestep,
iterations, initial state and observation duration, then compare numerical error.
`--time-step`, `--warm-start-factor` and `--maximum-pairs` expose controlled sweeps.
`--software` explicitly requests software GPU execution.

Each sample encodes one full physics step, including discovery, contact generation,
solving, integration and lifetime diagnostics. There is at most one pending step.
Completion latency includes the 64-byte diagnostic readback; GPU timestamp work and
span do not include host readback latency. Compilation is reported separately.
Warmup advances the scene, so sleep/contact density at measurement time affects cost.
The renderer never starts in the benchmark page. Close other GPU workloads when
comparing runs, and retain adapter/browser/settings and raw reports.

`executionComplete` requires finite final state, the expected step count and no
lifetime failure/saturation. Incomplete execution exits with status 2. This field
is not an accuracy, proposal-conformance or performance-budget qualification, and
these reports do not automatically satisfy the combined qualification profile.
Final state is read outside the timed region for independent numerical comparison.
Logical world-buffer and graph-buffer totals are not measured VRAM residency.

Mechanisms fixtures `cradle`, `pendulum`, `hinge` and `slider` require `--solver ordered`.
For example: `node scripts/physics/benchmark-rigid-body.mjs --url http://127.0.0.1:5233/ --fixture hinge --solver ordered`.
The default is `--failure-policy report`; use `--failure-policy rollback` to include
checkpoint and restoration passes. `--broad-phase all-pairs` and
`--broad-phase hierarchical-grid` compare discovery strategies. The cradle uses
elastic low-speed contacts; use `--time-step 0.0020833333333333333` to match its
480 Hz example. Compare numerical behavior as well as timings.

## Recovery and analytic qualification

The profile also tracks the recovery and analytic fixtures in
`rigid-body-recovery.spec.ts` and `rigid-body-qualification.spec.ts`. Run those through
`yarn test-headless --no-coverage` for focused development, then run the full suite.
Recovery checks compare a small-budget replay to a generous-budget world, including
failure on a later tick after kinematic commands. Numerical checks use independent
slab, sphere-intersection, ballistic and elastic-impact formulas, rather than treating
one GPU implementation as the only accuracy oracle.

The Physics Stress Lab (`yarn workspace luma.gl-examples-experimental-physics-stress start`)
exports per-tick completion measurements and recovery counts. This includes host/GPU
synchronization and readback, and replay samples include compilation. These exports
are exploratory evidence, not automatic hardware qualification passes.


## Compaction and difficult-contact qualification

Use `--full-scan` with `benchmark-rigid-body.mjs` to compare against the default compact
parallel queue at identical solver settings and pair capacity. `--fixture sparseContacts
--maximum-pairs 8192 --warmup 0` exercises an overprovisioned sparse world; impacts
separate early, so later samples include empty-contact steps. Reports include last-step
`solverWork` and full-step GPU/completion timings. Do not equate pair invocation reduction
with a proportional full-step speedup.

`rigid-body-compaction.spec.ts` checks scan parity, empty/rebuilt queues, capture/restore,
and 80 independent contacts spanning two workgroups. `rigid-body-contact-geometry.spec.ts`
uses closed-form signed depths and normals. The three stack qualification suites bound
sampled drift, support separation and final energy across two timesteps, with sleeping
disabled, 64 pair slots, 64 iterations, warm-start factor 0.8 and recovery fraction 0.1. Each test describes a bounded numeric envelope, not general SOTA coverage.

## Box3D comparison

The [matched benchmark suite](./matched/README.md) builds a pinned real Box3D reference,
runs the same authored boxes/joints through native CPU and browser WebGPU adapters,
and reports independent simulation-quality metrics alongside repeated timing samples.
The corresponding `matched*` scenarios are available in Physics Stress Lab.

## Authored-scene publication qualification

`benchmark-publication.mjs --url http://127.0.0.1:5241/ --count 10000 --samples 30`
measures and verifies the GPU body-node matrix/AABB publisher. Start the
`examples/gltf/authored-scene-stress` Vite server first. Add `--software-gpu` for
separate fallback evidence. Feed the JSON report to `qualification-report.mjs`
alongside node/headless JSON reports. The G6 publication selector requires hardware.
See `dev-docs/benchmarks/gpu-physics-publication.md` for timing boundaries.
