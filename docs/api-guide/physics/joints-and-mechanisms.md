---
title: Joints and mechanisms
description: Build pendulums, hinges, sliders, springs and driven attachments.
---

# Joints and mechanisms

A physical joint restricts the relative motion of two body attachments. It is distinct
from a skeletal joint used by a skin. The engine can represent attachments shared by
programmatic scenes and glTF imports; the physics adapter converts them to solver rows.

| Constraint | Intended motion |
| --- | --- |
| Distance | Keep attachment points a fixed distance apart, optionally with a spring |
| Fixed | Lock relative position and orientation |
| Hinge | Rotate about one attachment-frame axis, with optional limits and motor |
| Slider | Translate along one attachment-frame axis, with optional stops and drive |
| General | Compose supported linear/angular attachment limits and drives |

## A suspended ball

```ts
const joints = [{type: 'distance' as const, first: 0, second: 1, distance: 10}];
```

Here `first` and `second` index the world's body array. Body zero could be a static
anchor and body one a dynamic sphere. Place their initial attachment points ten world
units apart. Optional attachment frames are body-local, not center-of-mass-local.

The [Wrecking Ball example](/examples/experimental/wrecking-ball) uses a real distance
constraint. Gravity drives the swing and contact impulses change the ball's motion;
its path is not a prescribed animation.

## Solver choice

The ordered reference solver supports the broader bounded joint envelope. Parallel
contacts support static-anchored distance joints: a small GPU joint sweep alternates
with contact iterations. Dynamic-to-dynamic joints, moving anchors and the other joint
families still require ordered solving.

The parallel distance path is useful when one pendulum interacts with a large block pile.
It avoids sending every block contact through the serial reference solve. The current
joint count is bounded to 64; this is not a general articulation solver.

## Limits, motors and compliance

