# SphereGeometry

Creates a sphere geometry.

The generated geometry will have `indices` and `POSITION`, `NORMAL` and `TEXCOORD_0` attributes.

## Usage

Create a white SphereGeometry of radius 2

```js
import {SphereGeometry} from '@luma.gl/core';
const sphere = new SphereGeometry({
  radius: 2
});
```

## Inheritance

`SphereGeometry` extends [`Geometry`](/docs/api-reference/core/geometry.md)

## Methods

### constructor(props : Object)

The constructor for the SphereGeometry class. Use this to create a new SphereGeometry.

* `props.nlat`=`10` - (*number*, optional) The number of vertices for latitude.
* `props.nlong`=`10` - (*number*, optional) The number of vertices for longitude.
* `props.radius`=`1` - (*number*, optional) The radius of the sphere.
