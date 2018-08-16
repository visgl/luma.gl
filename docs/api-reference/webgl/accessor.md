# Accessor (Experimental)

The `Accessor` class is a helper class that describes a GPU buffer layout, as well as some additional parameters relating to how the GPU should access buffer data.

Accessors can be used to provide different views on the data in the same buffer.

Some accessor information can be extracted from GLSL shader code and use as defaults, minimizing the amount of book keeping in the standard case.


Data type information:

* `type`: low level data type (GL.BYTE, GL.SHORT, GL.FLOAT, GL.INT, ...)
* `size`: (1-4 values per vertex)

Data layout information:

* `offset`
* `stride`

GPU access information:

* `divisor`: (enables/disables instancing) **WebGL2/Extension**.
* `normalize`: integer to float normalization policy.
* `integer`: integer conversion policy **WebGL2**.


## Methods

### `BYTES_PER_ELEMENT` : Number

Returns the number of bytes per "element", based on the `type` field in the accessor. Asserts if type is not set.

### `BYTES_PER_VERTEX` : Number

Returns the number of bytes per "vertex", based on the `type` and `size` fields in the accessor. Asserts if `type` and `size` are not set.



## Remarks: Auto-deduction

* `type` and `size` can be automatically inferred from program reflection.
* `divisor` - if attribute is named `instance...` this will be automatically set to 1.

* `offset` and `stride` are simply assumed to be 0 which corresponds to the simple non-interleaved case.

* `integer` - if type is `GL.INT` or `GL.UINT`, then integer is automatically true, as floating point shader inputs cannot be mapped to such attributes.


