# GPU physics

Loading interactive example…

Newton's cradle runs the rigid-body solver on the GPU and renders its position and orientation buffers directly. Use Reset to release the raised ball again, Pause to inspect a moment, or drag to orbit. Open **GPU Graph** and **GPU Graph Timeline** (the GPU Trace view) in the lab to inspect simulation work. The cradle uses a fixed 1/480-second timestep; its discrete solver approximates contact and constraint response rather than guaranteeing lossless, indefinitely periodic motion.

See [command graph debugging](https://luma.gl/next/docs/api-reference/experimental/gpu-core/debugging.md) for how to interpret the panels.

`@luma.gl/graph/gpu-physics` provides experimental WebGPU simulation. Import this subpath explicitly; the physics API is not exported from the package root. It requires a WebGPU device and has no WebGL or CPU simulation fallback.

| World                                                                                           | Use it for                                                                  | Important boundary                                                                                                         |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [GPUSphereWorld](https://luma.gl/next/docs/api-reference/graph/gpu-sphere-world.md)        | Large sphere fields, rolling balls, pool and small continuous sphere scenes | Dynamic shapes are spheres; continuous mode and events are bounded to small worlds                                         |
| [GPURigidBodyWorld](https://luma.gl/next/docs/api-reference/graph/gpu-rigid-body-world.md) | Oriented shapes, compounds, mass properties and glTF physics workloads      | Discrete contacts with opt-in sphere/static and bounded moving-convex CCD envelopes; parallel solving remains experimental |

`GPUPhysicsBatch` manages independent rigid-body instances, residency and submission groups; see [large worlds](#large-and-independently-batched-worlds).

These are separate implementations with different controls, storage ownership and failure counters. A feature on one world does not imply support on the other. Neither establishes complete glTF proposal coverage or state-of-the-art performance. The [background guide](https://luma.gl/next/docs/api-guide/gpu/gpu-physics.md) explains the algorithms and GPU tradeoffs; the references below describe the actual contracts.

For task-oriented guides, start with the [Physics overview](https://luma.gl/next/docs/api-guide/physics/overview.md).

## Feature cards[​](#feature-cards "Direct link to Feature cards")

**Available** means an implemented API within the limits shown, not full performance qualification. **Experimental** marks an opt-in path needing broader numerical or scale evidence. **Partial** means important cases remain unsupported. **Planned** means no general rigid-body implementation is offered yet. All physics remains experimental as a module.

| Feature                         | Status       | What you can use today                                                                                                                                                     | Remaining boundary                                                                                                                                                                                                                            |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GPU simulation and rendering    | Available    | Fixed-step command graphs; position/orientation buffers consumed directly by renderers                                                                                     | Applications own scheduling, catch-up and submission limits; glTF publication is separate                                                                                                                                                     |
| Large sphere worlds             | Available    | GPU grid discovery, angular dynamics, friction, rolling resistance and sleep/wake                                                                                          | Body count alone is not a frame-rate guarantee; dense contacts can exhaust budgets                                                                                                                                                            |
| General rigid bodies            | Available    | Oriented boxes, spheres, tapered primitives, convex hulls, planes and compounds; mass, COM and inertia                                                                     | Pairwise geometry and numerical qualification remain incomplete                                                                                                                                                                               |
| Triangle-mesh contacts          | Partial      | Convex/mesh and bounded moving mesh/mesh surface contacts; original nonconvex openings preserved                                                                           | Deep solid containment, degenerate geometry and high-speed traversal are not generally covered                                                                                                                                                |
| Scalable rigid-body discovery   | Available    | Hierarchical discovery and sparse contact storage; all-pairs reference for small scenes                                                                                    | Dense scenes and mixed-size extremes still require capacity and performance qualification                                                                                                                                                     |
| Parallel rigid-body solving     | Experimental | Opt-in parallel contact response, GPU contact compaction/indirect work, persistent manifolds, coupled friction and island sleep/wake                                       | Ordered solving remains the default; deep stacks and extreme mass ratios need broader evidence                                                                                                                                                |
| Continuous collision detection  | Partial      | Bounded small-world continuous mode in `GPUSphereWorld`                                                                                                                    | Rigid worlds offer sphere/static-surface CCD and opt-in moving-convex CCD with swept queues, angular bounds, friction and rollback; jointed/nonconvex continuous coverage remains open                                                        |
| Collision events                | Available    | Opt-in rigid-body begin/end and thresholded impact samples with IDs, step ordering and explicit loss reporting                                                             | Ordered GPU compaction scans pair capacity in parallel. Lost records require consumer resynchronization                                                                                                                                       |
| Scene queries                   | Partial      | Parallel collider rays, sphere overlap and bounded sphere casts across analytic shapes and cooked mesh geometry                                                            | One pending query per world; bounded casts report incomplete results; spatial batching and general shape casts remain planned                                                                                                                 |
| Trigger volumes                 | Partial      | Step-local compound sensors, per-collider glTF events, bounded general geometry and swept sphere crossings                                                                 | Curved trajectories and general swept sensor geometry remain work                                                                                                                                                                             |
| Joints and articulations        | Partial      | Bounded ordered distance/fixed/hinge/slider constraints, frames, limits, warm starts, springs, position/velocity drives and island sleeping                                | Static-anchored distance joints can alternate with parallel contacts; dynamic-to-dynamic parallel scheduling, breakage and articulations remain planned                                                                                       |
| glTF physics                    | Partial      | Pinned draft import, shape/body/material/filter semantics and explicit capability reports                                                                                  | Pinned G4/G5 qualification covers attachment constraints, triggers and behavior operations; analytic shape mutation/scale and live scene capture are implemented, while mesh-deformation recooking and full-profile qualification remain work |
| GPU scenegraph pose publication | Partial      | Reusable geometry snapshots and GPU body-node matrices/visual AABBs; cradle PBR and shadows consume published matrices                                                     | The glTF gallery consumes GPU matrices directly and binds rigid animation targets; deformation, live scene edits and export/reimport remain work                                                                                              |
| Capacity and diagnostics        | Available    | Allocation preflight, bounded queues, lifetime diagnostics and GPU rollback; opt-in bounded automatic growth/replay for sparse pair, traversal and swept-candidate budgets | Recovery synchronizes each tick and replays from initial state; fixed mesh-task/CCD impact failures, event continuity and GPU-only adaptive growth remain work                                                                                |
| Large worlds and batching       | Partial      | Independent leases, bounded residency, explicit streaming, GPU slot resets, local origins/rebasing and measured submission groups                                          | Fused homogeneous ensembles and shared mesh packing; cross-slot GPU geometry sharing, interacting streamed partitions and cross-device qualification remain work                                                                              |
| Qualification and tooling       | Partial      | Independent analytic shape/motion references, command replay, whole-step measurements and Physics Stress Lab with JSON exports                                             | Named-case evidence only; difficult-contact, multi-device and full-profile qualification remain work                                                                                                                                          |

See the [remaining tranches](https://github.com/visgl/luma.gl/blob/master/dev-docs/roadmaps/gpu-physics-roadmap.md#remaining-tranches-after-space-salvage) for completion gates. The detailed [sphere](https://luma.gl/next/docs/api-reference/graph/gpu-sphere-world.md) and [rigid-body](https://luma.gl/next/docs/api-reference/graph/gpu-rigid-body-world.md) references define the API contracts.

## Integration contract[​](#integration-contract "Direct link to Integration contract")

1. Create the world and add it to a `GPUCommandGraph` on your WebGPU device.
2. Compile the graph once, then encode it once for every fixed simulation step.
3. Submit encoded work before issuing immediate body-control commands.
4. Bind the state buffers directly to rendering where possible. Snapshot readback is optional and should not become a per-frame pose bridge.
5. Sample failure diagnostics. Incomplete collision work invalidates that run even when it produces a plausible image.
6. Stop scheduling, finish pending GPU work/readbacks, destroy render bindings and the compiled graph, then destroy the world and any caller-owned state.

The application owns wall time, catch-up limits and queue depth. `timeStep` is simulation time per encoding, not the elapsed duration of a render frame. More iterations improve a step's constraint solve; more substeps also refresh geometry and integrate motion. Neither provides a general CCD guarantee.

Use consistent units. Metres, kilograms and seconds are a useful convention; angular velocities use radians per second and rotations use quaternions in xyzw order. Changing world scale also changes meaningful slop, sleep and speed thresholds.

## Ownership and mutation[​](#ownership-and-mutation "Direct link to Ownership and mutation")

`GPUSphereWorld` borrows required position/velocity buffers and can borrow optional state. `GPURigidBodyWorld` allocates all its state. Exposing a buffer for rendering does not transfer ownership to the renderer. Graph scratch belongs to the compiled graph. A world can be attached to one graph.

Use each world's control methods instead of writing buffers when possible. Direct writes must be ordered between submissions and invalidate the relevant contact and sleep state. The sphere world has `clearContactCache()`; the rigid world has `wake()`. Do not modify geometry, mass or capacity by changing the constructor input after attachment; construct a replacement world.

## Examples and qualification[​](#examples-and-qualification "Direct link to Examples and qualification")

Sphere World, Pool and Rigid Body Lab use procedural scenes. The glTF Physics example tests authored semantics through the separate `@luma.gl/engine/gltf-physics` adapter. Its supported draft profile and render integration limitations are documented in the [adapter reference](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/gltf/physics/README.md).

[Qualification tooling](https://github.com/visgl/luma.gl/blob/master/scripts/physics/README.md) separates schema/import evidence, numerical behavior, capacity and performance. A successful import, finite poses or zero overflow alone is not proof of accuracy.

See the [collision coverage contract](https://luma.gl/next/docs/api-reference/graph/gpu-physics-collision-coverage.md) for pairwise response fixtures and the distinction between coverage and numerical qualification.

## Capacity recovery and numerical qualification[​](#capacity-recovery-and-numerical-qualification "Direct link to Capacity recovery and numerical qualification")

`GPURigidBodyRecoveryRunner` is an opt-in asynchronous owner of a world and its graph. It checks completion after each fixed tick. Recoverable sparse-pair or traversal exhaustion grows the relevant budget, reconstructs a world and replays the accepted command history plus the pending tick from the authored initial state. This avoids copying incompatible contact caches and preserves kinematic targets and joint toggles. A replacement becomes visible only after the complete replay succeeds.

```
const runner = await GPURigidBodyRecoveryRunner.create(device, {

  bodies,

  broadPhase: 'hierarchical-grid',

  maximumPairs: 16

}, {maximumRetries: 8, maximumReplayTicks: 4096});

const result = await runner.advance([

  {type: 'impulse', body: 0, impulse: [1, 0, 0]}

]);

if (!result.accepted) {

  // Stop and inspect result.diagnostics; this runner will reject subsequent advances.

}

// Rebind render buffers from runner.world after advance: recovery replaces the world.

runner.destroy();
```

All external mutations must use `advance(commands)`. Do not encode `runner.graph` or mutate `runner.world` independently; those accessors support inspection and rendering. Calls must be serialized. `maximumReplayTicks` bounds retained command history and is also the maximum accepted run length; reaching it requires creating a new runner. `maximumOwnedBufferBytes` defaults to 256 MiB **per world**. Recovery temporarily keeps both old and candidate worlds, and graph scratch/pipelines/driver memory are additional. An allocation or compilation failure throws and blocks the runner; exhaustion without a viable growth plan returns `accepted: false`. Destroy it after inspection.

Ticks with commands save pre-command state into a reusable GPU checkpoint for atomic rejection. These copies stay on the GPU; there is no full-state readback on commanded ticks. Checkpoint allocations count against the per-world memory budget. The runner reads compact diagnostics each tick and replays from initial conditions, not from a portable checkpoint. It is intended for bounded sessions, tools and qualification, not a zero-readback high-throughput simulation loop. Event rings retain their existing explicit overflow semantics; this runner does not guarantee delivery of every event across world replacement. Consumer event cursors must not be carried across replacements. Numerical/geometry failures and CCD impact-budget exhaustion are rejected instead of being disguised as capacity problems.

### Event ordering and overflow[​](#event-ordering-and-overflow "Direct link to Event ordering and overflow")

Rigid-body contact and trigger publishers compact transitions in parallel before writing their bounded rings. Events retain pair-slot or trigger-slot order within each accepted step, with a swept trigger enter preceding its exit. A fused ensemble omits events from rejected instances. The publisher writes the newest records that fit, while sequence numbers also account for the overwritten records. A nonzero `dropped` count means the consumer needs to resynchronize any state derived from the missing transitions. Sequence and step counters saturate instead of wrapping.

Publishers with up to 64 input slots publish with one workgroup. Larger workloads classify tiles in parallel, reserve ring positions in tile order, then scatter retained records. The input scan still scales with configured pair or trigger slots. Temporary storage is owned by the simulation graph and counted in batch residency. In Physics Batch Lab, **Event burst** checks counts, ordered trigger pairs and retained ring suffixes under deliberate overflow. The GPU Graph inspector shows the publication stages.

The **Physics Stress Lab** exposes recovery counters, buffer capacities, completion p50/p95 and JSON reports. Independent GPU qualification tests cover rotated-box slab intersections, sphere ray intersections across scales, convex/capsule/cylinder/triangle surfaces, elastic momentum/energy, ballistic timestep convergence and analytic sphere/static-wall rebound positions. These qualify named cases; general mesh containment, rotational CCD, deep stacks and cross-device performance still require separate evidence.

### Difficult contact patches[​](#difficult-contact-patches "Direct link to Difficult contact patches")

With `solver: 'parallel'`, `parallelContactSolver: 'block'` opts into two local Gauss–Seidel sweeps over each manifold before the global velocity gather. The solver relaxes the whole patch once, rather than each contact increment. This can achieve a similar contact error with fewer global iterations, at the cost of more arithmetic and private state per invocation. `parallelContactSolver: 'scalar'` remains the default. Both modes retain compact queues, warm starts, island sleeping and exclusive output ownership. There is no additional CPU synchronization or pose readback.

```
const world = new GPURigidBodyWorld({

  bodies,

  solver: 'parallel',

  parallelContactSolver: 'block',

  iterations: 24,

  timeStep: 1 / 240

});
```

Compare error and cost for your scene before reducing iterations. More local sweeps are not equivalent to more substeps: collision geometry is still refreshed once per substep. See the [G8 comparison](https://github.com/visgl/luma.gl/blob/master/dev-docs/benchmarks/physics-g8.md) for the bounded workload, measurements and remaining performance limits.

### Awake solver work[​](#awake-solver-work "Direct link to Awake solver work")

With `solver: 'parallel'` and contact compaction enabled, island construction retains all contact edges so wake propagation remains correct. After waking connected bodies, the engine compacts awake bodies and contacts into separate GPU queues. Iterative pair solving and body gathering use indirect dispatches over those queues. Sleeping islands retain their manifolds without participating in iterative work.

`readSolverWork()` reports contact-cache occupancy (`activeContacts`) separately from `awakeContacts` and `awakeBodies`, with the actual pair/body workgroup counts. Reading these diagnostics is optional; queue construction and dispatch require no CPU readback. `compactContacts: false` retains the scan path for numerical and performance comparisons.

`createGPUCheckpoint()` returns a reusable, same-world checkpoint with `save()`, `restore()` and `destroy()`. It copies buffers on the GPU and retains CPU-side event cursors and mutable joint settings. It is not a portable capture; use `captureState()` for downloadable debug artifacts. Checkpoints are also destroyed with their world.

## Large and independently batched worlds[​](#large-and-independently-batched-worlds "Direct link to Large and independently batched worlds")

`GPUPhysicsBatch` manages a bounded set of resident `GPURigidBodyWorld` instances. Worlds have independent contacts, events, queries, joints and recovery state. They may occupy the same local coordinates without colliding. This is **independent-world batching**, not decomposition of one interacting world; bodies in different slots cannot exchange contacts.

```
import {GPUPhysicsBatch} from '@luma.gl/graph/gpu-physics';



const batch = new GPUPhysicsBatch({

  device,

  maximumResidentWorlds: 16,

  maximumResidentBytes: 256 * 1024 * 1024

});

batch.registerTemplate('debris', worldProps);

const handle = await batch.acquire('debris', 'region-42', [1e12, 0, 0]);

for (const group of batch.planSubmissions(4, 4096)) {

  const encoder = device.createCommandEncoder();

  batch.encode(encoder, 1, group.handles);

  device.submit(encoder.finish());

}
```

World handles identify one lease, not merely a reusable body index. Released handles are rejected. The world returned by `getWorld()` is borrowed: do not destroy it or keep using it after release. `setActive(handle, false)` skips the entire graph without losing state. Sleeping bodies remain managed by each world's existing solver. `encode()` never submits commands or reads back poses. Submission groups bound world/body counts; an indivisible oversized world is explicitly flagged. Finish submitting encoded work before changing residency, issuing controls or resetting. Finish asynchronous world readbacks before releasing or recycling a lease. Residency changes are serialized; simultaneous acquisition is rejected rather than silently oversubscribing memory.

### Streaming and memory reuse[​](#streaming-and-memory-reuse "Direct link to Streaming and memory reuse")

`release()` retains a compiled slot for reuse. Acquiring the same template restores an initial GPU checkpoint, resetting contacts, events, controls and poses without reallocating or compiling. `reset()` performs that same reset for an existing lease. `trim()` destroys unused slots; when a new template requires space, unused slots are evicted before any live lease can be affected.

For persistence, `streamOut()` explicitly downloads accepted state and releases the lease. `streamIn()` restores that snapshot into a compatible registered template before publishing the lease. Streaming snapshots omit rollback scratch that the next step rebuilds. These transfers are not hidden in stepping and should be scheduled separately from latency-sensitive rendering. Snapshots are implementation-specific debug captures, not a portable asset format.

`getStats()` separates world-buffer, reset-checkpoint and graph-transient bytes and counts created, reused and evicted slots. The budget covers retained buffer allocations, not driver/pipeline memory. Compilation can temporarily allocate scratch before the final budget check. A retained initial checkpoint omits rollback scratch, which is overwritten before its next use; it still duplicates persistent buffers, including geometry. Sharing immutable GPU cooked assets and reducing checkpoint scope remain further memory optimizations.

### Large coordinates and rebasing[​](#large-coordinates-and-rebasing "Direct link to Large coordinates and rebasing")

The batch stores a JavaScript double-precision global origin for each instance. Supply nearby local coordinates to the float32 solver. `getRenderTranslation(handle, cameraOrigin)` subtracts origins before upload so render transforms stay small. Large origins do not increase the solver's local precision or make a single huge interacting world safe automatically.

`world.shiftOrigin([1024, 0, 0])` subtracts that displacement from GPU poses, active kinematic targets, cached world-space contact points, swept-trigger history and queued contact points. Velocities, body-local joint anchors, contact impulses and sleep state are retained. Pose publication is refreshed. Future controls, queries and returned event points use the new local frame. CPU snapshots and GPU reset checkpoints retain their own origin and restore it with state. Use exactly representable float32 displacements, typically grid-aligned powers of two. Rebase before local coordinate magnitudes lose the precision the application needs; rebasing cannot recover precision already lost. Apply the matching origin change to external scene/camera state.

### Qualification[​](#qualification "Direct link to Qualification")

The standalone **Physics Batch Lab** compares fused ensembles, separate and batched submissions, sparse debris and dense settling piles, reports p50/p95 completion latency and throughput, and exercises slot reuse. See `scripts/physics/batch/README.md` for repeatable scale runs. No universal batching speedup or cross-device G10 completion is claimed. Shared GPU cooked assets across separately resident slots and seamless interaction across streamed partitions remain open.

### Fused independent ensembles[​](#fused-independent-ensembles "Direct link to Fused independent ensembles")

`GPUPhysicsEnsemble` runs identical scene topologies with independent state in a single solver graph. World identity participates in spatial hashing and exact collision rejection. Instances can occupy identical local coordinates without generating cross-instance contacts. All instances share the timestep and solver settings; use `GPUPhysicsBatch` when membership, residency or solver settings must vary independently.

```
import {GPUPhysicsEnsemble} from '@luma.gl/graph/gpu-physics';



const ensemble = await GPUPhysicsEnsemble.create(device, {

  template: worldProps,

  instances: 1024,

  maximumPairs: 16384,

  maximumResidentBytes: 256 * 1024 * 1024

});

const encoder = device.createCommandEncoder();

ensemble.encode(encoder);

device.submit(encoder.finish());

const selectedBody = ensemble.getBodyIndex(42, 0);

// ensemble.world exposes controls, contact events and GPU pose publication.

// Global transforms for rendering each instance remain application-owned.
```

The ensemble forces the parallel solver, hierarchical broad phase and rollback failure policy. `maximumPairs` sets the shared power-of-two candidate capacity. With the default shared contact cache, its exhaustion rejects the whole ensemble step. Total bodies and colliders must each fit within 65,535 and adapter buffer limits. Joints, authored triggers and CCD are currently rejected. Queries inspect every instance. Map returned global body indices back to instance ranges. Streaming and whole-world checkpoint/capture APIs remain available.

A template can include either `vehicle` or `vehicles`. Give each chassis and terrain collider an index within the template. The ensemble maps them to the matching body and colliders of each instance, including additional terrain tiles. Use instance-local controls and the existing GPU wheel-pose ranges to draw each vehicle.

```
ensemble.setVehicleControls(42, 0, 0.7, 0.1, 0); // Instance, vehicle, throttle, steering, brake

const vehicle = ensemble.getVehicleIndex(42, 0);

const wheelPoses = ensemble.world.getVehicleWheelPoses(vehicle);
```

Vehicle input schedules only the selected enabled instance. Inputs written while paused are applied on resume. A shared rejected step restores wheel telemetry and matrices, together with all participating bodies and their contact state. Standalone rigid-body worlds with `failurePolicy: 'rollback'` also retain vehicle state on rejected steps.

`setActive(instance, false)` pauses an instance without changing its poses, velocities or cached contacts; `setActive(instance, true)` resumes it. A resumed sleeping instance remains asleep until `wake(instance)` or a world control wakes it. Kinematic instances remain scheduled even when stationary, so new targets can take effect. Apply controls between submissions: do not change activation or reset after encoding work but before submitting it.

`await reset(instance)` restores its creation-time body state, materials, collider transforms and pose metadata and vehicle controls and wheel state, clears its contact cache and counters, and preserves its enabled flag. Other instances are unchanged. Reset respects the current origin after rebasing. The reset excludes shared simulation diagnostics: after a latched shared failure, reconstruct the ensemble instead. While reset is pending, ensemble encoding, control and destruction are rejected. Do not bypass this guard through the borrowed world. Reset invalidation scans the selected partition when a per-instance contact budget is configured, or the shared cache otherwise.

`await readStatus()` reports the most recently scheduled active instance/body count, plus each instance's enabled and active flags, accepted and rejected participation counters, `sharedFailure`, and a latched local `failure` reason. Counters saturate at uint32 maximum and reset per instance. The active flag describes scheduling in the last attempted step. A shared failure is reported for all instances.

`readWorkStatistics().vehicleSnapshotBytes` reports the vehicle rows copied for active instances during the last step. No wheel pose or telemetry readback is required for scheduling, rollback, or reset.

One template-sized GPU reset image is retained automatically, regardless of instance count. `checkpointBytes` reports this image and its reset uniform. `residentBytes` includes it, world-owned buffers and graph scratch, excluding driver allocations and compilation peaks. Explicit checkpoints made through the borrowed world add allocations outside these statistics. Repeated references to the same cooked mesh object share packed vertex, triangle and BVH data within an ensemble; distinct mesh objects are not content-deduplicated. Shared metadata storage remains owned by the world.

A GPU queue compacts enabled instances containing awake dynamic bodies or kinematics. Indirect integration, suspension, bounds generation and pose advancement visit only queued ranges. Broad-phase insertion and discovery use active collider hash buckets rather than sorting the whole population; collision domain and exact cell tests preserve isolation. Bucket traversal is separately bounded at 32 times `maximumCandidateTestsPerCollider`; exhausting either budget rejects the shared step and records an incomplete query. Sleeping/paused contacts retain their cache slots. Scheduling retains an awake flag per instance and consumes explicit wake notifications. Body-level sleep checks run only for participating instances. Instance flags and status still require an O(instance count) scan; controls on the borrowed world request reclassification of enabled instances. Per-instance linked contact lists prepare and compact only scheduled caches, using instance-local age counters so pauses do not expire contacts. Persistent hash storage clears only previously touched buckets after its initial full initialization.

Rollback snapshots active body vectors and journals each changed manifold, cache key and link once. It saves only scheduled instance heads/epochs and a small header. It does not copy every reserved contact slot or kinematic target on each step. Journal storage is reserved at capacity, so allocating fixed per-instance ranges does not reduce the shared memory reservation.

#### Recover one instance after contact cache exhaustion[​](#recover-one-instance-after-contact-cache-exhaustion "Direct link to Recover one instance after contact cache exhaustion")

Set `maximumPairsPerInstance` to reserve a power-of-two persistent cache for each instance. The product of the instance count and the local budget must fit within `maximumPairs`. Give the shared candidate queue enough headroom for a dense instance to exceed its local cache. The persistent cache includes candidate pairs that pass body and collision filtering, even when narrow phase finds no contact.

```
const ensemble = await GPUPhysicsEnsemble.create(device, {

  template,

  instances: 64,

  maximumPairs: 8192,

  maximumPairsPerInstance: 64,

  maximumResidentBytes: 128 * 1024 ** 2

});



// Inspect after submitting one or more steps.

const status = await ensemble.readStatus();

if (!status.instances[7].sharedFailure && status.instances[7].failure === 'contact-cache-capacity') {

  await ensemble.reset(7);

}
```

On a local exhaustion the step restores that instance's bodies, vehicle state, and persistent cache, and skips its contact event publication. Healthy siblings commit the same step. The scheduler holds the failed instance at its accepted state on subsequent steps, even if it receives a wake notification. Reset restores the template, clears quarantine, and preserves streamed terrain and the enabled flag. It reuses the compiled graph and fixed GPU allocations.

Use `readStatus()` for local failures. `ensemble.world.readSimulationDiagnostics()` continues to report the shared failure latch, which stays clear when only a local cache exhausts. Global broad-phase, mesh-work, solver, and state-validation failures still use shared rollback. A latched shared failure requires reconstruction. Use **Independent recovery (fused)** in Physics Batch Lab to watch one world run out of cache, hold while the others keep stepping, and resume after reset.

`await ensemble.readWorkStatistics()` explicitly reads last-step counters outside encoding: `activeInstances`, `activeBodies`, `touchedBuckets`, `visitedContacts`, `claimedContacts`, `journaledContacts`, `bodySnapshotBytes`, `contactSnapshotBytes` and `allocatorSnapshotBytes`. Snapshot bytes count payload writes, not total memory-bus traffic or reads. Capacity fields report resident instances/bodies and contact slots. On rejection these counters describe attempted work. With multiple substeps they refer only to the last substep.

The default compact solver uses scheduled body ranges and live-contact lists. The optional `compactContacts: false` fallback, contact-event scans, pose publication, selective reset invalidation, and explicit capture/readback can still scale with capacity. Per-instance list traversal is serial within each participating instance; very large individual worlds need separate qualification. The Physics Batch Lab and `scripts/physics/batch/run.mjs --active-fractions 0.01,0.1,0.5,1` measure this distinction with actual rounded active counts and active-body throughput. Sparse, dense, mostly sleeping and periodic wake-storm scenarios expose different scheduling costs. A separate instrumented step reports CPU encoding and available GPU timestamp costs by stage; it is excluded from throughput samples. Missing GPU timestamps are reported as unavailable. Destroy the ensemble after submitting its encoded work; do not independently destroy its borrowed world or graph. Destroying the ensemble releases its world, graph and any world-owned checkpoints.

## Batched collision casts[​](#batched-collision-casts "Direct link to Batched collision casts")

Enable queries and reserve `queryBatchCapacity` to sample many rays and sphere sweeps against the same submitted poses. The result array follows command order. Each row contains the nearest hit, a count of all hit colliders, and a `complete` flag. A row can contain a known hit and still be incomplete if bounded traversal of another collider did not finish.

```
const world = new GPURigidBodyWorld({

  bodies,

  enableQueries: true,

  queryBatchCapacity: 4096,

  queryBatchIndex: true

});

world.addToGraph(commands);



const [ray, sweptProbe] = await world.castBatch([

  {origin: [0, 0, 8], direction: [0, 0, -1], maximumDistance: 20},

  {origin: [2, 0, 8], direction: [0, 0, -1], maximumDistance: 20, radius: 0.25}

], {colliderIndices: sensorTargets});
```

A batch uses one shared collider selection. Omit `colliderIndices` to scan all colliders, or provide a compact subset. Each command can exclude one body with `excludeBody`. Distances use world units regardless of input direction length. At equal distances the lower global collider index wins, matching the scalar queries. A command without a radius uses the ray path.

Submit any previously encoded simulation work before querying. Both paths use one submission and one compact readback, with 48 input bytes and 64 result bytes per reserved command. The batch and scalar methods share a staging lock. Await each call before starting another or restoring the world. Oversized batches reject before submission.

By default a world uses a direct scan with one GPU dispatch. Set `queryBatchIndex: true` to use a GPU bounding-volume hierarchy (BVH) for sphere and box colliders. Leaf order follows the authored positions, and the GPU refits bounds from current poses for each indexed submission. Traversal inflates bounds by the sweep radius and retains exact intersection tests for candidate leaves. All hit colliders contribute to the count. Extended geometry, including meshes and planes, uses the existing direct path so it retains the same results and completion flags under its local traversal budgets.

The index uses linear GPU scratch in the configured primitive count and refits in multiple compute passes. `getCapacityInfo().queryIndexScratchBytes` reports a conservative pre-attachment bound and the actual scratch allocation after attachment. Batch and ensemble residency budgets include this scratch. Large spatially localized batches benefit the most. Small or dense batches, and scenes where objects have moved far from their authored neighborhoods, may favor `{strategy: 'scan'}`.

Select **Collision scan (GPU index)** in Physics Batch Lab to scan a field of spheres and rotated boxes. The example checks every row against the direct GPU scan and samples scalar queries, displays the depth image, and reports matched host timings including refit, submission, and readback. Set the sweep radius to zero for rays.

## Terrain from math.gl geometry[​](#terrain-from-mathgl-geometry "Direct link to Terrain from math.gl geometry")

Use the same indexed triangle surface for rendering and collision. If the source is a math.gl height field, create a `HeightFieldGeometry` with one origin per tile. Its triangles preserve sample registration, cell diagonals, and gaps for missing samples. The physics adapter accepts the existing `@math.gl/geometry/primitives` contract, so luma.gl does not need to load or depend on `@math.gl/terrain` to cook it. The snippet uses the math.gl terrain source API. Applications using released packages can pass any compatible CPU triangle geometry to the same cooker.

```
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain';

import {makeStaticTriangleMeshGeometry} from '@luma.gl/graph/gpu-physics';



// field is a HeightField in a Z-up, local metric coordinate system.

const surface = new HeightFieldGeometry(field, {origin: tileOrigin});

const terrainBody = {

  mass: 0,

  position: surface.origin, // Relative to the physics world's current origin.

  shape: {

    type: 'triangle-mesh' as const,

    geometry: makeStaticTriangleMeshGeometry(surface)

  }

};
```

Use the physics body's local frame when placing the rendered mesh. A geospatial application must first choose a local metric frame and common elevation reference. Apply the same rebasing to both paths so float32 GPU positions stay small. Do not pass longitude and latitude as distances.

The static cooker takes XYZ `POSITION` data and authored triangle-list indices, retains only referenced vertices, and omits closed-solid mass properties. Skip fully empty tiles. Exclude render skirts from collision geometry unless they represent real walls. Use `makeTriangleMeshGeometry(positions, indices)` for closed dynamic meshes that need mass properties. For an existing scenegraph, `PhysicsController.addBody` also accepts the geometry with `motion: 'static'` and `geometryMode: 'triangle-mesh'`.

Vehicle terrain candidates are supplied explicitly. Neighbor selection, mixed-resolution seams, and source-to-metric conversion remain with the application.

### Native height fields and tile residency[​](#native-height-fields-and-tile-residency "Direct link to Native height fields and tile residency")

Use `{type: 'height-field', field}` on a static body to store scalar heights and a small cell hierarchy instead of uploading a cooked triangle mesh. The GPU reconstructs the selected cell triangles for contacts, raycasts, sphere casts and suspension. Missing samples remove the triangles that use them. Affine XY steps, the cell diagonal, and an optional first-sample offset are retained in the collider-local Z-up frame. `makeRigidBodyHeightField(heightField, tileAnchor)` adapts the structural math.gl API and subtracts the anchor before converting vertices to float32. Choose a local metric frame with a common vertical datum before calling it.

```
import {GPURigidBodyWorld, makeRigidBodyHeightField} from '@luma.gl/graph/gpu-physics';



const world = new GPURigidBodyWorld({

  bodies: [

    {

      mass: 0,

      position: [0, 0, 0],

      shape: {type: 'height-field', field: {width: 65, height: 65}}

    }

  ]

});

// Attach the world to a GPUCommandGraph and compile before loading a tile.

world.setHeightFieldTiles([

  {

    collider: 0,

    field: makeRigidBodyHeightField(heightField, tileAnchor),

    position: tileAnchor

  }

]);



// Evict the tile without destroying the collider or its reserved storage.

world.setHeightFieldTiles([{collider: 0, field: null}]);
```

The example uses a zero-origin static body, so the collider position and tile anchor use the same coordinates. In general, pass the tile's placement in the **body-local** frame. If you rebase the simulation, the body and collider shift together. A slot keeps its width, height, collider ID, and GPU allocation for its lifetime. Submit encoded commands before changing residency. The world validates every edit before uploading any of the batch, then invalidates cached contacts and wakes the world once. The application owns fetching, slot assignment, and neighbor loading. GPU checkpoints restore the currently loaded tiles as well as body state.

There is a cap of one million samples per tile, subject to adapter storage limits. Native height fields work with sphere/static CCD and through the triangle contact path. Moving-convex CCD continues to exclude terrain shapes. Ensembles can share immutable height fields, while independently resident worlds support streaming. Off-road Buggy streams collision tiles ahead of the chassis. Append `?terrain=mesh` to use the same rendered course with the cooked-mesh reference.

### Provider-backed terrain windows[​](#provider-backed-terrain-windows "Direct link to Provider-backed terrain windows")

Use `GPURigidBodyTerrainStream` when the app has a tile provider and a set of fixed height-field slots. A window describes the desired collider IDs, versioned tile keys and neighboring edges. The provider can decode network assets, adapt a math.gl height field, or serve data from the application's tile cache. The stream owns concurrency and cancellation. The application selects tiles and LOD, and supplies slot placement in one shared local metric frame.

```
import {

  GPURigidBodyTerrainStream,

  makeRigidBodyTerrainFetchProvider,

  makeRigidBodyHeightField

} from '@luma.gl/graph/gpu-physics';



const provider = makeRigidBodyTerrainFetchProvider({

  getTileUrl: key => `/terrain/${encodeURIComponent(key)}.bin`,

  async decode(response, key) {

    const {heightField, tileAnchor} = await decodeTerrainTile(await response.arrayBuffer(), key);

    return {

      field: makeRigidBodyHeightField(heightField, tileAnchor),

      position: tileAnchor

    };

  }

});

const stream = new GPURigidBodyTerrainStream(world, {provider, maximumConcurrentLoads: 4});



// Slots 0 and 1 exist in the compiled world and match their tiles' sample dimensions.

await stream.prepare({

  tiles: [{collider: 0, key: 'west@3'}, {collider: 1, key: 'east@8'}],

  seams: [{first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'}]

});



// In the frame loop, between submissions and after pending queries:

stream.apply();
```

The renderer can read the stitched CPU tile with `getTile(collider)`. Keep stream slots in the same body-local frame and reserve each slot at its expected resolution. For height fields in a global coordinate system, subtract the simulation origin from tile placement before publishing. Use one vertical datum and nearby tile anchors.

A newer `prepare` cancels the previous request. It resolves to `false` for a canceled window and rejects on a provider or stitch error. The current window keeps supporting the simulation until `apply` publishes the replacement as a single slot-edit batch. Duplicated keys share a request across overlapping windows. Raw tiles are reused while their keys remain active. Change the key when the source content changes. Call `clear()` between submissions to cancel pending work and evict stream-owned slots. Use exclusive ownership of those slots, including when restoring checkpoints.

Declared seams must have collinear boundaries, nested sample spacing, and a shared span that begins and ends at coarse sample knots. One coarse edge can meet multiple fine tiles. The fine boundary follows the coarse edge's piecewise-linear profile. The stitcher resolves coincident corner heights before interpolating intermediate samples, keeps missing-data gaps, and recomputes from raw samples when neighbors change. A slot with no declared seam uses its provider samples directly. Matching boundary heights permits a slope change across the seam.

Open Off-road Buggy with `?terrain=mixed` for adjacent 17×17 and 33×33 grids. The bundled provider serves the same stitched samples used to render the course.

### Automatic terrain LOD and residency[​](#automatic-terrain-lod-and-residency "Direct link to Automatic terrain LOD and residency")

Use `GPURigidBodyTerrainSelector` when a provider has several resolutions of the same terrain. Give it the dataset's local metric XY bounds, the highest available quadtree level, and the collider indices reserved for streaming. The selector chooses the detail around a focus, keeps neighboring levels within one LOD, and provides the edge matches needed by the stream.

```
const selector = new GPURigidBodyTerrainSelector({

  bounds: [-512, -512, 512, 512],

  slots: terrainColliderIndices,

  maximumLevel: 6,

  getTileKey: ({level, column, row}) => catalog.get(`${level}/${column}/${row}`)

});



// Request during movement. The previous window stays active while tiles load.

const window = selector.select({position: [vehicleEast, vehicleNorth], radius: 80});

await terrainStream.prepare(window);



// Publish between simulation submissions.

terrainStream.apply();
```

* `radius` limits collision residency around the focus. Leave it out to keep coarse coverage to the root boundary. Include enough distance for the vehicle to travel while a new window loads.
* `refinementDistance` controls the switch distance in tile widths. The default hysteresis keeps recent detail briefly as the focus moves and preserves collider assignments for retained addresses.
* Return `undefined` for missing catalog entries. A missing child keeps its parent resident. A missing root yields an empty selection. Change a key when the corresponding provider content changes. Without a callback, the keys are `level/column/row`.
* When the slot budget prevents a split, the selection retains coarser leaves and reports `slotLimitReached`. Use the same reserved slot list throughout the life of the selector.
* Sample within `getRigidBodyTerrainTileBounds(bounds, address)` with columns and rows increasing along positive X and Y. Use a common grid with an even number of cells per axis (for example, 33×33 samples) so the automatically matched half-tile boundaries align. Fetch or generate the tiles in the same local metric frame as the physics focus.
* Call `selector.reset()` when restoring a starting selection after a teleport or checkpoint reset. Coalesce identical requests before calling `prepare` each frame. Use the latest committed `getTile(collider)` when rendering the stitched collision surface.

Open Off-road Buggy with `?terrain=auto` to see the active tiles and LODs change as the chassis moves. Its terrain panel reports the committed window.

### Terrain streaming in fused ensembles[​](#terrain-streaming-in-fused-ensembles "Direct link to Terrain streaming in fused ensembles")

Reserve vacant native height-field colliders in the template and list their template-local collider indices in `terrainSlots` when creating `GPUPhysicsEnsemble`. The ensemble allocates writable sample and hierarchy storage for each reserved slot in each instance at creation. Authored height fields outside that list can still share their immutable GPU data. All slots remain fixed in shape and grid dimensions, and their allocation counts toward `maximumResidentBytes`.

```
const ensemble = await GPUPhysicsEnsemble.create(device, {

  template,

  instances: 64,

  terrainSlots: [0, 1, 2, 3],

  maximumPairs: 8192,

  maximumResidentBytes: 128 * 1024 ** 2

});

const terrain = ensemble.createTerrainStreamer({

  provider,

  maximumConcurrentLoads: 8

});



// Give each moving instance its own selector and focus.

const selector = new GPURigidBodyTerrainSelector({

  bounds: [-256, -256, 256, 256],

  slots: ensemble.terrainSlots,

  maximumLevel: 4

});

const instance = 6;

await terrain.prepare(instance, selector.select({position: [40, 72], radius: 24}));



// Submit previously encoded work before applying a prepared window.

terrain.apply(instance);
```

Each instance stages and publishes independently. All windows share the same provider concurrency limit and reuse requests and source samples by versioned key while any instance needs them. Stitching happens per instance. A failed or superseded request leaves that instance's committed tiles in place. Use `getTile(instance, collider)` to read a detached stitched surface for rendering. Use `getColliderIndex(instance, collider)` to target that slot in a query against the fused world.

A terrain edit discards cached warm-start impulses when a contact next sees the edited collider. Standalone worlds wake dynamic bodies overlapping the old or new tile bounds, so removing support wakes resting bodies. In a fused ensemble the edit wakes only the affected partitions, and disabled instances stay disabled until explicitly enabled. Shared discovery and solver failures still apply to the full ensemble.

`ensemble.reset(instance)` restores that instance's body state and keeps its committed terrain slots, including their local placement. Call `terrain.clear(instance)` to evict them, or `terrain.cancel(instance)` to discard pending work while keeping the current tiles. Destroying the ensemble cancels its outstanding provider requests. For already decoded tiles, use `ensemble.setHeightFieldTiles(instance, edits)` as the direct publication path. Choose one publication path for the reserved slots. Whole-world checkpoints and debug captures operate on GPU state and require application coordination with any live streamer's residency.

Select **Streamed terrain (fused)** in Physics Batch Lab to measure window publication and solver time separately while changing one instance at a time.

#### Shared terrain atlas pages[​](#shared-terrain-atlas-pages "Direct link to Shared terrain atlas pages")

Set `terrainAtlas` when many fused instances reuse terrain. It reserves a fixed number of pages for each grid size used by `terrainSlots`. Specify a pool for every reserved grid size. Omit the option to keep one private page per reserved slot.

```
const ensemble = await GPUPhysicsEnsemble.create(device, {

  template,

  instances: 64,

  terrainSlots: [0, 1], // Both colliders reserve a 33 × 33 grid.

  terrainAtlas: [{width: 33, height: 33, pages: 12}],

  maximumPairs: 8192,

  maximumResidentBytes: 128 * 1024 ** 2

});

const terrain = ensemble.createTerrainStreamer({provider});



await Promise.all([

  terrain.prepare(0, firstWindow),

  terrain.prepare(1, secondWindow)

]);

terrain.applyMany([0, 1]);
```

Pages share the packed sample and hierarchy data. The atlas compares the actual GPU payload after stitching, so adjacent tiles can make the same provider key produce different pages. Conversely, identical data can share a page across different keys or collider placements. Each collider keeps its own placement, material, and contact revision. A changed tile can reuse a matching page or allocate a new one while other colliders keep the old page. Evicting the last reference makes the page available for reuse.

Size each pool for the maximum number of distinct payloads that must coexist at that resolution. If a window exceeds the pool, publication throws and keeps the committed windows and their collider references intact. You can stage several windows and use `applyMany(instances)` to publish them as one transaction when an old page can be released only by moving several of its users together. The method applies only ready windows and returns the number committed. Await each `prepare()` first when every window is required for a handoff.

`ensemble.getStats().terrainAtlas` reports occupied pages, resident collider references, and reserved bytes alongside the equivalent private-slot payload size. Atlas pages count toward the world memory budget at creation. Instance reset preserves active leases. Full world captures and GPU checkpoints restore the exact page references along with their GPU data. Coordinate a full world restore with any provider window bookkeeping.

The **Streamed terrain (fused)** Physics Batch Lab workload reports shared atlas occupancy and allocated payload bytes for comparison with private slots.
