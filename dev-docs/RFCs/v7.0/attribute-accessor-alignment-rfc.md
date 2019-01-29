# RFC: Attribute Accessor Class Alignment

* **Author**: Ib Green
* **Date**: Jan, 2019
* **Status**: **Draft**

## Summary

This RFC proposes some changes to our `Attribute`/`Accessor`/`Buffer` classes to consolidate what has become an overlapping and sometimes confusing API.


## Use cases

Specify Access Metadata for a buffer


## Proposed Terminology

* A **buffer** is a handle to GPU memory, with methods for uploading, copying and downloading memory.
* An **accessor** contains information about the structure of the memory in a buffer. Multiple accessors can provide different "views" of the same buffer's memory. To use a buffer as a vertex shader attribute, the accessor must be providecd.
* An attribute 


## Summary of Proposed Changes

* `Accessor` class instances and "accessor objects" can be used interchangeably. Documentation is updated accordingly.
* `Accessor` (and accessor objects) can now have a field `buffer`, to support the interleaved case. (If a buffer is provided and its accessor is extracted, the buffer value if any is ignored.)
* `Buffer` can still hold partial accessors. `Accessors` have a `buffer` field that points to a `Buffer`. Multiple accessors can point to the same `Buffer`. This is a breaking change.
* `Buffer` takes an `accessor` parameter to help set the accessor.
* `Attribute` class no longer take accessor type options but instead an accessor field (can support old style for backwards compatibility if necessary).

## getAccessor() helper function

## getBuffer() helper funciton

## Proposed APIs

### Buffer class

| Field        | Type          | Description |
| ---          | ---           | --- |
| `handle`     | `WebGLBuffer` | The actual WebGL buffer. |
| `byteStride` | `Number`      | It can make sense to set the `byteStride` directly on the buffer, as it would normally be shared by all accessors. This also fits with how glTF does it. |


### Accessor class / objects (AttributeDescriptor objects)

For maximum flexibility, luma.gl accepts plain JavaScript objects (attribute descriptor objects) with the supported fields wherever an accessor is expected. Also an `Accessor` class that can be used to create accessor object compatible instances, with additional methods for.

An accessor / attribute descriptor object can wrap a buffer, or just hold partial accessor data to be merged.


It is common to work with "partial Accessors", i.e. leaving a number of fields undefined. luma.gl implements auto deduction that deducts fields like `type` and `size` from GLSL shaders, so this information does not need to be duplicated in an accessor object/instance.


| Field        | Type        | Default    | Description |
| ---          | ---         | ---        | --- |
| `buffer`     | `Buffer`    | N/A        | `buffer` (or `value`) must be defined |
| `byteStride` | `Number`    | `0`        | Distance between successive vertex data elements in interleaved buffers. Overrides any `byteStride` value set on the buffer. |
| `byteOffset` | `Number`    | `0`        | Offset into the `byteStride` |
| `normalized` | `Boolean`   | `false`    | Whether integers are scaled into `0-1` |
| `type`       | `GLenum`    | `GL.FLOAT` | Auto-deduced from compiled shader if left undefined |
| `size`       | `Number`    | `1`        | Auto-deduced from compiled shader if left undefined. 1-4 (more for matrices/arrays) |
| `divisor`    | `Number`    | `0`        | Auto-deduced from shader if left undefined, heuristic based on shader attribute name. | `integer`    | `boolean`   | `false`    | Should be auto-deducable from shader? |

To maximize backwards compatibility, alternate fields are checked:

| Backup Fields | Used in place of |
| ---           | ---              |
| `stride`      | `byteStride`     |
| `offset`      | `byteOffset`     |
| `value`       | `buffer`         |

| Field         | Description |
| ---           | ---         |
| `size`        | `Number` |  |
| `type`        | `GLenum` | `GL.FLOAT` etc |


The recommended approach is to wrap buffers in accessors.




### class


| Field        | Type        | Default    | Description |
| ---          | ---         | ---        | --- |
| `buffer`     | `Buffer`    | N/A        | `buffer` (or `value`) must be defined |
| `byteStride` | `Number`    | `0`        | Overrides any `byteStride` value set on the buffer. |
| `byteOffset` | `Number`    | `0`        | Offset into the `byteStride` |
| `normalized` | `Boolean`   | `false`    | Whether integers are scaled into `0-1` |
| `type`       | `GLenum`    | `GL.FLOAT` | Auto-deduced from compiled shader if left undefined |
| `size`       | `Number`    | `1`        | Auto-deduced from compiled shader if left undefined |
| `divisor`    | `Number`    | `0`        | Auto-deduced from shader if left undefined, heuristic based on shader attribute name. | `integer`    | `boolean`   | `false`    | Should be auto-deducable from shader? |

To maximize backwards compatibility, alternate fields are checked:

| Backup Fields | Used in place of |
| ---           | ---              |
| `stride`      | `byteStride`     |
| `offset`      | `byteOffset`     |
| `value`       | `buffer`         |



### Attribute descriptor object

| `value`  | Used if `buffer` is not defined. For backwards compatibility |



### Attribute class

An attribute manages everything with an attribute:

* Either an accessor or a constant
* "Uploading" JavaScript arrays to GPU `Buffers`.

```
const interleavedBuffer = new Buffer(gl, {byteStride: 12 + 4});

vertexArray.setAttributes({
  POSITIONS: new Accessor({byteOffset: 0, buffer: interleavedBuffer})
  COLORS: new Accessor({byteOffset: 12, buffer: interleavedBuffer})
})
```



---

## Rejected Alternatives

### Add "constant" support to accessor



