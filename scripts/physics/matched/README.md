# Matched Box3D / WebGPU benchmarks

This suite compares **real native Box3D** with luma.gl's **browser WebGPU rigid-body
solver** on the same host. It is not a WebAssembly comparison, a general engine ranking,
or an assumption that Box3D's trajectory is ground truth. The first profile covers
centered sharp boxes and rigid center-to-center distance joints.

## Run

Use Node from `.nvmrc`, CMake >= 3.22, a C17 compiler, Git, and the repository's installed
Playwright Chromium. The reference builder fetches the exact commit in
`box3d-reference.json` into the system temporary directory and compiles Release with
SIMD enabled and float32 positions. It does not install or vendor Box3D into luma.gl.
A supplied `--source` must be clean and at that exact revision. The report records the
license, revision, compiler configuration, host and actual worker count.

```sh
yarn install
yarn vite examples/experimental/physics-stress --host 127.0.0.1 --port 5242 --strictPort
# In a second terminal:
node scripts/physics/matched/run.mjs --output matched.json
node scripts/physics/matched/report.mjs matched.json > matched.md
```

Useful options:

- `--scenes matchedPile,matchedMixed,matchedStack,matchedChain,matchedFast,matchedBallistic`
- `--count 32 --seed 42 --frames 360 --warmup 60 --substeps 4 --repeats 3`
- `--timeStep 0.016666666666666666 --iterations 16 --solver ordered`
- `--workers 1` or `--workers 4`: explicit native CPU worker count; do not compare these as one lane.
- `--stride 6`: quality snapshot interval in outer frames. Use `--stride 1` for fast-motion investigations.
- `--profile`: separate timestamp-instrumented GPU replay; primary timings remain uninstrumented.
- `--software`: portability smoke test, with hardware ratios disabled.
- `--source /path/to/pinned/box3d --build /path/to/build`: reuse a local clean checkout/build.
- `--url http://127.0.0.1:5242/`: another local Vite server for this checkout.

Joint chains require the ordered GPU solver and at most 64 links. The other scenarios
can run with `--solver parallel`. Sweep `--count 32`, `128`, `512`, `2048` separately
for pile/mixed scenes and sweep solver iterations/substeps; compare the quality/cost
frontier, not a single iteration count. The suite does not silently change budgets,
resize failed GPU work queues, or substitute an engine when compilation fails.

## Matching contract

`examples/experimental/physics-stress/matched-fixtures.ts` is the only scenario generator.
It creates deterministic SI positions, quaternions, velocities, box extents, masses,
materials and joints. Both adapters preserve order; the JSON includes the complete
fixture and SHA-256. Initial state is checked against that fixture, independently of
the other engine. Boxes have analytical uniform-density inertia, origin-centered COM,
zero damping and disabled sleeping. Materials are uniform within a scene, avoiding
mixing-policy differences. Both engines use the same outer timestep and substep count.
Box3D Soft Step and luma's solver algorithms are different: an equal substep count does
not imply equal convergence. Native worker count, GPU iterations and actual adapter
identity stay visible in every report.

The fast scenario rotates bars between thin, very tall walls. It tests both translation
and rotation without intentionally allowing the bars to go around a wall. Box3D enables
continuous collision; luma selects its convex CCD path with rollback on incomplete work.
The suite rejects incomplete execution instead of counting a rolled-back/frozen step
as successful physics. The live Stress Lab exposes all six inputs, with its existing
pause/reset, solver controls and GPU Graph tabs. That diagnostic renderer reads poses
back and is **not** the performance runner.

## Timing and quality are separate replays

Each repetition creates fresh worlds. Engine order alternates between repetitions.
Warmup advances the scene; the measured window then follows exactly the same simulated
time for both engines. Creation, compilation, rendering, diagnostic reads and state
snapshots are excluded from primary timing. Native time wraps `b3World_Step`; GPU
completion includes encoding, submission and a completion fence, with one frame in
flight. This intentionally exposes small-world dispatch/synchronization cost.
Optional GPU timestamps use an additional replay and report summed pass work, not wall
latency. Readback and profiling can perturb scheduling even outside a timed interval;
repeat runs on an otherwise idle machine before interpreting small differences.

A fresh quality replay evaluates sampled poses using independent CPU geometry:

| Metric | Meaning |
| --- | --- |
| OBB penetration | Maximum minimum-translation overlap from 15-axis SAT, excluding static/static and disabled connected pairs |
| Joint error | Maximum absolute distance error in meters |
| Ballistic error | Euclidean error against the analytic constant-gravity trajectory |
| Energy | Translational + rotated-box rotational kinetic energy + gravity potential; reports gain and conservative-scene absolute relative error |
| Escapes | Fast bodies entirely beyond either wall at a sampled frame |
| Quaternion error | Maximum deviation from unit length |
| Moving bodies | Final bodies above the declared linear/angular speed thresholds; not a sleep claim |

Declared experimental budgets are in `QUALITY_BUDGETS`: 3 cm penetration, 2 cm joint
error, 20 cm ballistic error, 0.001 quaternion error, 5% energy gain, 10% absolute energy
error for conservative scenes, and no escapes. These are **bounded comparison budgets**,
not SOTA certification. Reports retain raw metrics and failures; ratios are withheld
unless both engines meet the budgets, all GPU steps complete, initial states match and
every GPU replay reports a non-fallback integrated or discrete adapter. Unknown adapter
identities do not qualify as hardware evidence. Dissipative pile scenes are not penalized for expected energy loss.
Sampled overlap is not an exact swept-contact oracle; transient errors between samples
can be missed. Independent replays may diverge chaotically without either being wrong.

CPU memory is Box3D's allocated-byte counter. GPU memory is logical graph-buffer
capacity, not VRAM residency or total browser memory. Reports keep these separate.
Missing/failed scenarios remain error rows. Exit code 2 means incomplete execution;
quality failures remain data rather than preventing an adversarial benchmark report.

The native adapter currently targets macOS and Linux (POSIX monotonic timing).
Both lanes audit body masses and inertia against the shared box parameters before
qualifying a run. Reports record source hashes, the reference compiler and build flags.

## Reproducibility and CI

The Node tests check independent metrics against analytic cases and validate fixture
encoding. The reference smoke workflow builds the pinned C implementation and runs
small real-engine scenes with SwiftShader; it checks adapter wiring and complete work,
not hardware performance. Full hardware runs are opt-in. Raw JSON includes per-step
samples, each repetition, trajectories, quality gates, capacities and provenance. Use
`report.mjs` for a compact table without discarding that evidence.

Remaining comparison lanes: Box3D WebAssembly, wider native worker sweeps, cross-vendor
GPU runs, contact-rich large-world scale, off-center COM/compound/mesh geometry and
controlled CPU/GPU power or thermal measurements. None are implied by this first profile.
