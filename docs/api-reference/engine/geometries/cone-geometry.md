# Cone

Creates a cone geometry.

The generated geometry will have `indices` and `POSITION`, `NORMAL` and `TEXCOORD_0` attributes.

## Usage

Create a `Cone` of base radius 2 and height 3.
```js
import {Cone} from '@luma.gl/core';
const cone = new Cone({
  radius: 2,
  height: 3,
  cap: true
});
```

## Inheritance

`Cone` extends [`Geometry`](/docs/api-reference/core/geometry.md).

## Methods

### constructor(props : Object)

The constructor for the Cone class. Use this to create a new Cone.

- `props.radius` (*number*): The radius of the base of the cone.
- `props.cap`=`false` (*boolean*, optional): Whether to put the cap on the base of the cone.
- `props.nradial`=`10` (*number*): Number of vertices used to create the disk for a given height.
- `props.nvertical`=`10` (*number*): Number of vertices for the height.
