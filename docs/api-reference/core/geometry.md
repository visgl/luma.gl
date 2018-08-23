# Geometry

The Geometry class enables you to create a collection of vertex array attribute buffers representing a geometric primitive.


## Usage

Create a pyramid geometry (used in lesson 4 of learning WebGL examples).
```js
const pyramidGeometry= new Geometry({
  attributes: {
    positions: new Float32Array([ ... ]),
    colors: {
      size: 4,
      value: new Float32Array([ ... ])
    }
  }
});
```

## Methods

### constructor

The constructor for the `Geometry` class. Use this to create a new `Geometry`.

```js
const geometry = new Geometry(options);
```
#### Parameters

* `id` - (*string*, optional) An id for the model. If not provided, a random unique identifier will be created.
* `drawMode` - (*string*, optional) A string describing the drawMode. Some options are `GL.TRIANGLES`, `GL.TRIANGLE_STRIP`, `GL.POINTS`, `GL.LINES`. Default's `TRIANGLES`.
* `attributes` - (*object*, optional) An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model.

### Typical Attributes

* `vertices` - (*array*, optional) An array of floats that describe the vertices of the model.
* `normals` - (*array*, optional) An array of floats that describe the normals of the model.
* `texCoords` - (*mixed*, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as keys and an array of floats as values.
* `colors` - (*array*, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces.
* `indices` - (*array*, optional) An array of numbers describing the vertex indices for each face.
* `pickingColors` - (*array*, optional) A custom set of colors to render the object to texture when performing the color picking algorithm.
