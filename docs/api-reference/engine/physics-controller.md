# PhysicsController

Application-facing GPU physics for an existing engine scenegraph. Import from
`@luma.gl/engine/physics`. Requires WebGPU.

```ts
import {PhysicsController} from '@luma.gl/engine/physics';

const physics = new PhysicsController(device, {scene, gravity: [0, -9.81, 0]});
const ball = physics.addBody('/room/ball', {motion: 'dynamic', mass: 2});
physics.addBody('floor', {motion: 'static'});
await physics.prepare();

// deltaTime is in seconds. Encoding/submission is synchronous; no pose is read back.
physics.update(deltaTime);
ball.applyImpulse([1, 0, 0]);

// Explicit asynchronous inspection and editing boundaries.
const pose = await ball.readPose();
await physics.reset();
await physics.destroy();
```

## Node references

`addBody`, `getBody`, `removeBody` and joint attachments accept a `ScenegraphNode` or a
string resolved through `scene.findNode()`. A bare ID or partial path searches the subtree;
a leading `/` anchors the path below `scene`. Missing attachment targets and ambiguous
paths throw. `getBody` returns `undefined` for a missing node or an unattached node.

Paths resolve when the method is called. Returned body handles retain object identity;
moving a node does not retarget an existing handle. Resolve paths during setup rather than
calling `getBody(path)` in every frame. Preparing verifies that registered nodes belong to
the scene. Cycles and shared node objects are rejected.

## Construction

`new PhysicsController(device, {scene, ...options})` accepts a `GroupNode` and the rigid-body
world options, except body lists, publication settings and backend joint rows. Gravity,
solver choice, contact settings and collision/query options retain their existing meanings.
`timeStep` defaults to `1 / 120` seconds. `maximumSubsteps` defaults to four.

## Body authoring

`addBody(nodeOrPath, options = {})` returns a `PhysicsBody` handle. The default motion is
`dynamic` with mass one; declare `motion: 'static'` for stationary geometry or `kinematic`
for scene/application-driven motion. Options include mass, friction, restitution, initial
velocities, center of mass, inertia and gravity factor.

`collider: 'geometry'` is the default. The controller snapshots CPU geometry from
`PhysicsGeometryNode.geometry` or `ModelNode.model.sourceGeometry`. A registered group
collects descendant geometry, stopping at descendants with their own bodies. Hidden
geometry participates. Declared `ModelNode.instanceMatrices` become compound colliders.

- Unmodified box primitives use analytic boxes.
- Spherical primitives with uniform scale use analytic spheres.
- Flat static surfaces retain their finite triangles rather than attempting a volumetric hull.
- Other triangle-list geometry is cooked as a convex hull by default.
- `geometryMode: 'triangle-mesh'` explicitly requests triangle surfaces, including concavity.
- An explicit `collider` shape overrides inference. Its dimensions are scaled by the
  authored body-node scale. Supply `geometry` when a node has no retained CPU geometry.

Cooking includes authored transforms and scale. Controller options are authoritative;
legacy `PhysicsGeometryNode` body/collision fields are not imported automatically. Sheared transforms are rejected. GPU-only
geometry requires an explicit shape; shaders, skinning, morphing and procedural GPU
deformation are not evaluated by inference. Geometry, scale, instance, collider-local child-transform and hierarchy edits
require another `prepare()`. Visual bounds are prepared from CPU geometry as a fallback
for nodes without bounds; normal node bounds remain authoritative.

`getBody(nodeOrPath)` returns the existing handle. `removeBody(nodeOrPath)` returns whether
a body was removed. A removed handle cannot control a subsequently reattached body, even
when it uses the same node object. Body edits require `prepare()` before further updates.

## Joint authoring

```ts
const joint = physics.addJoint({
  first: 'cradle/ball/attachment',
  second: '/frame/anchor',
  limits: [{axes: [0, 1, 2], minimum: 0, maximum: 0}],
  collideConnected: false
});
```

Attachment paths resolve to shared engine `ScenegraphJoint` node references. The existing
`JointController` resolves nearest body owners and body-local frames. Attachments without
a body ancestor are fixed in world space. Limits, drives and connected collision policies
use the existing solver envelope; the controller does not expand solver capabilities.
`removeJoint(joint)` removes that declaration. Call `prepare()` after editing declarations.

## Preparation and updates

`await prepare({preserveState: true})` compiles the initial world, or transactionally rebuilds
an existing session. Dynamic state is preserved by node identity by default. Set
`preserveState: false` to start from the newly authored scene. Preparation and reset clear
the elapsed-time accumulator and explicit kinematic targets.
If preparation fails, the old session remains owned but updates stay disabled until a
successful preparation; fix the authoring error and retry.

`update(deltaTime, {animatedNodes} = {})` accumulates nonnegative seconds and submits at most
`maximumSubsteps` fixed steps. It returns `{steps, simulatedTime, droppedTime}`. Excess time
is dropped and reported, preventing unbounded catch-up work. Submission does not wait for a
GPU fence; the host still owns frame pacing and rendering. Do not overlap it with pending
prepare, readback, reset or destroy operations.

Kinematic bodies follow authored scenegraph transforms by default. `animatedNodes` is a set
of animation roots, not the list of kinematic bodies. A scene-following kinematic parent
does not take ownership of separately registered dynamic descendants. Explicit target
exclusions affect only that body; animation still propagates to independent descendants.
Supply resolved node references from the animation system, including paused actions. This
temporarily hands affected bodies to animation. Releasing animation retains the last accepted pose and
velocity. This API does not resample animation or interpolate targets between substeps.

## Body commands

- `body.applyImpulse(impulse, {point} = {})`: world-space impulse; an omitted point uses the
  current GPU center of mass.
- `body.setKinematicTarget({position, rotation})`: explicit world-space node-origin target
  for a body declared kinematic. Rotation is a quaternion. This overrides inherited scene
  animation until `body.followScenegraph()` restores scene ownership.
- `await body.readPose()`: explicit diagnostic readback returning a world-space node-origin
  position and quaternion. Currently reads the world's body-state arrays; avoid per-frame use.

## Publication and lifetime

`physics.publication` exposes the existing `ScenegraphPhysicsPublication`: borrowed GPU
matrices, bounds and node bindings. Rendering composes each published body matrix with its
mesh-relative matrix. CPU node transforms remain authored/animated values.

Fetch publication again after prepare/reset changes `physics.revision`; old buffers belong
to the old session revision. This controller does not yet add automatic scene traversal,
shadow casting or physics bindings to `SceneRenderer`. Those remain the next renderer
integration step; existing physics-aware render adapters can consume this publication.

`await reset()` restores authored bodies and scene-node transforms, preserving cameras
outside the controlled scene. `destroy()` is idempotent, waits for pending operations and
GPU work, and releases the owned session. Scene nodes, source geometry, models and materials
remain application-owned. Existing handles reject commands after destruction.
