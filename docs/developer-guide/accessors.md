# Accessors

"Buffer accessor objects" (or "accessor objects", or just "accessors" for short) are used to describe the structure of data contained in WebGL buffers (for more information see [`Buffers`](developers-guide/buffers.md)).

When using `Buffer`s as input to shader programs, applications must tell WebGL how the data in the buffer is formatted, so that the GPU knows how to access buffers' memory. To enable applications to specify how the buffer memory should be accessed, luma.gl APIs that set attribute buffers accept buffer "accessor objects".

## Accessor Object Fields

This is an overview of the object accessor fields that are available to applications to define format descriptions. These objects can contain the following fields:

| Field        | Type        | Default    | Description |
| ---          | ---         | ---        | --- |
| `buffer`     | `Buffer`    | N/A        | `buffer` (or `value`) must be defined |
| `stride`     | `Number`    | `0`        | Distance between successive vertex data elements in interleaved buffers. |
| `offset`     | `Number`    | `0`        | Offset into the `byteStride` |
| `normalized` | `Boolean`   | `false`    | Whether integers are scaled into `0-1` |
| `type`       | `GLenum`    | `GL.FLOAT` | Auto-deduced from compiled shader if left undefined |
| `size`       | `Number`    | `1`        | Auto-deduced from compiled shader if left undefined. 1-4 (more for matrices/arrays) |
| `divisor`    | `Number`    | `0`        | Auto-deduced from shader if left undefined, heuristic based on shader attribute name. | `integer`    | `boolean`   | `false`    | Should be auto-deducable from shader? |


| Property    | Category    | Auto Deduce    | Default    | Comment |
| ---         | ---         | ---            | ---        | ---     |
| `offset`    | data layout | N/A            | `0`        | Byte offset to start of data in buffer |
| `stride`    | data layout | N/A            | `0`        | Extra bytes between each successive data element |
| `type`      | data type   | Vertex Shader/`Buffer.setData` | `GL.FLOAT` | Low level data type (`GL.BYTE`, `GL.SHORT`, ...) |
| `size`      | data type   | Vertex Shader  | `1`        | Components per element (`1`-`4`) |
| `divisor`   | instancing  | Attribute name | `0`        | Enables/disables instancing |
| `normalize` | data access | N/A            | `false`    | Normalize integers to [-1,1], or [0,1] if unsigned |
| `integer`   | data access | N/A            | `false`    | Disable conversion of integer values to floats **WebGL2** |
| `buffer`    |             | N/A            | `false`    | Disable conversion of integer values to floats **WebGL2** |


## Accessor Class vs Accessor Objects

luma.gl provides the [`Accessor`](api-reference/webgl/accessor.md) helper class to help you work with accessor objects. For instance, the `Accessor` class supports merging of partial accessor objects, see below.

Note that it is not necessary to use the `Accessor` class, as plain old JavaScript objects with the appropriate fields are also accepted by the various APIs that accept accessors. Use the style that works best for your application.


### "Partial" Accessors

luma.gl allows "partial" accessors to be created, and later combined. Usually many accessor fields can be left undefined (e.g. because defaults are sufficient, or because accessor auto-deduction has already deduced the information, see below).

Partial accessors will be created automatically by `Program` when shaders are compiled and linked, and also by `Buffer` objects when they are created. Any application supplied accessors fields will then be merged in (override) these auto-deduceted fields, that can add any fine-tuning or override of parameters.


### Accessor Auto Deduction

luma.gl attempts to "auto deduce" as much accessor information as it can, for instance luma.gl can extract fields like `type` and `size` after shaders have been compiled.

This relieves applications from having to respecify the same thing multiple times. For instance if the application has already declared an attribute as `in vec2 size` in the vertex shader, it does not need to specify `size:2, type: GL.FLOAT` again in the accessor, when it sets the buffer in JavaScript, since this information will have been auto-deduced.

In many cases, when buffers are not shared between attributes (i.e. interleaved) and default behavior is desired, luma.gl applications often do not need to specify any `Accessor` at all.


### Merging (Resolving) Accessors

The `Accessor` API allows for accessors to be merged (or "resolved") into a new `Accessor`. Accessor mmerging is mainly used internally in luma.gl to implement support for partial accessors and accessor auto deduction, but can be used by applications if necessary.


### Data Interleaving

Using the`stride` and `offset` fields in accessor objects, it is possible to interleave two arrays so that the first two elements of one array are next to each other, then the next two elements etc.

```
const interleavedBuffer = new Buffer(gl, accessor: {stride: 12 + 4}}); // Creates a partial accessor with `stride` in buffer.

vertexArray.setAttributes({
  // These accessors are merged with the `interleavedBuffer` accessor and any
  // auto-deduced accessors
  POSITIONS: new Accessor({offset: 0, buffer: interleavedBuffer})
  COLORS: new Accessor({offset: 12, buffer: interleavedBuffer})
})
```

For more information see the article about attributes.


### Intentional Size Mismatches

It is possible to use different size memory attributes than specified by the GLSL shader code.


### glTF Format Accessors

[glTF formatted files](https://www.khronos.org/gltf/). glTF files contain two JSON object arrays ("bufferViews" and "accessors") that describe how raw memory buffers are organized and should be interpreted.

The `Accessor` and `Buffer` class APIs have intentionally been designed to be a close representation when converting "accessors" and "bufferViews" stored in glTF files. Each glTF `accessor` can be mapped to a luma.gl `Accessor` and each glTF `bufferView` can be mapped to a luma.gl `Buffer`. For more details see [glTF mapping]().
