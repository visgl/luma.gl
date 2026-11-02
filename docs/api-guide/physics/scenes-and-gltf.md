---
title: Scenes and glTF
description: Share physical scene concepts across imported assets and programmatic scenes.
---

# Scenes and glTF

The engine owns scenegraph objects, materials, animation and physical attachment
representations. glTF parsing translates asset data into those concepts. GPU physics owns
simulation state and solving; kernels do not depend on glTF node indices.

## Node references and body indices

Scenegraph relationships use node references. Importers retain source identifiers for
diagnostics, and adapters map body-owning nodes to simulation indices. A node reference,
a glTF node index and a physics body index are different identities.

`JointController` resolves attachment nodes relative to their closest body-owning ancestor.
A world-fixed attachment has no body ancestor. `makeRigidBodyJointsFromScenegraph()`
translates the resolved attachments into the supported world constraint representation.

Skeletal skins use joint-node lists and palette updates for deformation. Physical joints
constrain bodies. Sharing a scenegraph does not make the two update paths interchangeable.

## Transform ownership

Choose one writer for each body pose:

| Owner | Update path |
| --- | --- |
| Authored scene | Initialize a static collider |
| Animation/application | Submit kinematic targets before a simulation step |
| Physics | Publish a dynamic body's solved pose for rendering |

Sample animation at simulation time, apply inputs/kinematic targets, simulate the fixed
step, then render the published poses. Avoid letting animation and physics overwrite the
same dynamic transform independently.

## Geometry and rendering

Scene geometry can supply collision metadata and geometry snapshots. Prefer analytic
shape descriptions for primitives; use cooked geometry when appropriate. A visual mesh
may require a deliberate collision approximation, and unsupported deformation or live
mesh changes need explicit diagnostics rather than stale collision data.

GPU pose publication supplies body-node matrices and visual bounds. Renderers can read
those buffers directly, including for shadow passes. This avoids per-frame CPU pose
readback. Body center-of-mass transforms must still be converted to node-origin transforms.

## Proposal coverage

glTF physics proposals are versioned drafts. Import acceptance, solver behavior, GPU render
integration and performance qualification are separate checks. Use the adapter capability
report for the pinned profile; unsupported fields should not silently become approximations.

See [Scenegraph physics integration](/docs/api-guide/engine/scenegraph-physics) for the
full update order and attachment rules, and [glTF Physics](/examples/gltf/physics) and
[Authored Scene Stress](/examples/gltf/authored-scene-stress) for representative workloads.
