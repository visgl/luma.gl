import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# GroupNode

<EngineDocsTabs group="scenegraph" active="group-node" />

`GroupNode` extends [`ScenegraphNode`](/docs/api-reference/engine/scenegraph/scenegraph-node) with child-node management and traversal helpers.

## Usage

```typescript
import {GroupNode} from '@luma.gl/engine';

const group = new GroupNode();
group.add(childNodeA, childNodeB);
```

## Types

### `GroupNodeProps`

```ts
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

## Properties

### `children`

The current list of child nodes.

## Methods

### `constructor(children: ScenegraphNode[])`

Creates a group from an initial child list.

### `constructor(props?: GroupNodeProps)`

Creates a group from node props plus optional children.

### `getBounds(): [number[], number[]] | null`

Returns world-space bounds aggregated from all descendants that provide bounds, including nested
group transforms, leaf transforms, and every transformed bounding-box corner.

### `destroy(): void`

Destroys all children and clears the child list.

### `add(...children): this`

Adds one or more children. Nested arrays are unpacked recursively.

### `remove(child: ScenegraphNode): this`

Removes one child.

### `removeAll(): this`

Clears all children.

### `traverse(visitor, {worldMatrix} = {})`

Traverses descendants depth-first and calls the visitor for non-group leaf nodes.

### `traverseDepthSorted(visitor, options)`

Flattens leaf descendants and visits them in camera-depth order using their aggregate bounding-box
centers. The default order is `back-to-front`; set `order: 'front-to-back'` for opaque rendering or
other front-first workflows.

```ts
group.traverseDepthSorted(
  (node, {worldMatrix, bounds, depth}) => {
    if (node instanceof ModelNode) {
      node.draw(renderPass);
    }
  },
  {viewMatrix, order: 'back-to-front'}
);
```

The visitor's `worldMatrix` includes both ancestor transforms and the leaf node transform. Sorting
is stable for equal depths and preserves instanced models as a single visited node and draw.

### `preorderTraversal(visitor, {worldMatrix} = {})`

Traverses the group and its descendants in preorder, including the group itself.
