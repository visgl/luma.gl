# Built-in Geometries

**@luma.gl/engine** provides several built in geometry primitives (subclasses of [Geometry](/docs/api-reference/engine/geometry)). The generated geometry instances will have `indices` and `POSITION`, `NORMAL` and `TEXCOORD_0` attributes.

## ConeGeometry

Create a `ConeGeometry` of base radius 2 and height 3.

```js
import {ConeGeometry} from '@luma.gl/engine';
const cone = new ConeGeometry({
  radius: 2,
  height: 3,
  cap: true
});
```

### constructor(props : Object)

- `props.radius` (_number_): The radius of the base of the cone.
- `props.cap`=`false` (_boolean_, optional): Whether to put the cap on the base of the cone.
- `props.nradial`=`10` (_number_): Number of vertices used to create the disk for a given height.
- `props.nvertical`=`10` (_number_): Number of vertices for the height.

## CubeGeometry

```js
import {CubeGeometry} from '@luma.gl/engine';
const cube = new CubeGeometry();
```

## CylinderGeometry

Create a `CylinderGeometry` of radius 2 and height 3.

```js
import {CylinderGeometry} from '@luma.gl/engine';
const cylinder = new CylinderGeometry({
  radius: 2,
  height: 3
});
```

### constructor(props : Object)

- `props.height`= - (_number_) The height of the cylinder.
- `props.radius`= - (_number_) The radius of the cylinder.
- `props.nradial`=`10` - (_number_) The number of vertices for the disk.
- `props.nvertical`=`10` - (_number_) The number of vertices for the height.
- `props.verticalAxis`=`y` - (_string_) The axis along which the height is measured. One of `x`, `y`, `z`.
- `props.topCap`=`false` - (_boolean_) Whether to put the cap on the top of the cylinder.
- `props.bottomCap`=`false` - (_boolean_) Whether to put the cap on the bottom
  part of the cylinder.

## IcoSphereGeometry

Create an IcoSphereGeometry of radius 1

```js
import {IcoSphereGeometry} from '@luma.gl/engine';
const sphere = new IcoSphereGeometry({
  iterations: 1
});
```

### constructor(props : Object)

- `props.iterations`=`0` - (_number_) The number of iterations used to subdivide the Icosahedron.

## PlaneGeometry

Create a XZ plane.

```js
import {PlaneGeometry} from '@luma.gl/engine';
const plane = new PlaneGeometry({
  type: 'x,z',
  xlen: 10,
  zlen: 20,
  nx: 5,
  nz: 5,
  offset: 0
});
```

### constructor(props : Object)

- `props.type` - (_string_) Whether is a XY, YZ or XZ plane. Possible values are `x,y`, `x,z`, `y,z`.
- `props.xlen` - (_number_) The length along the x-axis. Only used in `x,z` or `x,y` planes.
- `props.ylen` - (_number_) The length along the y-axis. Only used in `y,z` or `x,y` planes.
- `props.zlen` - (_number_) The length along the z-axis. Only used in `x,z` or `y,z` planes.
- `props.nx` - (_number_) The number of subdivisions along the x-axis. Only used in `x,z` or `x,y` planes.
- `props.ny` - (_number_) The number of subdivisions along the y-axis. Only used in `y,z` or `x,y` planes.
- `props.nz` - (_number_) The number of subdivisions along the z-axis. Only used in `x,z` or `y,z` planes.
- `props.offset` - (_number_) For XZ planes, the offset along the y-axis. For XY planes, the offset along the z-axis. For YZ planes, the offset along the x-axis.

## SphereGeometry

```js
import {SphereGeometry} from '@luma.gl/engine';
const sphere = new SphereGeometry({
  radius: 2
});
```

### constructor(props : Object)

- `props.nlat`=`10` - (_number_, optional) The number of vertices for latitude.
- `props.nlong`=`10` - (_number_, optional) The number of vertices for longitude.
- `props.radius`=`1` - (_number_, optional) The radius of the sphere.
