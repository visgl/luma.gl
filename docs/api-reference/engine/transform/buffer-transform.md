# BufferTransform

![WebGPU not supported](https://img.shields.io/badge/webgpu-no-red.svg?style=flat-square")

`BufferTransform` manages resources and state required for doing TransformFeedback based GPU computations reading from and/or writing to `Buffer` objects. 


## Types

### `BufferTransformProps`

```ts
export type BufferTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs']; // override as optional
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};
```

- `props.feedbackBuffers` (`Object`, Optional) - Map of output buffers that the shaders will write to. Key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object or buffer params object. If a buffer params object is specified, it will contain following fields, these can be used to capture data into the buffer at particular offset and size.
    - `buffer`=(Buffer) - Buffer object to be bound.
    - `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
    - `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.
  
## Methods

### constructor

```ts
new BufferTransform(device: Device, props: BufferTransformProps)
```

- `device` (`Device`) - device
- `props.feedbackBuffers` - Map of output buffers that the shaders will write to. Key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object or buffer params object. If a buffer params object is specified, it will contain following fields, these can be used to capture data into the buffer at particular offset and size.
  - `buffer`=(Buffer) - Buffer object to be bound.
  - `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
  - `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.
- `props.sourceBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
- `props.varyings` (`Array`, Optional) - Array of vertex shader varyings names. When not provided this can be deduced from `feedbackBuffers`.


### `run(props: RenderPassProps)`

Updates buffer bindings for one or more source or feedback buffers.

- `props` (`Object`) - contains following data.
  - `sourceBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader attribute and value is the corresponding `Attribute`, `Buffer` or attribute descriptor object.
  - `feedbackBuffers` (`Object`, Optional) - key and value pairs, where key is the name of vertex shader varying and value is the corresponding `Buffer` object or buffer params object. If a buffer params object is specified, it will contain following fields, these can be used to capture data into the buffer at particular offset and size.
    - `buffer`=(Buffer) - Buffer object to be bound.
    - `byteOffset`=(Number, default: 0) - Byte offset that is used to start recording the data in the buffer.
    - `byteSize`=(Number, default: remaining buffer size) - Size in bytes that is used for recording the data.

### `getBuffer(varyingName : String) : Buffer`

Returns current feedback buffer corresponding to given varying name.

- `varyingName` (`String`) - varying name.

### `readAsync(varyingName: string) : Promise<Uint8Array>`

Reads and returns data from current feedback buffer corresponding to the given varying name.

- `varyingName` - when specified, first checks if there is a corresponding feedback buffer, if so reads data from this buffer and returns. When not specified, there must be target texture and data is read from this texture and returned.
