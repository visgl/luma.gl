# Buffer

A `Buffer` is a WebGL object that stores an chunk of memory allocated by the GPU. This memory can be accessed directly by the GPU and is used to store things like vertex data, pixel data retrieved from images or the framebuffer, etc. The `Buffer` class provides mechanism for allocating such memory, together with facilities for copying data to and from the GPU (usually via JavaScript typed arrays).

For additional information, see [OpenGL Wiki](https://www.khronos.org/opengl/wiki/Buffer_Object).


## Usage

```js
import {Buffer} from 'luma.gl';
```

Creating a generic buffer
```js
const buffer = new Buffer(gl);
```

Creating an elements buffer
```js
const buffer = new Buffer(gl, {target: GL.ELEMENT_ARRAY_BUFFER});
```

Allocating memory in a buffer
```js
const buffer = new Buffer(gl, {bytes: 200});
const buffer = new Buffer(gl).initialize({bytes: 200});
```

Allocating and initializating a buffer
```js
const buffer = new Buffer(gl, {
  target: GL.ELEMENTS_ARRAY_BUFFER,
  data: new Uint32Array([1, 2, 3])
});
const buffer = new Buffer(gl, {size: 3, data: new Float32Array([1, 2, 3])});
const buffer = new Buffer(gl).initialize({bytes: 200});
```

Updating a buffer
```js
const buffer = new Buffer(gl, {bytes: 200})
buffer.subData({})
```

Copying data between buffers (WebGL2)
```js
const sourceBuffer = ...
const destinationBuffer = ...

// To copy 32 bytes from sourceBuffer to destinationBuffer
destinationBuffer.copyData({sourceBuffer, size: 32});

// To copy 32 bytes from sourceBuffer at 8 byte offset into
// destinationBuffer at 16 byte offset.
destinationBuffer.copyData({sourceBuffer,
  readOffset: 8,
  writeOffset: 16,
  size: 32});
```

Getting data from a buffer (WebGL2)
```js
const buffer = ...;

// To get all the data from buffer
const data = buffer.getData();

// To get all the data from buffer starting from byteOffset 8
// into existing ArrayBufferView.
const existingArray = ...
const data = buffer.getData({dstData: existingArray, srcByteOffset: 8});
// Maximum possible elements will be copied based buffer and dstData size.

// To get 5 elements from source buffer starting from byteOffset 8
// into existing ArrayBufferView starting from 3rd element position.
const existingArray = ...
const data = buffer.getData({dstData: existingArray, srcByteOffset: 8, dstOffset: 3, length: 5});

```

Binding and unbinding a buffer
```js
const buffer = ...;
buffer.bind({target: GL.ARRAY_BUFFER});
...
buffer.unbind({target: GL.ARRAY_BUFFER});
```
WebGL2 examples
```js
buffer.bind({target: GL.PIXEL_PACK_BUFFER});
buffer.bind({target: GL.PIXEL_UNPACK_BUFFER});
buffer.bind({target: GL.TRANSFORM_FEEDBACK_BUFFER, index: 0});
buffer.bind({target: GL.UNIFORM_BUFFER, index: 0, offset: ..., size: ...});
buffer.unbind({target: GL.UNIFORM_BUFFER, index: 0});
```
Note: buffer binding and unbinding is handled internal by luma.gl methods so the application  typically **DONOT** need to bind buffers unless integrating with external libraries or raw webgl code.


## Members

* `handle` - holds the underlying `WebGLBuffer`


## Constructor

### Buffer(gl : WebGLRenderingContext, props : Object)

Creates a new `Buffer`, which will either be a an "element" buffer used for storing vertex indices, or a generic buffer. To create an element buffer, specify `target: GL.ELEMENT_ARRAY_BUFFER`. If target is not specified, it will be a generic buffer that can be used in a variety of situations.

```js
const buffer = new Buffer(gl, {target, ...initOptions, ...layoutOptions});
```

* `gl` (`WebGLRenderingContext`) - gl context
* `target`=`GL.ARRAY_BUFFER`|`GL.COPY_READ_BUFFER` (*GLenum*, optional) - the type of the buffer, see notes.
* `...initOptions` (*Object*) - options passed on to `initialize`.
* `...layoutOptions` - options passed on to `setLayout`

Note:
* In WebGL1, the default is `GL.ARRAY_BUFFER` which will work as a generic buffer.
* In WebGL2, the default is `GL.COPY_READ_BUFFER` which means the buffer can work either as a generic buffer and an element buffer. This will be determined when it is first used (bound). From that point on, WebGL will consider it either as an element buffer or a generic buffer.

## Methods

### initialize(props : Object) : Buffer

Allocates and optionally initializes buffer memory/data store (releasing any previously allocated memory).

Also extracts characteristics of stored data, hints for vertex attribute.

```js
Buffer.initialize({data, bytes, usage=, dataType=, size=, ...layoutOptions})
```

* `data` (ArrayBufferView) - contents
* `bytes` (GLsizeiptr) - the size of the buffer object's data store.
* `usage`=`GL.STATIC_DRAW` (GLenum) - Allocation hint for GPU driver.
* `type`=Inferred (GLenum) - type of data stored in buffer. Inferred from `data` if supplied, otherwise `GL.FLOAT`.
* `size`=`1` (GLuint) - number of components per vertex, e.g. a `vec2` has 2 components.
* `...layoutOptions` -  parameters passed to `setLayout`


### updateAccessor(accessor : Object) : Buffer

Allows you to optionally describe the layout of the data in the buffer. This does not affect the buffer itself, but if supplied can avoid having to supply this data again (for instance if you use this buffer as an attribute later, see `VertexArray`).

* `type`= type of the data being stored in the buffer. Usually not needed, when inferred by the typed array supplied as `data`.
* `size`=`1` (*number*, optional) - The number of components in each element the buffer (typically 1-4).
* `normalized`=`false` (*boolean*, optional) -
* `integer`=`false` (*boolean*, optional) -
* `instanced`= `0` (*number*, optional) - whether buffer contains instance data
* `offset`=`0` (*number*, optional) - the `offset`, where the data starts in the buffer.
* `stride`=`0` (*number*, optional) - the `stride` represents an additional offset between each element in the buffer.

Notes:
* `type` and `size` values for attributes are read from the shaders when a program is created and linked, and normally do not need to be supplied. Also any attribute with `instance` in its name will automatically be given an instance divisor of `1`.
* `offset` and `stride` are typically used to interleave data in buffers.


### subData({data , offset=, srcOffset=, length=}) : Buffer

Updates part or all of a buffer's allocated memory.

`Buffer.subData({data, offset=, srcOffset=, length=})`

* `data` (`ArrayBufferView`) - length is inferred unless provided
* `offset`=`0` - Offset into buffer
* `srcOffset`=`0` -  WebGL2: Offset into srcData
* `length` - WebGL2: Number of bytes to be copied


### copyData(opts : Object) : Buffer (WEBGL2)

Copies part of the data of another buffer into this buffer. The copy happens on the GPU and is expected to be efficient.

`Buffer.copyData({sourceBuffer, readOffset=, writeOffset=, size})`

* `sourceBuffer` (`Buffer`) - the buffer to read data from.
* `readOffset`=`0` (GLint) - byte offset from which to start reading from the buffer.
* `writeOffset`=`0` (GLint) - byte offset from which to start writing to the buffer.
* `size` (GLsizei) - byte count, specifying the size of the data to be copied.

Note:
* `readOffset`, `writeOffset` and `size` must all be greater than or equal to zero.
* `readOffset + sizereadOffset + size` must not exceeed the size of the source buffer object
* `writeOffset + sizewriteOffset + size` must not exceeed the size of the buffer bound to writeTarget.
* If the source and destination are the same buffer object, then the source and destination ranges must not overlap.

### getData() : TypedArray (WEBGL2)

Reads data from buffer into an `ArrayBufferView` or `SharedArrayBuffer`.

`Buffer.getData({dstData, srcByteOffset, srcOffset, length})`

* `dstData`=`null` (`ArrayBufferView` | `SharedArrayBuffer` | `null`)  - memory to which to write the buffer data. New ArrayBufferView allocated with correct type if not provided.
* `srcByteOffset`=`0` (GLintptr) - byte offset from which to start reading from the buffer.
* `srcOffset`=`0` (GLuint) - element index offset where to start reading the buffer.
* `length`=`0` (GLuint)  Optional, Element count to be copied, optimal value calculated when not provided.

Returns a typed array containing the data from the buffer (if `dstData` was supplied it will be returned, otherwise this will be a freshly allocated array).

### getElementCount() : Int

Returns number of elements in the buffer. In a buffer created with Float32Array typed array, each float is an element and takes 4 bytes (or 32 bits).


## Types

### Usage

| Usage             | WebGL2 | WebGL1 | Description |
| ---               | ---    | ---    | ---         |
| `GL.STATIC_DRAW`  | Yes    | Yes    | Buffer will be used often and not change often. Contents are written to the buffer, but not read. |
| `GL.DYNAMIC_DRAW` | Yes    | Yes    | Buffer will be used often and change often. Contents are written to the buffer, but not read. |
| `GL.STREAM_DRAW`  | Yes    | Yes    | Buffer will not be used often. Contents are written to the buffer, but not read. |
| `GL.STATIC_READ`  | Yes    | No     | Buffer will be used often and not change often. Contents are read from the buffer, but not written. |
| `GL.DYNAMIC_READ` | Yes    | No     | Buffer will be used often and change often. Contents are read from the buffer, but not written. |
| `GL.STREAM_READ`  | Yes    | No     | Buffer will not be used often. Contents are read from the buffer, but not written. |
| `GL.STATIC_COPY`  | Yes    | No     | Buffer will be used often and not change often. Contents are neither written or read by the user. |
| `GL.DYNAMIC_COPY` | Yes    | No     | Buffer will be used often and change often. Contents are neither written or read by the user. |
| `GL.STREAM_COPY`  | Yes    | No     | Buffer will be used often and not change often. Contents are neither written or read by the user. |

### Parameters

| Parameter         | Type   | Value |
| ---               | ---    | ---   |
| `GL.BUFFER_SIZE`  | GLint  | The size of the buffer in bytes   |
| `GL.BUFFER_USAGE` | GLenum | The `usage` pattern of the buffer |


## Remarks

* All instance methods in a buffer (unless they return some documented value) are chainable.
* While transferring memory between CPU and GPU takes some time, once the memory is available as a buffer on the GPU it can be very efficiently used as inputs and outputs by the GPU.

Note that in WebGL, there are two types of buffers:
* "element" buffers. These can only store vertex attributes with indices (a.k.a "elements") and can only be used by binding them to the `GL.ELEMENT_ARRAY_BUFFER` before draw calls.
* "generic" buffers. These can be used interchangeably to store different types of data, including (non-index) vertex attributes.

For more on the `GL.ELEMENT_ARRAY_BUFFER` restrictions in WebGL, see [this page](https://www.khronos.org/registry/webgl/specs/1.0/#webgl_gl_differences) for WebGL1 and [this page](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences) for WebGL2.
