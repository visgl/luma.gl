import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Scenegraph Physics Integration

<EngineDocsTabs group="scenegraph" active="physics" />

The engine describes scene objects and constraint attachments. The graph physics
module owns body state, collision detection and constraint solving. glTF imports and
programmatic scenes meet at the same engine representation before the graph adapter
creates GPU simulation data.

## Physical Joints

`JointController` holds `ScenegraphJoint` declarations. Each joint references two
attachment nodes, with optional limits, drives, collision policy and enabled state.
These are physical constraints, distinct from the joint-node list used for skinning.

```ts
import {GroupNode, JointController} from '@luma.gl/engine';

const fixedAnchor = new GroupNode({id: 'fixed-anchor'});
const movingAnchor = new GroupNode({id: 'moving-anchor'});
const body = new GroupNode({id: 'body', children: [movingAnchor]});
const root = new GroupNode({children: [fixedAnchor, body]});
const joints = new JointController([{
  first: fixedAnchor,
  second: movingAnchor,
  limits: [{axes: [0, 1, 2], minimum: 0, maximum: 0}],
  collideConnected: false
}]);

const resolved = joints.resolve([root], new Set([body]));
```

This fixes the two attachment points together while leaving rotation unconstrained.
It resolves metadata; it does not start a simulation.

For each attachment, resolution finds the closest body-owning ancestor, including
the attachment node itself. With no body ancestor the attachment is fixed in world
space and its resolved `body` is `null`. Otherwise its pose is expressed relative to
the owner's rigid frame. Authored scale contributes to anchor offsets rather than
becoming a scale in the rigid-body orientation.

Axes `0`, `1`, and `2` denote the attachment frame's X, Y and Z axes. Linear and angular
limits are distinct; drives specify a single axis, force or acceleration mode, targets,
spring/damper coefficients and an optional force cap. Multiple limits and drives can
compose one physical joint. Consult the physics API for the supported solver envelope;
being representable in the scenegraph does not by itself qualify every configuration.

`makeRigidBodyJointsFromScenegraph()` in the graph physics module translates resolved
attachments into body indices and solver rows. A world-fixed attachment requires the
adapter's static world body. Keep source node indices and backend body indices in
separate maps; neither is interchangeable with a node reference.

## Transform Ownership

Declare who writes each simulated body's pose:

| Owner | Update path |
| --- | --- |
| Static scene | Authored transform initializes a stationary collision object |
| Animation/application | Sample the node transform and submit a kinematic target |
| Physics | Integrate the dynamic body and publish its pose for rendering |

`ScenegraphPhysicsMotion` samples declared node references after animation and supplies
kinematic targets before a fixed physics step. It also records inverse authored body
frames used to combine published poses with render geometry.

The glTF physics import option `animationOwnership: 'scenegraph'` permits supported
translation/rotation animation of body nodes or ancestors and assigns those bodies
kinematic ownership. It is not blanket support for animated scale, deforming collision
meshes or arbitrary physics object-model mutation. Unsupported imports must report
diagnostics instead of silently using stale collision shapes.

## Frame Order

A physics-integrated frame typically performs:

1. Accumulate elapsed time and choose the number of fixed simulation steps.
2. For each step, sample animation at that simulation time.
3. Submit the corresponding kinematic targets and gameplay commands.
4. Encode and submit the physics step and pose publication.
5. Consume completed queries/events according to the application's scheduling policy.
6. Update CPU-dependent deformation, then render using the accepted published poses.

Queued buffer writes and encoded commands must preserve step ordering. Sampling several
kinematic poses into one buffer before executing any steps can make every step observe
only the last pose. The glTF example submits animated steps in order to preserve their
target samples.

## Direct GPU Pose Publication

A rigid-body world can publish body matrices with `publishPoses: true`. The renderer
can borrow that buffer through the engine `publishedTransforms` shader module. The
glTF model adapter accepts `publishedTransforms` and binds per-model body indices,
allowing rigid visual geometry to follow physics without a per-frame pose readback.

This path requires WebGPU and shader participation. It does not mutate every CPU node
matrix. CPU bounds, picking code, skin palettes and application traversal therefore
must not assume that they see the latest GPU pose automatically. Use appropriate GPU
publication/query paths or deliberate readback for consumers that require CPU state.
The physics world retains ownership of its publication buffer.

