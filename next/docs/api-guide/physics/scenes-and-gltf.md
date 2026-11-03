# Scenes and glTF

A useful way to think about scene integration is **describe once, evaluate each frame**. The scenegraph describes the objects, their starting placement and shared resources. Animation and physics evaluate how those objects move. A renderer combines the results with geometry and materials to produce an image.

Start with the [working box-and-floor walkthrough](https://luma.gl/next/docs/api-guide/physics/getting-started.md) if you want code before the details. This page explains the choices behind that code.

## Follow one object through the system[​](#follow-one-object-through-the-system "Direct link to Follow one object through the system")

Imagine a ball inside a room:

```
scene

└── room

    ├── ball            ← dynamic body attached here

    │   └── surface     ← geometry and material

    └── floor           ← static body
```

The room places the ball initially. `PhysicsController` resolves the ball node, gathers its visual geometry to cook a collider, and assigns it a backend body index. The solver moves the body on the GPU. Pose publication produces a matrix for the ball's **node origin**. The renderer multiplies that matrix by the surface's mesh-to-body transform.

```
Scene nodes + CPU geometry

          │ prepare / explicit rebuild

          ▼

GPU bodies → collisions → constraint solver → published world matrices

                                                       │ borrowed directly

                                                       ▼

                                         PBR geometry → render target
```

Only setup, edits and deliberately requested inspection need cross this boundary on the CPU. A normal render frame does not need to copy every simulated position to JavaScript.

## Authored and evaluated transforms[​](#authored-and-evaluated-transforms "Direct link to Authored and evaluated transforms")

There are two useful answers to “where is this object?”:

| Transform | Where it lives                        | What it means                                              |
| --------- | ------------------------------------- | ---------------------------------------------------------- |
| Authored  | `node.matrix`, relative to its parent | Starting placement, or current animation/application input |
| Evaluated | Producer-owned GPU matrix buffer      | The accepted simulated world pose used to draw the object  |

Physics does **not** overwrite `node.matrix` after every step. That preserves authoring and animation inputs and avoids a GPU-to-CPU synchronization point. It also means CPU traversal, `getBounds()`, and CPU ray tests describe authored placement unless explicitly adapted. Use `renderer.pick()` for selection at GPU-evaluated placement. Use a deliberate asynchronous `body.readPose()` for a diagnostic or an application feature that needs a CPU pose; it is not a render-loop bridge.

Body-node origins and centers of mass can differ. Physics publication already converts its internal center-of-mass state into node-origin matrices. A renderer must not apply that correction a second time. Visual scale and child offsets stay in the mesh-relative matrix; rigid-body orientation remains a rotation.

## Choose one pose owner[​](#choose-one-pose-owner "Direct link to Choose one pose owner")

| Body kind | Who supplies motion?                          | Typical use                                  |
| --------- | --------------------------------------------- | -------------------------------------------- |
| Static    | Authored placement at preparation             | Floors and stationary walls                  |
| Kinematic | Scenegraph/application target before stepping | Moving platforms and animated machinery      |
| Dynamic   | Solver integration and contacts               | Falling objects and freely moving mechanisms |

Kinematic bodies follow authored transforms by default. Use `body.setKinematicTarget({position, rotation})` for an explicit world-space node-origin target; use `body.followScenegraph()` to resume following the scene. Editing a dynamic node's authored matrix is not a command to teleport the live GPU body.

For animation, evaluate the mixer before physics and pass the resolved nodes with active transform tracks to `physics.update(elapsedSeconds, {animatedNodes})`. An animated ancestor can own descendant bodies. Paused tracks retain ownership; stopped tracks release it. Releasing ownership retains the accepted pose and velocity. Seeking can inject energy, since a new animation pose is an authored kinematic movement.

The controller does not resample animation between catch-up substeps. For precise animation/physics coupling, use a fixed-step animation schedule and the lower-level session API. Repeatedly writing several targets before submitting any steps can make every step see only the final target.

## References connect the systems[​](#references-connect-the-systems "Direct link to References connect the systems")

Use paths for convenient setup, then retain object references:

```
const ball = physics.addBody('/room/ball', {mass: 2});

const sameBody = physics.getBody('room/ball');
```

A leading `/` is anchored below the receiving root. A partial path must contain contiguous, complete ID segments; it does not skip ancestors. Ambiguous paths throw. Renaming a label or moving a node does not retarget an existing body handle, skin binding or physical joint.

Three identities coexist:

* A **node reference** is the shared runtime identity.
* A **glTF index** identifies source data during import/export.
* A **body index** addresses one prepared simulation revision.

Do not substitute one for another. Public controller commands accept nodes or paths so applications need not manage backend indices.

## Geometry: appearance and collision have different jobs[​](#geometry-appearance-and-collision-have-different-jobs "Direct link to Geometry: appearance and collision have different jobs")

A visual mesh can contain tiny details that are expensive or unhelpful to collide against. Start with inferred primitive colliders and choose a deliberate approximation when needed. `collider` overrides inference; `geometryMode: 'triangle-mesh'` explicitly requests triangle surfaces instead of a convex hull. Registered descendant bodies are excluded from their ancestor's compound collider.

Changes to geometry, scale, child-collider transforms or hierarchy require another `await physics.prepare()`. By default, preparation preserves live state for the same node objects. Use `{preserveState: false}` when a newly authored scene should become the new starting state. Keep updates paused during asynchronous edits. A failed preparation leaves the prior session owned, but updates remain disabled until preparation succeeds.

Skinning and morphing deform visual vertices. They do not continuously recook colliders. Use the glTF snapshot/cooking tools for an explicit deformation revision. This is distinct from a deformable-body solver.

## Rendering and replacement buffers[​](#rendering-and-replacement-buffers "Direct link to Rendering and replacement buffers")

For retained PBR scenes, create `SceneMeshNode` leaves and call:

```
renderer.render({scene, camera, lights});

device.submit();
```

A successfully prepared `PhysicsController` installs `scene.transformSource`. Each render asks the source for its current publication. Reset and rebuild can replace buffers and indices; the renderer refreshes borrowed bindings automatically. It never owns or destroys the producer's buffers. During an asynchronous replacement the controller exposes no publication, so authored transforms are the fallback; pause normal frame rendering if you want to avoid that temporary fallback.

`SceneMeshNode` is a declarative PBR description. `ModelNode` holds an already compiled, possibly custom-shaded model. The new direct scenegraph traversal accepts the former; existing glTF `ModelNode` adapters retain their explicit rendering/publication path. This change does not silently reinterpret custom models, skeleton palettes or imported effects. Low-level `SceneSurface` adapters remain available for renderer-specific scene systems.

GPU-transformed retained meshes currently require WebGPU and opaque or alpha-masked materials. Alpha-blended instances need evaluated-position ordering and are rejected on this path. Shared spot-shadow, depth and identity passes use the same GPU matrix lookup as the visible pass. CPU bounds and CPU skin palettes do not gain evaluated transforms merely because a render source is attached.

## Imported glTF scenes[​](#imported-gltf-scenes "Direct link to Imported glTF scenes")

The glTF module translates asset data into engine objects. The engine owns scenegraph transforms, materials, animation runtime, skins and physical attachment representations. The physics kernels do not parse glTF or depend on source node indices.

For proposal-driven physics, `makeGLTFPhysicsScene` maps imported descriptions to the same node references used for rendering, and `ScenegraphPhysicsSession` coordinates compilation, motion ownership, properties, behaviors and publication. This advanced path also supports explicit capture, restore and recooking. See [Scenegraph physics integration](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md) for session examples.

Physical joints connect body attachments. Skin joints form a skeleton that deforms vertices. Both reference scene nodes, but their solvers and updates remain different. A skeleton does not automatically become a physical mechanism.

The proposal extensions are versioned drafts. Import acceptance, supported solver behavior, render integration and performance qualification are separate checks. Consult the adapter capability report for the pinned profile; a field being parseable does not establish that its full physical behavior is supported.

## Reset, replace, dispose[​](#reset-replace-dispose "Direct link to Reset, replace, dispose")

Treat asynchronous edits as boundaries between frames:

1. Stop scheduling updates for the scene.
2. Await pending commands, picking and application queries.
3. Reset or rebuild; resume only after successful completion.
4. For removal, submit pending rendering and call `renderer.destroyScene(scene)`.
5. Destroy the physics controller, then application-owned scene resources and textures.

Reset restores the starting scene; it should not reset an external camera. Rebuild preserves state by node object identity, so independently animated instances need separate mutable nodes even when they share immutable geometry or texture resources.

Try [glTF Physics](https://luma.gl/next/examples/gltf/physics), [Authored Scene Stress](https://luma.gl/next/examples/gltf/authored-scene-stress), [Newton's Cradle](https://luma.gl/next/examples/experimental/newtons-cradle), and [Wrecking Ball](https://luma.gl/next/examples/experimental/wrecking-ball) to explore these paths.
