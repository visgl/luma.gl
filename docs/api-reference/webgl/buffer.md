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
const buffer = new Buffer(gl, {byteLength: 200});
const buffer = new Buffer(gl).initialize({byteLength: 200});
```

Allocating and initializing a buffer
```js
const buffer = new Buffer(gl, {
  target: GL.ELEMENTS_ARRAY_BUFFER,
  data: new Uint32Array([1, 2, 3])
});
const buffer = new Buffer(gl, new Float32Array([1, 2, 3])); // Allocate+init 12 bytes of GPU memory
const buffer = new Buffer(gl, 200); // Allocate 200 bytes of GPU memory
```

Updating a buffer
```js
const buffer = new Buffer(gl, {byteLength: 200})
buffer.subData(new Float32Array(...));
```

Copying data between buffers (WebGL2)
```js
const sourceBuffer = ...
const destinationBuffer = ...

// To copy 32 bytes from sourceBuffer to destinationBuffer
destinationBuffer.copyData({sourceBuffer, size: 32});

// To copy 32 bytes from sourceBuffer at 8 byte offset into
// destinationBuffer at 16 byte offset.
destinationBuffer.copyData({
  sourceBuffer,
  readOffset: 8,
  writeOffset: 16,
  size: 32
});
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


## Members

##### `handle` : `WebGLBuffer`

Holds the underlying WebGL object reference.


##### `byteLength` : Number

Number of bytes of allocated memory.


#### `bytesUsed` : Number

Same as `byteLength` unless the `Buffer.reallocate` has been called with a value smaller than the actual length of the buffer.


##### `accessor` : `Accessor`

Holds an `Accessor` instance. By default it contains type information that is automatically deducted from the type of data used to initialize the buffer, but the application can store any `Accessor` it wants with the `Buffer`. This can simplify handling of buffer related data in many basic use cases (e.g. when buffers are not shared by multiple attributes etc).


## Constructor

### Buffer(gl : WebGLRenderingContext, props : Object | TypedArray | Number)

Creates a new `Buffer`. Multiple signatures are supported:

```js
const buffer = new Buffer(gl, {target, ...initOptions, accessor, ...accessorOptions});
```

* `gl` (`WebGLRenderingContext`) - gl context
* `target`= (*GLenum*, optional) - the type of buffer, see below.
* `...initOptions` (*Object*) - options passed on to `initialize`.
* `accessor` - options used to create the `accessor`
* `...accessorOptions` (DEPRECATED) - options passed on to `setAccessor`. Use `accessor` instead.

```js
const buffer = new Buffer(gl, typedArray);
```

* `gl` (`WebGLRenderingContext`) - gl context
* `typedArray` - typed array with values that should be used to size and initialize the new GPU buffer. Short hand for `new Buffer({data: typedArray})`.

```js
const buffer = new Buffer(gl, byteLength);
```

* `gl` (`WebGLRenderingContext`) - gl context
* `byteLength` - specifies the number of bytes that should be allocated (but not initialized). Short hand for `new Buffer({byteLength})`.

The newly constructed buffer will either be a an "element" buffer used for storing vertex indices, or a "generic" buffer that can be used to store other things. To create an element buffer, specify `target: GL.ELEMENT_ARRAY_BUFFER`. If target is not specified, it will be a generic buffer that can be used in a variety of situations.

* In WebGL1, the default target is `GL.ARRAY_BUFFER` which will work as a "generic" (i.e. non-element) buffer.
* In WebGL2, the default target is `GL.COPY_READ_BUFFER` which means the buffer can work either as a generic buffer and an element buffer. This will be determined when it is first used with (bound to) a specific target. From that point on, WebGL will consider it either as an element buffer or a generic buffer.


## Methods

### initialize(props : Object) : Buffer

Allocates and optionally initializes buffer memory/data store (releasing any previously allocated memory).

Also extracts characteristics of stored data, hints for vertex attribute.

