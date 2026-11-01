import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Scenegraphs

<EngineDocsTabs group="scenegraph" active="scenegraphs" />

A luma.gl scene combines a hierarchy of spatial nodes with shared rendering resources
and controllers. The hierarchy places objects; controllers animate, deform, or constrain
them. The same engine objects serve imported glTF assets and programmatically constructed
scenes.

A scenegraph is not a second renderer or a physics world. `ModelNode` connects the
hierarchy to engine `Model` rendering. Physics adapters connect selected nodes to a GPU
simulation. Applications still choose the render passes, frame scheduling, and resources
appropriate for their renderer.

## Scenegraph Capabilities

These are luma.gl engine capabilities. The glTF adapter resolves source data into the same
nodes, bindings, and controllers used by native scenes; source extensions do not own the runtime.
Existing glTF assets remain useful inline demonstrations of those engine capabilities.

| Capability | Guide |
| --- | --- |
| Keyframes, playback, blending, and animated properties | [Animation](./animation.md), [animated example](./features/animation.mdx) |
| Skeletons and joint-matrix palettes | [Skins](./scenegraph-skins.mdx) |
| Vertex-target deformation | [Morph targets](./scenegraph-morphs.mdx) |
| Behavior graphs and external hosts | [Scenegraph interactivity](./scenegraph-interactivity.mdx) |
| Browser input, selection, and feedback | [Input and picking](./interactivity.md) |
| Body ownership, fixed steps, and pose publication | [Physics integration](./scenegraph-physics.md) |
| Constraint attachments, limits, and drives | [Physical joints](./scenegraph-joints.mdx) |
| Camera-facing placement | [Billboards](./scenegraph-billboards.mdx) |
| Punctual and area-light attachments | [Scenegraph lights](./scenegraph-lights.mdx) |
| Emitters, listener state, graphs, and environments | [Spatial audio](./scenegraph-audio.mdx) |
| Alternate appearances on existing models | [Material variants](./features/material-variants.mdx) |
| Visibility, repeated meshes, and crowds | [Visibility](./features/visibility.mdx), [instancing](./features/instancing.mdx), [animated crowds](./features/animated-crowds.mdx) |

Physical joints and skinning joints are separate concepts. The former constrain simulation
bodies; the latter deform vertices through a palette. Neither is an extra node class inserted
into the spatial hierarchy.

## The Scene Representation

| Part | Engine representation | Responsibility |
| --- | --- | --- |
| Spatial hierarchy | `ScenegraphNode`, `GroupNode` | Local transforms, visibility, traversal, aggregate bounds |
| Renderable primitive | `ModelNode` referencing a `Model` | Draw a mesh at its accumulated transform |
| Surface appearance | `Material`, textures and shader inputs | Reusable rendering state shared across primitives |
| Alternate appearance | `MaterialVariants` | Select materials and pipeline parameters without rebuilding nodes |
| Keyframe animation | Bindings, tracks, clips, actions and `AnimationMixer` | Sample and blend properties on resolved runtime objects |
| Scene playback | `ScenegraphAnimator`, `MixerAnimationClip` | Clip selection, crossfades and dependent updates |
| Skeletal deformation | `SkinController` and `SkinBinding` | Resolve joint transforms into mesh-local skin palettes |
| Morph deformation | Morph target state and `setMorphWeights` | Update GPU weights or existing vertex buffers |
| Physical constraints | `JointController` | Resolve attachment nodes into body-local or world frames |
| Camera-facing placement | `BillboardController` | Derive per-camera draw transforms without changing authored nodes |
| Area lighting | `AreaLightController` | Resolve area-light definitions against node transforms |
| Spatial audio | `AudioController` | Manage emitters, processing graphs and listener updates |
| Behavior | `Interactivity` and application host interfaces | Evaluate supported behavior operations and route external effects |

Materials, skins, animation clips and physical joints are **referenced objects**, not
extra children in the spatial tree. This keeps hierarchy traversal about transforms
while allowing several nodes to share resources.

See [Controllers and deformation](/docs/api-guide/engine/scene-controllers) for
skins, morphs, variants and playback, and
[Physics integration](/docs/api-guide/engine/scenegraph-physics) for body ownership,
constraint frames and GPU pose publication.

