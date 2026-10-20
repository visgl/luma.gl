# glTF Physics Extensions

Run `yarn workspace luma.gl-examples-gltf-physics start` (WebGPU required).

Loads the restitution, friction, filtering, and motion-property GLBs directly from
[the extension author's sample repository](https://github.com/eoineoineoin/glTF_Physics/tree/9dc61cb3474ff9a51f58d3592f79d5c9e572056a/samples),
pinned to revision `9dc61cb3474ff9a51f58d3592f79d5c9e572056a`. The assets are not
copied into this repository. Network access to raw.githubusercontent.com is required.

Parses raw glTF physics metadata before loaders.gl post-processing, creates a
`GPURigidBodyWorld`, and renders the original meshes/materials with luma.gl's glTF
renderer. Uses fixed 1/120-second steps with at most four catch-up steps per frame.
One asynchronous pose readback can be pending at a time. This small example uses
an explicit CPU pose bridge; it does not claim GPU-driven glTF transform publication.
The source asset's scale and child transforms are preserved through body pose deltas.

The extensions are drafts, and the importer implements a bounded sphere/box subset.
Filtering and Motion Properties remain static previews with visible diagnostics for
unsupported mesh and capsule/cylinder colliders; no partial simulation is created.
The standard InfoBox starts collapsed, with a sample selector, wrapping previous/next
arrows, Pause, and Reset controls.
Reset reloads the authored scene and simulation. Pause leaves camera controls active.

The compact luma.gl panel keeps carets, selector, Pause, and Reset on one row.
The Info tab contains instructions and provenance. GPU Graph inspects the current
compiled simulation, and GPU Graph Timeline shows CPU encoding and GPU timestamp
lanes. GPU timestamps are sampled when the adapter exposes `timestamp-query`;
otherwise the timeline retains CPU encoding measurements. Selecting a static
preview clears diagnostics from the previous simulation.
