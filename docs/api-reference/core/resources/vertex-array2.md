# VertexArray

:::info
Unless you are writing framework level code, it is usually not necessary to create `VertexArray` instances in luma.gl applications. It is often simpler to just provides attributes directly to the [`Model`](/docs/api-reference/engine/model) class. Still, it can be useful to review this documentation to understand how attributes are handled by luma.gl under the hood.
:::

A `VertexArray` object lets the application map a set of GPU buffers to shader locations and the index buffer.
By providing a vertexArray to a draw call, the buffers will be made available as input data to shaders,

Using multiple `VertexArray` makes it easy for applications to reuse the same shaders.

Remarks:
- WebGPU - WebGPU does not provide a native VertexArray type resource. In WebGPU, `VertexArray` is just a convenience class that groups all attribute and index buffer bindings for a draw call.
- WebGL - 
- WebGL2 - see the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Vertex_Specification#Vertex_Array_Object).

## Usage

Import the `VertexArray` class so that your app can use it:

```typescript
import {VertexArray} from '@luma.gl/core';
```

Create a new VertexArray

```typescript
const vertexArray = device.createVertexArray();
}
```

Adding attributes to a VertexArray

```typescript
const vertexArray = device.createVertexArray();
vertexArray.setBuffer(location, buffer);
```

Deleting a VertexArray

```typescript
vertexArrayObject.destroy();
```

Setting a constant vertex attribute

```typescript
import {VertexArray} from '@luma.gl/core';
const vertexArray = device.createVertexArray();
vertexArray.setConstant(0, [0, 0, 0]);
```

To discover how many attribute locations are available on the current system

```typescript
const maxVertesAttributes = device.limits.maxVertexAttributes;
```

## Methods

`VertexArray` inherits from `Resource`.

### constructor 

```typescript
device.createVertexArray(gl : WebGLRenderingContext, props : Object)
```

Creates a new VertexArray

- `props` (Object) - passed through to `Resource` superclass constructor and to `initialize`

### VertexArray.getDefaultArray() : VertexArray

Returns the "global" `VertexArray`.

Note: The global `VertexArray` object is always available. Binds the `null` VertexArray.

### initialize(props : Object) : VertexArray

Reinitializes a `VertexArray`.

- `attributes`=`{}` (`Object`) - map of attributes, can be keyed by index or names, can be constants (small arrays), `Buffer`, arrays or typed arrays of numbers, or attribute descriptors.
- `elements`=`null` (`Buffer`) - optional buffer representing elements array (i.e. indices)
- `program` - Transfers information on vertex attribute locations and types to this vertex array.

### setConstant

Sets a constant value for a vertex attribute. When this `VertexArray` is used in a `Program.draw()` call, all Vertex Shader invocations will get the same value.

```typescript
vertexArray.setConstant(location: number, constant: NumberArray) : VertexArray
```

- `location` - index of the attribute
- `array` - the constant value

Remarks:
- WebGL APIs: [`vertexAttrib4[u]{f,i}v`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttrib)

### setBuffer(location: number, buffer : Buffer [, accessor : Object]) : VertexArray

```typescript
setBuffer(location: number, buffer : Buffer [, accessor : Object]) : VertexArray
```

Binds the specified attribute in this vertex array to the supplied buffer

- Set a location in vertex attributes array to a buffer, specifying
- its data layout and integer to float conversion and normalization flags

- `location` (_GLuint_ | _String_) - index/ordinal number of the attribute
- `buffer` (_WebGLBuffer_|_Buffer_) - WebGL buffer to set as value

Remarks:
- WebGL APIs `gl.vertexAttrib{I}Pointer`, [gl.vertexAttribDivisor](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor)

## Types, Constants, Enumarations


## Attribute Accessors

When setting `Buffer` attributes, additional data can be provided to specify how the buffer should be accessed. This data can be stored directly on the `Buffer` accessor or supplied to `.setBuffer`.

- `target`=`buffer.target` (_GLuint_, ) - which target to bind to
- `size` (_GLuint_) - number of values (components) per element (1-4)
- `type` (_GLuint_) - type of values (e.g. gl.FLOAT)
- `normalized` (_boolean_, false) - normalize integers to [-1,1] or [0,1]
- `integer` (_boolean_, false) - disable int-to-float conversion
- `stride` (_GLuint_, 0) - supports strided arrays
- `offset` (_GLuint_, 0) - supports strided arrays
- `layout.normalized`=`false` (GLbool) - normalize integers to [-1,1], [0,1]
- `layout.integer`=`false` (GLuint) -  disable int-to-float conv.

- `divisor` - Sets the frequency divisor used for instanced rendering (instances that pass between updates of attribute). Usually simply set to 1 or 0 to enable/disable instanced rendering. 0 disables instancing, >=1 enables it.

Notes:

- The application can enable normalization by setting the `normalized` flag to `true` in the `setBuffer` call.
- [`glVertexAttribIPointer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribIPointer) specifies _integer_ data formats and locations of vertex attributes. Values are always left as integer values. Only accepts the integer types gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.INT, gl.UNSIGNED_INT

Notes about Instanced Rendering

- An attribute is referred to as **instanced** if its divisor value is non-zero.
- The divisor modifies the rate at which vertex attributes advance when rendering multiple instances of primitives in a single draw call.
- If divisor is zero, the attribute at slot index advances once per vertex.
- If divisor is non-zero, the attribute advances once per divisor instances of the set(s) of vertices being rendered.
