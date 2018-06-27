# VertexArray

A `VertexArray` object holds a map of "buffers" that will be made available as input data to shaders during a draw call, similar to how a `TransformFeedback` object holds a set of `Buffer` instances that will receive output data from shaders.

A properly configured `VertexArray` should contain one binding (to a `Buffer` object or a constant) for every named attribute in the shader (or for every `layout` declared location in the shader) representing the input data. For `Buffer` objects, the `VertexArray` also stores some additional information about how that data in the buffer should be accessed, such as offsets, strides, etc.

> Note that it is usually not necessary to manipulate `VertexArray` directly in luma.gl applications. It is often simpler to just supply attributes to the [`Model`](/docs/api-reference/core/model.md) class, and rely on that class to automatically manage the vertex attributes array and supply it to any draw calls (e.g. when rendering, picking etc). Still, it can be useful to review this documentation to understand how attributes are handled.

For more information on WebGL `VertexArrayObject`s, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).

Notes:

* `VertexArray`s are provided by a WebGL1 extension on some WebGL1 systems: [vertex_array_objects extension](https://webglstats.com/webgl/extension/OES_vertex_array_object). To make sure they are supported in all WebGL1 environments, import `luma.gl/webgl1` before creating any WebGL contexts.


## Usage

Import the `VertexArray` class so that your app can use it:

```js
import {VertexArray} from 'luma.gl';
```

Getting the global `VertexArray` for a WebGL context

```js
const vertexArray = VertexArray.global(gl);
```

Create a new VertexArray

```js
const vao = new VertexArray(gl);
}
```

Adding attributes to a VertexArray

```js
const vertexArray = new VertexArray(gl);
vertexArray.setBuffer(location, buffer);
vertexArray.setBuffer(name, buffer);
```

Deleting a VertexArray

```js
vertexArrayObject.delete();
```

Setting a set of attributes and an elements array

```js
const vertexArray = new VertexArray(gl, {
  elements:
    new Buffer({target: GL.ELEMENT_ARRAY_BUFFER, data: new Uint32Array([...])}),
  buffers: {
  	0: new Buffer({data: new Float32Array([...])})
  }
}

const vertexArray = new VertexArray(gl);
// Can only set buffers using location indices
vertexArray.setBuffers({
  0: new Buffer({data: new Float32Array([...]), ...})
});

```

Setting attribute metadata

```js
// Register attribute info
const program = new Program(gl, ...);
vertexArray.initialize({attributeInfo: program.getAttributeInfo()});

// Now it is possible to set buffers using attribute names
vertexArray.setBuffers({
  aColor: new Buffer({size: 3, data: new Float32Array([...]), ...})
});

vertexArray.initialize({program: });
```

Setting a constant vertex attribute

```js
import {VertexArray} from 'luma.gl';
const vao = new VertexArray(gl);
vao.setConstant(0, [0, 0, 0]);
```

## Methods

`VertexArray` inherits from `Resource`.


### VertexArray(gl : WebGLRenderingContext, props : Object)

Creates a new VertexArray

* `props` (Object) - passed through to `Resource` superclass constructor and to `initialize`


### VertexArray.getDefaultArray() : VertexArray

Returns the "global" `VertexArray`.

Note: The global `VertexArray` object is always available. Binds the `null` VertexArrayObject.


### initialize(props : Object) : VertexArray

Reinitializes a `VertexArray`.

* `attributes`=`{}` (`Object`) - map of attributes, can be keyed by index or names, can be constants (small arrays), `Buffer`, arrays or typed arrays of numbers, or attribute descriptors.
* `elements`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
* `program` - Transfers information on vertex attribute locations and types to this vertex array.


### setAttributes(attributes : Object) : VertexArray

Sets named uniforms from a map.

```js
program.setAttributes(attributes : Object);
```

* `attributes` - (*object*) An object with key value pairs matching a buffer name and its value respectively.

Attributes is an object with key-value pairs: `{nameOrLocation: value, ....}`.

* `nameOrLocation` - (*string|number*) The name of the attribute as declared in the shader, or the location specified by a layout qualifier in the shader.
* `value` - (*Buffer|Array|typed array*) An attribute value must be a `Buffer` or a typed array.

Each value can be an a `Buffer`, an `Array` starting with a `Buffer` or a typed array.

* Typed Array - Sets a constant value as if `.setConstant(value)`  was called.
* `Buffer` - Binds the atttribute to a buffer, using buffer's accessor data as if `.setBuffer(value)` was called.
* `Array` - Binds the atttribute to a buffer, with extra accessor data overrides. Expects a two element array with `[buffer : Buffer, accessor : Object]`. Binds the attribute to the buffer as if ` .setBuffer(buffer, accessor)` was called.


### setConstant(values : Array) : VertexArray

Sets a constant value for a vertex attribute. When this `VertexArray` is used in a `Program.draw()` call, all Vertex Shader invocations will get the same value.

`VertexArray.setConstant(location, array);`

* `gl` (`WebGLRenderingContext`) - gl context
* `location` (*GLuint*) - index of the attribute

WebGL APIs:
[vertexAttrib4[u]{f,i}v](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib)


### setBuffer(nameOrLocation, buffer : Buffer [, accessor : Object]) : VertexArray

Binds the specified attribute in this vertex array to the supplied buffer

* Set a location in vertex attributes array to a buffer, specifying
* its data layout and integer to float conversion and normalization flags

`setBuffer(location, buffer);`
`setBuffer(location, buffer, {offset = 0, stride = 0, normalized = false, integer = false});`

* `location` (*GLuint* | *String*) - index/ordinal number of the attribute
* `buffer` (*WebGLBuffer*|*Buffer*) - WebGL buffer to set as value

[gl.vertexAttrib{I}Pointer](), [gl.vertexAttribDivisor](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor)


### getParameter(pname, location) : *

Queries a vertex attribute location.

* `pname` (GLenum) - Which parameter to query. See table of parameter constants below for values.
* **location** (*Number*) - index of attributes

Note that in WebGL queries are generally slow and should be avoided in performance critical code sections.


## Types, Constants, Enumarations


## Attribute Accessors

When setting `Buffer` attributes, additional data can be provided to specify how the buffer should be accessed. This data can be stored directly on the `Buffer` accessor or supplied to `.setBuffer`.

* `target`=`buffer.target` (*GLuint*, ) - which target to bind to
* `size` (*GLuint*)  - number of values (components) per element (1-4)
* `type` (*GLuint*)  - type of values (e.g. gl.FLOAT)
* `normalized` (*boolean*, false) - normalize integers to [-1,1] or [0,1]
* `integer` (*boolean*, false) - `WebGL2` disable int-to-float conversion
* `stride` (*GLuint*, 0) - supports strided arrays
* `offset` (*GLuint*, 0) - supports strided arrays
* `layout.normalized`=`false` (GLbool) - normalize integers to [-1,1], [0,1]
* `layout.integer`=`false` (GLuint) - WebGL2 only, disable int-to-float conv.

* `divisor` - Sets the frequency divisor used for instanced rendering (instances that pass between updates of attribute). Usually simply set to 1 or 0 to enable/disable instanced rendering. 0 disables instancing, >=1 enables it.

Notes:

* The application can enable normalization by setting the `normalized` flag to `true` in the `setBuffer` call.
* **WebGL2** The application can disable integer to float conversion when running under WebGL2, by setting the `integer` flag to `true`.
* [`glVertexAttribIPointer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer) specifies *integer* data formats and locations of vertex attributes. Values are always left as integer values. Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT

Notes about Instanced Rendering

* About setting `divisor` in attributes: Instanced attributes requires WebGL2 or a (widely supported) WebGL1 extension. Apps can use the luma.gl feature detection system to determine if instanced rendering is available, though the extension is so ubiquitously supported that many apps just make the assumption: [instanced_arrays](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays).
* An attribute is referred to as **instanced** if its divisor value is non-zero.
* The divisor modifies the rate at which vertex attributes advance when rendering multiple instances of primitives in a single draw call.
* If divisor is zero, the attribute at slot index advances once per vertex.
* If divisor is non-zero, the attribute advances once per divisor instances of the set(s) of vertices being rendered.


### getParameter Constants

| Parameter                           | Type         | Value |
| ---                                 | ---          | ---   |
| `GL.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING` | `WebGLBuffer` (not `Buffer`) | Get currently bound buffer |
| `GL.VERTEX_ATTRIB_ARRAY_ENABLED`    | `GLboolean`  | true if the vertex attribute at this index is enabled |
| `GL.VERTEX_ATTRIB_ARRAY_SIZE`       | `GLint`      | indicating the size of an element of the vertex array. |
| `GL.VERTEX_ATTRIB_ARRAY_STRIDE`     | `GLint`      | indicating the number of bytes between successive elements in  |the array. 0 means that the elements are sequential.
| `GL.VERTEX_ATTRIB_ARRAY_TYPE`       | `GLenum`     | The array type. One of
`GL.BYTE`, `GL.UNSIGNED_BYTE`, `GL.SHORT`, `GL.UNSIGNED_SHORT`, `GL.FIXED`, `GL.FLOAT`. |
| `GL.VERTEX_ATTRIB_ARRAY_NORMALIZED` | `GLboolean`  | true if fixed-point data types are normalized for the vertex attribute array at the given index. |
| `GL.CURRENT_VERTEX_ATTRIB`          | `Float32Array(4)` | The current value of the vertex attribute at the given index. |
When using a WebGL 2 context, the following values are available additionally:
| `GL.VERTEX_ATTRIB_ARRAY_INTEGER`    | `GLboolean`  | true if an integer data type is in the vertex attribute array at the given index. |
| `GL.VERTEX_ATTRIB_ARRAY_DIVISOR`    | `GLint`      | The frequency divisor used for instanced rendering. |