Attachment frames determine axes. Hinge angular limits use wrapped radians; sliders use
linear distance. Velocity motors and position drives have force/torque caps. Springs and
dampers provide compliance and energy loss instead of assuming perfectly rigid, lossless
motion. Check the [joint reference](/docs/api-reference/graph/gpu-rigid-body-world#ordered-joints-and-mechanisms)
for exact frame conventions and supported controls.

More iterations can reduce coupled constraint error, while smaller fixed steps resolve
motion more frequently. They change different aspects of the approximation. Measure
joint length/angle drift, contact penetration and energy behavior at the chosen settings.

For scene-authored attachments, see [Scenegraph joints](/docs/api-guide/engine/scenegraph-joints)
and [Scenes and glTF](./scenes-and-gltf.md).

## Command a named actuator

Give a programmatic scenegraph joint an `id` and author an angular force drive on the desired local axis. A glTF rig uses the **attachment node name** as its joint ID, with `node-<index>` as the fallback for unnamed nodes. Within a physics world the pair of joint ID and axis must identify exactly one angular force drive. The same name may be reused in another world.

```ts
const world = session.world;
world.setAngularActuator('elbow', 1, {
  angle: Math.PI / 6,
  stiffness: 2400,
  damping: 70,
  maximumTorque: 150
});

// A later angle-only command retains the existing gains and torque cap.
world.setAngularActuator('elbow', 1, {angle: 0});

// Optional diagnostic readback after submitting the step.
const torque = await world.readAngularActuatorTorque('elbow', 1);
```

The axis is local to the joint frame (X = 0, Y = 1, Z = 2). Angles are radians. Torque is the signed angular constraint impulse divided by the fixed timestep, in N·m. A motor at its cap can sustain a pose error under gravity or contact. Use the torque readback for telemetry at a lower rate than simulation. Rendering can consume the published body transforms directly.

In the **Robot arm** scenario, open **Info → Settings** to change payload mass, elbow target and torque cap. Lower the arm onto the work stop, then raise the target to lift away. Reset preserves your settings.

## Fixed-base articulated trees

Use `GPUArticulationTree` for a small mechanism moving under gravity and joint torques. Specify its links in parent-before-child order. Each revolute link adds one independent angle. A welded link adds inertia to its ancestors. The solver derives each child pose from its parent and attachment frames, so a joint cannot pull apart under load.

```ts
import {GPUArticulationTree} from '@luma.gl/graph/gpu-physics';

const tree = new GPUArticulationTree({
  timeStep: 1 / 120,
  base: [0, 0, 2],
  links: [{
    id: 'shoulder',
    parent: -1,
    parentAnchor: [0, 0, 0],
    childAnchor: [-0.5, 0, 0],
    axis: [0, 1, 0],
    mass: 1,
    inertia: [0.02, 1 / 12, 1 / 12]
  }]
});
const poses = tree.addToGraph(graph);
tree.setDrive('shoulder', {angle: 0, stiffness: 100, damping: 8, maximumTorque: 20});
```

Compile and submit the graph once per fixed step. A downstream GPU pass can read the returned pose handle after the solver pass. Each 64-byte record has four `vec4f` fields: world COM position, XYZW orientation, linear velocity and angular velocity. The CPU diagnostics and torque readbacks are optional. Destroy the compiled graph before the tree.

Supply positive principal inertia about each link's COM. Anchors are offsets from the parent and child COMs. The unit axis is in parent space; omit it to weld a payload. An optional rest quaternion rotates the child into the parent frame at zero joint angle. The current solver handles up to 16 links on a stationary base. Use the general rigid-body world for arbitrary collision geometry, joint limits, closed loops or a floating base. A numerical failure latches diagnostics and preserves the last accepted output; build a fresh tree after correcting the inputs.

### Pressing against a work stop

Pass a `contact` when constructing the tree to couple one link-centered sphere to a stationary, world-axis-aligned box. The normal reaction acts through the articulated mass matrix alongside the drive impulses. It can support the load and falls to zero when the link lifts away. This contact is frictionless.

```ts
const arm = new GPUArticulationTree({
  links, base, timeStep: 1 / 120, publishMatrices: true,
  contact: {link: 'payload', radius: 0.25, center: [3.55, 0, 0.52], halfExtents: [0.6, 0.5, 0.52]}
});
```

After registering the tree, a renderer can consume `arm.poseMatrices` in link order. After stepping, `readSimulationDiagnostics().then(status => status.normalForce)` reports the compressive reaction in newtons. In the Robot arm scenario, open **Try the 3 kg work-stop comparison** to switch solvers and press or lift the load.

### Carrying a free workpiece

A two-finger tool can support a free box through friction. Give the tree a `payload` with the initial world-space center, box half-extents, mass and two spherical pads identified by link ID. Each pad is centered on its link's center of mass. The horizontal support plane sets the resting height. For example, with a one-kilogram workpiece:

```ts
const payload = {
  position: [1.4, 0, 0.24], halfExtents: [0.19, 0.2, 0.24], mass: 1,
  pads: [{link: 'left', radius: 0.095}, {link: 'right', radius: 0.095}],
  friction: 0.9, supportHeight: 0, supportFriction: 0.65
} satisfies GPUArticulationPayload;
const tree = new GPUArticulationTree({links, base, payload, publishMatrices: true});
```

Drive the finger joints inward to build normal force. Tangential impulses are limited by pad friction and the current normal impulse. The impulses act on the fingers and the free box, including its rotation. Opening the fingers releases the workpiece. The final record in `readState()` and the final published matrix belong to the box.

Open **Try pick and place** in the Robot arm lab. Use **Run cycle** to grip, lift, carry, lower and release. **Stop cycle** restores the starting poses. Adjust the block mass in the panel header to try another load. Switch to frictionless pads and repeat to see the load stay on the bench during lift.

### Picking a box from a bin

Use a rigid-body world when a gripper must discover which object it touched. Register the boxes, bench and tray as ordinary world bodies. With an authored scene you can use `makePhysicsControllerScene` from `@luma.gl/engine/physics` to infer their collider geometry from scene nodes. Create a fixed-base tree for the arm, then register the world and tree together:

```ts
const tree = new GPUArticulationTree({links, base, timeStep: 1 / 120, publishMatrices: true});
world.addToGraph(graph, {
  tree,
  pads: [{link: 'left', radius: 0.095}, {link: 'right', radius: 0.095}],
  friction: 0.9
});
```

Each fingertip tests the oriented boxes on the GPU. Selecting a destination or a pickup changes the arm's drive targets. Contact geometry determines which bodies receive impulses. The tree and world publish separate matrix buffers for rendering. For inspection, read `padContactMasks` from the tree's simulation diagnostics. Bit `i` identifies world body `i`. Two different bits on opposite fingers can mean that an obstruction has left the fingers pressing on separate objects.

This path supports one tree and up to 16 bodies with one solid box each, using the same fixed timestep. Pad friction combines geometrically with each box's sliding friction. World contacts resolve after the fingertip impulses in each step. The coupling currently uses all registered boxes and requires a standalone world with the reporting failure policy. Use the Bin Picking controls in the gripper lab to pick a workpiece, release it in the tray and grasp it again, or release it onto a neighbor.

### Colliding a whole arm with a workcell

Register link-local colliders when a palm, forearm or tool can touch the scene. Each link has
a fixed center-of-mass frame. A sphere, a box, or a capsule can be translated and rotated in
that frame. Several colliders can belong to the same link. The engine helper resolves scene
nodes or paths and cooks their geometry once, using the same rules as the physics controller.

```ts
import {makeArticulationCollidersFromScenegraph} from '@luma.gl/engine/physics';

const colliders = makeArticulationCollidersFromScenegraph(scene, [
  {link: 'left', node: '/machine/left-finger'},
  {link: 'right', node: '/machine/right-finger'},
  {link: 'boom', node: '/machine/forearm'}
]);
world.addToGraph(graph, {tree, colliders, friction: 0.81});
```

Direct authoring uses the rigid-body shape types. Give the capsule equal cap radii and set `height` to the distance between cap centers along local Y. The indexed path accepts up to 16 link colliders and 1,024 world bodies, each with one solid box. It sorts leaves by their initial Morton keys and refits groups of eight from the current GPU poses every step. Contact rows reuse impulses when the same bodies, colliders, points and normals remain compatible.

Use `tree.readSimulationDiagnostics()` to inspect candidate pairs, active contacts, reused contacts and the world body and link collider indices for each active pair. The 25th simultaneous contact sets `contactOverflow` and stops the tree before applying its impulses. The standalone world continues stepping. Restore the world and reset the tree together to restart a coupled simulation. Box contacts currently use one representative point per pair. The discrete solver covers fixed-base mechanisms.

In the gripper workcell selector, **Crowded bin** picks and regrasps a block, **Forearm stop** obstructs the carry, **Stack delivery** releases onto a second block and **Scale** increases the load to 256 parts.

### Rendering a ring of independent workpieces

The gripper lab authors each workpiece as a scenegraph node with its own dimensions, transform and rigid-body mass. Several nodes reference the same cube geometry and the same named finish, much as several glTF nodes can reference one mesh. The scene renderer groups compatible opaque instances for drawing and reads a separate physics pose matrix for each one. A teal shim can be lighter, smaller and moving independently of a teal die.

Give a piece its own material when its finish needs to change independently. Its physics body, joint targets and pickup sequence work the same way. The crowded-bin scenario uses the same scenegraph and materials for all 64 bodies.
