# GroupNode

[Scenegraphs](https://luma.gl/next/docs/api-guide/engine/scenegraph.md)[ScenegraphNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/next/docs/api-reference/engine/scenegraph/model-node.md)

`GroupNode` extends [`ScenegraphNode`](https://luma.gl/next/docs/api-reference/engine/scenegraph/scenegraph-node.md) with child-node management and traversal helpers.

## Usage[​](#usage "Direct link to Usage")

```
import {GroupNode} from '@luma.gl/engine';

const group = new GroupNode();
group.add(childNodeA, childNodeB);
```

## Types[​](#types "Direct link to Types")

### `GroupNodeProps`[​](#groupnodeprops "Direct link to groupnodeprops")

```
export type GroupNodeProps = ScenegraphNodeProps & {
  children?: ScenegraphNode[];
};

export type DepthSortedTraversalOptions = {
  viewMatrix: NumericArray;
  worldMatrix?: NumericArray;
  order?: 'back-to-front' | 'front-to-back';
};

export type DepthSortedTraversalContext = {
  worldMatrix: Matrix4;
  bounds: [number[], number[]] | null;
  depth: number;
};
```

## Properties[​](#properties "Direct link to Properties")

### `children`[​](#children "Direct link to children")

The current list of child nodes.

## Methods[​](#methods "Direct link to Methods")

### `constructor(children: ScenegraphNode[])`[​](#constructorchildren-scenegraphnode "Direct link to constructorchildren-scenegraphnode")

Creates a group from an initial child list.

### `constructor(props?: GroupNodeProps)`[​](#constructorprops-groupnodeprops "Direct link to constructorprops-groupnodeprops")

Creates a group from node props plus optional children.

### `getBounds(): [number[], number[]] | null`[​](#getbounds-number-number--null "Direct link to getbounds-number-number--null")

Returns world-space bounds aggregated from all descendants that provide bounds, including nested group transforms, leaf transforms, and every transformed bounding-box corner.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Destroys all children and clears the child list.

### `add(...children): this`[​](#addchildren-this "Direct link to addchildren-this")

Adds one or more children. Nested arrays are unpacked recursively.

### `remove(child: ScenegraphNode): this`[​](#removechild-scenegraphnode-this "Direct link to removechild-scenegraphnode-this")

Removes one child.

### `removeAll(): this`[​](#removeall-this "Direct link to removeall-this")

Clears all children.

### `traverse(visitor, {worldMatrix} = {})`[​](#traversevisitor-worldmatrix-- "Direct link to traversevisitor-worldmatrix--")

Traverses descendants depth-first and calls the visitor for non-group leaf nodes.

### `traverseDepthSorted(visitor, options)`[​](#traversedepthsortedvisitor-options "Direct link to traversedepthsortedvisitor-options")

Flattens leaf descendants and visits them in camera-depth order using their aggregate bounding-box centers. The default order is `back-to-front`; set `order: 'front-to-back'` for opaque rendering or other front-first workflows.

```
group.traverseDepthSorted(
  (node, {worldMatrix, bounds, depth}) => {
    if (node instanceof ModelNode) {
      node.draw(renderPass);
    }
  },
  {viewMatrix, order: 'back-to-front'}
);
```

The visitor's `worldMatrix` includes both ancestor transforms and the leaf node transform. Sorting is stable for equal depths and preserves instanced models as a single visited node and draw.

### `preorderTraversal(visitor, {worldMatrix} = {})`[​](#preordertraversalvisitor-worldmatrix-- "Direct link to preordertraversalvisitor-worldmatrix--")

Traverses the group and its descendants in preorder, including the group itself.
