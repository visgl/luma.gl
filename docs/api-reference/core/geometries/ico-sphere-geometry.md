# IcoSphere

Creates a sphere model by subdividing an Icosahedron.

## Usage

Create an IcoSphere of radius 1

```js
import {IcoSphere} from '@luma.gl/core';
const sphere = new IcoSphere({
  iterations: 1
});
```

## Inheritance

`IcoSphereGeometry` extends [`Geometry`](/docs/api-reference/core/geometry.md)

## Methods

### constructor(props : Object)

The constructor for the IcoSphere class. Use this to create a new IcoSphere.

* `props.iterations`=`0` - (*number*) The number of iterations used to subdivide the Icosahedron.
