# GPU Rigid Body Lab

A standalone, procedural physics example independent of glTF assets. Start with
`yarn workspace luma.gl-examples-experimental-gpu-rigid-body-world start`.

Open the collapsed luma.gl panel for scene, solver and iteration controls. Info
explains each scene; GPU Graph and GPU Graph Timeline expose the actual work.

- **Independent stacks:** three five-box stacks sharing a static floor. Sleeping
  bodies turn gray. Push the first stack to test waking, friction and rotation.
- **Mixed-shape field:** 256 varying-size boxes and spheres, using hierarchical
  discovery and sparse contacts beyond the all-pairs reference's 128-body limit.
- **Unequal-mass impact:** a unit sphere hits a mass-two sphere at restitution one,
  without gravity or friction. The lighter sphere reverses direction.
- **Off-center impact:** a sphere transfers angular momentum to a heavier box.

Parallel block-Jacobi and ordered solving share the same scene and fixed timestep.
Changing solver or iterations resets the scene; comparisons must include both
accuracy and cost. Parallel mode is experimental, not the module default.
Rendering binds GPU positions, orientations and sleep state directly. Periodic
compact collision counters expose incomplete work. The user-triggered push reads
body state once to locate its application point; it is not a render pose bridge.

The application bounds outstanding frame submissions with a GPU fence, caps catch-up
at four steps, and slows simulation under sustained overload. Timeline samples do
not constitute a full qualification report. General-body CCD, joints and unrestricted
moving mesh collisions are not demonstrated or claimed here.

## Planned companion scenes

Keep glTF examples focused on authored semantics and interoperability. Extend this
lab with CCD thin-obstacle/rotating-body scenes when CCD is implemented; create a
mechanism lab for motors, constraints and articulations; and a separate batch/scale
benchmark for throughput and capacity. Each scene needs quantitative checks as well
as visual controls. Do not add placeholder simulations for unsupported features.