## Behavior and Queries

`ScenegraphPhysicsBehaviors` adapts engine interactivity physics operations to a rigid-body
world. It maps source-visible node identity to body ownership for impulses, resolves
query results back to nodes, and dispatches trigger events. Query output and event
transport have bounded capacities; incomplete or lost results are errors, not evidence
that no collision occurred.

The shared bridge is a foundation for imported behavior graphs. It does not make
unsupported sensor combinations or every proposal pointer
operation available automatically. See the physics qualification profile for tested
coverage rather than inferring completeness from one working scene.

## Runtime Property Bindings

`ScenegraphPhysicsProperties` resolves property addresses to body, collider-material, analytic-shape or
joint indices. It calls `setBodyParameters`, `setColliderMaterial` and
`setJointParameters` and `setColliderShapes` between submitted steps. glTF builds this address table with
`makeGLTFPhysicsProperties`; the runtime does not retain glTF parsing logic.
The same adapter works with `Interactivity` and the engine’s
`makeAdapterAnimationBinding` for programmatic animation tracks.

Motion edits update mass, inertia, COM, velocity, gravity and kinematic mode on the GPU.
Changing COM preserves the body-node pose and moves the COM velocity consistently with
its angular velocity. Joint anchors remain in node coordinates. Material edits invalidate
cached contacts. These controls and their configured properties participate in captures,
GPU checkpoints and command replay. No pose readback or shader rebuild is required.

Property getters return configured values. To inspect the evolving simulated velocity,
use the asynchronous `readState()` diagnostics API. Submit each physics step before
applying the next step’s property values; queue writes cannot be interleaved inside an
already encoded command buffer. The gallery demonstrates this with an animated hinge
actuator target.

Analytic shape bindings cover sphere radius, box size, tapered capsule/cylinder height
and radii, and plane extents/sidedness. Shared glTF shapes update all referring
colliders with their own scale conversion. A batch validates every shape before
writing GPU metadata, recalculates derived inertia, wakes affected bodies and
invalidates contact caches. Explicit mass, COM, inertia and visual publication bounds
remain caller-owned. Resizing does not conserve angular momentum automatically:
velocities are retained, so shape animation is an authored energy input.

`ScenegraphPhysicsMotion` also applies exact analytic scale changes before stepping.
Boxes permit nonuniform scale; spheres and capsules require uniform scale, and
cylinders require equal radial scale. Singular scale, ellipsoids and mesh deformation
are rejected rather than approximated. The Animated collider scale gallery scene
shows a growing platform supporting a dynamic box.

## Lifecycle and Current Limits

Keep scene nodes, physics bodies, query identities and render bindings aligned for the
lifetime of one scene instance. Replacing a scene means rebuilding these bindings,
stopping old behavior continuations and disposing resources after GPU completion.
Resetting simulation state should restore authored body poses without resetting the
user's camera.

`ScenegraphPhysicsInstance` owns an independent world and compiled graph. `reset()`
restores its authored state. `rebuild(definition)` compiles a replacement before committing
it and preserves dynamic node poses by object reference; failure leaves the current
world usable. Rebuilds begin a new revision for borrowed render buffers and event
identities. Use `makeGLTFPhysicsDefinition` to bind an updated glTF collision snapshot to
the same render-scene node references. Explicit rebuilds read state once; ordinary steps
keep poses on the GPU. `destroy()` waits for pending work before releasing resources.

Animated child-collider translation, rotation and supported analytic scale use `ScenegraphPhysicsMotion` without
taking ownership of their parent body's motion. Bindings are a list of collider targets,
so one node can animate both a solid collider and a trigger. Each target can supply a
`localMatrix` for its cooked frame relative to the node; glTF descriptions retain this
matrix so off-center mesh bounds keep their offset during animation. These are collider teleports: they do
not promise physical response to shape deformation.

