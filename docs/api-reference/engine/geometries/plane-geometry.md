# Plane

Creates a plane geometry.

The generated geometry will have `indices` and `POSITION`, `NORMAL` and `TEXCOORD_0` attributes.

## Usage

Create a XZ plane.
```js
import {Plane} from '@luma.gl/core';
const plane = new Plane({
  type: 'x,z',
  xlen: 10,
  zlen: 20,
  nx: 5,
  nz: 5,
  offset: 0
});
```

## Inheritance

`PlaneGeometry` extends [`Geometry`](/docs/api-reference/core/geometry.md)

## Methods

### constructor(props : Object)

The constructor for the Plane class. Use this to create a new Plane.

* `props.type` - (*string*) Whether is a XY, YZ or XZ plane. Possible values are `x,y`, `x,z`, `y,z`.
* `props.xlen` - (*number*) The length along the x-axis. Only used in `x,z` or `x,y` planes.
* `props.ylen` - (*number*) The length along the y-axis. Only used in `y,z` or `x,y` planes.
* `props.zlen` - (*number*) The length along the z-axis. Only used in `x,z` or `y,z` planes.
* `props.nx` - (*number*) The number of subdivisions along the x-axis. Only used in `x,z` or `x,y` planes.
* `props.ny` - (*number*) The number of subdivisions along the y-axis. Only used in `y,z` or `x,y` planes.
* `props.nz` - (*number*) The number of subdivisions along the z-axis. Only used in `x,z` or `y,z` planes.
* `props.offset` - (*number*) For XZ planes, the offset along the y-axis. For XY planes, the offset along the z-axis. For YZ planes, the offset along the x-axis.
