# Geometry

The Geometry class holds a collection of vertex array attributes representing a geometric primitive.

A geometry is considered a "primitive" when it can be rendered with a single GPU draw call. Multiple geometry primitives can be composed into a composite geometry using the `Mesh` and `Model` classes.

To learn more about attributes refer to the `Accessor` class that holds metadata for each attributes.


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

## Properties

### `id` - (*string*, optional)

An id for the model. If not provided, a random unique identifier will be created.


### drawMode : Number

The draw mode, or primitive type.

Some options are `GL.TRIANGLES` (default), `GL.TRIANGLE_STRIP`, `GL.POINTS`, `GL.LINES`.


### `attributes` - (*object*, optional)

An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model.


### attributes : Object

A map of `Accessor` instances describing the geometry of this primitive.


### indices : Accessor

An optional `Accessor` instance that contains the indices (aka elements) for this geometry. Can be `null` or `undefined` if this primitive doesn't use indices. Note that indices can also be stored inside `attributes`.


### material : Object

An object with key/value pairs that indicate how various uniforms should be set up before the GPU draw call. The `Geometry` class itself does not directly use the contents of the `material` field, however other classes such as `Mesh` will refer to it if available, and normally expects it to be set to an instance of the `Material` class.


## Methods

### constructor(props : Object)

The constructor for the `Geometry` class. Use this to create a new `Geometry`.

```js
const geometry = new Geometry(props);
```


### setProps(props : Object)

Update properties



## Types and Enumerations

### drawMode

Follows glTF/OpenGL/WebGL conventions:

| Value | Primitive Mode   |
| ---   | ---              |
| `0`   | `POINTS`         |
| `1`   | `LINES`          |
| `2`   | `LINE_LOOP`      |
| `3`   | `LINE_STRIP`     |
| `4`   | `TRIANGLES`      |
| `5`   | `TRIANGLE_STRIP` |
| `6`   | `TRIANGLE_FAN`   |


### Typical Attributes

| Attribute      | Description      |
| ---            | ---              |
| `indices`      | (*array*, optional) An array of numbers describing the vertex indices for each face. |
| `positions`    | (*array*, optional) An array of floats that describe the vertices of the model. |
| `normals`      | (*array*, optional) An array of floats that describe the normals of the model. |
| `texCoords`    | (*mixed*, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as  |keys and an array of floats as values.
| `colors`       | (*array*, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces. |
| `pickingColors` | (*array*, optional) A custom set of colors to render the object to texture when performing the color picking algorithm. |


## Remarks

* The Geometry class does not take a `WebGLRenderingContext` and is intentionally 
* The `Geometry` class holds the [glTF2 "primitive" specification](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0), although morph `targets` are not yet supported.