`capture()` explicitly reads live simulation buffers and stores the authored reset
definition alongside them. `restore(capture)` compiles and validates a replacement
before publishing it; failed restoration leaves the accepted execution usable.
Restoration increments `revision`, so replace borrowed renderer/behavior bindings.
Reset after restoration still returns to the captured authored starting state.
Captures retain scene object references and are tied to the implementation version;
they are not a portable glTF export or a cross-device binary format.

Wrap asynchronous queries in `instance.withWorld(world => world.raycast(query))` when
using instance-managed lifetimes. Reset/rebuild/advance reject while the operation is
pending; destruction waits for it. Direct calls on borrowed `instance.world` remain
the caller's responsibility. Do not call another instance operation inside this callback.

The shared representation does not yet provide automatic collider reconstruction for
morphed/skinned geometry, general scene edits, or arbitrary glTF export/reimport of
live simulation state. Direct GPU physics-to-skinning palette generation also remains
separate work. These boundaries are explicit so a programmatic scene and an imported
glTF scene receive the same behavior rather than different hidden implementations.

## Authored-scene sessions

`ScenegraphPhysicsSession` coordinates an engine scene and a physics instance. glTF
resolves source indices once with `makeGLTFPhysicsScene`; simulation, ownership,
properties and render publication use the same objects as programmatic scenes.

```typescript
const session = await ScenegraphPhysicsSession.create(
  device,
  makeGLTFPhysicsScene(description, {
    roots: rendered.scenes,
    nodes: rendered.gltfNodeIndexToNodeMap
  })
);
await session.step(animatedNodes, () => mixer.update(fixedTimeStep));
```

Pass the nodes with active transform tracks after blending. Animated ancestors own
descendant body poses. Paused tracks keep ownership; stopped tracks release it.
Release restores the requested body mode and retains the accepted pose and velocity.
Seeking is an authored kinematic movement and can inject energy. Keep animation time
and action state in the application; a physics capture does not serialize the mixer.

`session.publication` exposes borrowed GPU `matrices`, world `bounds`, and a map of
mesh-to-body `localMatrix`, `body`, and inherited `visible` values. A renderer multiplies
its mesh-local matrix by the published body matrix in both visible and shadow passes.
Refresh every buffer binding when `session.revision` changes, including draws whose
body index is -1: a declared storage binding must still point to a live buffer.
Visual bounds come from leaf geometry (including renderer-supplied instance and
deformation bounds). They are independent of collider bounds. Recompute them after
geometry edits; a CPU frustum test against stale authoring transforms is not valid for
GPU-moved bodies.

`capture()` records live physics, scene transforms, visibility, child references and
animation ownership. `restore()` rebuilds all bindings before publishing the revision;
`reset()` restores the authored scene and leaves the external camera alone.
`rebuild(cook, preserveState)` accepts a new scene, including a different selected
scene when `preserveState` is false. Cooking should build detached resources; the
session can roll back node transforms but cannot undo arbitrary external resource edits.
Instances may share immutable meshes and materials, but need separate mutable node
objects when animated independently.

Use `withWorld` for asynchronous queries. Behavior bindings invalidate queued work
and drain active query/event reads before replacement or disposal. New session
operations reject while another operation is pending; `destroy()` drains it.
Do not retain `world`, property adapters, render buffers or behavior bindings across
revisions. The authored-scene stress lab exercises this lifecycle repeatedly.

### Deformation and native glTF export

For an explicit skin/morph cooking revision, `snapshotGLTFPhysicsScene(source, nodes)`
copies current local transforms and morph weights, and
`makeGLTFPhysicsMeshResolver(sourceScenegraph, nodes)` decodes a fresh collision
snapshot. It delegates deformation to the engine's `deformPositions`; create a new
resolver for each revision. Use the resulting description with `session.rebuild`.
Continuous deformable-body dynamics and automatic per-frame mesh recooking are not
provided.

`exportGLTFPhysicsState(source, description, world)` returns native glTF JSON with
live body poses/velocities and configured physics properties, preserving source
geometry references and other fields. It explicitly reads state and does not export
solver caches. Existing animation clips remain intact and can replace exported poses
when played. JSON and its referenced binary resources must be saved together.
Shared resource edits must agree; divergent low-level edits and unreconciled animated
scale require recooking before export. Version-specific captures are a separate API
and are not portable glTF files.
