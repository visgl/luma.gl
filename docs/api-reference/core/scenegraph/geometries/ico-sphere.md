# IcoSphere

A scenegraph model node with an [`IcoSphereGeometry`](/docs/api-reference/core/geometries/cube-geometry).

## Usage

Create a white IcoSphere of radius 1.

```js
import {IcoSphere} from '@luma.gl/core';
const sphere = new IcoSphere(gl, {
  iterations: 1
});
```

## Inheritance

`IcoSphere` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the IcoSphere class. Use this to create a new IcoSphere.

* `props.iterations`=`0` - (*number*) The number of iterations used to subdivide the Icosahedron.
