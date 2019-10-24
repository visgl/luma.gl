# Cone

A scenegraph model node with a [`ConeGeometry`](/docs/api-reference/core/geometries/cone-geometry).

## Usage

Create a cone of base radius 2 and height 3.
```js
import {Cone} from '@luma.gl/core';
const cone = new Cone(gl, {
  radius: 2,
  height: 3,
  cap: true
});
```

## Inheritance

`Cone` extends [`ModelNode`](/docs/api-reference/core/scenegraph/model-node.md) extends [`ScenegraphNode`](/docs/api-reference/core/scenegraph/scenegraph-node.md)

## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

The constructor for the Cone class. Use this to create a new Cone.

* `props.nradial` - (*number*, optional) The number of vertices used to create the disk for a given height. Default's 10.
* `props.nvertical` - (*number*, optional) The number of vertices for the height. Default's 10.
* `props.radius` - (*number*) The radius of the base of the cone.
* `props.cap` - (*boolean*, optional) Whether to put the cap on the base of the cone. Default's false.
