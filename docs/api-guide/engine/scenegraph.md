# Scenegraphs

The luma.gl engine provides a set of Scenegraph classes to organize `Model`s into a hierarchy.

Note that these classes are used by the `@luma.gl/gltf` module, which can transform a glTF file into a luma.gl Scenegraph.

But Scenegraphs can also be created programmatically by applications.

## Nodes And Materials

In luma.gl, scenegraph nodes and materials play different roles:

- `ScenegraphNode` and `GroupNode` describe hierarchy, traversal, and transforms.
- `ModelNode` connects a renderable `Model` to that hierarchy.
- `Material` is not itself a node. It is a reusable rendering resource that renderable nodes and models can reference.

This distinction is important:

- Nodes participate in parent/child relationships and transform propagation.
- Materials do not have transforms, parents, or children.
- Multiple `ModelNode`s can share the same `Material`, just as they can share geometry or textures.

That makes `Material` scenegraph-adjacent rather than scenegraph-structural:

- it belongs to the engine-side scene representation,
- it is commonly created alongside meshes and nodes when loading glTF,
- but it should be treated as referenced data, not as part of the node hierarchy itself.

For a more detailed discussion of what belongs in a material, see the
[Materials guide](/docs/api-guide/engine/materials).

This maps well to luma.gl's binding ownership model:

- group `0` is typically model or draw-local engine state,
- group `2` is typically scene-shared state such as lighting or IBL,
- group `3` is material state that can be reused across many renderable nodes.
