# VertexArrayObject

A `VertexArrayObject` stores a set of `Buffer` bindings representing the input data to GLSL shaders, in much the same way that a `TransformFeedback` object stores a set of `Buffer` bindings for output data from shaders.

For more information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).

Version Notes:
* Instancing requires a WebGL extension or WebGL2.


## Functions

| **Function** | **WebGL Counterpart** | **Description** |
| --- | --- | --- |
| [`setBuffer`](#setBuffer) | `vertexAttrib{I}Pointer` | Set to ['WebGLBuffer'](buffer.html) |
| [`setGeneric`](#setGeneric) | `vertexAttrib4[u]{f,i}v` | Set value to a constant |
| `enable` | `enableVertexAttribArray` | attribute visible to shader |
| `disable` | `disableVertexAttribArray` | not visible to shader |
| `setDivisor` <sub>**WebGL2/ext**</sub> | `vertexAttribDivisor` | (un)marks as instanced |
| `getMaxAttributes` | `MAX_VERTEX_ATTRIBS` | Length of array (>=8) |


## Usage

Getting the global `VertexArrayObject` for a WebGL context
```js
const vertexArray = VertexArrayObject.global(gl);
```

Creating a VertexArrayObject
```js
import {VertexArrayObject} from 'luma.gl';
if (VertexArrayObject.isSupported(gl)) {
  return new VertexArrayObject(gl)
}
```

Adding attributes to a VertexArrayObject
```js
const vertexArrayObject = new VertexArrayObject(gl);
vertexArrayObject.bind();
vertexArrayObject.unbind();
```

Deleting a VertexArrayObject
```js
vertexArrayObject.delete();
```

Setting a set of attributes and an elements array
```js
const vertexArray = new VertexArrayObject(gl, {
  elements: new Buffer({target: GL.ELEMENT_ARRAY_BUFFER, data: new Uint32Array([...])}),
  attributes: {
  	0: 
  }
}

Setting a buffer name map
```js
const vertexArray = new VertexArrayObject(gl);
// Can only set buffers using location indices
vertexArray.setAttributes({
  0: new Buffer({size: 3, data: new Float32Array([...]), ...})
})
// Register a location map
const program = new Program();
const locations = program.getLocations(); // Note: slow call, GPU driver roundtrip
vertexArray.update({locations});
// Now possible to set buffers using attribute names
vertexArray.setAttributes({
  aColor: new Buffer({size: 3, data: new Float32Array([...]), ...})
});
```


Setting a generic vertex attribute
```js
import {VertexAttributes} from 'luma.gl';
VertexAttributes.setGeneric(gl, 0, ...);
```

## Methods

`VertexArrayObject` inherits from `Resource`.

### global (static method)

Returns the "global" `VertexArrayObject` which is always supported.


### isSupported (static method)

`VertexArrayObject.isSupported({vertexArrayObjects: true, instanceDivisors: true});`

Parameters:
* gl (WebGLRenderingContext) - gl context
* `vertexArrayObjects`=`true` - if set, returns true only if `VertexArrayObject`s are supported.
* `instanceDivisors`=`true` - if set, returns true only if instance divisors are supported.

Returns:
* Boolean - true if `VertexArrayObject`s and/or instanced rendering are supported in the current environment.

Note that while `VertexArrayObject`s and instance divisors are technically not available in basic WebGL1 environments, they available by default in WebGL2 and via commonly supported extensions under WebGL1.
* [instanced_arrays](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays)
* [vertex_array_objects](https://webglstats.com/webgl/extension/OES_vertex_array_object)


### constructor

Creates a new VertexArrayObject

Parameters:
* `gl` (WebGLRenderingContext) - gl context
* `opts` (Object) - passed through to `Resource` constructor and to `initialize`


### initialize

Parameters:
* `elements`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
* `buffers`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
* `location`={} (Object) - optional map of (attribute) names to location indices.


### setLocations



### enable

  // Enable the attribute
   * Note: By default all attributes are disabled. Only attributes
   * used by a program's shaders should be enabled.


### disable

   // Disable the attribute
   * Note: Only attributes used by a program's shaders should be enabled.
   * @param {GLuint} location - ordinal number of the attribute

* Attribute 0 can sometimes be treated specially by the driver, so to be safe this method avoids disabling it.

[gl.enable]


### setBuffer

Assigns a buffer a vertex attribute. Vertex Shader will be invoked once (not considering indexing and instancing) with each value in the buffer's array.

      // specifies *integer* data formats and locations of vertex attributes
      // For glVertexAttribIPointer, Values are always left as integer values.
      // Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE,
      // gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT

  /**
   * Set a location in vertex attributes array to a buffer, specifying
   * its data layout and integer to float conversion and normalization flags
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {WebGLBuffer|Buffer} buffer - WebGL buffer to set as value
   * @param {GLuint} target=gl.ARRAY_BUFFER - which target to bind to
   * @param {Object} layout= Optional data layout, defaults to buffer's layout
   * @param {GLuint} layout.size - number of values per element (1-4)
   * @param {GLuint} layout.type - type of values (e.g. gl.FLOAT)
   * @param {GLbool} layout.normalized=false - normalize integers to [-1,1], [0,1]
   * @param {GLuint} layout.integer=false - WebGL2 only, disable int-to-float conv
   * @param {GLuint} layout.stride=0 - supports strided arrays
   * @param {GLuint} layout.offset=0 - supports strided arrays
   */

setBuffer({location, buffer, ...});

1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute
3. **buffer** (*WebGLBuffer*|*Buffer*)
4. **target** (*GLuint*, gl.ARRAY_BUFFER) - which target to bind to
4. **size** (*GLuint*)  - number of values per element (1-4)
4. **type** (*GLuint*)  - type of values (e.g. gl.FLOAT)
4. **normalized** (*boolean*, false) - normalize integers to [-1,1] or [0,1]
4. **integer** (*boolean*, false) - **WebGL2 only** disable int-to-float conversion
4. **stride** (*GLuint*, 0) - supports strided arrays
4. **offset** (*GLuint*, 0) - supports strided arrays

* The application can enable normalization by setting the `normalized` flag to `true` in the `setBuffer` call.
* **WebGL2** The application can disable integer to float conversion when running under WebGL2, by setting the `integer` flag to `true`.

[vertexAttrib{I}Pointer]()


### setGeneric

Sets a constant (i.e. generic) value for a vertex attribute. All Vertex
Shader invocations will get the same value.

  /*
   * Specify values for generic vertex attributes
   * Generic vertex attributes are constant for all vertices
   * Up to 4 values depending on attribute size
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} divisor - instances that pass between updates of attribute
   */

`VertexAttributes.setGeneric({gl, location, array});`

Arguments
1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute

[vertexAttrib4[u]{f,i}v]()


### setGenericValues

  /*
   * Specify values for generic vertex attributes
   * Generic vertex attributes are constant for all vertices
   * Up to 4 values depending on attribute size
   *
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} divisor - instances that pass between updates of attribute
   */
  /* eslint-disable max-params */


### setDivisor

Sets the instance divisor. 0 disables instancing, >=1 enables it.

See description of instancing in the overview above.

  /**
   * Set the frequency divisor used for instanced rendering.
   * Note: Usually simply set to 1 or 0 to enable/disable instanced rendering
   * for a specific attribute.
   * @param {GLuint} location - ordinal number of the attribute
   * @param {GLuint} divisor - instances that pass between updates of attribute
   */

`VertexAttributes.setDivistor({gl, location, array});`

1. **gl** (*WebGLRenderingContext) - gl context
2. **location** (*GLuint*) - index of the attribute


* An attribute is referred to as **instanced** if its divisor value is non-zero.
* The divisor modifies the rate at which generic vertex attributes advance when rendering multiple instances of primitives in a single draw call.
* If divisor is zero, the attribute at slot index advances once per vertex.
* If divisor is non-zero, the attribute advances once per divisor instances of the set(s) of vertices being rendered.

* This method will look use WebGL2 or the `array_instanced_ANGLE` extension, if available. To avoid exceptions on unsupported platforms. the app can call `VertexAttributeObject.isSupported()` to determine whether instancing is supported before invoking `VertexAttributes.setDivisor`.

[vertexAttribDivisor]()




### getParameter

* **gl** (*WebGLRenderingContext*) - WebGL context
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

| `hasDivisor` | `ANGLE_instanced_arrays` | Instancing supported? |
| `isEnabled` | `..._ARRAY_ENABLED` | Is attribute enabled? |
| `getBuffer` | `..._ARRAY_BUFFER_BINDING` | Get buffer value |
| `getGeneric` | `..._CURRENT_VERTEX_ATTRIB` | Get generic value |
| `getSize` | `..._ARRAY_SIZE` | Elements/vertex (1-4) |
| `getType` | `..._ARRAY_TYPE` | element type (GLenum)|
| `isNormalized` | `..._ARRAY_NORMALIZED` | are integers normalized? |
| `isInteger` <sub>**WebGL2**</sub> | `..._ARRAY_INTEGER` | integer-to-float disabled? |
| `getStride` | `..._ARRAY_STRIDE` | bytes between elements |
| `getOffset` | `getVertexAttribOffset` | index of first element |


## Technical Notes

This module offers set of functions for manipulating WebGL's global "vertex attributes array". Essentially, this module collects all WebGL `gl.vertexAttrib*` methods and `gl.VERTEX_ATTRIB_ARRAY_*` queries.

It is usually not necessary to manipulate the vertex attributes array directly in luma.gl applications. It is often simpler to just supply named attribute buffers to the [`Model`](model.html) class, and rely on that class to automatically manage the vertex attributes array before running a program (e.g. when rendering, picking etc).

In WebGL, **vertex attributes** (often just called **attributes**) are input data to the Vertex Shader, the first shader stage in the GPU rendering pipeline.

These vertex attributes are stored in a conceptual global array with indices from 0 and up. At the start of shader execution, these indices (or 'locations') are matched to small integer indices assigned to shader attributes during shader compilation and program linking. This makes the data the application has set up in the vertex attributes available during shader execution. Vertex attributes thus represent one of the primary mechanisms for communication between JavaScript code and GPU code (GLSL shaders).


### Vertex Attribute Values and Properties

Each vertex attribute has these properties:

- A value (constant or a buffered array with one set of values per vertex) that is accessible in shaders
- Enabled status: Can be enabled or disabled
- Data layout information: size (1-4 values per vertex), type, offset, stride
- An instance `divisor` (which enables/disables instancing) **WebGL2/Extension**
- An integer normalization policy (see below)
- An integer conversion policy (see below) **WebGL2**

Normally attributes are set to a [`WebGLBuffer`](buffer.html) that stores unique values for each vertex/instance, combined with information about the layout of data in the memory managed by the buffer.

Attributes can also be set to "generic" values. This single value will then be passed to every invocation of the vertex shader effectively representing a constant attribute value. A typical example could be to specify a single color for all vertices, instead of providing a buffer with unique colors per vertex.


### Integer to Float Conversion and Normalization

Integer values in attributes (e.g in an `Int32Array`) are converted to floats before being passed to the shader.

In addition, normalization, maps values stored in an integer format to a normalized floating point range before they are passed to the shader:

* `[-1,1]` (SNORM, for signed integers)
* `[0,1]` (UNORM, for unsigned integers)

In WebGL2, it is possible to disable automatic conversion of integers to integers, enabling shaders to work directly with integer values. This works with all the integer types: `gl.BYTE`, `gl.UNSIGNED_BYTE`,
`gl.SHORT`, `gl.UNSIGNED_SHORT`, `gl.INT` and `gl.UNSIGNED_INT`.


## Remarks

Note that while you can create your own `VertexArrayObjects` there is a global "vertex attributes array" that is always available (even in core WebGL1)
which is where vertex data is staged for vertex shader execution. This API is somewhat hard to learn for OpenGL newcomers so luma.gl provides this thin wrapper module to simplify its use.

* All methods in this class take a `location` index to specify which vertex attribute in the array they are operating on. This location needs to be matched with the location (i.e. index) selected by the compiler when compiling a Shader. Therefore it is usually better to work with symbolic names for vertex attributes, which is supported by other luma.gl classes.
* It is strongly recommended to only enable attributes that are actually used by a program. Other attributes can be left unchanged but disabled.

* The raw WebGL APIs for are working with `WebGLVertexArrayObject`s are exposed differently in the WebGL1 extension and WebGL2. As always, the luma.gl `VertexArrayObject` class transparently handles the necessary API detection and selection.

**`ANGLE_instanced_arrays` Extension** Allows instance divisors to be set, enabling instanced rendering.
* **`OES_VertexArrayObject` Extension** Enables the application to create and "VertexArrayObject"s to save and restore the entire global vertex attribute array with a single operation. luma.gl provides a class wrapper for `VertexArrayObjects`.

* Setting instance divisors no longer requires a WebGL extension.
* `VertexArrayObjects` no longer require using a WebGL extension.
* Adds support for exposing integer attribute values directly to shaders
  (without those values first being auto-converted to floats).
  The improvements cover both generic and buffered attributes.
