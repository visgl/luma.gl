# VertexArray

The `VertexArray` class (like its lower level counterpart, the `VertexArrayObject`) manages an "array" of values ("buffers") that will be made available as input data to shaders during a draw call. For each WebGL `Buffer`, the `VertexArray` also stores some additional information about how that data in the buffer should be accessed, such as offsets, strides, etc, and whether the attribute is instanced.

The `VertexArray` class provides the following features on top of the lower level `VertexArrayObject` class:

* Reads a "program configuration", enabling attributes to be set using names instead of locations
* Avoids duplicating information already specified in shaders, such as size and type of attributes.
* Automatic deduction of draw parameters from currently set attributes
* Handles the "constant attribute 0" complication that is common on desktop WebGL browsers.
* Can generated debug output of attribute bank

* Can fall back to sharing single `VertexArrayObject` across all `VertexArray` objects.

> The `VertexArray` is a wrapper class around the `VertexArrayObject` class which encapsulates the underlying WebGL object. The `VertexArrayObject` class has a number of complications that the `VertexArray` takes care of.

> It is usually not necessary to create `VertexArray` instances in luma.gl applications. The application can just supply a map of `attributes` to the [`Model`](/docs/api-reference/core/model.md) class, and rely on that class to automatically manage the vertex attributes array and supply it to any draw calls (e.g. when rendering, picking etc). Still, it can be useful to review this documentation to better understand how attributes are handled.

For more information on the WebGL `VertexArrayObject`, see the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).


## Usage

Import the `VertexArray` class so that your app can use it:

```js
import {VertexArray} from '@luma.gl/core';
```

Create a new VertexArray

```js
const vao = new VertexArray(gl);
}
```

Deleting a VertexArray

```js
vertexArrayObject.delete();
```

Adding attributes to a VertexArray: without program metadata, buffers must be specified using location indices

```
const vertexArray2 = new VertexArray(gl);
vertexArray2.setBuffers({
  0: new Buffer({data: new Float32Array([...]), ...})
});
```

Adding attributes to a VertexArray: adding a program configuration enables setting attributes by name

```js
// Register attribute info extracted from program shaders
const program = new Program(gl, ...);
const vertexArray = new VertexArray(gl, {program});

// Now it is possible to set buffers using attribute names
vertexArray.setAttributes({
  aColor: new Buffer(gl, new Uint8Array([...]))
});

Setting a set of attributes and an elements array

```js
const vertexArray = new VertexArray(gl, {
  attributes: {
    elements: new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER, data: new Uint32Array([...])}),
  	positions: new Buffer(gl, {data: new Float32Array([...])})
  }
}

Setting a constant vertex attribute

```js
import {VertexArray} from '@luma.gl/core';
const vao = new VertexArray(gl);
vao.setConstant(0, [0, 0, 0]);
```

## Constructor

### VertexArray(gl : WebGLRenderingContext, props : Object)

Creates a new VertexArray

* `props` (Object) - passed through to `Resource` superclass constructor and to `initialize` it.


## Methods

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

* `nameOrLocation` - (*string|number*) The name of the attribute as declared in the shader, or the location specified by a layout qualifier in the shader. The name can contain an offset to the actual location in the format of `name__LOCATION_0`. This is useful for setting *mat* type attributes. See the section at the bottom for more details.
* `value` - (*Buffer|Array|typed array*) An attribute value must be a `Buffer` or a typed array.

Each value can be an a `Buffer`, an `Array` starting with a `Buffer` or a typed array.

* Typed Array - Sets a constant value as if `.setConstant(value)`  was called.
* `Buffer` - Binds the atttribute to a buffer, using buffer's accessor data as if `.setBuffer(value)` was called.
* `Array` - Binds the atttribute to a buffer, with extra accessor data overrides. Expects a two element array with `[buffer : Buffer, accessor : Object]`. Binds the attribute to the buffer as if ` .setBuffer(buffer, accessor)` was called.


### setConstant(value : Array  [, accessor : Object]) : VertexArray

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


### setElementBuffer(buffer : Buffer [, accessor : Object]) : VertexArray

Binds the supplied buffer as index buffer (`GL.ELEMENT_ARRAY_BUFFER`).


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


## Notes about Integer Attributes

* The application can enable normalization by setting the `normalized` flag to `true` in the `setBuffer` call.
* **WebGL2** The application can disable integer to float conversion when running under WebGL2, by setting the `integer` flag to `true`.
* [`glVertexAttribIPointer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer) specifies *integer* data formats and locations of vertex attributes. Values are always left as integer values. Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT


## Notes about Instanced Rendering

* About setting `divisor` in attributes: Instanced attributes requires WebGL2 or a (widely supported) WebGL1 extension. Apps can use the luma.gl feature detection system to determine if instanced rendering is available, though the extension is so ubiquitously supported that many apps just make the assumption: [instanced_arrays](https://webglstats.com/webgl/extension/ANGLE_instanced_arrays).
* An attribute is referred to as **instanced** if its divisor value is non-zero.
* The divisor modifies the rate at which vertex attributes advance when rendering multiple instances of primitives in a single draw call.
* If divisor is zero, the attribute at slot index advances once per vertex.
* If divisor is non-zero, the attribute advances once per divisor instances of the set(s) of vertices being rendered.

## Notes about setting *mat* type attributes

* Setting a **mat** type in the shader requires to manually add an *offset* to the location.
* This can be done by using special name format `name__LOCATION_0`. This will add 0 to the *LOCATION* resulting in no change. `name__LOCATION_1` will add **1**.
* For example:
  * if we have the following declaration in the shader:
```
attribute mat4 matrix;
```
  * We should specify `matrix__LOCATION_0`, `matrix__LOCATION_1`, `matrix__LOCATION_2` **and** `matrix__LOCATION_3` as *vec4*.
