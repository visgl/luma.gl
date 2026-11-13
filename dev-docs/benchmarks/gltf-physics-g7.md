# G7 glTF physics qualification

Recorded November 13, 2026 on Chromium 151.0.7922.34, WebGPU core, Apple Metal 3 hardware (macOS 27.2).
The executable profile pins `KHR_physics_rigid_bodies` at `13ffdd2d681736c3fdbac0d53b4f490770c178e4` and `KHR_implicit_shapes` at `f817a1b252dcee25fa14174a49bc219310f61ddb`.

## Geometry and dynamics

All 92 rows of the executable G1–G7 profile passed, including all 26 G2 and 29 G3 rows. The aggregate uses the previously retained G1 discovery and G6 publication measurements.

The focused qualification run passed 103 node tests and 423 WebGPU tests. G2 adds end-to-end coverage of reflected and scaled child transforms, disabled colliders, off-scene mesh references, and initial skin and morph deformation. G3 checks authored motion against analytic trajectories, exercises six-second stacks at 120 and 240 Hz, and checks fast impacts and failure rollback.

## Full-step hardware measurements

Each run uses the parallel solver at a fixed 120 Hz timestep, with sleeping disabled, a 64-pair budget and one outstanding step. The runner advances 120 warmup steps, then records 60 steps. Completion includes diagnostic readback. GPU work measures timestamped operations. The gates are 16.667 ms p95 completion, 4 ms p95 encoding, 128 MiB logical buffers, complete execution and fixture-specific accuracy. These are isolated step measurements. At 120 Hz an application has 8.33 ms per step before rendering costs.

| Fixture | Bodies | Iterations | Encode p95 (ms) | GPU work p95 (ms) | Completion p95 (ms) | Logical bytes | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| deep | 9 | 32 | 2.10 | 2.99 | 13.50 | 64,488 | Pass |
| massRatio | 5 | 48 | 2.60 | 6.57 | 16.60 | 62,504 | Pass |
| impact | 2 | 16 | 1.70 | 3.77 | 11.10 | 95,280 | Pass |
| continuous | 3 | 16 | 2.00 | 0.88 | 7.50 | 61,732 | Pass |

The initial 64-iteration heavy-on-light run recorded 20.2 ms p95 completion. The eight-box stack recorded 12.9 ms with the original 256-pair budget and 19.3 ms in a subsequent 64-pair rollback run at 64 iterations. At 48 iterations the same 64-pair stack recorded 16.70 ms, just outside the gate. Browser and GPU contention can affect repeatability.

The impact benchmark restores a checkpoint with an approaching contact before each sample. All 60 timed samples solved a contact and the final velocities match the elastic reference. The memory total includes the checkpoint. Checkpoint copies and contact-counter readback run outside timing.

[Raw full-step results](./gltf-physics-g7-rigid.json) include numerical error, energy, diagnostic counters, and timing summaries.

## Upstream assets

The four [pinned upstream GLBs](https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples) use the legacy sample profile, including opt-in `geometry.mesh` handling where needed. Each imported without issues and completed 240 steps. The runner checks finite state, static poses and a specific outcome in each asset.

| Sample | Bodies | Checked outcome |
| --- | ---: | --- |
| Motion Properties | 10 | All four balloons rise. The infinite-mass wheel keeps its position. |
| Restitution | 3 | The basketball rebounds while the bowling ball stays near rest. |
| Friction | 3 | The soap slides farther than the honeycomb. |
| Filtering | 9 | The matching green body rests on its support. The excluded bodies pass through theirs. |

[Asset evidence](./gltf-physics-g7-assets.json) includes source URLs, SHA-256 hashes, and the checkpoints used for the outcome checks.

## Release envelope

The report covers one desktop browser and GPU family. Cross-vendor, mobile, dense workloads, and complete authored scenes with rendering still need separate qualification. The [reproduction commands](../../scripts/physics/README.md#g7-qualification-report) generate the per-feature matrix and accept the retained G1 discovery and G6 publication measurements as separate evidence.
