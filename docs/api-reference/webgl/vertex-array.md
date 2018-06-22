# VertexArray

A `VertexArray` (WebGL `VertexArrayObject`) stores a set of `Buffer` bindings representing the input data to GLSL shaders together with additional information about how that data should be accessed (in much the same way that a `TransformFeedback` object stores a set of `Buffer` bindings for output data from shaders).

Note that it is usually not necessary to manipulate `VertexArray`s directly in luma.gl applications. It is often simpler to just supply named attribute buffers to the [`Model`](/docs/api-reference/core/model.md) class, and rely on that class to automatically manage the vertex attributes array before running a program (e.g. when rendering, picking etc).

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object) as well as the remarks at the end.

Notes:

* A default `VertexArray` is always available, even in basic WebGL1 environments.
* Creating additional non-default `VertexArray`s requires either WebGL2 or luma.gl's webgl1 support.
* Instanced attributes requires WebGL2 or a (widely supported) WebGL1 extension. Apps can use the luma.gl feature detection system to determine if instanced rendering is available, though many apps just make the assumption.

Note that while `VertexArray`s and instance divisors are technically not available in basic WebGL1 environments, they available by default in WebGL2 and via commonly supported extensions under WebGL1.

* [instanced_arrays](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays)
* [vertex_array_objects](https://webglstats.com/webgl/extension/OES_vertex_array_object)


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


### getDefaultArray (static method)

Returns the "global" `VertexArray`.

Note: The global `VertexArray` object is always available. Binds the `null` VertexArrayObject.


### constructor

Creates a new VertexArray

Parameters:

* `gl` (WebGLRenderingContext) - gl context
* `opts` (Object) - passed through to `Resource` constructor and to `initialize`


### initialize(props) : VertexArray

Parameters:

* `attributes`=`{}` (`Object`) - map of attributes, can be keyed by index or names, can be constants (small arrays), `Buffer`, arrays or typed arrays of numbers, or attribute descriptors.
* `elements`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
* `program` - Transfers information on vertex attribute locations and types to this vertex array.

Deprecated Parameters:

* `buffers`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)


### setBuffers

Sets named uniforms from a map, ignoring names.

```js
program.setBuffers(object);
```

* object - (*object*) An object with key value pairs matching a buffer name and its value respectively.
* name - (*string*) The name (unique id) of the buffer. If no `attribute` value is set in `options` then the buffer name will be used as attribute name.
* options - (*object*) An object with options/data described below:


### setBuffer(buffer : Buffer) : VertexArray

Assigns a buffer a vertex attribute. Vertex Shader will be invoked once (not considering indexing and instancing) with each value in the buffer's array.

* Set a location in vertex attributes array to a buffer, specifying
* its data layout and integer to float conversion and normalization flags

`setBuffer(location, buffer);`
`setBuffer(location, buffer, {offset = 0, stride = 0, normalized = false, integer = false});`

* `location` (*GLuint* | *String*) - index/ordinal number of the attribute
* `buffer` (*WebGLBuffer*|*Buffer*) - WebGL buffer to set as value
* `target`=`buffer.target` (*GLuint*, ) - which target to bind to
* `size` (*GLuint*)  - number of values (components) per element (1-4)
* `type` (*GLuint*)  - type of values (e.g. gl.FLOAT)
* `normalized` (*boolean*, false) - normalize integers to [-1,1] or [0,1]
* `integer` (*boolean*, false) - `WebGL2` disable int-to-float conversion
* `stride` (*GLuint*, 0) - supports strided arrays
* `offset` (*GLuint*, 0) - supports strided arrays
* `layout.normalized`=`false` (GLbool) - normalize integers to [-1,1], [0,1]
* `layout.integer`=`false` (GLuint) - WebGL2 only, disable int-to-float conv.


Notes:

* The application can enable normalization by setting the `normalized` flag to `true` in the `setBuffer` call.
* **WebGL2** The application can disable integer to float conversion when running under WebGL2, by setting the `integer` flag to `true`.
* [`glVertexAttribIPointer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer) specifies *integer* data formats and locations of vertex attributes. Values are always left as integer values. Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT

[gl.vertexAttrib{I}Pointer]()


### setConstant(values : Array) : VertexArray

Sets a constant value for a vertex attribute. All Vertex Shader invocations will get the same value.

`VertexArray.setConstant(location, array);`

* `gl` (`WebGLRenderingContext`) - gl context
* `location` (*GLuint*) - index of the attribute

WebGL APIs:
[vertexAttrib4[u]{f,i}v](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib)



### getParameter(location) : *

* **location** (*Number*) - index of attributes

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



## About Attribute Access

* Only attributes used by a program's shaders should be enabled.
* Attribute 0 can sometimes be treated specially by the driver, so to be safe this method avoids disabling it.

### Instanced

Sets the Set the frequency divisor used for instanced rendering. Usually simply set to 1 or 0 to enable/disable instanced rendering. 0 disables instancing, >=1 enables it.

* @param {GLuint} divisor - instances that pass between updates of attribute


Notes:
* An attribute is referred to as **instanced** if its divisor value is non-zero.
* The divisor modifies the rate at which vertex attributes advance when rendering multiple instances of primitives in a single draw call.
* If divisor is zero, the attribute at slot index advances once per vertex.
* If divisor is non-zero, the attribute advances once per divisor instances of the set(s) of vertices being rendered.

* This method will look use WebGL2 or the `array_instanced_ANGLE` extension, if available. To avoid exceptions on unsupported platforms. the app can call `VertexAttributeObject.isSupported()` to determine whether instancing is supported before invoking `VertexArray.setDivisor`.

WebGL APIs:
[gl.vertexAttribDivisor](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor)


## Remarks

