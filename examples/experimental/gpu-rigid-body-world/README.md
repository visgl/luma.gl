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
