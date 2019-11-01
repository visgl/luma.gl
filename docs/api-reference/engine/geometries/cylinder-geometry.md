# Cylinder

Creates a cylinder geometry.

The generated geometry will have `indices` and `POSITION`, `NORMAL` and `TEXCOORD_0` attributes.

## Usage

Create a white Cylinder of radius 2 and height 3.

```js
import {Cylinder} from '@luma.gl/core';
const cylinder = new Cylinder({
  radius: 2,
  height: 3
});
```

## Inheritance

`CylinderGeometry` extends [`Geometry`](/docs/api-reference/core/geometry.md)

## Methods

### constructor(props : Object)

The constructor for the Cylinder class. Use this to create a new Cylinder.

* `props.height`= - (*number*) The height of the cylinder.
* `props.radius`= - (*number*) The radius of the cylinder.
* `props.nradial`=`10` - (*number*) The number of vertices for the disk.
* `props.nvertical`=`10` - (*number*) The number of vertices for the height.
* `props.verticalAxis`=`y` - (*string*) The axis along which the height is measured. One of `x`, `y`, `z`.
* `props.topCap`=`false` - (*boolean*) Whether to put the cap on the top of the cylinder.
* `props.bottomCap`=`false` - (*boolean*) Whether to put the cap on the bottom
  part of the cylinder.
