# Buffer

luma.gl class managing a `WebGLBuffer` and related WebGL APIs.

From the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Buffer_Object):
Buffer Objects are OpenGL Objects that store an array of unformatted memory allocated by the GPU. These can be used to store vertex data, pixel data retrieved from images or the framebuffer, and a variety of other things.

So, a `Buffer` (`WebGLBuffer`) is essentially a mechanism for allocating memory on the GPU, together with facilities for uploading, copying and downloading chunks of contiguous memory to and from that memory chunk on the GPU. While transferring memory between CPU and GPU takes some time, once the memory is available as a buffer on the GPU it can be very efficiently used as inputs and outputs by the GPU.

Note that in WebGL, there are two types of buffers:
* "element" buffers. These can only store vertex attributes with indices (a.k.a "elements") and can only be used by binding them to the `GL.ELEMENT_ARRAY_BUFFER` before draw calls.
* "generic" buffers. These can be used interchangeably to store different types of data, including (non-index) vertex attributes.


### Usage

```
import {Buffer} from 'luma.gl';
```

Creating a buffer
```js
const buffer = new Buffer(gl);
const buffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER});
```

Allocating memory in a buffer
```js
const buffer = new Buffer(gl, {bytes: 200});
const buffer = new Buffer(gl).setData({bytes: 200});
```

Allocating and initializating a buffer
```js
const buffer = new Buffer(gl, {
  target: GL.ELEMENTS_ARRAY_BUFFER,
  data: new Uint32Array([1, 2, 3])
});
const buffer = new Buffer(gl, {size: 3, data: new Float32Array([1, 2, 3])});
const buffer = new Buffer(gl).setData({bytes: 200});
```

Updating a buffer
```
const buffer = new Buffer(gl, {bytes: 200})
buffer.subData({})
```

Copying data between buffers (WebGL2)
```
const buffer = new Buffer(gl, {bytes: 200})
buffer.subData({offset: 20, data: new Float32Array([1, 2, 3])});
```

Getting data from a buffer (WebGL2)
```
const buffer = ...;
const data = buffer.getSubData({offset: 20, size: 10});
```

Binding and unbinding a buffer
```
const buffer = ...;
buffer.bind({target: GL.ARRAY_BUFFER});
...
buffer.unbind({target: GL.ARRAY_BUFFER});
```
WebGL2 examples
```
buffer.bind({target: GL.PIXEL_PACK_BUFFER});
buffer.bind({target: GL.PIXEL_UNPACK_BUFFER});
buffer.bind({target: GL.TRANSFORM_FEEDBACK_BUFFER, index: 0});
buffer.bind({target: GL.UNIFORM_BUFFER, index: 0, offset: ..., size: ...});
buffer.unbind({target: GL.UNIFORM_BUFFER, index: 0});
```
Note: buffer binding and unbinding is handled internal by luma.gl methods so the application will typically not need to bind buffers unless integrating with external libraries or raw webgl code).

### Buffer Methods

| **Method** | **Description** |
| --- | --- |
| `constructor` | creates a Buffer|
| `delete` | Destroys buffer |
| `setData` | Allocates and optionally initializes the buffer object's data store on GPU. |
| `subData` | Updates a subset of a buffer object's data store. |
| `copySubData` (WebGL2) | Copies part of the data of another buffer into this buffer |
| `getSubData` (WebGL2) | Reads data from buffer (GPU) into an ArrayBuffer or SharedArrayBuffer. |
| `bind` | Binds a buffer to a given binding point (target) and optionally index and range.  |
| `unbind` | Unbinds a buffer from a given binding (and optionally index) |

### Remarks

### Buffer Constructor

Creates a new WebGLBuffer. Also, for all properties set to a buffer, these properties are remembered so they're optional for later calls.

Note: Specify `target: GL.ELEMENT_ARRAY_BUFFER` To create an element buffer. Otherwise it will be a generic buffer that can be used in a variety of situations.

```
const buffer = new Buffer(gl, options);
```

1. gl - WebGLContext
2. options - (*object*) An object with options/data described below:

