# Scenegraphs

[Workflow](https://luma.gl/next/docs/api-guide/engine/scenegraph.md)[ScenegraphNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md)

The luma.gl engine provides a set of Scenegraph classes to organize `Model`s into a hierarchy.

Note that these classes are used by the `@luma.gl/gltf` module, which can transform a glTF file into a luma.gl Scenegraph.

But Scenegraphs can also be created programmatically by applications.

## Nodes And Materials[​](#nodes-and-materials "Direct link to Nodes And Materials")

In luma.gl, scenegraph nodes and materials play different roles:

* `ScenegraphNode` and `GroupNode` describe hierarchy, traversal, and transforms.
* `ModelNode` connects a renderable `Model` to that hierarchy.
* `Material` is not itself a node. It is a reusable rendering resource that renderable nodes and models can reference.

This distinction is important:

* Nodes participate in parent/child relationships and transform propagation.
* Materials do not have transforms, parents, or children.
* Multiple `ModelNode`s can share the same `Material`, just as they can share geometry or textures.

That makes `Material` scenegraph-adjacent rather than scenegraph-structural:

* it belongs to the engine-side scene representation,
* it is commonly created alongside meshes and nodes when loading glTF,
* but it should be treated as referenced data, not as part of the node hierarchy itself.

For a more detailed discussion of what belongs in a material, see the [Materials guide](https://luma.gl/next/docs/api-guide/engine/materials.md).

This maps well to luma.gl's binding ownership model:

* group `0` is typically model or draw-local engine state,
* group `2` is typically scene-shared state such as lighting or IBL,
* group `3` is material state that can be reused across many renderable nodes.

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
