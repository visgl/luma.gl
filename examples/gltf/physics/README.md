# glTF Physics Extensions

Run `yarn workspace luma.gl-examples-gltf-physics start` (WebGPU required).

Loads the restitution, friction, filtering, and motion-property GLBs directly from
[the extension author's sample repository](https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples),
pinned to revision `9dc61cb3474ff9a51f58d3592f79d5c9e572056a`. The assets are not
copied into this repository. Network access to raw.githubusercontent.com is required.

Parses raw glTF physics metadata before loaders.gl post-processing, creates a
`GPURigidBodyWorld`, and renders the original meshes/materials with luma.gl's glTF
renderer. Uses fixed 1/120-second steps with at most four catch-up steps per frame.
One simulation submission and asynchronous pose readback can be pending at a time;
the example waits for publication before queuing more physics to bound input latency. This small example uses
an explicit CPU pose bridge; it does not claim GPU-driven glTF transform publication.
The source asset's scale and child transforms are preserved through body pose deltas.

The extensions are drafts. All four pinned assets simulate on the GPU, including
Motion Properties: its bottom-heavy tapered capsule wobbles, balloons rise under
negative gravity, the nonconvex wheel rotates around its unlocked inertia axis, and
the rounded box falls without rotating. The wheel retains its original triangles
and holes; balloons and the rounded box use computed convex hulls. Capsule and cone
contacts use analytic support functions. No collision mesh is inferred from rendering.
Filtering retains its exact box fast path and independent child collider filters.

The backend uses discrete collisions. Mesh/mesh contacts preserve original surfaces
and holes, with a 65,536-entry GPU task queue and a per-pair traversal budget.
`world.readCollisionDiagnostics()` exposes overflow, incomplete traversal and
unresolved GJK/EPA queries. Deep solid containment and fast-motion tunneling remain
unsupported; these scenes do not qualify arbitrary mesh combinations.
Performance depends on hull complexity and triangle overlap; the four catch-up-step
limit prevents unbounded simulation work when this detailed scene is GPU-bound.
Samples appear in Motion Properties, Restitution, Friction, Filtering order, starting
with Motion Properties. The standard InfoBox starts collapsed, with a sample selector, wrapping previous/next
arrows, Pause, and Reset controls.
Reset reloads the authored scene and simulation. Pause leaves camera controls active.

The compact luma.gl panel keeps carets, selector, Pause, and Reset on one row.
The Info tab contains instructions and provenance. GPU Graph inspects the current
compiled simulation, and GPU Graph Timeline shows CPU encoding and GPU timestamp
lanes. GPU timestamps are sampled when the adapter exposes `timestamp-query`;
otherwise the timeline retains CPU encoding measurements. Selecting a static
preview clears diagnostics from the previous simulation.

### Animated collider scale

The local AnimatedScale fixture animates a kinematic platform's scale while a dynamic
box lands on it. The engine animation drives both the rendered node and the analytic
box collider. Dimensions and derived inertia update between fixed steps without pose
readback or graph recompilation. Reset restores the source state and keeps the camera.
Mesh deformation and arbitrary nonuniform rounded-shape scaling still require recooking.
