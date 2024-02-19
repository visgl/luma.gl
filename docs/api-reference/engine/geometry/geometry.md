# Geometry

The Geometry class holds a collection of vertex array attributes representing a geometric primitive.

A geometry is considered a "primitive" when it can be rendered with a single GPU draw call. Multiple geometry primitives can be composed into a composite geometry using the `Mesh` and `Model` classes.

To learn more about attributes refer to the `Accessor` class that holds metadata for each attributes.

## Usage

Create a pyramid geometry (used in lesson 4 of learning WebGL examples).

```typescript
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

### `id: string` 

An id for the model. If not provided, a random unique identifier will be created.

### topology

The draw mode, or primitive type.

Some options are `triangle-list` (default), `triangle-strip`, `point-list`, `line-list`.

### `attributes`

An object with buffer/attribute names and buffer/attribute descriptors to be set before rendering the model.

### `indices`

An optional `Accessor` instance that contains the indices (aka elements) for this geometry. Can be `null` or `undefined` if this primitive doesn't use indices. Note that indices can also be stored inside `attributes`.

## Methods

### constructor(props : Object)

The constructor for the `Geometry` class. Use this to create a new `Geometry`.

```typescript
const geometry = new Geometry(props);
```

### setProps(props : Object)

Update properties

## Types and Enumerations

### topology

Follows glTF/OpenGL/WebGL conventions:

### Typical Attributes

| Attribute       | Description                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `indices`       | (_array_, optional) An array of numbers describing the vertex indices for each face.                                                             |
| `positions`     | (_array_, optional) An array of floats that describe the vertices of the model.                                                                  |
| `normals`       | (_array_, optional) An array of floats that describe the normals of the model.                                                                   |
| `texCoords`     | (_mixed_, optional) Can be an array of floats indicating the texture coordinates for the texture to be used or an object that has texture ids as | keys and an array of floats as values. |
| `colors`        | (_array_, optional) An array of colors in RGBA. If just one color is specified that color will be used for all faces.                            |
| `pickingColors` | (_array_, optional) A custom set of colors to render the object to texture when performing the color picking algorithm.                          |

## Remarks

- The Geometry class does not take a `WebGLRenderingContext` and is intentionally
- The `Geometry` class holds the [glTF2 "primitive" specification](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0), although morph `targets` are not yet supported.