## Nodes, Transforms and Identity

`GroupNode.children` contains object references. A child's local matrix is combined
with its ancestors during traversal. Nodes can also carry application metadata in
`userData`; metadata does not automatically create rendering or simulation behavior.

```ts
import {GroupNode} from '@luma.gl/engine';

const hinge = new GroupNode({id: 'hinge'});
const door = new GroupNode({id: 'door', children: [hinge]});
const room = new GroupNode({id: 'room', children: [door]});

door.setPosition([2, 0, 0]).updateMatrix();
```

Node IDs are useful for diagnostics and application lookup. Shared skin and physical
joint bindings retain **node references**, so duplicate display IDs do not redirect
those bindings. glTF indices are resolved by the importer; compact physics body
indices are created by the physics adapter. Neither replaces runtime node identity.

Animation binding IDs have a different purpose: they identify properties for mixer
blending. Use the same binding identity for tracks affecting the same property, and
scope identities when combining independent asset instances in one mixer.

Treat controller-managed hierarchies as trees. Joint and motion resolution reject
repeated nodes and cycles. Sharing a material or geometry is supported; placing the
same node object under multiple parents is not a substitute for creating instances.

## Importing glTF

The `@luma.gl/engine/gltf` adapter decodes asset-specific indices, extension fields, accessors
and animation pointers into engine nodes, materials and bindings. Its scenegraph
bundle exposes scene roots, materials, variants, skins, animation playback, cameras,
lights, lookup maps and joint declarations.

Runtime sampling, blending, skin palette updates, morph updates and material property
updates belong to the engine. The glTF adapter retains source addressing, conversion,
compatibility wrappers and asset ownership. Programmatic scenes can construct the
same engine controllers without manufacturing a glTF document.

A successfully created scenegraph does not imply every glTF extension is supported.
Inspect extension support and physics import diagnostics. Physics joint declarations
also require a physics adapter and simulation world before they produce motion.

## Materials and Shared Resources

A `Material` has no parent, children or spatial transform. Multiple models can share
one material, geometry or texture. Mutating a shared material updates all its users;
clone it when one object needs an independent appearance.

Binding group `0` typically carries draw-local state, group `2` scene lighting or
image-based lighting, and group `3` material state. See the
[Materials guide](/docs/api-guide/engine/materials) for resource bindings and ownership.

## Frame Scheduling

The application establishes update order. A typical animated scene samples animation,
updates dependent skin palettes, then traverses and renders. A physics scene additionally
uses a fixed simulation clock and explicit animation/physics ownership; see the
[physics frame sequence](/docs/api-guide/engine/scenegraph-physics#frame-order).

`AnimationMixer.update()` and `ScenegraphAnimator.update()` use seconds. The
compatibility `ScenegraphAnimator.setTime()` interface uses an absolute clock in
milliseconds. Do not advance the same mixer through both paths in one frame.

## Lifetime and Destruction

Track who owns each resource. `GroupNode.destroy()` recursively destroys its children;
that is not a general reference-counting system for all shared resources and controllers.
`SkinController.destroy()` releases the palette transports it owns. A borrowed physics
pose buffer remains owned by the physics world.

For imported assets, use the returned bundle's `destroy()` method: it accounts for
asset-owned models, materials, buffers and textures shared across source primitives.
For programmatic scenes, dispose controllers and shared resources through the application
that created them, after outstanding GPU work has completed. Stop animation and behavior
callbacks before destroying their targets.

## Instanced Bounds And Depth Sorting

An instanced model can remain one renderable scenegraph node while providing all of its instance
transforms for aggregate bounds:

```ts
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

`ModelNode` calculates one bounding box enclosing every transformed instance. `GroupNode` combines
those bounds with ancestor and leaf transforms, orders nodes by their camera-space bounding-box
centers, and still visits the instanced model only once.

This is useful when translucent objects naturally divide into a small number of semantic groups.
For example, the glass showcase renders its spine switches and two network planes as three instanced
models, sorts those models back to front, and refreshes the refraction source between groups. This
improves layered transmission without replacing per-group order-independent transparency or
requiring one draw call per switch.
