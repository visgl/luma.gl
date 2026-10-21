# GPU Physics Roadmap

Updated: October 20, 2026

## Goal and current status

Build a general, high-performance WebGPU rigid-body module on the GPGPU primitives
and command graph. The first qualification programme is complete, performant support
for a pinned glTF physics proposal profile, rather than a collection of asset-specific
demos. State-of-the-art is an engineering ambition, not a current capability claim:
conformance, stability, accuracy, latency and throughput must be measured separately.

The scalable sphere path and bounded general-body reference path already exist. The
Motion Properties follow-up adds analytic tapered primitives, convex hulls and
convex/triangle-mesh contacts. It is a foundation, not full proposal coverage or the
production general-body architecture. Four functioning sample files do not establish
extension conformance. The original tranche history below remains for provenance;
the G1–G7 programme now governs the next work.

The initial implementation landed in [#3446](https://github.com/visgl/luma.gl/pull/3446).
The sphere dynamics follow-up and pool example landed together in
[#3455](https://github.com/visgl/luma.gl/pull/3455), incorporating
[#3456](https://github.com/visgl/luma.gl/pull/3456). All 17 checks passed on the final
PR head before merge.

Implementation references on master:

- [Module API and limitations](../../modules/gpgpu/src/gpu-physics/README.md)
- [Sphere world example](../../examples/experimental/gpu-sphere-world/)
- [Pool example and controls](../../examples/experimental/gpu-pool/README.md)

## Current development checkpoint

The G1–G3 follow-up has executable qualification tooling, hierarchical discovery and
sparse contact storage, plus node-geometry snapshots, plane support and disabled-collider
handling. An opt-in parallel solver has focused impact and island sleep/wake tests;
the ordered solver remains the default. These are partial implementations, not closed
tranches. General mesh collision qualification, general-body CCD, stress qualification and
multi-adapter whole-step performance evidence remain required.

The capacity/stability follow-up adds allocation preflight and CPU capacity reports,
GPU lifetime failure counters, and an isolated whole-step benchmark. Coupled
two-dimensional friction replaces the rigid solver's slip-speed switch; cached
impulse retention, recovery bias and parallel relaxation are explicit controls.
Ordered and parallel fixtures cover anisotropic contact response, static friction,
moving supports and eight-box stacks. The lab adds corresponding scenarios and
optional automatic scene progression. Public world references now document lifecycle,
frames, failure recovery and limits separately from the conceptual guide.

These improvements do not close G1 or G3: whole-step timing is not an accuracy
qualification, allocation preflight is not automatic overflow recovery, and the
stability fixtures do not establish extreme mass-ratio or general CCD coverage.

The next G1/G2 increment adds bounded moving mesh/mesh surface contacts, original
triangle-pair queries, explicit per-pair traversal exhaustion, and a Mesh Openings lab
scene. GPU fixtures check both collider orderings, momentum exchange, preserved holes
and budget failure. The fixed-separation/immutable-pose exception is removed.
This does not close G2: deep solid containment, general degeneracy/side semantics,
large-mesh performance and independent geometry qualification remain outstanding.

Prioritize closing G1 capacity/measurement gaps, G2 general collision semantics and G3
solver/CCD qualification before broadening the feature surface. Keep G1–G7 identifiers
aligned with the machine-readable qualification profile. G8–G12 extend the programme
toward a competitive general GPU rigid-body library after the glTF milestone.

For the conceptual background, see [GPU physics](../../docs/api-guide/gpu/gpu-physics.md).

## Active programme: glTF physics qualification first

Target the exact `KHR_physics_rigid_bodies` and `KHR_implicit_shapes` revisions
recorded in the [adapter profile](../../modules/gltf/src/physics/README.md). Record
prose/schema discrepancies and the separately versioned legacy sample profile.
“Complete” means every normative feature in the declared profile has behavioral
evidence, including its companion interactivity operations; it does not mean support
for every historical or future draft. Draft migrations require a reviewed matrix diff.

### Architecture and acceptance rules

- `gpu-physics` owns bodies, shapes, mass properties, contacts, constraints, queries,
  events and integration. The glTF adapter translates document semantics and IDs;
  simulation kernels must not know asset names or glTF node indices.
- Reuse shared GPU sort, scan, compaction and command-graph primitives. Share shape
  and body conventions with the sphere path; retain a small CPU/reference path for
  correctness comparisons instead of treating quadratic discovery as production.
- Keep persistent GPU state in explicit buffers suitable for rendering. CPU geometry
  preprocessing is allowed; advancing physics must not require CPU contact solving,
  per-body readback or a GPU-to-CPU-to-GPU round trip.
- Use structure-of-arrays for independently consumed body state. Benchmark packed
  solver/contact records separately; do not confuse one universal layout with a
  performance result. Reuse compiled graphs and indirect queues rather than creating
  one graph operation per body/contact/joint. Fuse only where dependencies permit it.
- No asset-specific exclusions or immutable-pose exceptions count as completed
  collision coverage. Bounded mesh surface contacts replace the wheel/ceiling proof;
  G2 still requires complete declared collision semantics and qualification.
- Performance is a gate in every tranche. Record CPU encode time, GPU time per step,
  frame latency, queue depth, memory, candidate/contact counts and overflows. Never
  present a multi-step batch duration as a single-pass duration. Slow devices must
  not accumulate an unbounded submission backlog.
- Reuse math.gl CPU shape/transform queries for independent references where suitable.
  Upstream reusable CPU geometry algorithms when their API and tests are mature;
  GPU work queues, integration and constraint solving belong in gpu-physics.

### G1. Executable contract and scalable execution foundation

Create a field-by-field support matrix and fixtures for implicit shapes, geometry
references, body ownership, modes, mass/inertia, materials, filters, triggers, joints,
object-model pointers and physics interactivity operations. Distinguish schema
acceptance, import, physical behavior and performance. Pin asset revisions, licenses
and expected outcomes; network availability must not determine unit-test results.

Establish stable body/collider IDs, sparse candidate/contact storage, reusable work
queues, indirect dispatch and explicit capacity handling. Introduce a size-aware GPU
broad phase for mixed shapes, while retaining all-pairs discovery as an oracle. Reuse
sphere sort/scan infrastructure where its assumptions hold. Instrument baseline
reference devices before optimizing: discrete/integrated desktop GPU and a browser
software adapter for correctness, followed by a defined mobile qualification target.

Exit: an executable conformance matrix, reproducible benchmark exports, no hidden
truncation, bounded pending submissions and candidate scaling that is not quadratic
for sparse mixed-shape scenes. Coverage labels remain partial until G7.

### G2. Complete collision geometry for the declared proposal

Cover all proposal primitives, including finite/infinite and one-/double-sided
planes, tapered capsules and cylinders/cones. Complete `geometry.node` resolution,
compound hierarchies, shared shapes, transforms and authored convex-hull semantics.
Make convex manifolds robust and persistent across feature changes. Implement the
required convex/mesh and mesh/mesh combinations, including moving nonconvex bodies,
with topology/degeneracy checks and explicit collision-side semantics. Preserve
holes; any allowed approximation must be declared and tested, not inferred silently.

Exit: pairwise shape coverage, separation/contact/penetration tests, rotated/scaled
assets and nonconvex openings pass against independent references. Direct pose changes
must not invalidate undocumented assumptions. The fixed-center mesh exception
has been removed by the bounded surface-contact increment. Worst-case traversal, work budgets and overflow recovery are benchmarked.

### G3. Stable dynamics, parallel solving and fast-motion reliability

Complete mass, COM and full-tensor handling, locked/infinite response semantics,
material combine rules, static/dynamic friction, kinematics and frame-independent
sleep/wake behavior. Build contact/constraint islands and a parallel solver strategy
with measured convergence, warm starting and bounded energy/error. Add continuous
collision handling for the qualified fast-motion envelope and swept trigger queries.
CCD is an engine quality target even where the proposal leaves integration choices open.

Exit: stacks, mixed mass ratios, offset COM, infinite inertia, moving supports,
high-speed thin obstacles and timestep convergence meet declared numeric tolerances.
Contact latency and memory gates must pass with 60 Hz rendering on the selected
reference scenes; publish physics timings separately from rendering costs.

### G4. Proposal constraints, limits and drives

Implement the proposal's two attachment frames and composable 1D/2D/3D linear and
angular limits, including radial/conical angular metrics. Cover open-ended bounds,
hard and soft limits, stiffness/damping, linear/angular drives, position/velocity
targets, force/acceleration modes and force caps. Honor connected-body collision
defaults and `enableCollision`. Solve joints and contacts coherently, rather than
adding independent scene-specific corrections.

Exit: hinge, slider, ball/socket and composed-joint fixtures, chains, motors and
contact-loaded mechanisms pass error, energy, stability and throughput gates.

### G5. Triggers, queries and physics/interactivity execution

Support individual and compound trigger volumes with per-collider filtering and
step-ordered enter/exit events. Add GPU ray-segment queries with nearest hit, source
collider/node identity, hit fraction and normal. Bind proposal-defined
`rigid_body/applyImpulse`, `rigid_body/applyPointImpulse`, `rigid_body/rayCast`,
`event/rigid_body_triggerEntered` and `event/rigid_body_triggerExited` to the engine.
Specify fixed-step/tick ordering, repeated events between ticks and invalid-node
handling. GPU events remain compact and bounded, with explicit overflow recovery.

Exit: original behavior graphs and synthetic simultaneous-entry/exit/query fixtures
produce correct payloads and ordering without whole-world readback per operation.

### G6. Complete glTF ownership and GPU render publication

Complete animation-over-physics precedence, object-model property updates, collider
rebuild policies, instancing where required by the declared profile, shared assets,
scene selection, visibility semantics and reset/lifecycle behavior. Publish GPU body
poses and bounds to glTF rendering without the example's CPU pose bridge. Preserve
source transforms, node origins, COM frames and source provenance through import and
export. Keep render geometry separate from analytic collision shape declarations.

Exit: animated and interactive assets, independent instances, scene switches, reset,
resource destruction and export/reimport preserve defined physics behavior, with no
per-frame synchronization readback in the render path.

### G7. Full-profile qualification and performance release

Close every normative support-matrix row, run all pinned external assets plus adversarial
fixtures, and publish remaining implementation choices and numeric limits. Separate
correctness qualification from performance qualification; a test skipped because a
feature is unavailable does not count as a supported-feature pass. Benchmark sparse
and dense worlds, mixed sizes, deep stacks, articulated mechanisms, moving meshes,
fast bodies, triggers and interactive queries. Compare against an independent CPU
reference with equivalent settings; any external engine comparison must disclose
hardware, backend, scene, timestep, iterations, tolerances and approximation choices.

Exit: no missing required profile features; no hidden dropped work or forced CPU
fallback; documented device/capacity envelopes; CI conformance fixtures; and a
reproducible performance report. Only then describe the adapter as complete for the
pinned profile. The 128-body reference limit and pose-bridge limitations cannot remain
as the general production implementation behind that claim.

### Examples beyond glTF

Use the standalone [Rigid Body Lab](../../examples/experimental/gpu-rigid-body-world/README.md)
for procedural stacks, mixed-size discovery, unequal-mass impacts, solver comparison and
sleep/wake diagnostics. Its GPU render path avoids conflating solver behavior with glTF
import or scenegraph publication. Keep sphere scale and pool as specialized workloads.

Add a fast-motion lab for G3/G11 CCD, a mechanisms lab for G4/G9 joints and articulations,
and a batch/scale benchmark for G10 throughput and capacity. Each should expose its
settings, expected behavior, error/overflow counters and timing scope. Introduce these
scenes with the corresponding implementation, not placeholder approximations. glTF
examples remain the interoperability and authored-semantics qualification suite.

### G8. Competitive contact solving and difficult dynamics

Qualify deep stacks, large mass ratios, dense compounds and persistent friction under
repeatable accuracy budgets. Compare the parallel solver with constraint coloring and
other scheduling/stabilization strategies before selecting production defaults. Measure
convergence and energy error alongside timing. Include long-duration regression scenes.

Exit: published quality/performance comparisons against independent engines using
matched scenes, timestep, approximation and error tolerances; no unsupported SOTA claim
based solely on body count or a discovery benchmark.

### G9. Articulations and mechanism quality

Extend beyond proposal-joint conformance to demanding connected mechanisms. Evaluate
reduced-coordinate articulation solving, contact coupling, motors, limits and closed-loop
handling. Keep generic constraint and articulation APIs distinct where their semantics
differ. Measure joint drift, actuator response and high-mass-ratio stability.

Exit: chains, robots and contact-loaded mechanisms pass reference trajectories and
error budgets, including sleep/wake and topology changes within the supported envelope.

### G10. Large worlds and batched simulation

Optimize mixed-size discovery, active-island compaction, mesh work queues and memory
reuse. Add independent-world batching with explicit world identities and command/event
isolation. Define coordinate precision, origin shifting and streaming lifecycle contracts.

Exit: separate single-world latency and batched throughput reports across the supported
adapter matrix, with p50/p95 full-step timings, memory, queue depth and capacity recovery.
No whole-world host round trip is required to advance or render.

### G11. Advanced collision and material fidelity

Expand the qualified CCD envelope and robust nonconvex handling based on measured gaps.
Evaluate optional cooked representations such as convex decomposition or distance fields;
record their approximation explicitly and preserve authored collision semantics by default.
Add calibrated material models only with independent evidence, including rolling/spinning
resistance and pace-dependent responses where applications require them.

Exit: adversarial geometry, fast rotation, repeated impacts and material reference cases
meet documented accuracy and cost budgets without silently dropping work.

### G12. Production library qualification

Stabilize API ownership, mutation and disposal contracts; version cooked assets; provide
capture/replay and solver diagnostics; define device-loss and capacity-failure behavior.
Maintain continuous correctness and performance coverage across integrated/discrete GPUs
and a declared mobile envelope. Publish reproducible benchmarks and known limitations.

Exit: a versioned supported-feature contract, end-to-end rendering integration, release
regression gates and reproducible competitive evidence. SOTA status is evaluated per
workload and quality metric, not asserted universally.

### Later research tracks

Deformables, cloth, fluids and differentiable simulation are separate research programmes.
They should reuse the execution infrastructure, but do not block a strong rigid-body
release or expand the initial glTF qualification milestone implicitly.

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

## Historical next-tranche sequence

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
Later tranches below add warm starting and bounded dynamic boxes with persistent manifolds.
Measured billiards calibration and broad-phase CCD for large worlds remain open. No external
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
Tranches 12–13 below add bounded dynamic box manifolds and rotated inertia tensors.
Large-world swept broad phases remain later work. Do not interpret the analytic fixture as empirical calibration.

## Large-count showcase and tranches 12–13

The `gpu-sphere-scale` example starts at 10,000 spheres and offers 25,000/50,000
stress settings. It retains grid discovery, contact/candidate diagnostics, direct
GPU rendering and benchmark exports. Interactive playback caps catch-up work and
reports the actual simulation-time/wall-time ratio. Selectable capacity is not a
performance or dense-scene correctness guarantee.

Tranche 12 adds `GPURigidBodyWorld`, with explicit sphere/box shape and material
metadata, oriented transforms, rotated solid-body inertia and off-center impulses.
Tranche 13 adds 15-axis box SAT, clipped face manifolds, supporting-edge contacts,
persistent accumulated friction constraints and connected-component sleeping/waking.
The new `gpu-rigid-body-world` example includes stacks, mixed shapes and impacts.

This is a separate, bounded reference path: at most 128 bodies, quadratic pair
storage and an ordered GPU solver. It does not replace the scalable sphere solver.
Large-world sparse manifolds, parallel rigid-body solving, box CCD, joints, general
convex shapes and glTF synchronization remain later work. Device-specific evidence
must accompany any performance or supported stacking-depth claim.

## Tranches 20A–B: glTF import and body semantics

The optional `@luma.gl/gltf/physics` subpath decodes pinned raw-JSON revisions of
`KHR_physics_rigid_bodies` and `KHR_implicit_shapes` without GPU allocation. It
returns source-node/body/collider mappings, preserved source data and explicit
capability issues; unsupported assets cannot create partial worlds.

The bounded rigid-body path now supports compound spheres/boxes, center offsets,
authored principal inertia/orientation, additive primitive mass properties,
kinematic velocity/target motion, per-collider filtering, and distinct static/dynamic
friction with material combine policies. Limits remain 128 bodies and 128 colliders,
quadratic pair storage and discrete collision detection.

See the [adapter profile](../../modules/gltf/src/physics/README.md) for draft hashes,
coordinate/ownership rules, schema discrepancies and unsupported features.
GPU transform/bounds publication (20C), animation ownership (20D), behavior/event
bindings (20E), and exporter interoperability (20F) remain separate increments.
