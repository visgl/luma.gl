# Core API Reference

The [core module](api-reference/webgl), with the signature [`Model`](model) class, represent a set of fairly traditional 3D library classes on a slightly higher abstraction level than the WebGL2 API, that can serve as the basic building blocks for most applications.

Also contains a limited scene graph system that provides primitive hierarchy of 3D objects with positioning, grouping, traversal and scene support.

Note tyat the `Model` class is in many ways the quintessential luma.gl class. It ties together many concepts in luma.gl and is a good place to start reading if you are new to the framework.


## Classes

The core module provides the following classes

* [`AnimationFrame`](api-reference/core/animation-frame) - render loop / app life cycle support
* [`Model`](api-reference/core/model) - A renderable object with attributes and uniforms.
* [`Geometry`](api-reference/core/geometry) - Holds attributes and drawType for a geometric primitive
* [`Group`](api-reference/core/group) - Supports recursive travesal and matrix transformation
* [`Object3D`](api-reference/core/object3d) - Base class, golds position, rotation, scale


## Functions

### encodePickingColor

Encodes an index as a Uint8Array([r, g, b]) format picking color`

`encodePickingColor(index)`

* `index` - index to be decoded
returns the decoded color


### decodePickingColor

Decodes a picking color in [r, g, b] format to an index`

 * @param {Uint8Array} color - color array to be decoded
 * @return {Array} - the decoded picking color


### getNullPickingColor

Returns the picking color that doesn't match any subfeature. Use if some graphics do not belong to any pickable subfeature.


### pickModels
