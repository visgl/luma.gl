# GPU Rigid Body Lab

A standalone, procedural physics example independent of glTF assets. Start with
`yarn workspace luma.gl-examples-experimental-gpu-rigid-body-world start`.

Open the collapsed luma.gl panel for scene, solver and iteration controls. Info
explains each scene; GPU Graph and GPU Graph Timeline expose the actual work.

- **Independent stacks:** three five-box stacks sharing a static floor. Sleeping
  bodies turn gray. Push the first stack to test waking, friction and rotation.
- **Deep stack:** eight boxes, exposing convergence and penetration under load.
- **Heavy-on-light stack:** a mass-ten box on three mass-one boxes.
- **Moving support:** a kinematic platform carries boxes through friction.
- **Static friction:** tangential gravity below the static limit should not cause sliding.
- **Mesh openings:** two moving triangle-mesh cubes fall toward a nonconvex frame.
  One passes through the real opening; the other lands on a bar. The renderer uses
  the original cooked triangles. This demonstrates discrete surface contacts, not CCD
  or deep initial containment.
- **Mixed-shape field:** 256 varying-size boxes and spheres, using hierarchical
  discovery and sparse contacts beyond the all-pairs reference's 128-body limit.
- **Unequal-mass impact:** a unit sphere hits a mass-two sphere at restitution one,
  without gravity or friction. The lighter sphere reverses direction.
- **Off-center impact:** a sphere transfers angular momentum to a heavier box.

Parallel block-Jacobi and ordered solving share the same scene and fixed timestep.
Changing solver or iterations resets the scene; comparisons must include both
accuracy and cost. Parallel mode is experimental, not the module default.
Rendering binds GPU positions, orientations and sleep state directly. Periodic
lifetime collision counters expose incomplete work, including failures between samples.
World allocation size is logical buffer capacity, excluding graph scratch and driver overhead. The user-triggered push reads
body state once to locate its application point; it is not a render pose bridge.

The application bounds outstanding frame submissions with a GPU fence, caps catch-up
at four steps, and slows simulation under sustained overload. Timeline samples do
not constitute a full qualification report. General-body CCD, joints and unrestricted
moving mesh collisions are not demonstrated or claimed here.

## Auto-play

Enable **Auto-play scenarios** to cycle scenes. After at least three simulated
seconds, one second of quiet motion triggers a two-second pause and advancement.
Impact and moving-support scenes have eight- and twelve-second demonstration limits;
other scenes have a twenty-second limit. Timed completion is labeled separately from
settling. Incomplete simulation stops playback visibly. Reset, manual scene changes,
pushes and pause/resume restart the settling timer. Auto-play uses optional body
readback to detect settling; rendering continues to consume GPU buffers directly.

## Planned companion scenes

Keep glTF examples focused on authored semantics and interoperability. Extend this
lab with CCD thin-obstacle/rotating-body scenes when CCD is implemented; create a
mechanism lab for motors, constraints and articulations; and a separate batch/scale
benchmark for throughput and capacity. Each scene needs quantitative checks as well
as visual controls. Do not add placeholder simulations for unsupported features.

The Fast sphere / thin walls scenario uses bounded sphere/static-surface CCD. It
rejects incomplete steps through GPU rollback and preserves the remaining travel
after impacts. This does not imply dynamic-pair or rotating-convex CCD support.

## Mechanisms collection

The scene selector includes Newton's cradle, a distance pendulum, motorized hinge and powered slider.
The cradle and pendulum have GPU-driven visible tethers. Reset releases the raised
cradle ball again. When auto-play is off, the cradle automatically resets after
60 seconds of simulated motion without moving the camera; pausing also pauses
this timer. The cradle uses a 1/480-second fixed step (other scenes use
1/120 second), so each closely spaced impact is resolved before the next pair closes.
For this 12-body scene, all-pairs discovery and eight solver iterations reduce
GPU work; switching to another scene restores the 32-iteration default. User-selected
iteration counts are retained when resetting the same scene.
Its restitution threshold is zero to retain elastic low-speed contacts. Iterative
contacts still introduce numerical loss despite restitution one.
These use the public `joints` API, force the ordered solver and preserve the existing
Reset, GPU Graph and Timeline controls. Hinge and slider scenes include loose boxes
so constraint and contact response can be observed together. Joint-connected bodies
remain awake; this initial envelope is limited to 64 joints and has no joint warm start.

Run the longer cradle regression from the repository root while this example is
served (`PHYSICS_MECHANISMS_URL` overrides the default `http://127.0.0.1:5233/`):

```bash
node scripts/playwright/physics-cradle-smoke.mjs
```

It advances 60 simulated seconds and checks joint drift, energy bounds, middle-ball
excursions and sustained end-ball swings. A local WebGPU run at 480 Hz completed
28,800 steps with no incomplete steps, less than 0.06 mm joint error, energy within
0.6% of the initial value, and a 1.45 m end-ball excursion in the final ten seconds.
These are bounded regression measurements, not a guarantee of indefinitely lossless
or perfectly periodic motion.

### Cradle rendering

The cradle uses a retained `GroupNode` / `ModelNode` scenegraph with shared PBR
materials for the frame, steel balls, tabletop and tethers. The example's pose
shader reads the physics world's position and orientation buffers directly; it
never copies moving body transforms back to the CPU. Authored node matrices define
static placement and the local geometry scale. Tethers read both GPU endpoints.
The same pose shader drives the shared `ShadowMapRenderer` caster passes, so shadows
follow the simulated bodies. These render bindings borrow the world's buffers.

The stone uses normal and metallic/roughness maps. Image-based lighting is prepared
by `PBREnvironmentGenerator`. The steel uses a local reflection probe that captures
the static tabletop and frame against a bright reflection backdrop once when the
scene is created. This illumination is independent of the visible charcoal background.
This shared probe approximates reflections across the five balls; it does not
include other moving balls or update parallax as each ball swings. The other
materials retain studio environment fill. One elevated spotlight supplies direct
lighting and a matching spotlight shadow map. The scenegraph's CPU bounds do not track GPU motion, so
this example does not use CPU frustum culling or CPU picking for moving nodes.
Rendering uses at least two device pixels per CSS pixel for smoother silhouettes.
