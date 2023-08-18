# BufferMapping (type)

The bufferMapping type provides information about how the buffers the application is planning to bind map to the attributes. 

It affects buffers bound with `Model.setAttributes()` or `RenderPipeline.setAttributes()`

The simplest use case is to provide a non-default vertex type:

```typescript
  bufferMap: [
    {name: 'instancePositions', format: 'float32x3'}
    ...
    // RGBA colors can be efficiently encoded in 4 8bit bytes, instead of 4 32bit floats
    {name: 'instanceColors': format: 'uint8normx4'},
  ],
```

A more advanced use case is interleaving: two attributes access the same buffer in an interleaved way.

```typescript
  bufferMap: [
    {name: 'particles', attributes: [
      {name: 'instancePositions'},
      {name: 'instanceVelocities'}
    ]
  ],
```

In the above case case a new buffer name `particles` is defined and `setAttributes()`
calls will recognize that name and bind the provided buffer to all the interleaved 
attributes.


