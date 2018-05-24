# Plane

Creates a plane. Inherits methods from [`Model`](/docs/api-reference/core/model.md).

## Usage

Create a white XZ plane.
```js
var whitePlane = new Plane(gl, {
  type: 'x,z',
  xlen: 10,
  zlen: 20,
  nx: 5,
  nz: 5,
  offset: 0,
  colors: [1, 1, 1, 1]
});
```
## Method

### constructor

The constructor for the Plane class. Use this to create a new Plane.

`var model = new Plane(gl, options);`

* type - (*string*) Whether is a XY, YZ or XZ plane. Possible values are `x,y`, `x,z`, `y,z`.
* xlen - (*number*) The length along the x-axis. Only used in `x,z` or `x,y` planes.
* ylen - (*number*) The length along the y-axis. Only used in `y,z` or `x,y` planes.
* zlen - (*number*) The length along the z-axis. Only used in `x,z` or `y,z` planes.
* nx - (*number*) The number of subdivisions along the x-axis. Only used in `x,z` or `x,y` planes.
* ny - (*number*) The number of subdivisions along the y-axis. Only used in `y,z` or `x,y` planes.
* nz - (*number*) The number of subdivisions along the z-axis. Only used in `x,z` or `y,z` planes.
* offset - (*number*) For XZ planes, the offset along the y-axis. For XY planes, the offset along the z-axis. For YZ planes, the offset along the x-axis.