```js
Buffer.initialize({data, byteLength, usage=, dataType=, size=, accessor=, ...accessorOptions})
Buffer(gl, typedArray);
Buffer(gl, byteLength);
``````

* `data` (ArrayBufferView) - contents
* `byteLength` (Number) - the size of the buffer object's data store.
* `usage`=`GL.STATIC_DRAW` (GLenum) - Allocation hint for GPU driver.
* `accessor` (Object) - object with accessor props to be stored as accessor.
* `...accessorOptions` (DEPRECATED) -  parameters passed to `setAccessor`


### reallocate(byteLength : Number) : Buffer

If necessary, increases buffer size to `byteLength`. Does not decrease the buffer's size if already long enough.

* `byteLength` (Number) - the minimum size of the buffer object's data store.

Returns:

* `true` - if reallocation happened (in which case any stored data was invalidated).
* `false` - if the `Buffer` was already big enough in which case any uploaded data remains intact.


### subData({data , offset=, srcOffset=, length=}) : Buffer

Updates part or all of a buffer's allocated memory.

`Buffer.subData({data, offset=, srcOffset=, length=})`

* `data` (`ArrayBufferView`) - length is inferred unless provided
* `offset`=`0` - Offset into buffer
* `srcOffset`=`0` -  WebGL2: Offset into srcData
* `length` - WebGL2: Number of bytes to be copied


### copyData(opts : Object) : Buffer (WebGL2)

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


### getData() : TypedArray (WebGL2)

Reads data from buffer into an `ArrayBufferView` or `SharedArrayBuffer`.

`Buffer.getData({dstData, srcByteOffset, srcOffset, length})`

* `dstData`=`null` (`ArrayBufferView` | `SharedArrayBuffer` | `null`)  - memory to which to write the buffer data. New ArrayBufferView allocated with correct type if not provided.
* `srcByteOffset`=`0` (GLintptr) - byte offset from which to start reading from the buffer.
* `srcOffset`=`0` (GLuint) - element index offset where to start reading the buffer.
* `length`=`0` (GLuint)  Optional, Element count to be copied, optimal value calculated when not provided.

Returns a typed array containing the data from the buffer (if `dstData` was supplied it will be returned, otherwise this will be a freshly allocated array).


### getElementCount([accessor : Accessor]) : Number

Returns number of elements in the buffer. In a buffer created with Float32Array typed array, each float is an element and takes 4 bytes (or 32 bits).


### setAccessor(accessor : Accessor | Object) : Buffer

Allows you to optionally describe the accessor properties of the data in the buffer. This does not affect the buffer itself, but if supplied can avoid having to supply this data again when you use this buffer as an attribute later (see `VertexArray.setAttributes`).

For details on accessor props, see the documentation for the [`Accessor`]() class.


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


### "Manually" Binding Buffers

If you are an experienced WebGL or OpenGL programmer you are probably used to constantly binding buffers. Buffer binding and unbinding is handled internal by luma.gl methods and applications typically do not need to bind buffers.

To support use cases integrating with external libraries or raw webgl code, it is of course possible to "manually" bind and unbind luma.gl `Buffer` instances:

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


## Remarks

* All instance methods in a buffer (unless they return some documented value) are chainable.
* While transferring memory between CPU and GPU takes some time, once the memory is available as a buffer on the GPU it can be very efficiently used as inputs and outputs by the GPU.

Note that in WebGL, there are two types of buffers:
* "element" buffers. These can only store vertex attributes with indices (a.k.a "elements") and can only be used by binding them to the `GL.ELEMENT_ARRAY_BUFFER` before draw calls.
* "generic" buffers. These can be used interchangeably to store different types of data, including (non-index) vertex attributes.

For more on the `GL.ELEMENT_ARRAY_BUFFER` restrictions in WebGL, see [this page](https://www.khronos.org/registry/webgl/specs/1.0/#webgl_gl_differences) for WebGL1 and [this page](https://www.khronos.org/registry/webgl/specs/2.0/#webgl_gl_differences) for WebGL2.
