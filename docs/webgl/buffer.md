# Buffer

luma.gl class managing a `WebGLBuffer` and related WebGL APIs.

From the [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Buffer_Object):
Buffer Objects are OpenGL Objects that store an array of unformatted memory allocated by the OpenGL context (aka: the GPU). These can be used to store vertex data, pixel data retrieved from images or the framebuffer, and a variety of other things.

So, a `Buffer` (`WebGLBuffer`) is essentially a mechanism for allocating memory on the GPU, together with facilities for uploading, copying and downloading chunks of contiguous memory to and from that memory chunk on the GPU. While transferring memory between CPU and GPU takes some time, once the memory is available as a buffer on the GPU it can be very efficiently used as inputs and outputs by the GPU.

Note that in WebGL, there are two types of buffers:
* "element" buffers. These can only store vertex attributes with indices (a.k.a elements) and can only be used by binding them to the `GL.ELEMENT_ARRAY_BUFFER` before draw calls.
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
|====|====|
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

* opt.data (ArrayBufferView) - contents
* opt.bytes (GLsizeiptr) - the size of the buffer object's data store.
* opt.usage (GLenum)=gl.STATIC_DRAW - Allocation hint for GPU driver Characteristics of stored data, hints for vertex attribute
* opt.dataType (GLenum)=gl.FLOAT - type of data stored in buffer
* opt.size (GLuint)=1 - number of values per vertex

Returns {Buffer} Returns itself for chaining.


### Buffer.subData

Updates part of a buffer's allocated memory.

Params
* {ArrayBufferView} opt.data - contents
* `data`      // Data (Typed Array or ArrayBuffer), length is inferred unless provided
* `offset`    // Offset into buffer
* `srcOffset` // WebGL2: Offset into srcData
* `length`    // WebGL2: Number of bytes to be copied

Returns
* Buffer - Returns itself for chaining.


### Buffer.copySubData (WEBGL2)

Copies part of the data of another buffer into this buffer

Params:
* `sourceBuffer`
* `readOffset` {GLintptr} - byte offset from which to start reading from the buffer.
* `writeOffset` {GLintptr} - byte offset from which to start writing to the buffer.
* `size` {GLsizei} - bytes specifying the size of the data to be copied

Remarks:
* `readOffset`, `writeOffset` and `size` must all be greater than or equal to zero.
* `readOffset+sizereadOffset+size` must not exceeed the size of the source buffer object
* `writeOffset+sizewriteOffset+size` must not exceeed the size of the buffer bound to writeTarget.
* If the source and destination are the same buffer object, then the source and destination
ranges must not overlap.


### Buffer.getSubData (WEBGL2)

Reads data from buffer into an ArrayBuffer or SharedArrayBuffer.

Params
* {GLintptr} srcByteOffset - byte offset from which to start reading from the buffer.
* {ArrayBufferView | ArrayBuffer | SharedArrayBuffer} dstData -
   memory to which to write the buffer data.
* {GLuint} srcOffset=0 - element index offset where to start reading the buffer.
* {GLuint} length=0  Optional, defaulting to 0.

Returns a buffer (provided or allocated)


### Remarks

* All instance methods in a buffer (unless they return some documented value) are chainable.
* The cost of tranferring memory back and forth between the GPU and CPU will vary between systems (e.g. depending on whether the system uses a unified memory architecture or not).
* For more on the `GL.ELEMENT_ARRAY_BUFFER` restrictions in WebGL, see [WebGL1](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences) and [WebGL2](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences).


### WebGL Notes (Advanced)

#### About Buffer Binding Points

This section can be skipped as the luma.gl API will handle binding (and unbinding) of buffers to the appropriate "targets". Still it can be good to have some understanding of buffer binding points as these feature prominently in the WebGL API.

Rather than taking buffers as arguments, WebGL functions that operate on buffers expect any necessary buffers to have been bound to various specific "binding points" or "targets" before the function is called.

In WebGL1 there are only two binding points:

* `GL.ELEMENT_ARRAY_BUFFER` - used by `drawElements` (and `drawElementsInstanced`)
* `GL.ARRAY_BUFFER` - used by `vertexAttribPointer` (and `vertexAttribIPointer`)

However, WebGL2 allows buffers to be used in a number of additional contexts:

* `GL.PIXEL_PACK_BUFFER` - used by `readPixels`
* `GL.PIXEL_UNPACK_BUFFER` - used by `texImage2D`, `texSubImage2D`, `texImage3D`, `texSubImage3D`
* `GL.TRANSFORM_FEEDBACK_BUFFER` - `beginTransformFeedback`
* `GL.UNIFORM_BUFFER` - `drawArrays` and `drawArraysInstanced`, `drawElements` and `drawElementsInstanced` (requires `uniformBlockBinding` to have been called).

In addition, some WebGL2 functions (such as `copyBufferSubData`, `getBufferSubData`) allow the app to specify which buffer binding point to use. For these applications WebGL2 also provides two extra, "virtual" binding points (in the sense that no WebGL function unconditionally uses them).

* `GL.COPY_READ_BUFFER`: Buffer for copying from one buffer object to another.
* `GL.COPY_WRITE_BUFFER`: Buffer for copying from one buffer object to another.

A primary reason to use these targets is to avoid overwriting other binding points (which can be important when integrating with external WebGL code), so luma.gl will use these bindings when possible (but only for methods that are WebGL2 specific).

Also note that `GL.TRANSFORM_FEEDBACK_BUFFER` and `GL.UNIFORM_BUFFER` bindings are special in that they have multiple binding points and they need to be bound to a certain "index" to affect WebGL state (using `bindBufferBase` or `bindBufferRange`)
