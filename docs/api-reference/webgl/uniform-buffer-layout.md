# UniformBufferLayout (WebGL2)

A helper class that lets the application describe the contents of a uniform block and then perform `setUniforms({uniform: value})` calls on it, manipulating individual values without concern for memory layout requirements.


## Usage

Create a `UniformBufferLayout` that matches the uniform block declaration in your shader

```js
#version 300 es
layout (std140) uniform matrix {
    mat4 mvp;
} matrixBlock;
```

```js
const matrixBlockLayout = new UniformBufferLayout({
  mvp: GL.FLOAT_MAT4
});
```

Setting values on a `UniformBufferLayout`:

```js
.setValues({
  mvp: [1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1]
});
```

Creating a uniform buffer to hold the data required by the layout

```js
const layout = new UniformBufferLayout({...});
const buffer = new Buffer(gl, {size: layout.getBytes()});
```

Updating your actual uniform buffer

```js
const layout = ...
layout.setValues({...})
buffer.subData({data: layout.getData()})
```

Updating a minimal part of the actual uniform buffer

```js
const {data, offset} = layout.getSubData();
buffer.subData({data, offset})
```

Binding your uniform buffer

```js
TBA
```


## Methods

### constructor

Takes a layout object and creates an internal layout description. Once constructed the layout cannot be changed. Once constructed the size of the required memory buffer is known, and the buffer layout provides a convenient interface for updating values.

Note: The order and type of the uniforms in the layout object provided to the constructor must match the order and type of the uniform declarations in the GLSL uniform block


### setValues

Sets uniform values.


### getBytes

Returns the number of bytes needed to hold all the uniforms in the layout, which can be used to create a `Buffer` with enough data to hold the entire memory layout.


### getData

Returns a `Float32Array` representing all the memory in the layout. The length of this array (* 4) will correspond to the value returned by `getBytes()`


### getSubData

Returns a `Float32Array` representing all the memory in the layout. The length of this array (* 4) will correspond to the value returned by `getBytes()`


## Types

Use the following WebGL types to declare uniforms corresponding to your GLSL data types.

| GLSL Type | WebGL type |
| ---       | --- |
| `float`   | `GL.FLOAT` |
| `vec2`    | `GL.FLOAT_VEC2` |
| `vec3`    | `GL.FLOAT_VEC3` |
| `vec4`    | `GL.FLOAT_VEC4` |
| `int`     | `GL.INT` |
| `ivec2`   | `GL.INT_VEC2` |
| `ivec3`   | `GL.INT_VEC3` |
| `ivec4`   | `GL.INT_VEC4` |
| `uint`    | `GL.UNSIGNED_INT` |
| `uvec2`   | `GL.UNSIGNED_INT_VEC2` |
| `uvec3`   | `GL.UNSIGNED_INT_VEC3` |
| `uvec4`   | `GL.UNSIGNED_INT_VEC4` |
| `bool`    | `GL.BOOL` |
| `bvec2`   | `GL.BOOL_VEC2` |
| `bvec3`   | `GL.BOOL_VEC3` |
| `bvec4`   | `GL.BOOL_VEC4` |
| `mat2`    | `GL.FLOAT_MAT2` |
| `mat3`    | `GL.FLOAT_MAT3` |
| `mat4`    | `GL.FLOAT_MAT4` |
| `mat2x3`  | `GL.FLOAT_MAT2x3` |
| `mat2x4`  | `GL.FLOAT_MAT2x4` |
| `mat3x2`  | `GL.FLOAT_MAT3x2` |
| `mat3x4`  | `GL.FLOAT_MAT3x4` |
| `mat4x2`  | `GL.FLOAT_MAT4x2` |
| `mat4x3`  | `GL.FLOAT_MAT4x3` |


## Remarks

* WebGL requires the data representing the uniforms in to be laid out in memory according to specific rules (essentially some padding needs to be injected between successive values to facilitate memory access by the GPU).
* Note that WebGL2 uniform buffers are just [Buffer](/docs/api-reference/webgl/buffer.md) objects and can be manipulated directly. The `UniformBufferLayout` class is not a WebGL2 object, it is just an optional helper class that makes it easy to create and update a block of memory with the required layout.
* More information on the `std140` layout specification: [OpenGL spec](https://khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf#page=137)
