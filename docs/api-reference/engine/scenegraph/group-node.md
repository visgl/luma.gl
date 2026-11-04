# GroupNode

[Workflow](https://luma.gl/docs/api-guide/engine/scenegraph.md)[Controllers](https://luma.gl/docs/api-guide/engine/scene-controllers.md)[Physics](https://luma.gl/docs/api-guide/engine/scenegraph-physics.md)[ScenegraphNode](https://luma.gl/docs/api-reference/engine/scenegraph/scenegraph-node.md)[GroupNode](https://luma.gl/docs/api-reference/engine/scenegraph/group-node.md)[ModelNode](https://luma.gl/docs/api-reference/engine/scenegraph/model-node.md)

`GroupNode` extends [`ScenegraphNode`](https://luma.gl/docs/api-reference/engine/scenegraph/scenegraph-node.md) with child-node management and traversal helpers.

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

### `findNode(path: string): ScenegraphNode | undefined`[​](#findnodepath-string-scenegraphnode--undefined "Direct link to findnodepath-string-scenegraphnode--undefined")

Resolves an exact node ID or hierarchy path to its existing node object. Returns `undefined` when no node matches; throws if the path is ambiguous.

```
scene.findNode('hinge');                // ID anywhere in the subtree, including scene.

scene.findNode('door/hinge');           // Contiguous suffix of a node's path.

scene.findNode('/room/door/hinge');     // Anchored below scene; omit scene's own ID.

scene.findNode('/');                   // scene itself.
```

Segments match complete, case-sensitive IDs. Leading ancestors may be omitted in an unanchored path; intermediate ancestors may not. Encode `/` inside an ID as `~1`, and `~` as `~0`. Empty paths, empty segments and invalid escapes throw. Other characters, including dots and asterisks, are literal IDs rather than navigation or wildcard syntax.

### `findNodes(path: string): ScenegraphNode[]`[​](#findnodespath-string-scenegraphnode "Direct link to findnodespath-string-scenegraphnode")

Returns all matches in structural preorder, or an empty array. Uses the same path syntax as `findNode`, includes hidden branches, and can return groups as well as leaves. IDs may be duplicated; use this method when multiple results are intentional.

Both lookup methods inspect the current hierarchy without computing transforms or keeping a cache. They require a tree and reject cycles and repeated node objects. Resolve paths at application setup and retain node references for controllers or repeated frame work.

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