* `target` - (*enum*, optional) The type of the buffer. Specify `GL.ELEMENT_ARRAY_BUFFER` To create an element buffer. Default is `GL.ARRAY_BUFFER` which indicates a generic buffer
* `size` - (*numer*, optional) The size of the components in the buffer. Default is 1.
* `type` - (*enum*, optional) The type of the data being stored in the buffer. Default's `gl.FLOAT`.
* `stride` - (*number*, optional) The `stride` parameter when calling `gl.vertexAttribPointer`. Default 0.
* `offset` - (*number*, optional) The `offset` parameter when calling `gl.vertexAttribPointer`. Default 0.
* `usage` - (*enum*, optional) The access pattern used when setting the `gl.bufferData`. Default's `gl.STATIC_DRAW`.


### Buffer.setDataLayout

Stores the layout of data with the buffer which makes it easy to e.g. set it as an attribute later.

Params:
* `layout`
* `type`
* `size` = 1
* `offset` = 0
* `stride` = 0
* `normalized` = false
* `integer` = false
* `instanced` = 0


### Buffer.setData

Allocates and optionally initializes buffer memory/data store (releasing any previously allocated memory).

Also extracts characteristics of stored data, hints for vertex attribute.

`Buffer.setData({data, bytes, usage=, dataType=, size=})`

* `data` (ArrayBufferView) - contents
* `bytes` (GLsizeiptr) - the size of the buffer object's data store.
* `usage`=`GL.STATIC_DRAW` (GLenum) - Allocation hint for GPU driver.
* `dataType`=`GL.FLOAT` (GLenum) - type of data stored in buffer
* `size`=`1` (GLuint) - number of values per vertex

Returns {Buffer} Returns itself for chaining.

### subData

Updates part of a buffer's allocated memory.

`Buffer.subData({data, offset=, srcOffset=, length})`

Params
* `data` (`ArrayBufferView`) - length is inferred unless provided
* `offset`=`0` - Offset into buffer
* `srcOffset`=`0` -  WebGL2: Offset into srcData
* `length` - WebGL2: Number of bytes to be copied

Returns
* Buffer - Returns itself for chaining.


### copySubData (WEBGL2)

Copies part of the data of another buffer into this buffer

`Buffer.copySubData({sourceBuffer, readOffset=, writeOffset=, size})`

Params:
* `sourceBuffer`
* `readOffset`=`0` (GLint) - byte offset from which to start reading from the buffer.
* `writeOffset`=`0` (GLint) - byte offset from which to start writing to the buffer.
* `size` (GLsizei) - bytes specifying the size of the data to be copied

Remarks:
* `readOffset`, `writeOffset` and `size` must all be greater than or equal to zero.
* `readOffset + sizereadOffset + size` must not exceeed the size of the source buffer object
* `writeOffset + sizewriteOffset + size` must not exceeed the size of the buffer bound to writeTarget.
* If the source and destination are the same buffer object, then the source and destination ranges must not overlap.


### getSubData (WEBGL2)

Reads data from buffer into an `ArrayBuffer` or `SharedArrayBuffer`.

`Buffer.getSubData({dstData, srcByteOffset, srcOffset, length})`

* `srcByteOffset`=`0` (GLintptr) - byte offset from which to start reading from the buffer.
* `dstData`=`null` (`ArrayBufferView` | `ArrayBuffer` | `SharedArrayBuffer`)  - memory to which to write the buffer data.
* `srcOffset`=`0` (GLuint) - element index offset where to start reading the buffer.
* `length`=`0` (GLuint)  Optional, defaulting to 0.

Returns a buffer (provided or allocated)


### Remarks

* All instance methods in a buffer (unless they return some documented value) are chainable.
* The cost of tranferring memory back and forth between the GPU and CPU will vary between systems (e.g. depending on whether the system uses a unified memory architecture or not).
* For more on the `GL.ELEMENT_ARRAY_BUFFER` restrictions in WebGL, see [WebGL1](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences) and [WebGL2](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences).
