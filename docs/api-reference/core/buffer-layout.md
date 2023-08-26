# BufferLayout

The bufferLayout type provides information about how the application is planning to 
map the attributes in its pipelines to the memory in GPU buffers. 

`BufferLayout` affects buffers bound with `RenderPipeline.setAttributes({[bufferName]: Buffer})` or 
`Model.setAttributes({[bufferName]: Buffer})`. The names of buffer bind points are determined by the `bufferLayout` mapping supplied to `createRenderPipeline()` or `new Model()`. 
This buffer name then becomes valid in `RenderPipeline.setAttributes()` and `Model.setAttributes()`.

## Usage

The simplest use case is to provide a non-default vertex type:

```typescript
  bufferLayout: [
    {name: 'instancePositions', format: 'float32x3'}
    ...
    // RGBA colors can be efficiently encoded in 4 8bit bytes, instead of 4 32bit floats
    {name: 'instanceColors', format: 'uint8normx4'},
  ],
```


This is short hand for specifying an attribute with the same name as the buffer

```typescript
  bufferLayout: [
    {name: 'instancePositions', attributes: [{attribute: 'instancePositions', format: 'float32x3'}]},
    {name: 'instanceColors', attributes: [{attribute: 'instanceColors', format: 'uint8normx4'}]},
  ]
  ```


A more advanced use case is interleaving: two attributes access the same buffer sin an interleaved way.
Note that this introduces a buffer name that is different from attribute names. This buffer name can be specified in `setAttributes({[bufferName]: Buffer})` method on the `RenderPipeline` and `Model` classes.

```typescript
  bufferLayout: [
    {
      name: 'particles', stepMode: 'instance', byteStride: 24, attributes: [
        // Note that strides are automatically calculated assuming a packed buffer.
        {attribute: 'instancePositions', format: 'float32x3', byteOffset: 0},
        {attribute: 'instanceVelocities', format: 'float32x3', byteOffset: 12}
      ]
    }
  ],
```

In the above case case a new buffer name `particles` is defined and `setAttributes({particles: Buffer})`
calls will recognize that name and bind the provided buffer to all the interleaved attributes.

## `BufferLayout` Fields

Each `BufferLayout` describes how the memory content of one buffer is mapped to one or more shader attributes. Tje  

- `name: string` defines the name of this buffer for use in `setAttributes()` methods. THe application is free to select this name.
- `stepMode: 'vertex' | 'instance'` Whether attributes in this buffer will be treated as instanced.
- `byteStride?: number` the stride between elements in the buffer (default assumes a packed buffer)
- `attributes?: BufferAttributeLayout[]` - A list of attributes that will be bound to this buffer.
- `format?: VertexFormat` - Secify the format of a single attribute with the same name as the buffer. 
 
Note that one of `attributes` and `format` must be supplied, but not both.

## `BufferAttributeLayout` Fields

The attributes field must contain an array of `BufferAttributeLayout` objects.

- `attribute: string` the name of the attribute.
- `format: VertexFormat` the format of (the subset of) the buffer's memory being mapped to this attribute.
- `byteOffset?: number` the offset into the buffer (defaults to `0`). This should be a sum of any global offset into the buffer plus any small offset into the `byteStride` for interleaved attributes.

:::info 
Unfortunately, interleaving attributes into the same buffer does not help avoid the
limit on the number of attributes that can be used in a shader (16 on many systems). 
:::
