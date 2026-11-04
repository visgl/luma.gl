# Scenegraph Billboards

`BillboardController` derives camera-facing draw transforms for selected scenegraph nodes. Authored local matrices remain intact, so several cameras can render the same scene using separate facing transforms after animation has updated the hierarchy.

## Example[​](#example "Direct link to Example")

Loading interactive example…

## Create a binding[​](#create-a-binding "Direct link to Create a binding")

```
import {BillboardController, GroupNode} from '@luma.gl/engine';



const labelNode = new GroupNode({id: 'label'});

const scene = new GroupNode({children: [labelNode]});

const billboards = new BillboardController({

  scenes: [scene],

  bindings: [{node: labelNode, definition: {rotationAxis: 'all', up: [0, 1, 0]}}]

});



const drawEntries = billboards.getDrawEntries({viewMatrix, cameraId: 'main'});
```

The example binds a group; populate its children with renderable primitives. Each returned entry contains a leaf node, complete `modelMatrix`, and an `overlay` flag. For a `ModelNode`, supply that matrix through the application's projection/shader-input path. Do not multiply its local matrix again.

`rotationAxis` accepts `'all'` or `'y'`; `viewDirection` and `up` establish facing orientation. `scaleWithDistance` controls the distance-scaling behavior. Set `matrixAuthored` on a binding when the node uses an explicit matrix rather than separately authored TRS values.

Overlay entries are drawn after ordinary geometry with depth testing and depth writes disabled. The controller returns draw metadata; the renderer owns pipeline configuration and submission. Use a distinct `cameraId` for independent camera histories and call `destroy()` when finished. The controller borrows its scene nodes.

## Importing billboards[​](#importing-billboards "Direct link to Importing billboards")

`parseGLTFBillboards()` resolves source attachments into these construction props. Its draft compatibility profile is narrower than the native controller API; see [glTF billboard conversion](https://luma.gl/docs/api-reference/gltf/gltf-billboard.md) for constrained-axis and legacy-source restrictions. See [Scenegraphs](https://luma.gl/docs/api-guide/engine/scenegraph.md) for traversal and frame ordering.
