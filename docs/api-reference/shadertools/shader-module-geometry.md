# geometry (Shader Module)

Allows for registration of positions and normals. Other shader modules can use `geometry` to query for these in predictable ways.

Implements flat shading controlled by a module setting.


## Usage

In your vertex shader, your inform the `geometry` module what position and normals we are using, typically from an attribute.

```
attribute vec3 POSITION;
attribute vec3 NORMAL;

main() {
  geometry_setPosition(POSITION);
  geometry_setNormal(NORMAL);
  ...
}
```

In your fragment shader:

```
main() {
  geometry_getPosition();
  geometry_getNormal(); // May return a flat normal;
  ...
  gl_FragColor = ...
}
```

## JavaScript Functions

### getUniforms

`getUniforms` returns an object with key/value pairs representing the uniforms that the `picking` module shaders need.

`getUniforms({flatShading, hasNormals})`

* `flatShading`=`false` (*boolean*) - Calculates face normals
* `hasNormals`=`false` (*boolean*) - Are normals present?

## Vertex Shader Functions

### `void geometry_setPosition(vec3)`

### `void geometry_setNormal(vec3)`

### `vec3 geometry_getPosition()`

### `vec3 geometry_getNormal()`


## Fragment Shader Functions

### `vec3 geometry_getPosition()`

### `vec3 geometry_getNormal()`

May return a flat shaded normal instead of the passed in normal.

