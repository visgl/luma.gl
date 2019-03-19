# IcoSphere

Creates a sphere model by subdividing an Icosahedron. Inherits methods from [`Model`](/docs/api-reference/core/model.md).

## Usage

Create a white IcoSphere of radius 1.

```js
import {IcoSphere} from '@luma.gl/core';
const whiteSphere = new IcoSphere(gl, {
  iterations: 1,
  colors: [1, 1, 1, 1]
});
```

## Inheritance

`IcoSphere` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the IcoSphere class. Use this to create a new IcoSphere.

* `props.iterations`=`0` - (*number*) The number of iterations used to subdivide the Icosahedron.
