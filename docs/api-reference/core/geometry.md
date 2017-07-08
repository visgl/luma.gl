# Geometry

The Geometry class enables you to create a collection of vertex array attribute buffers representing a geometric primitive.


## Usage

Create a pyramid model (used in lesson 4 of learning WebGL examples).
```js
var pyramid = new Model(gl, {
  vertices: [ 0,1,0, -1,-1,1, 1,-1, 1, ...],
  colors: [1,0,0,1, 0,1,0,1, 0,0,1,1, ...]
});
```

Create a pyramid geometry and add some extra buffer information and uniform
color to be set before rendering the model.
```js
var fromVertices = [0,1,0, -1,-1,1, 1,-1,1, ...;
var toVertices = fromVertices.map(function(value) { return value * 2; });

var pyramid = new Geometry({
  attributes: {
    endPosition: {
      //default is type: gl.FLOAT
      attribute: 'endPosition',
      size: 3,
      value: new Float32Array(toVertices)
    }
  }
});
```

## Methods

### constructor

The constructor for the Geometry class. Use this to create a new Geometry.

`const model = new Geometry(options);`

* id - (*string*, optional) An id for the model. If not provided, a random unique identifier will be created.

* drawType - (*string*, optional) A string describing the drawType. Some options are `GL.TRIANGLES`, `GL.TRIANGLE_STRIP`, `GL.POINTS`, `GL.LINES`. Default's `TRIANGLES`.
* attributes - (*object*, optional) An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model.


## Typical Attributes

* vertices - (*array*, optional) An array of floats that describe the vertices of the model.
* normals - (*array*, optional) An array of floats that describe the normals of the model.
* textures - (*array*, optional) An array of strings of texture ids.
* texCoords - (*mixed*, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as keys and an array of floats as values.
* colors - (*array*, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces.
* indices - (*array*, optional) An array of numbers describing the vertex indices for each face.
* pickingColors - (*array*, optional) A custom set of colors to render the object to texture when performing the color picking algorithm.
