# BufferLayout

The bufferLayout type provides information about how the buffers the application is planning to bind map to the attributes. 
The `BufferLayout` stores the dynamic structure of a render pipeline binding points.

`BufferLayout` affects buffers bound with `RenderPipeline.setAttributes()` or `Model.setAttributes()`. The names
of buffer bindings are determined by the buffer mapping.  Buffer names will match the attribute names, 
however for interleaved buffers the buffer layout defines new buffer names,
that then becomes valid in `RenderPipeline.setAttributes()` and `Model.setAttributes()`.

## Usage

The simplest use case is to provide a non-default vertex type:

```typescript
  bufferLayout: {
    attributes: [
      {name: 'instancePositions', format: 'float32x3'}
      ...
      // RGBA colors can be efficiently encoded in 4 8bit bytes, instead of 4 32bit floats
      {name: 'instanceColors': format: 'uint8normx4'},
    ]
  ],
```

```typescript
  bufferLayout: {
    attributes: [
      {name: 'instancePositions', format: 'float32x3'}
      ...
      // RGBA colors can be efficiently encoded in 4 8bit bytes, instead of 4 32bit floats
      {name: 'instanceColors': format: 'uint8normx4'},
    ],
  }
```

A more advanced use case is interleaving: two attributes access the same buffer in an interleaved way.
Note that this introduces a new buffer name that can be referenced in `setAttributes()`

```typescript
  bufferLayout: [
    {name: 'particles', attributes: [
      // Note that strides are automatically calculated assuming a packed buffer.
      {name: 'instancePositions'},
      {name: 'instanceVelocities'}
    ]
  ],
```

In the above case case a new buffer name `particles` is defined and `setAttributes()`
calls will recognize that name and bind the provided buffer to all the interleaved 
attributes.


## Fields

Each row in the buffer mapping describes one buffer. 

- `name: string` the name of the attribute and the buffer
- `format: VertexFormat` the format of the buffer's memory.
- `byteOffset?: number` the offset into the buffer (defaults to `0`)
- `byteStride?: number` the stride between elements in the buffer (default assumes a packed buffer)

- `attributes: InterleavedAttribute[]`

Interleaved Attribute Description

- `name: string` the name of the attribute and the buffer
- `format: VertexFormat` the format of the buffer's memory.


:::info 
Interleaving attributes into the same buffer does not increase the number of attributes
that can be used in a shader (16 on many systems). 
:::

