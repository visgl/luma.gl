# Accessor (Experimental)

The `Accessor` class is a helper class that describes how a buffers memory is structured and should be accessed. Accessors are used.

The type of values, number of values per element, any offset and strides, etc. as well as some additional parameters relating to how the GPU should access buffer data (instance divisors, integer normalization etc).

By using multiple `Accessor` instances, the application can defined different "views" of the data in a single buffer.

Accessors are immutable by design. Once they have been created they cannot be changed.

Accessors can be resolved (merged) into a new Accessor. This is useful since while some accessor properties can be extracted directly from a program's shaders (and some can be extracted when data is set to the buffer), some properties needs to be set by the application.


## Properties

| Property    | Category    | Auto Deduce    | Default    | Comment |
| ---         | ---         | ---            | ---        | ---     |
| `offset`    | data layout | N/A            | `0`        | Byte offset to start of data in buffer |
| `stride`    | data layout | N/A            | `0`        | Extra bytes between each successive data element |
| `type`      | data type   | Vertex Shader/`Buffer.setData` | `GL.FLOAT` | Low level data type (`GL.BYTE`, `GL.SHORT`, ...) |
| `size`      | data type   | Vertex Shader  | `1`        | Components per element (`1`-`4`) |
| `divisor`   | instancing  | Attribute name | `0`        | Enables/disables instancing |
| `normalize` | data access | N/A            | `false`    | Normalize integers to [-1,1], or [0,1] if unsigned |
| `integer`   | data access | N/A            | `false`    | Disable conversion of integer values to floats **WebGL2** |

Notes:

* `type` and `size` values for attributes are read from the shaders when a program is created and linked, and normally do not need to be supplied. Also any attribute with `instance` in its name will automatically be given an instance divisor of `1`.
* `divisor` is automatically set to `1` for any attribute that has some capitalization of `instance` in the name.
* `offset` and `stride` are typically used to interleave data in buffers and are normally left undefined (i.e. `0`).
* `normalize` and `integer` need to be enabled by applications through an `Accessor`.


### `offset`

Byte offset to start of data in buffer

### `stride`

### `type`

Low level data type (GL.BYTE, GL.SHORT, GL.FLOAT, GL.INT, ...)

### `size`

Number of (1-4 values per vertex)

### `divisor`: Number

Enables/disables instancing.

### `normalize`

If `true` normalizes integer values (`GL.BYTE`, ...). Signed values are normalized to [-1,1] and unsigned values are normalized to [0,1].

### `integer` **WebGL2**

Disable conversion of integer values to floats.


## Static Methods

### Accessor.merge(accessor1, accessor2, ...) : Accessor

Merges a number of partial accessors into a merged accessor that can be used to set vertex attributes. Any unspecified accessor properties will be set to their default values.

Note: Most applications do not need to merge accessors directly. Merging is done by the `VertexArray.setAttributes` method.


## Methods

### constructor(props : Object)

Creates a new partial `Accessor`. The new object will be immutable, i.e. its values cannot be changed after creation.


### `BYTES_PER_ELEMENT` : Number

Returns the number of bytes per "element", based on the `type` field in the accessor. Asserts if type is not set.

### `BYTES_PER_VERTEX` : Number

Returns the number of bytes per "vertex", based on the `type` and `size` fields in the accessor. Asserts if `type` and `size` are not set.



## Remarks: Auto-deduction

* `type` and `size` are automatically inferred (through WebGL APIs that provide access to metadata extracted during compilation and linking of shader programs).
* `divisor` - if attribute name starts with `instance...` this will be automatically set to `1`.
* `offset` and `stride` are assumed to be 0 which corresponds to the simple non-interleaved case.
* `integer` - if type is `GL.INT` or `GL.UINT`, then integer is automatically true, as floating point shader inputs cannot be mapped to such attributes.


