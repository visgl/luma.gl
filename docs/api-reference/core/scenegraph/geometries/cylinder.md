# Cylinder

A scenegraph model node with a [`CylinderGeometry`](/docs/api-reference/core/geometries/cube-geometry).


## Usage

Create a white Cylinder of radius 2 and height 3.

```js
import {Cylinder} from '@luma.gl/core';
const cylinder = new Cylinder(gl, {
  radius: 2,
  height: 3
});
```

## Inheritance

`Cylinder` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the Cylinder class. Use this to create a new Cylinder.

* `props.height`= - (*number*) The height of the cylinder.
* `props.radius`= - (*number*) The radius of the cylinder.
* `props.nradial`=`10` - (*number*) The number of vertices for the disk.
* `props.nvertical`=`10` - (*number*) The number of vertices for the height.
* `props.verticalAxis`=`y` - (*string*) The axis along which the height is measured. One of `x`, `y`, `z`.
* `props.topCap`=`false` - (*boolean*) Whether to put the cap on the top of the cylinder.
* `props.bottomCap`=`false` - (*boolean*) Whether to put the cap on the bottom
  part of the cylinder.
