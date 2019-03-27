# Geometry

Holds a geometric primitive.

While the `Geometry` class itself is WebGL-independent and essentially a "mathematical" description of a geometrric primitive, it contains all the information needed to create WebGL `Buffers` and render the geometry.


## Static Fields

### Geometry.MODE

Corresponds to the WebGL draw mode constants.

| Primitive Mode   | Comment                |
| ---              | ---  |
| `Geometry.MODE.POINTS`          | - |
| `Geometry.MODE.LINES`          | - |
| `Geometry.MODE.LINE_LOOP`      | - |
| `Geometry.MODE.LINE_STRIP`     | - |
| `Geometry.MODE.TRIANGLES`      | - |
| `Geometry.MODE.TRIANGLE_STRIP` | - |
| `Geometry.MODE.TRIANGLE_FAN`   | - |


## Fields

### id : String

String id, mainly intended for debugging.

### mode : Number

Describes how primitives are to be read from the vertex arrays. Will be a A valid WebGL draw mode, one of the
`Geometry.MODE` constants.


### drawMode : Number

Returns same value as `mode`.


### attributes : Object

Returns an object map with attribute names as keys and attribute accessor objects as values.

Each accessor object will have at minimum:
* A `value` field that is a typed array
* A `size` field that indicates how many components per vertex.

### indices : Object | undefined

If present, the `indices` will be an object that at minimum has:
* A `value` field that is a typed array, either `Uint32Array` or `Uint16Array`
* A `size` field that is always `1`.

### vertexCount

The number of vertices. If `instances` are present, this is the length of the instance array. Otherwise it is determined by vertex array and size.


## Functions

### constructor(props : Object)

- `props.mode` (Number): The draw mode, one of the `Geometry.MODE` constants.
- `props.drawMode` (Number): Alternative to `props.mode`, only one of them should be specified.
- `props.vertexCount`= (Number): Optionally sets the number of vertices to draw.
- `props.attributes` (Object): Map of attribute names to accessor objects.
- `props.indices`= (Object | undefined): If supplied, an accessor object for the indices array.

