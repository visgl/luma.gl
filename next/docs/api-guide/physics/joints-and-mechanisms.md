# Joints and mechanisms

A physical joint restricts the relative motion of two body attachments. It is distinct from a skeletal joint used by a skin. The engine can represent attachments shared by programmatic scenes and glTF imports; the physics adapter converts them to solver rows.

| Constraint | Intended motion                                                          |
| ---------- | ------------------------------------------------------------------------ |
| Distance   | Keep attachment points a fixed distance apart, optionally with a spring  |
| Fixed      | Lock relative position and orientation                                   |
| Hinge      | Rotate about one attachment-frame axis, with optional limits and motor   |
| Slider     | Translate along one attachment-frame axis, with optional stops and drive |
| General    | Compose supported linear/angular attachment limits and drives            |

## A suspended ball[​](#a-suspended-ball "Direct link to A suspended ball")

```
const joints = [{type: 'distance' as const, first: 0, second: 1, distance: 10}];
```

Here `first` and `second` index the world's body array. Body zero could be a static anchor and body one a dynamic sphere. Place their initial attachment points ten world units apart. Optional attachment frames are body-local, not center-of-mass-local.

The [Wrecking Ball example](https://luma.gl/next/examples/experimental/wrecking-ball) uses a real distance constraint. Gravity drives the swing and contact impulses change the ball's motion; its path is not a prescribed animation.

## Solver choice[​](#solver-choice "Direct link to Solver choice")

The ordered reference solver supports the broader bounded joint envelope. Parallel contacts support static-anchored distance joints: a small GPU joint sweep alternates with contact iterations. Dynamic-to-dynamic joints, moving anchors and the other joint families still require ordered solving.

The parallel distance path is useful when one pendulum interacts with a large block pile. It avoids sending every block contact through the serial reference solve. The current joint count is bounded to 64; this is not a general articulation solver.

## Limits, motors and compliance[​](#limits-motors-and-compliance "Direct link to Limits, motors and compliance")

Attachment frames determine axes. Hinge angular limits use wrapped radians; sliders use linear distance. Velocity motors and position drives have force/torque caps. Springs and dampers provide compliance and energy loss instead of assuming perfectly rigid, lossless motion. Check the [joint reference](https://luma.gl/next/docs/api-reference/graph/gpu-rigid-body-world.md#ordered-joints-and-mechanisms) for exact frame conventions and supported controls.

More iterations can reduce coupled constraint error, while smaller fixed steps resolve motion more frequently. They change different aspects of the approximation. Measure joint length/angle drift, contact penetration and energy behavior at the chosen settings.

For scene-authored attachments, see [Scenegraph joints](https://luma.gl/next/docs/api-guide/engine/scenegraph-joints.md) and [Scenes and glTF](https://luma.gl/next/docs/api-guide/physics/scenes-and-gltf.md).

## Command a named actuator[​](#command-a-named-actuator "Direct link to Command a named actuator")

Give a programmatic scenegraph joint an `id` and author an angular force drive on the desired local axis. A glTF rig uses the **attachment node name** as its joint ID, with `node-<index>` as the fallback for unnamed nodes. Within a physics world the pair of joint ID and axis must identify exactly one angular force drive. The same name may be reused in another world.

```
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

## Fixed-base articulated trees[​](#fixed-base-articulated-trees "Direct link to Fixed-base articulated trees")

Use `GPUArticulationTree` for a small mechanism moving under gravity and joint torques. Specify its links in parent-before-child order. Each revolute link adds one independent angle. A welded link adds inertia to its ancestors. The solver derives each child pose from its parent and attachment frames, so a joint cannot pull apart under load.

```
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

### Pressing against a work stop[​](#pressing-against-a-work-stop "Direct link to Pressing against a work stop")

Pass a `contact` when constructing the tree to couple one link-centered sphere to a stationary, world-axis-aligned box. The normal reaction acts through the articulated mass matrix alongside the drive impulses. It can support the load and falls to zero when the link lifts away. This contact is frictionless.

```
const arm = new GPUArticulationTree({

  links, base, timeStep: 1 / 120, publishMatrices: true,

  contact: {link: 'payload', radius: 0.25, center: [3.55, 0, 0.52], halfExtents: [0.6, 0.5, 0.52]}

});
```

After registering the tree, a renderer can consume `arm.poseMatrices` in link order. After stepping, `readSimulationDiagnostics().then(status => status.normalForce)` reports the compressive reaction in newtons. In the Robot arm scenario, open **Try the 3 kg work-stop comparison** to switch solvers and press or lift the load.
