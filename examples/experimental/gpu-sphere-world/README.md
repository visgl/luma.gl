# GPU Sphere World

Run `yarn start` in this directory. Requires WebGPU. `yarn build` runs strict
TypeScript checks and builds the standalone example. Debug alias: `sphere-world`.

The example consumes `GPUSphereWorld` from `@luma.gl/gpgpu/gpu-physics`; it does not
contain a second physics solver. Select 64, 1,024 or 10,000 equal-mass spheres with
varied radii. State remains GPU-resident and feeds an instanced analytic sphere
renderer. A single dark cue-ball band is attached to each quaternion orientation,
so rolling and spinning are visible. Fragment depth follows the sphere surface.

Drag with OrbitControls to orbit the camera and tilt gravity relative to the
platform. The initial view is calibrated to level. Drag sensitivity defaults to
0.25; releasing within 3 degrees optionally snaps level. Double-click or Level
restores the initial view; Reset restores sphere positions, velocities, orientations
and sleep state. The bubble level shows direction and angle. Static/dynamic contact
friction, rolling resistance and sleeping bring the balls to rest.

## Benchmark

Select a body count, then press Benchmark. It resets to the same seeded four-layer
pile (one layer at 64 bodies), disables dragging and count/reset controls, warms up
for 30 frames and measures 300 frames with one fixed 1/120-second physics step per
frame. The normal simulation uses a fixed-step accumulator with bounded catch-up;
benchmark mode intentionally measures one step per rendered frame.

Save report downloads JSON containing adapter information, solver configuration,
frame median/p95, CPU encoding median and GPU timing median where timestamp queries
are supported. Frame duration includes display pacing, browser throttling and
rendering; it is not GPU execution time. GPU samples sum the graph's timestamped
passes and are collected at most twice a second. Live metrics show memory, directed
contacts, candidate tests, sleepers, invalid bodies and dropped contacts. Any dropped
or invalid counter means the scene has exceeded its configured physics contract.

Compare reports on the same browser, viewport, power state and hardware. The 10k
preset is a workload to measure, not a promise of 60 fps on every adapter. Sparse
candidate-count scaling, dense contact overflow and numerical behavior are also
covered by automated WebGPU tests; see the module's README for solver limits.

Reports also include sampled maximum dropped-contact/invalid-body counts,
diagnostic sample counts, sampling failures and an explicit `valid` flag. These
are sampled observations, not an every-step guarantee. Warmup samples contribute
to workload validity but never to the GPU median. Each asynchronous result belongs
to the run and phase in which it was submitted; report finalization waits for the
last pending result. Benchmark time never accumulates as a playback backlog.
