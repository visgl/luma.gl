# GPU Physics Roadmap

Updated: October 22, 2026

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

- [Module API and limitations](../../modules/graph/src/gpu-physics/README.md)
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

## Remaining tranches after Space Salvage

This checkpoint includes the implementation in [#3494](https://github.com/visgl/luma.gl/pull/3494)
and its stacked prerequisites; it does not imply that these PRs have landed. Space
Salvage establishes a real consumer of public contact events and queries. It does
not close G5: its query kernels scan colliders, its event kernel scans the pair
cache, and docking samples overlap rather than maintaining simulation-step triggers.
The [feature cards](../../docs/api-reference/gpgpu/gpu-physics.md#feature-cards)
distinguish usable APIs from remaining qualification work.

Keep G1–G12 stable: these identifiers already connect documentation, fixtures and
the executable profile. The table below describes **remaining work**, rather than
starting another numbering sequence or treating an implemented foundation as a
completed tranche.

| Tranche | Remaining deliverable | Completion evidence | Example / workload |
| --- | --- | --- | --- |
| G1 — Capacity-safe execution | Recover or reject a step transactionally when pair, manifold, mesh or event budgets exhaust; checkpoint/grow/replay policy; active-work compaction and reusable indirect queues | Deliberately overflow every queue; never publish a partially accepted step; measure full-step latency, dispatch count and memory across sparse/dense mixed sizes | Capacity stress controls in Rigid Body Lab |
| G2 — Qualified collision geometry | Pairwise shape matrix, stable feature IDs, degeneracy and sidedness rules, declared closed-solid containment semantics and robust mesh cooking | Independent separation/penetration references; rotated/scaled compounds, thin triangles, holes and moving nonconvex bodies; explicit unsupported cases | Geometry torture scenes and Mesh Openings |
| G3 — Reliable dynamics and baseline CCD | Mass-ratio/stack/COM convergence; rotational integration checks; parallel-solver qualification; swept broad phase and bounded time-of-impact processing for an explicitly declared shape envelope | Long-running stack and energy tests; fast thin-obstacle and rotating-body cases; timestep convergence and bounded CCD exhaustion | Fast Motion Lab; high-speed salvage debris |
| G4 — Constraints, limits and drives | Generic attachment-frame constraints; linear/angular limits, springs, motors, caps and connected-body filtering, solved with contacts | Contact-loaded hinges/sliders, chains and composed joints; drift, actuator response and energy budgets | Mechanisms Lab; a real salvage tow joint |
| G5 — Complete gameplay and behavior queries | Accelerated/batched rays, overlaps and casts for all declared shapes; persistent compound triggers; scalable event compaction; asynchronous tick ordering and glTF physics behavior bindings | Multiple entries/exits between readbacks, disabled/reused IDs, query saturation, all geometry types and original behavior graphs | Salvage docking/hazard volumes; glTF trigger and ray scenes |
| G6 — glTF ownership and direct GPU publication | Pose/bounds publication, animation/physics precedence, object-model mutation, collider rebuilds, instances and lifecycle/export semantics | No per-frame pose readback; scene switches, reset, independent instances and export/reimport preserve frames and provenance | Animated and interactive glTF physics scenes |
| G7 — Complete pinned-profile release | Close every normative profile row, including companion behavior operations; package accuracy and performance reports | No missing normative behavior; no skipped feature counted as supported; reproducible integrated/discrete GPU results and a declared mobile envelope | Pinned external assets plus adversarial conformance corpus |
| G8 — Competitive difficult-contact solving | Compare solver scheduling and stabilization strategies; deep stacks, extreme mass ratios, dense compounds and persistent friction | Matched quality/cost curves against independent engines; long-duration drift/energy regressions | Warehouse piles and heavy-on-light stacks |
| G9 — Articulations and mechanisms | Reduced-coordinate articulation evaluation, contact coupling, actuator interfaces and supported loop/topology behavior | Reference trajectories, joint drift, force/torque caps, sleep/wake and high-mass-ratio mechanisms | Robot arm, crane and articulated rover |
| G10 — Large and batched worlds | Independent-world batching, active-island scheduling, mesh queue optimization, shared cooked assets, streaming and origin shifting | World/event isolation; p50/p95 step latency and batched throughput, memory and recovery on the device matrix | Batch benchmark and large debris field |
| G11 — Advanced collision/material fidelity | Broader translating/rotating CCD and nonconvex envelopes; explicit optional approximations; calibrated rolling/spinning and velocity-dependent materials | Adversarial repeated impacts and measured material cases with provenance and held-out tolerances | Fast rotating machinery and calibrated pool fixtures |
| G12 — Production qualification | Versioned APIs/cooked assets, capture/replay, command ordering, device-loss recovery, sustained cross-device correctness/performance gates | Reproducible bug captures, resource/lifecycle stress, documented numerical repeatability and supported release envelopes | Replay/debugger and device qualification runner |

### G1/G2/G3/G5 implementation checkpoint

The reliability follow-up implements an opt-in GPU checkpoint/finite-state check/
rollback boundary, latched failure handling and explicit reconstruction from accepted
poses with larger budgets. Two graph operations group checkpoint copies and restore
dispatches; the finite-state validation remains a separate parallel operation.

Queries now run per collider in parallel with deterministic reduction and bounded
output readback. Shared distance kernels cover analytic tapered shapes, planes,
convex interiors and original BVH mesh surfaces. Sphere casts report exhausted work
explicitly. Mesh cooking rejects zero-area float32 triangles. This does not establish
solid nonconvex containment or complete pairwise G2 collision qualification.

Selected centered dynamic spheres gain bounded static-surface CCD with restitution
and remaining-time sweeps; rollback rejects budget exhaustion. The Fast sphere /
thin walls lab demonstrates the envelope. Dynamic-pair/rotating-convex CCD and
continuous friction/contact-event fidelity remain open G3 work.

Compound spherical sensors now retain simulation-step enter/exit state per target
body. Optional linear swept sphere crossings produce paired transitions between
snapshots. Space Salvage uses the sensor events instead of sampled docking queries.
General sensor shapes, all intermediate compound transitions, batched indexed queries,
parallel event compaction and glTF behavior bindings remain open G5 work.

These are executable increments across the requested tranches, not closure of the
G1/G2/G3/G5 qualification programmes. The remaining-deliverable table above still
sets the completion criteria; production claims require its missing evidence.

### Recommended delivery order

1. **Execution and geometry reliability:** close the G1 failure/publication contract
   and the highest-risk G2 geometry gaps. Add checkpoint/replay tests before allowing
   automatic capacity growth. Prototype GPU queue/compaction primitives here for
   reuse by event and query processing. Capture the current numerical/performance
   baseline before changing solver scheduling.
2. **Fast motion and gameplay correctness:** deliver a bounded G3 CCD envelope and
   the G5 simulation-step trigger/query foundation. Start with sphere/convex casts;
   explicitly defer other combinations until qualified. Replace sampled salvage
   docking with trigger events; add fast-motion fixtures. Share swept broad-phase
   infrastructure, but keep a query cast distinct from a collision response solver.
3. **Mechanisms:** implement G4 against the shared solver/island contract. A generic
   constraint representation should cover the proposal's composed limits and drives;
   convenience hinge/slider APIs should build on it. Add the Mechanisms Lab and a
   genuine tow joint rather than relabeling the game's force approximation.
4. **Authored interoperability:** finish G5 behavior bindings and G6 GPU scenegraph
   publication/ownership together. Specify tick and animation ordering before wiring
   callbacks. Reuse GPU transforms/bounds infrastructure instead of making glTF
   kernels part of the physics solver.
5. **Profile qualification:** close G7 with numeric tolerances, device measurements
   and the complete pinned corpus. G8 solver experiments can run earlier when they
   unblock G3, but profile completeness is a separate milestone from competitive
   performance.
6. **Competitive library:** advance G8/G10 quality and throughput, then G9 demanding
   articulations and G11 advanced fidelity according to measured workloads. Build
   G12 replay, API ownership and failure contracts throughout; final production
   qualification closes after the earlier gates, rather than starting diagnostics
   at the end.

Each delivery package can span multiple implementation PRs. In particular, general
CCD, complete proposal constraints and articulations are substantial algorithmic
projects; a single demonstration must not be used to mark them complete.

### What would justify a state-of-the-art claim?

Choose concrete workloads and publish the quality/cost frontier: error at a fixed
step budget, or cost at a fixed error tolerance. Record p50/p95 full-step GPU time,
CPU encode cost, end-to-end latency, memory, dispatches, awake bodies, contacts,
iterations, substeps and failures. Include compilation separately. A 10,000-body
sparse cloud is a scaling fixture, not evidence for dense stacks or robotics.

Use browser/WASM engines as deployment-relevant correctness and cost references,
and native GPU engines as architectural/throughput references with backend and
hardware differences disclosed. PhysX's documented [GPU simulation boundaries](https://nvidia-omniverse.github.io/PhysX/physx/5.4.1/docs/GPURigidBodies.html)
and [articulation model](https://nvidia-omniverse.github.io/PhysX/physx/5.3.0/docs/Articulations.html)
are useful comparison checklists, not promises that WebGPU offers the same execution
facilities. Rapier's [CCD documentation](https://rapier.rs/docs/user_guides/c/rigid_body_ccd/)
is a useful independent reference for separating continuous detection from discrete
contact behavior.

Set numerical and device budgets in executable fixtures before claiming a tranche
complete. Do not promise bitwise cross-adapter determinism; specify same-device
repeatability and tolerance-based cross-device behavior separately. GPU-resident
simulation must not require CPU contact solving or per-body readback to advance.
Optional gameplay/event reads and offline CPU cooking remain valid design choices.

Cloth, soft bodies, fluids, fracture and differentiable simulation remain separate
programmes. They should not delay a well-qualified rigid-body library or be implied
by its SOTA target.

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

The Space Salvage increment adds an opt-in GPU contact-event ring with begin/end
and thresholded impact samples, exact sphere/OBB nearest-ray and sphere-overlap
queries, explicit selection and loss reporting. The game consumes public APIs for
tractor targeting, sampled docking and impact damage. This is partial G5 work:
compound trigger enter/exit state, swept queries, general shape casts, large-world
query/event scaling and glTF behavior bindings remain outstanding.

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

## Mechanisms implementation checkpoint

The next package adds G1 debug capture/restore of complete world-owned GPU state,
including failure diagnostics and event cursors; replay still requires the application
to retain its ordered command history. G2 adds an executable 36 ordered finite-shape
pair response matrix, separate from independent numerical geometry qualification.
G4 adds a bounded ordered-solver joint envelope: distance, fixed, hinge and slider
constraints, attachment frames, connected-body filtering, limits and capped motors.
The existing Rigid Body Lab gains three Mechanisms scenarios.

Remaining G1 work includes command-journal tooling, portable serialization, automatic
capacity retry and active-work compaction. G2 still needs independent distance/depth
references and adversarial geometry qualification. G4 still needs parallel scheduling,
joint warm starts, robust difficult-frame qualification, sleeping, springs, breakage
and full pinned-proposal mapping. These increments do not close their parent tranches.


## G4/G6 mechanisms and supporting G1 checkpoint

This package adds persistent joint impulses, implicit distance springs, capped
position drives, connected passive-joint sleeping and runtime joint enable/disable.
The Rigid Body Lab adds spring suspension and a servo hinge; Space Salvage uses a
real spring tow attachment. Constraints remain bounded to 64 on the ordered solver.

The reusable scenegraph adapter snapshots authored geometry/transforms, supports
explicit collision overrides, and supplies visual bounds. An optional GPU pass
publishes accepted body-node matrices and AABBs after rollback. The cradle's PBR
and shadow rendering consumes those matrices. Tick-ordered impulse, kinematic-target
and joint-toggle journals extend whole-world capture/restore.

Remaining G4: parallel joint scheduling, breakage, difficult-frame/high-mass-ratio
qualification and full pinned glTF proposal mapping. Remaining G6: automatic glTF
animation/object-model binding, topology rebuild lifecycle, shared instances and
export/reimport. Remaining G1: automatic capacity grow/replay, active-work compaction
and cross-device qualification. This package does not close those parent tranches.

## G1/G2/G3 qualification checkpoint

The recovery runner now performs bounded grow-and-replay for sparse pair and traversal
budgets, with explicit retry, history and per-world allocation limits. Replay starts
from initial state and reproduces ordered external commands, including kinematic
motion. It checks diagnostics asynchronously each tick; active-work compaction and
GPU-only adaptive recovery remain open. Event delivery across reconstruction is not
promised, and fixed task/CCD/numerical failures remain explicit rejections.

Independent analytic tests add rotated-box slab distances, scaled sphere intersections,
elastic unequal-mass momentum/energy, ballistic timestep convergence and swept static
wall rebound positions. Physics Stress Lab adds capacity shortage, dense mixed-size,
100:1 loading, ballistic and CCD scenarios with exported completion measurements.

G2 still needs robust general mesh/containment and independent penetration-depth
qualification. G3 still needs long-duration difficult-stack/high-ratio and rotational
CCD qualification. These named-case checks are not a claim of complete G1–G3 or SOTA
performance, and hardware-specific performance gates remain open.


## G1 compaction and G2/G3 named-case qualification checkpoint

Parallel rigid-body worlds now default to a bounded GPU queue of nonempty manifold
IDs and GPU-produced indirect arguments. Island pair work and repeated warm/solve
passes consume the queue. A full-scan option remains an executable comparison.
The queue retains sleeping contacts and original cache identity. Body passes, contact
discovery, mesh/event work and ordered solving are not compacted. Full GPU adaptive
recovery, broader active-island scheduling and throughput qualification remain G1 work.

Independent signed-depth and normal references cover sphere/sphere, rotated aligned
box faces, sphere/box faces/edges/corners, capsule sides, compound offsets and scale.
Six-second stacks run with sleeping disabled at two timesteps and both solvers,
including eight boxes, 10:1 loading and offset COM, under an explicit damped
stabilization profile (64 slots/iterations, warm start 0.8, recovery fraction 0.1). The stress lab exposes corresponding
scenarios and compact/full-scan workgroup diagnostics. General penetration-depth
geometry, nonconvex containment, extreme ratios, rotational CCD and cross-device
quality/cost evidence remain open; this increment does not close G1–G3.

### G2 geometry robustness / G3 fast-motion checkpoint

The follow-up normalizes convex GJK/EPA distances by the smaller local feature
(primitive radius/minimum extent, hull bounds or selected triangle edges), caps
intentional EPA convergence tolerance in world units, bounds support directions, and uses exact float32 orientation for thin hull seed decisions. Mesh
capacity checks run before copying input. Independent rectangle and polyhedron SAT
references qualify named cube/box and tetrahedron penetration cases across scale.
Analytic depth cases qualify elongated capsule/cylinder and per-triangle contacts
at lengths 10 and 1000 with reversed order; whole-mesh bounds do not set accuracy.

Sphere/static CCD now accepts all static shape families. Analytic sphere, rounded-box
unbounded-plane and triangle-feature sweeps complement bounded capsule/cylinder/convex
surface advancement. Mesh sweeps traverse the BVH and retain other triangles after
a separating touch. Curved-shape tolerance is capped independently of obstacle length. Initial-distance traversal exhaustion rejects the step.
Qualification covers transformed obstacles, scale, timestep, mesh holes and both
sides, repeated ricochets, and latched rollback after impact/traversal exhaustion.
Constant-world-spin quaternion integration removes normalized-Euler phase lag;
dynamic isotropic and kinematic spheres are checked against analytic rotations.

Geometry Torture and Fast Motion Lab scenarios live in Physics Stress Lab with
original geometry projection, sampled trails, reset and GPU graph/trace inspection.
This checkpoint does not close G2 or G3: general convex degeneracies and persistent
feature IDs, solid containment, moving/rotating/dynamic-pair CCD, extreme stacks and
competitive cross-device quality/cost gates remain open.
