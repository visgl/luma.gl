# Accessors

"Buffer accessor objects" (or "accessor objects", or just "accessors" for short) are used to describe the structure of data contained in WebGL buffers (for more information see [`Buffers`](developers-guide/buffers.md)).

When using `Buffer`s as input to shader programs, applications must tell WebGL how the data in the buffer is formatted, so that the GPU knows how to access buffers' memory. To enable applications to specify how the buffer memory should be accessed, luma.gl APIs that set attribute buffers accept buffer "accessor objects".

## Accessor Object Fields

This is an overview of the object accessor fields that are available to applications to define format descriptions. These objects can contain the following fields, this is an excerpt from [`Accessor`](api-reference/webgl/accessor.md).

| Property    | Auto Deduced | Default    | Comment |
| ---         | ---          | ---        | ---        | ---     |
| `buffer`    | No           | An accessor can optionally reference a specific buffer. Multiple accessors can point to the same buffer, providing different views or "slices" of the buffer's memory. |
| `offset`    | No           | `0`        | Byte offset to start of data in buffer |
| `stride`    | No           | `0`        | Extra bytes between each successive data element |
| `type`      | Yes          | `GL.FLOAT` | Low level data type (`GL.BYTE`, `GL.SHORT`, ...) |
| `size`      | Yes          | `1`        | Components per element (`1`-`4`) |
| `divisor`   | Yes          | `0`        | Enables/disables instancing |
| `normalize` | N/A          | `false`    | Normalize integers to [-1,1], or [0,1] if unsigned |
| `integer`   | N/A          | `false`    | Disable conversion of integer values to floats **WebGL2** |


## Combining Accessors with Buffers

When setting attributes (e.g. using `Model.setProps({attributes: {attributeName: value, ...}}))`, each attribute value needs to contain both a buffer (a handle to the raw data uploaded to the GPU) and an accessor (describing how that data should be accessed).

luma.gl provides three methods to specify attribute values so that both a buffer and an accessor are provided:
* As a two-element array: `[buffer, accessor]`.
* As an accessor, in which case the accessor object's `buffer` field should be set to the matching `Buffer`.
* As a `Buffer`, in which case the `Buffer` objects `accessor` field should be set to the mathing `Accessor`.

All three methods have their uses: the first option gives the applications full freedom to dynamically select combinations of buffers and accessors, the second option is often the natural choice when working with interleaved buffers (see below), and the last choice is often the most convenient when just setting up an ad-hoc buffer for immediate use, as the accessor can be stored directly on the buffer, avoiding the need to manage separate objects.


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


### Using Different Size in Buffers and Shaders

It is possible to use different size memory attributes than specified by the GLSL shader code, by specifying a different size in the accessor compared to the GLSL shader variable declaration. Extra components in the Buffer memory will be ignored, missing components will be filled in from `(0.0, 0.0, 0.0, 1.0)`

> Be aware that the headless gl integration does not support this feature due to limitations in headless gl.


### glTF Format Accessors

[glTF formatted files](https://www.khronos.org/gltf/). glTF files contain two JSON object arrays ("bufferViews" and "accessors") that describe how raw memory buffers are organized and should be interpreted.

The `Accessor` and `Buffer` class APIs have intentionally been designed to be a close representation when converting "accessors" and "bufferViews" stored in glTF files. Each glTF `accessor` can be mapped to a luma.gl `Accessor` and each glTF `bufferView` can be mapped to a luma.gl `Buffer`. For more details see [glTF mapping]().
