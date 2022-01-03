# BufferTransform

`BufferTransform` is an internal helper class for `Transform`, responsible for managing resources and state required for reading from and/or writing to `Buffer` objects. It auto creates `feedbackBufferes` when requested, creates `TransformFeedback` objects. Maintains all buffer bindings, when swapping is eanbled, two binding objects are created for easy switching of all WebGL resource binginds.

NOTE: In following sections 'buffer transform' is used to refer to 'reading from and/or writing to `Buffer` objects'.

## Constructor

### Transform(gl : WebGL2RenderingContext, props: Object)

- `gl` (`WebGLRenderingContext`) gl - context
- `props` (`Object`, Optional) - contains following data.

  - `sourceBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
  - `feedbackBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object or buffer params object. If a buffer params object is specified, it will contain following fields, these can be used to capture data into the buffer at particular offset and size.
    - `buffer`=(Buffer) - Buffer object to be bound.
    - `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
    - `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.
  - `varyings` (`Array`, Optional) - Array of vertex shader varyings names. When not provided this can be deduced from `feedbackBuffers`.

  NOTE: If only reading from `Buffer` objects, above optional props doesn't have to be supplied during construction, but can be supplied using `update` method. If writing to `Buffer` objects, either `varyings` or `feedbackBuffers` must be supplied.

## Methods (Model props)

### getDrawOptions(opts: Object) : Object

Returns resources required when performing `Model.draw()` options.

- `opts` (`Object`) - Any existing `opts.attributes` will be merged with new attributes.

Returns an Object : {attributes, transformFeedback}.

### updateModelProps(props: Object) : Object

Updates input `props` object with data required for buffer transform.

- `opts` (`Object`) - If writing to `Buffer` objects, `opts.varying` will be updated.

Returns updated object.

## Methods (Resource management)

### setupResources(opts: Object)

Sets up internal resources needed writing to buffers.

- `opts` (`Object`) - contains following data.
  - `model` (`Model`, Optional) - `Model` object that is used to perform draw operations.

### swap()

If `feedbackMap` is provided during construction, performs source and feedback buffers swap as per the `feedbackMap`.

### update(props: Object)

Updates buffer bindings for one or more source or feedback buffers.

- `props` (`Object`) - contains following data.
  - `sourceBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
  - `feedbackBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object or buffer params object. If a buffer params object is specified, it will contain following fields, these can be used to capture data into the buffer at particular offset and size.
    - `buffer`=(Buffer) - Buffer object to be bound.
    - `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
    - `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.

## Methods (Accessors)

### getBuffer(varyingName : String) : Buffer

Returns current feedback buffer corresponding to given varying name.

- `varyingName` (`String`) - varying name.

### getData([options : Object]) : ArrayBufferView

Reads and returns data from current feedback buffer corresponding to the given varying name.

- `options.varyingName` (`String`, Optional) - when specified, first checks if there is a corresponding feedback buffer, if so reads data from this buffer and returns. When not specified, there must be target texture and data is read from this texture and returned.
