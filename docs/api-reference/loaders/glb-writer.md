# GLBWriter

The `GLBWriter` supports encoding of GLB files.


## `GLBBuilder` class

The `GLBWriter` module exposes the `GLBBuilder` class that allows applications to dynamically build up a hybrid JSON/binary GLB file. It exposes the following methods:


### constructor

Creates a new `GLBBuilder` instance.


### addBuffer(typedArray : TypedArray, accessor : Object) : Number

Adds one binary array intended to be loaded back as a WebGL buffer.

* `typedArray` -
* `accessor` - {size, type, ...}.

Type is autodeduced from the type of the typed array.

The binary data will be added to the GLB BIN chunk, and glTF `bufferView` and `accessor` fields will be populated.


### addImage(typedArray: TypedArray) : Number

Adds an image

The binary image data will be added to the GLB BIN chunk, and glTF `bufferView` and `image` fields will be populated.


### encode(json: Object | Array, options : Object) : ArrayBuffer

Writes JavaScript JSON data structure into an arrayBuffer that can be written atomically to file, extracting binary fields from the data and placing these in a compact binary chunk following the "stripped" JSON chunk.

Note: Once all binary buffers have been added `encode()` can be called..
