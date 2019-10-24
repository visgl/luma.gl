# Sphere

A scenegraph model node with an [`SphereGeometry`](/docs/api-reference/core/geometries/cube-geometry).

## Usage

Create a white Sphere of radius 2

```js
import {Sphere} from '@luma.gl/core';
const sphere = new Sphere(gl, {
  radius: 2
});
```

## Inheritance

`Sphere` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the Sphere class. Use this to create a new Sphere.

* `props.nlat`=`10` - (*number*, optional) The number of vertices for latitude.
* `props.nlong`=`10` - (*number*, optional) The number of vertices for longitude.
* `props.radius`=`1` - (*number*, optional) The radius of the sphere.
