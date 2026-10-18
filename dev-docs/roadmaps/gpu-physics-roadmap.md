# GPU Physics Roadmap

Updated: October 17, 2026

## Goal and current status

Build reusable WebGPU physics on the GPGPU primitives and command graph, with
examples that render simulation buffers directly. The current scope is sphere
dynamics against spheres and static rectangular planes, not a general rigid-body
engine or a calibrated billiards simulator.

The initial implementation landed in [#3446](https://github.com/visgl/luma.gl/pull/3446).
The sphere dynamics follow-up and pool example landed together in
[#3455](https://github.com/visgl/luma.gl/pull/3455), incorporating
[#3456](https://github.com/visgl/luma.gl/pull/3456). All 17 checks passed on the final
PR head before merge.

Implementation references on master:

- [Module API and limitations](../../modules/gpgpu/src/gpu-physics/README.md)
- [Sphere world example](../../examples/experimental/gpu-sphere-world/)
- [Pool example and controls](../../examples/experimental/gpu-pool/README.md)

## Landed baseline

| Area | Implemented |
| --- | --- |
| GPU execution | Fixed-step integration, hashed uniform-grid discovery using sort/scan, bounded CSR contacts, Jacobi solving, and direct rendering from GPU state |
| Sphere dynamics | Unequal masses, angular velocity, quaternion orientation, restitution, static/dynamic friction, rolling resistance, sleeping and waking |
| Surfaces and controls | Up to 32 static planes/rectangles, finite edges, live materials, ordered impulses, angular impulses, teleport, enable/disable and explicit snapshots |
| Diagnostics | Invalid bodies, dropped contacts, contact demand, candidate counts, sleeping/awake counts; bounded all-pairs reference path |
| Sphere showcase | 64/1,024/10,000 bodies, rotation bands, camera-linked tilt, level indicator, horizontal reset and benchmark export |
| Pool practice | Sixteen balls, finite cushions, pocket/scratch handling, mouse aiming, vertical power control, cue animation, synthesized sound and rail markers |
| Spin practice | Cue contact diagram with selectable-limit ring, throw toggles, follow/draw/cushion presets, cue-ball trail and motion readout |
| Cloth and cushion response | Sliding-to-rolling friction, independent sidespin resistance, raised cushion impulse contact and speed-dependent restitution |

Pool already uses GPU physics: `GPUSphereWorld` runs through `GPUCommandGraph` at
1/240-second steps with 12 solver iterations. Rendering consumes the position and
orientation buffers directly. CPU snapshots at most 30 times per second support
pockets, scratches, interaction, cosmetic sounds and trails; the CPU does not run
the rigid-body collision solver.

Follow, draw and spin-sensitive rebounds are implemented qualitatively. Throw
toggles isolate linear and angular slip contributions to Coulomb friction. The
raised cushion contact is a rigid-impulse approximation. Neither is a measured
billiards material model, and the contact selection ring does not simulate miscues.

## Next tranches

The numbering below sequences follow-up work from the landed baseline; it does
not renumber earlier implementation tranches. Each tranche should ship with
documented limits and focused regression evidence.

### 1. Collision reliability and continuous triggers

Priority: next. Keep fast breaks and pocket detection reliable before adding more
game rules or increasing shot speeds.

- Add swept sphere–sphere and sphere–plane detection, with bounded time-of-impact
  handling and explicit diagnostics when the work budget is exhausted.
- Define behavior for simultaneous impacts and dense racks; retain a discrete
  path for comparison and document supported speed/radius/timestep combinations.
- Move pocket crossing detection to simulation steps so a ball cannot skip a
  trigger between CPU snapshots. Keep scoring and scratch policy in the example.
- Cover thin cushions, grazing impacts, high-speed breaks, pocket crossings and
  frame stalls. Verify convergence as the timestep decreases and bound energy gain.

Exit: supported shots do not tunnel through balls, cushions or pocket triggers,
including when rendering and readback run slowly.

### 2. GPU contact events and consumer integration

Depends on tranche 1's trigger semantics.

- Provide bounded GPU event buffers for contact begin/impulse and trigger entry,
  including body identifiers, simulation-step identifiers and overflow counters.
- Offer asynchronous compact readback without making simulation wait for the CPU.
- Drive pool collision audio and pocket decisions from events instead of inferred
  velocity changes; define ordering and duplicate suppression across readbacks.
- Add a GPU-resident trail path or compact trail sampling where useful, while
  keeping CPU snapshots available for debugging and small scenes.

Exit: reducing snapshot frequency does not change pocket outcomes; event overflow
is visible and sound timing follows actual impacts.

### 3. Billiards calibration and richer surfaces

Depends on collision and event regressions from tranches 1–2.

- Establish units and repeatable measurements for sliding friction, rolling
  resistance, sidespin decay, ball restitution and cushion rebound versus pace.
- Compare follow/draw distances, throw angles and spin-sensitive cushion angles
  against a documented reference dataset with tolerances.
- Improve cushion noses, jaws and pocket geometry; separate geometric accuracy
  from optional material-model complexity.
- Evaluate speed/slip-dependent ball friction and a calibrated cushion model.
  Preserve the simpler default and educational throw controls where useful.
- Treat cue elevation, squirt, swerve, jumps and actual miscues as explicitly
  deferred extensions rather than implying the contact diagram implements them.

Exit: publish reproducible shot fixtures, calibration provenance and numerical
tolerances; label any effects that remain qualitative.

### 4. Scaling, stability and performance budgets

Can progress alongside tranches 1–3 without changing their correctness contracts.

- Benchmark sparse clouds, dense piles and racks across body/contact counts and
  solver iterations. Report GPU time separately from rendering and readback.
- Address pathological dense-cell candidate work and contact overflow using the
  measurements; avoid claiming uniformly linear scaling from sparse benchmarks.
- Investigate convergence, relaxation and warm starting with stack and energy
  regressions before changing solver defaults.
- Test device storage/dispatch limits, ownership, repeated graph execution and
  resource cleanup. Publish practical capacity and frame-budget guidance.

Exit: reproducible performance reports and bounded failure behavior for supported
scenes, with no silent contact loss.

### 5. Broader rigid-body foundations

Start after the sphere path has stable collision, event and performance contracts.

- Design shape/material/body boundaries before adding capsules and boxes.
- Add shape-specific narrow phases, persistent manifolds and angular inertia
  tensors; validate stacking before adding joints or arbitrary meshes.
- Evaluate static mesh acceleration and glTF/scene adapters as separate consumers.
- Keep gameplay rules, rendering and asset loading outside the physics solver.

Exit: a documented extension model and one validated additional shape family;
general rigid bodies, constraints and articulated systems remain separate work.

## Pool-specific follow-up

Eight-ball rules, players/turns, fouls, ball-in-hand and game completion belong to
the example layer. Add them after reliable contact/pocket events can establish
first contact, rail contact and pot ordering. Preserve free practice and repeatable
spin presets as physics debugging tools.

## Validation gates

- Retain GPU grid/all-pairs reference comparisons, mass/momentum and bounded-energy
  checks, rotation/slip/sleep tests, ownership tests and sparse 10k-body coverage.
- Add deterministic shot fixtures for each new collision, trigger or spin behavior;
  use numerical tolerances rather than cross-device bitwise equality.
- Verify direct GPU rendering and that optional readback never gates simulation.
- For implementation PRs, run `nvm use`, `yarn install`, `yarn lint fix`, final
  `yarn build` and `yarn test`; run website builds when changing website integration.
  Wait for the repository review window, resolve comments and require green CI.

## Follow-up implementation status

The follow-up adds an opt-in, bounded small-world sweep path, persistent GPU event
ring, step-local pocket capture, event-driven pool sound/trails, candidate traversal
budgets, analytic material fixtures and static box surface composition. These are
foundations across the five tranches, not completion of every exit criterion.
Measured billiards calibration, dynamic non-spherical bodies, persistent manifolds,
warm starting and broad-phase CCD for large worlds remain open. No external
measurement dataset is bundled or claimed.

Measured sparse/rack/pile evidence and an explicit 10,000-body frame-budget limit
are now recorded in the [performance report](../benchmarks/gpu-physics-performance.md).
The measured sparse scene reached approximately 24.43 ms of GPU simulation per step
on the tested Apple adapter; large-world fixed timesteps do not imply 120 Hz playback.


## Tranches 6–8: reliability, calibration and persistent contacts

The #3460 foundations have landed. The next implementation adds:

| Tranche | Implementation | Remaining evidence |
| --- | --- | --- |
| 6 — collision reliability | Simultaneous-impact momentum/energy regressions, repeated finite-cushion rebounds, timestep comparison, persistent discarded-time accounting and per-shot pool reporting | Wider shot-speed/radius/adapter matrices; budgets still discard unprocessed time explicitly |
| 7 — calibration | SI dataset/provenance schema, cloth and cushion least-squares fitting, residual reports, reproducible CLI fixture and GPU follow/draw/spin/pace tolerances | Measured table datasets and held-out throw/cushion-angle validation; pool remains illustrative |
| 8 — persistent contacts | Opt-in sphere and surface identity cache, accumulated normal/tangent constraints, friction-cone limits, timestep-scaled warm impulses and automatic command/material invalidation | Wider dense-pile and adapter evidence before making this the module default |

See [calibration and stability protocol](../benchmarks/gpu-physics-calibration.md).
Dynamic shape manifolds, general inertia tensors and large-world swept broad phases
remain later tranches. Do not interpret the analytic fixture as empirical calibration.
