## Accessors

When using buffers, applications must tell WebGL how the data in the buffer is formatted. luma.gl provides the `Accessor` helper class to help applications manage such format descriptions.


### Resolving Accessors

The `Accessor` API allows for accessors to be resolved or combined into a new `Accessor`. This is intended to support the use of partial accessors and accessor auto deduction.


### Accessor Auto Deduction

luma.gl attempts to "auto deduce" as much information as it can to relieve application from having to specify the same thing twice. For instance if the application has already declared an attribute `in vec2 size` in the vertex shader, it should not need to specify `size:2, type: GL.FLOAT` again later, when it sets the buffer in JavaScript.


### "Partial" Accessors

To support auto deduction, luma.gl allows "partial" accessors to be created, and later combined. Partial accessors will be created automatically by `Program` when shaders are compiled and linked, and also by `Buffer` objects when they are created. These will then be combined with partial application accessors that can add any fine-tuning or override of parameters.

In many cases, when buffers are not shared between attributes and default behavior is desired, luma.gl applications should not need to specify any `Accessor` at all


### glTF Format Accessors

[glTF formatted files](https://www.khronos.org/gltf/). glTF defines two JSON object types ("bufferViews" and "accessors") to describe how raw memory buffers should be interpreted.

The `Accessor` class is designed to be a directly usable representation when working with accessors and buffers stored in glTF files. Each `accessor` and `bufferView` can be mapped to a (partial) `Accessor` and later combined.


## Uses of Accessors

### Views into Buffers

By working with `Accessor` offsets, it is possible to store multiple data segments (e.g, arrays or images etc) in the same GPU buffer. For more information see the article about attributes.


### Data Interleaving

Using `Accessor` 'strides' it is possible to interleave two arrays so that the first two elements of one array are next to each other, then the next two elements etc. For more information see the article about attributes.
