# GroupNode

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

Returns world-space bounds aggregated from all descendants that provide bounds.

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

### `preorderTraversal(visitor, {worldMatrix} = {})`

Traverses the group and its descendants in preorder, including the group itself.
