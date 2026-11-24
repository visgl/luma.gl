# G8 difficult-contact solving

G8 adds an opt-in manifold-block solver, matched difficult-contact workloads, an
independent stack-drift gate and a fully 3D Stress Lab. The production default stays
`parallelContactSolver: 'scalar'`. This checkpoint establishes a quality/cost comparison;
it does not establish general performance leadership or close the cross-device roadmap.

## Solver change

The existing parallel path under-relaxes each contact update by the maximum dynamic
body degree. The new `parallelContactSolver: 'block'` path copies one manifold into
private invocation state, performs two local projected Gauss–Seidel sweeps, then
relaxes its total impulse and velocity change once. Four local sweeps were investigated
first, but added GPU arithmetic cost without a compelling completion-latency advantage.

Pair owners still write only their own manifold and velocity deltas. A separate body
owner gathers incident deltas. Dispatch boundaries provide synchronization. Local
sweeps add no dispatches, global atomics or CPU synchronization. Normal impulses remain
nonnegative; the final interpolation preserves the convex friction cone. Warm starts,
compact/full-scan queues and island sleeping retain their existing contracts.

A global iteration still costs two dispatches. Reducing global iterations trades global
coupling convergence for local patch convergence; it is not universally beneficial.
The new mode is deliberately selectable rather than silently changing defaults.

## Qualification

The block-contact regressions exercise eight-high stacks, 10:1 loaded stacks and offset
centers of mass at 120 and 240 Hz. The nightly matrix also runs each for 30 seconds
at 120 Hz, without sleeping. Separate tests exercise a compound on an incline with both compact and
full-scan queues. Sleeping is disabled. The stack gates bound lateral/vertical drift,
support separation and residual kinetic energy. The incline test bounds drift and
linear/angular speed throughout its run. Elastic impact tests check momentum in both
contact modes.

The matched suite shares identical sharp-box geometry, mass, inertia, friction,
restitution, initial state, timestep and substeps between native Box3D and WebGPU.
`matchedDense` creates a close cubic pile; `matchedLoaded` creates eight-high columns
with a 10:1 top load. `matchedStack` retains ordinary eight-high columns. The independent
CPU metric evaluates OBB penetration and a 12 cm lateral-drift budget for stationary
stacks, alongside the existing energy, quaternion and completion gates. Sleeping is
disabled in both engines. A failed Box3D budget remains a failure, not a new tolerance.

Run the sequential matrix with:

```sh
node scripts/physics/matched/g8.mjs --url http://127.0.0.1:5255/ --output g8-results
```

The default is 30 simulated seconds, 64 dynamic boxes, four substeps per 1/60-second
frame, three repetitions and three solver configurations: scalar/24, block/12 and
block/24. Each configuration runs dense, loaded and ordinary stack fixtures. Timing,
quality and GPU timestamp profiling are independent replays. The script retains full
compressed raw reports and readable summaries. Run 128 and 512 bodies separately to
extend the scale curve, with identical scene/window settings across lanes.

## Measurements

Recorded November 13, 2026. Each lane uses 64 dynamic bodies, 600 outer frames
(10 simulated seconds), 20 warmup frames, four substeps, two timing repetitions and
one outstanding GPU frame. Quality is sampled every six frames, including initial
and final poses. These results use `--frames 600 --repeats 2`, rather than the runner's
30-second/three-repeat defaults. [Machine-readable summaries](./physics-g8.json)
retain the fixture, source hashes, quality gates, adapter and stage distributions.
The runner emits full raw timings and trajectories as compressed JSON.

The adapter reports Apple/Metal 3 and `fallback: false`, but `gpuType: unknown`.
Hardware ratios are therefore withheld by the existing qualification policy. The host
was also running development workloads: native timing variation makes these exploratory
quality/cost observations, not controlled release performance certification.

| Lane | Scene | Completion p95 ms | GPU work p95 ms | Solver p95 ms | Native p95 ms |
| --- | --- | ---: | ---: | ---: | ---: |
| scalar-24 | matchedDense | 26.00 | 14.41 | 9.80 | 0.383 |
| scalar-24 | matchedLoaded | 22.60 | 12.24 | 8.28 | 0.586 |
| scalar-24 | matchedStack | 22.90 | 12.23 | 8.31 | 0.260 |
| block-12 | matchedDense | 18.00 | 11.67 | 7.60 | 0.127 |
| block-12 | matchedLoaded | 17.10 | 11.65 | 7.62 | 0.081 |
| block-12 | matchedStack | 16.50 | 11.76 | 7.65 | 0.033 |
| block-24 | matchedDense | 23.50 | 18.00 | 14.09 | 0.088 |
| block-24 | matchedLoaded | 23.70 | 18.27 | 14.32 | 0.100 |
| block-24 | matchedStack | 23.60 | 16.30 | 12.92 | 0.067 |

| Lane | Scene | GPU max overlap m | GPU stack drift m | GPU final moving bodies | Quality native / GPU |
| --- | --- | ---: | ---: | ---: | --- |
| scalar-24 | matchedDense | 0.0030 | n/a | 0 | maximumPenetration / pass |
| scalar-24 | matchedLoaded | 0.0070 | 0.0573 | 24 | pass / pass |
| scalar-24 | matchedStack | 0.0057 | 0.0590 | 3 | pass / pass |
| block-12 | matchedDense | 0.0044 | n/a | 0 | maximumPenetration / pass |
| block-12 | matchedLoaded | 0.0077 | 0.0232 | 35 | pass / pass |
| block-12 | matchedStack | 0.0060 | 0.0343 | 10 | pass / pass |
| block-24 | matchedDense | 0.0032 | n/a | 0 | maximumPenetration / pass |
| block-24 | matchedLoaded | 0.0058 | 0.0263 | 18 | pass / pass |
| block-24 | matchedStack | 0.0038 | 0.0143 | 4 | pass / pass |

All GPU lanes completed and passed the declared sampled budgets. Box3D exceeds the
3 cm penetration budget in the dense-drop scene (about 4.18 cm); that failed row is
retained. Residual motion is reported separately: passing overlap/drift budgets does
not mean every box is motionless. The small 64-body native lane remains substantially
cheaper than browser WebGPU. Fewer global dispatches help the block/12 lane here, but
these measurements do not justify replacing the default or claiming large-world gains.

## 3D inspection

The Stress Lab uses retained engine scenegraph objects, shared PBR materials and spot
shadows. GPU pose matrices feed `SceneRenderer` directly, including after recovery
replaces the world's allocations. Boxes, spheres, cooked meshes, capsules, cylinders
and compound collider transforms remain faithful to the simulation. Distance joints
have visible connections. Orbit controls expose depth and contact geometry; reset
preserves the camera. Diagnostics remain in the panel, separate from the visible scene.
Floor-based lab scenes use a square collision table. Free-flight scenes remain open.
The matched benchmark fixtures are shared unchanged with the native lane.

## Remaining work

- Constraint coloring and island-local solving remain alternative scheduling experiments;
  block-local solving does not eliminate global synchronization.
- The native matched lane supports centered boxes, not general compound/mesh contacts.
  Compound friction is covered by GPU regression tests, not a matched-engine speed claim.
- Longer-duration and wider mass-ratio envelopes, larger dense worlds, and cross-vendor
  integrated/discrete/mobile measurements remain necessary for competitive qualification.
- The long-duration matrix is opt-in; short regression tests do not substitute for its
  retained hardware evidence. No aggregate SOTA completion claim is made here.
