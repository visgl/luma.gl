# Scenegraphs

[Workflow](https://luma.gl/next/docs/api-guide/engine/scenegraph.md)[Controllers](https://luma.gl/next/docs/api-guide/engine/scene-controllers.md)[Physics](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md)[ScenegraphNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md)

A luma.gl scene combines a hierarchy of spatial nodes with shared rendering resources and controllers. The hierarchy places objects; controllers animate, deform, or constrain them. The same engine objects serve imported glTF assets and programmatically constructed scenes.

A scenegraph is the description that rendering and simulation share. You can build it in code or obtain it from an importer. For example, a room group can contain a door group, a visible mesh and an attachment node; those objects keep their identity as you add animation or physics.

A scenegraph is not a second renderer or a physics world. `ModelNode` connects the hierarchy to engine `Model` rendering. Physics adapters connect selected nodes to a GPU simulation. Applications still choose the render passes, frame scheduling, and resources appropriate for their renderer.

## A practical reading path[​](#a-practical-reading-path "Direct link to A practical reading path")

1. **Place objects.** Start with the hierarchy, local transforms and path lookup below.
2. **Choose a render path.** `ModelNode` holds a compiled model for an existing renderer. `SceneMeshNode` from `@luma.gl/anari` describes geometry and a PBR material for `SceneRenderer.render({scene, camera, lights})`; the renderer manages models and batching.
3. **Add motion.** Use [animation](https://luma.gl/next/docs/api-guide/engine/animation.md) for authored playback or [physics](https://luma.gl/next/docs/api-guide/physics/getting-started.md) for simulated bodies. Give each body a clear pose owner.
4. **Connect objects.** Use skins to deform a mesh, physical joints to constrain bodies, and interactivity to react to input. These are referenced relationships, not extra transform-tree children.
5. **Manage revisions.** Prepare or rebuild after structural edits, and dispose controllers and render caches before their borrowed resources.

Read only the capability you need. A static scene does not require a physics world, an animation mixer or a skeleton.

## Scenegraph Capabilities[​](#scenegraph-capabilities "Direct link to Scenegraph Capabilities")

These are luma.gl engine capabilities. The glTF adapter resolves source data into the same nodes, bindings, and controllers used by native scenes; source extensions do not own the runtime. Existing glTF assets remain useful inline demonstrations of those engine capabilities.

| Capability                                             | Guide                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyframes, playback, blending, and animated properties | [Animation](https://luma.gl/next/docs/api-guide/engine/animation.md), [animated example](https://luma.gl/next/docs/api-guide/engine/features/animation.md)                                                                                                       |
| Skeletons and joint-matrix palettes                    | [Skins](https://luma.gl/next/docs/api-guide/engine/scenegraph-skins.md)                                                                                                                                                                                               |
| Vertex-target deformation                              | [Morph targets](https://luma.gl/next/docs/api-guide/engine/scenegraph-morphs.md)                                                                                                                                                                                      |
| Behavior graphs and external hosts                     | [Scenegraph interactivity](https://luma.gl/next/docs/api-guide/engine/scenegraph-interactivity.md)                                                                                                                                                                    |
| Browser input, selection, and feedback                 | [Input and picking](https://luma.gl/next/docs/api-guide/engine/interactivity.md)                                                                                                                                                                                      |
| Body ownership, fixed steps, and pose publication      | [Physics integration](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md)                                                                                                                                                                               |
| Constraint attachments, limits, and drives             | [Physical joints](https://luma.gl/next/docs/api-guide/engine/scenegraph-joints.md)                                                                                                                                                                                    |
| Camera-facing placement                                | [Billboards](https://luma.gl/next/docs/api-guide/engine/scenegraph-billboards.md)                                                                                                                                                                                     |
| Punctual and area-light attachments                    | [Scenegraph lights](https://luma.gl/next/docs/api-guide/engine/scenegraph-lights.md)                                                                                                                                                                                  |
| Emitters, listener state, graphs, and environments     | [Spatial audio](https://luma.gl/next/docs/api-guide/engine/scenegraph-audio.md)                                                                                                                                                                                       |
| Alternate appearances on existing models               | [Material variants](https://luma.gl/next/docs/api-guide/engine/features/material-variants.md)                                                                                                                                                                         |
| Visibility, repeated meshes, and crowds                | [Visibility](https://luma.gl/next/docs/api-guide/engine/features/visibility.md), [instancing](https://luma.gl/next/docs/api-guide/engine/features/instancing.md), [animated crowds](https://luma.gl/next/docs/api-guide/engine/features/animated-crowds.md) |

Physical joints and skinning joints are separate concepts. The former constrain simulation bodies; the latter deform vertices through a palette. Neither is an extra node class inserted into the spatial hierarchy.

## The Scene Representation[​](#the-scene-representation "Direct link to The Scene Representation")

| Part                          | Engine representation                                 | Responsibility                                                        |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Spatial hierarchy             | `ScenegraphNode`, `GroupNode`                         | Local transforms, visibility, traversal, aggregate bounds             |
| Compiled renderable primitive | `ModelNode` referencing a `Model`                     | Keep an existing model and its render path                            |
| Retained CPU geometry         | `GeometryNode`                                        | Share geometry between adapters and collider cooking                  |
| Declarative PBR mesh          | `SceneMeshNode` from `@luma.gl/anari`                 | Let `SceneRenderer` compile and batch geometry/material pairs         |
| Evaluated GPU placement       | `GroupNode.transformSource`                           | Borrow current world matrices without overwriting authored transforms |
| Surface appearance            | `Material`, textures and shader inputs                | Reusable rendering state shared across primitives                     |
| Alternate appearance          | `MaterialVariants`                                    | Select materials and pipeline parameters without rebuilding nodes     |
| Keyframe animation            | Bindings, tracks, clips, actions and `AnimationMixer` | Sample and blend properties on resolved runtime objects               |
| Scene playback                | `ScenegraphAnimator`, `MixerAnimationClip`            | Clip selection, crossfades and dependent updates                      |
| Skeletal deformation          | `SkinController` and `SkinBinding`                    | Resolve joint transforms into mesh-local skin palettes                |
| Morph deformation             | Morph target state and `setMorphWeights`              | Update GPU weights or existing vertex buffers                         |
| Physical constraints          | `JointController`                                     | Resolve attachment nodes into body-local or world frames              |
| Camera-facing placement       | `BillboardController`                                 | Derive per-camera draw transforms without changing authored nodes     |
| Area lighting                 | `AreaLightController`                                 | Resolve area-light definitions against node transforms                |
| Spatial audio                 | `AudioController`                                     | Manage emitters, processing graphs and listener updates               |
| Behavior                      | `Interactivity` and application host interfaces       | Evaluate supported behavior operations and route external effects     |

Materials, skins, animation clips and physical joints are **referenced objects**, not extra children in the spatial tree. This keeps hierarchy traversal about transforms while allowing several nodes to share resources.

See [Controllers and deformation](https://luma.gl/next/docs/api-guide/engine/scene-controllers.md) for skins, morphs, variants and playback, and [Physics integration](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md) for body ownership, constraint frames and GPU pose publication.

## Nodes, Transforms and Identity[​](#nodes-transforms-and-identity "Direct link to Nodes, Transforms and Identity")

`GroupNode.children` contains object references. A child's local matrix is combined with its ancestors during traversal. Nodes can also carry application metadata in `userData`; metadata does not automatically create rendering or simulation behavior.

```
import {GroupNode} from '@luma.gl/engine';



const hinge = new GroupNode({id: 'hinge'});

const door = new GroupNode({id: 'door', children: [hinge]});

const room = new GroupNode({id: 'room', children: [door]});



door.setPosition([2, 0, 0]).updateMatrix();
```

Node IDs are useful for diagnostics and application lookup. Shared skin and physical joint bindings retain **node references**, so duplicate display IDs do not redirect those bindings. glTF indices are resolved by the importer; compact physics body indices are created by the physics adapter. Neither replaces runtime node identity.

### Finding nodes by ID or path[​](#finding-nodes-by-id-or-path "Direct link to Finding nodes by ID or path")

Use `GroupNode.findNode(path)` to resolve a node reference within a scene or subtree:

```
room.findNode('hinge');       // Exact ID anywhere in this subtree, including its root.

room.findNode('door/hinge');  // Contiguous partial path ending at the target.

room.findNode('/door/hinge'); // Exact path from room's children; omit room's own ID.

room.findNode('/');          // room itself.
```

Each segment matches a complete, case-sensitive node ID. Partial paths may omit leading ancestors, but do not skip intermediate nodes or match fragments of an ID. Leading `/` anchors the path to the receiving group, so the same imported asset can be searched under different parents without knowing its complete placement in the application scene.

`findNode` returns `undefined` when nothing matches and throws when more than one node matches. Add ancestor segments or search a smaller subtree to disambiguate. To operate on all matches, use `room.findNodes('door/hinge')`; it returns node references in structural preorder, including hidden nodes and branches. Even an anchored path can be ambiguous if siblings have duplicate IDs. No global uniqueness requirement is imposed on IDs.

Paths use `~1` for a literal `/` within an ID and `~0` for a literal `~`, following JSON Pointer's escaping convention. For example, `room.findNode('door~1hinge')` searches for a single node whose ID is `door/hinge`. Empty segments and invalid escapes throw. There are no wildcard, parent-directory, or property selectors; other characters are literal.

Resolve paths when configuring controllers, joints, or application behavior, then retain the returned **node objects**. Lookup always reads the current hierarchy, without cached indices or matrix calculations. Moving a node changes its path but does not invalidate an existing object reference. As with controllers, lookup requires a tree and rejects cycles and nodes shared under multiple parents.

Animation binding IDs have a different purpose: they identify properties for mixer blending. Use the same binding identity for tracks affecting the same property, and scope identities when combining independent asset instances in one mixer.

Treat controller-managed hierarchies as trees. Joint and motion resolution reject repeated nodes and cycles. Sharing a material or geometry is supported; placing the same node object under multiple parents is not a substitute for creating instances.

## Importing glTF[​](#importing-gltf "Direct link to Importing glTF")

The `@luma.gl/engine/gltf` adapter decodes asset-specific indices, extension fields, accessors and animation pointers into engine nodes, materials and bindings. Its scenegraph bundle exposes scene roots, materials, variants, skins, animation playback, cameras, lights, lookup maps and joint declarations.

Runtime sampling, blending, skin palette updates, morph updates and material property updates belong to the engine. The glTF adapter retains source addressing, conversion, compatibility wrappers and asset ownership. Programmatic scenes can construct the same engine controllers without manufacturing a glTF document.

A successfully created scenegraph does not imply every glTF extension is supported. Inspect extension support and physics import diagnostics. Physics joint declarations also require a physics adapter and simulation world before they produce motion.

## Materials and Shared Resources[​](#materials-and-shared-resources "Direct link to Materials and Shared Resources")

A `Material` has no parent, children or spatial transform. Multiple models can share one material, geometry or texture. Mutating a shared material updates all its users; clone it when one object needs an independent appearance.

Binding group `0` typically carries draw-local state, group `2` scene lighting or image-based lighting, and group `3` material state. See the [Materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md) for resource bindings and ownership.

## Frame Scheduling[​](#frame-scheduling "Direct link to Frame Scheduling")

The application establishes update order. A typical animated scene samples animation, updates dependent skin palettes, then traverses and renders. A physics scene additionally uses a fixed simulation clock and explicit animation/physics ownership; see the [physics frame sequence](https://luma.gl/next/docs/api-guide/engine/scenegraph-physics.md#frame-order).

`AnimationMixer.update()` and `ScenegraphAnimator.update()` use seconds. The compatibility `ScenegraphAnimator.setTime()` interface uses an absolute clock in milliseconds. Do not advance the same mixer through both paths in one frame.

## Lifetime and Destruction[​](#lifetime-and-destruction "Direct link to Lifetime and Destruction")

Track who owns each resource. `GroupNode.destroy()` recursively destroys its children; that is not a general reference-counting system for all shared resources and controllers. `SkinController.destroy()` releases the palette transports it owns. A borrowed physics pose buffer remains owned by the physics world.

For imported assets, use the returned bundle's `destroy()` method: it accounts for asset-owned models, materials, buffers and textures shared across source primitives. For programmatic scenes, dispose controllers and shared resources through the application that created them, after outstanding GPU work has completed. Stop animation and behavior callbacks before destroying their targets.

## Instanced Bounds And Depth Sorting[​](#instanced-bounds-and-depth-sorting "Direct link to Instanced Bounds And Depth Sorting")

An instanced model can remain one renderable scenegraph node while providing all of its instance transforms for aggregate bounds:

```
import {GroupNode, ModelNode} from '@luma.gl/engine';



const switches = new ModelNode({

  model: switchModel,

  bounds: [

    [-1, -1, -1],

    [1, 1, 1]

  ],

  instanceMatrices: switchTransforms

});



const scene = new GroupNode({children: [switches]});



scene.traverseDepthSorted(

  node => {

    if (node instanceof ModelNode) {

      node.draw(renderPass);

    }

  },

  {viewMatrix, order: 'back-to-front'}

);
```

`ModelNode` calculates one bounding box enclosing every transformed instance. `GroupNode` combines those bounds with ancestor and leaf transforms, orders nodes by their camera-space bounding-box centers, and still visits the instanced model only once.

This is useful when translucent objects naturally divide into a small number of semantic groups. For example, the glass showcase renders its spine switches and two network planes as three instanced models, sorts those models back to front, and refreshes the refraction source between groups. This improves layered transmission without replacing per-group order-independent transparency or requiring one draw call per switch.
