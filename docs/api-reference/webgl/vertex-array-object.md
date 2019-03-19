# VertexArrayObject

The WebGL `VertexArrayObject` object holds a map of "buffers" that will be made available as input data to shaders during a draw call, similar to how a `TransformFeedback` object holds a set of `Buffer` instances that will receive output data from shaders.For `Buffer` objects, the `VertexArrayObject` also stores some additional information about how that data in the buffer should be accessed, such as offsets, strides, etc.

However, the use of `VertexArrayObject` is problematic in WebGL1. While it is crucial for the operation of a program, its presence under WebGL1 is dependent on an [extension](https://webglstats.com/webgl/extension/OES_vertex_array_object) that is fairly common, but not universally available. In particular it is not available in headless gl which is essential for running tests under Node.js.

Therefore, in basic WebGL environments where the `VertexArrayObject` is not supported, luma.gl ensures that one ("fake") instance of the `VertexArrayObject` class can still be obtained, emulating the default (`null` handle) `VertexArrayObject`. This instance has the `isDefaultArray` flag set, and applications can adapt their behavior accordingly, while still using the same API to manage vertex attributes, albeit with a small performance loss. Since there is a considerable amount of work required to handle both cases, luma.gl also provides a higher level `VertexArray` class that works around these issues and provided additional conveniences.

> It is usually not necessary to create neither `VertexArrayObject` nor `VertexArray` instances in luma.gl applications. It is often simpler to just provides attributes directly to the [`Model`](/docs/api-reference/core/model.md) class. Still, it can be useful to review this documentation to understand how attributes are handled by WebGL.

For more information on WebGL `VertexArrayObject`s, see the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).


## Usage

Import the `VertexArrayObject` class so that your app can use it:

```js
import {VertexArrayObject} from '@luma.gl/core';
```

Getting the global `VertexArrayObject` for a WebGL context

```js
const vertexArray = VertexArray.getDefaultArray(gl);
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
```

Deleting a VertexArray

```js
vertexArrayObject.delete();
```

Setting a constant vertex attribute

```js
import {VertexArray} from '@luma.gl/core';
const vao = new VertexArray(gl);
vao.setConstant(0, [0, 0, 0]);
```

## Methods

`VertexArrayObject` inherits from `Resource`.


### VertexArray(gl : WebGLRenderingContext, props : Object)

Creates a new VertexArray

* `props` (Object) - passed through to `Resource` superclass constructor and to `initialize`


### VertexArray.getDefaultArray() : VertexArray

Returns the "global" `VertexArrayObject`.

Note: The global `VertexArrayObject` object is always available. Binds the `null` VertexArrayObject.


### initialize(props : Object) : VertexArray

Reinitializes a `VertexArrayObject`.

* `attributes`=`{}` (`Object`) - map of attributes, can be keyed by index or names, can be constants (small arrays), `Buffer`, arrays or typed arrays of numbers, or attribute descriptors.
* `elements`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
* `program` - Transfers information on vertex attribute locations and types to this vertex array.


### setConstant(values : Array) : VertexArray

Sets a constant value for a vertex attribute. When this `VertexArrayObject` is used in a `Program.draw()` call, all Vertex Shader invocations will get the same value.

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


