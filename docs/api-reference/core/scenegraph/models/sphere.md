# Sphere

Creates a sphere model. Inherits methods from [`Model`](/docs/api-reference/core/model.md).

## Usage

Create a white Sphere of radius 2

```js
import {Sphere} from '@luma.gl/core';
const whiteSphere = new Sphere(gl, {
  radius: 2,
  colors: [1, 1, 1, 1]
});
```

## Inheritance

`Sphere` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the Sphere class. Use this to create a new Sphere.

`var model = new Sphere(gl, options);`

* `props.nlat`=`10` - (*number*, optional) The number of vertices for latitude.
* `props.nlong`=`10` - (*number*, optional) The number of vertices for longitude.
* `props.radius`=`1` - (*number*, optional) The radius of the sphere.
