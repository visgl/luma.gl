# Attributes

Attributes (aka "vertex attributes") are used to specify the data that the GPU should work on. Attributes contain input data to the vertex shader, the first shader stage in the GPU rendering pipeline and are the main mechanism through which the application feeds data to the GPU.

To help apps set up and manage attributes, luma.gl provides the `VertexArray` class (which works as an "enhanced" WebGL `VertexArrayObject`).

References:

* [OpenGL Wiki: Vertex Specification](https://www.khronos.org/opengl/wiki/Vertex_Specification) - Detailed technical information about how vertex attributes are handled by OpenGL. Not suitable for beginners, but worth a read if you want a deeper understanding of what is going on.
* [OpenGL Wiki: Vertex Specification Best Practices](https://www.khronos.org/opengl/wiki/Vertex_Specification_Best_Practices) - An easier read, worthwhile if you are thinking about making changes to your vertex attributes to increase performance performance.


## Overview

### VertexArrays (aka VertexArrayObjects)

To provide data to the GPU, the program need to set up one or more "attributes" (the exact number depends on how many attributes the vertex shader program is using). These vertex attributes are stored in a luma.gl `VertexArray` instance.

A `VertexArray` can be thought of as a small conceptual array (typically around 16 entries long) referenced by indices (aka "locations") from 0 and up, where each location contains one attribute.

Each attribute is a an array of numbers stored in GPU Memory (together with some metadata describing how the GPU should access that memory).


### Attribute Properties and Accessors

Apart from the data that will be accessible in shaders, a `VertexArray` manages the following properties for each attribute:

- Data type information: `size` (1-4 values per vertex), `type`
- Data layout information: `offset`, `stride`.
- An instance `divisor` (which enables/disables instancing) **WebGL2/Extension**.
- An integer normalization policy (see below).
- An integer conversion policy (see below) **WebGL2**.


### Attribute Locations

Methods in this class take a `location` index to specify which vertex attribute in the array they are operating on. This location needs to be matched with the location (i.e. index) selected by the compiler when compiling a Shader. Therefore it is usually better to work with symbolic names for vertex attributes, which is supported by other luma.gl classes.


### Using Program Metadata

After a `Program` compiles and links its shaders, it extracts information about which attributes, uniforms etc were found in the shader, which locations these were mapped to, and information about data types etc based on the declarations in the shader code.

This information can be used by the `VertexArray` class and enables applications to specify attributes in a symbolic way, rather than referring to locations by numbers.

```js
const program = new Program(gl, {vs, fs});
const vertexAttribute = new VertexAttribute(gl, {program}); // Reads attribute metadata from program
vertexAttribute.setAttributes({color: ...}); // Now possible to reference attributes by name
```


### Buffer Attributes

The "standard" use case is to allocate on buffer per attribute:

```js
vertexArray.setAttributes({
  positions: new Buffer(gl, {...}),
  colors: new Buffer({offset: BUFFER2_START, ...})
});
```

### Constant Attributes

luma.gl provides extensive support for [constant attributes](https://www.khronos.org/opengl/wiki/Vertex_Specification#Non-array_attribute_values).

```js
vertexArray.setAttributes({
  colors: new Uint8Array([1, 0, 0, 1])
});
```

Remarks:

* The term "constant attribute" is luma.gl-specific. WebGL/OpenGL literature usually talks about "disabled" attributes, or "non-array" attributes.
* Constant attributes are not considered a high-priority use case by OpenGL GPU driver developers, so using constants may not be faster than using buffers, and native OpenGL apps are  sometimes recommended to avoid them, e.g. by creating "dummy" buffers with repeated constants.
* However, in WebGL applications, the tradeoffs are different. The cost of allocating and populating big arrays using JavaScript on the CPU is higher and typically worth avoiding, even if this comes at some cost in GPU rendering speed, and memory savings are also more valuable in browser environments.


### Attributes as Views into Buffers

By working with offsets, it is possible to have several attributes reference different memory areas in a single buffer. To make this work, set several attributes to the same buffer, with different metadata/accessor information for each.

```js
const largeBuffer = new Buffer(gl, ...);
const BUFFER1_START = 0;
const BUFFER1_START = 100;

vertexArray.setAttributes({
  positions: [largeBuffer, new Accessor({offset: BUFFER1_START, ...})],
  colors: [largeBuffer, new Accessor({offset: BUFFER2_START, ...})]
});
```

### Interleaving Data

By working with strides and offsets you can "interleave" several attributes in a single buffer.

| position1 | color1  | position2 | color2  | position3 | color3  |
| ---       | ---     | ---       | ---     | ---       | ---     |
| [x,y,z]   | [r,g,b] | [x,y,z]   | [r,g,b] | [x,y,z]   | [r,g,b] |

```js
const interleavedBuffer = new Buffer(gl, ...);
const STRIDE = 3 * 4 + 3 * 1; // 3 floats (x,y,z) and 3 bytes (r,g,b)
const COLOR_OFFSET = 3 * 4; // 3 floats (x,y,z)

vertexArray.setAttributes({
  positions: [interleavedBuffer, new Accessor({stride: STRIDE, offset: 0, ...})],
  colors: [interleavedBuffer, new Accessor({stride: STRIDE, offset: COLOR_OFFSET, ...})]
});
```

Note: The performance gains of interleaving data will vary between GPUs. On modern desktop GPUs the difference may be small enough (or even slightly negative) such that the additional complexity is not justified. However, the gains might be more noticeable on less powerful platforms (e.g. mobile or older GPUs) and therefore still worthwhile overall. Profiling is recommended.


### Instanced Attributes

Attributes can be instanced by adding a divisor to the accessor


### Streaming Attributes

Special techniques like double buffering, "nulling", etc can be applied to improve performance when frequently updating ("streaming") attributes. See references above.


### Integer to Float Conversion and Normalization

Integer values in attributes (e.g in an `Int32Array`) are converted to floats before being passed to the shader.

In addition, normalization, maps values stored in an integer format to a normalized floating point range before they are passed to the shader:
* `[-1,1]` (SNORM, for signed integers)
* `[0,1]` (UNORM, for unsigned integers)

In WebGL2, it is possible to disable automatic conversion of integers to integers, enabling shaders to work directly with integer values. This works with all the integer types: `gl.BYTE`, `gl.UNSIGNED_BYTE`, `gl.SHORT`, `gl.UNSIGNED_SHORT`, `gl.INT` and `gl.UNSIGNED_INT`.


### Transform Feedback

 For transform feedback operations, the `TransformFeedback` class holds the output buffers that will receive data from vertex shader varyings, complementing the `VertexArray` class which holds the input values. It is worth noting that the `TransformFeedback` class is quite similar to the `VertexArray` class in concept and API, they both read metadata from `Program` instances, etc.


## Background: How the GPU Accesses Attributes

GPUs shaders perform parallel processing on "vertices", and one "value" in each attribute is made available to the particular shader invocation that processes the corresponding "vertex".

At the start of shader execution, these indices (or 'locations') are matched with small integer indices assigned to shader attributes during shader compilation and program linking. This makes the data the application has set up in the vertex attributes available during shader execution. Vertex attributes thus represent one of the primary mechanisms for communication between JavaScript code and GPU code (GLSL shaders).

* Attributes contains the data for each vertex, i.e. each GPU call.
* Attributes are typically backed by a [`WebGLBuffer`](/docs/api-reference/webgl/buffer.md) that stores unique values for each vertex/instance, combined with information about the layout of data in the memory managed by the buffer.
* Attributes can also be set to a single "constant" vertex value instead of a full buffer/array. This single value will then be passed to every invocation of the vertex shader effectively representing a constant attribute value. A typical example could be to specify a single color for all vertices, instead of providing a buffer with unique colors per vertex.


## Remarks

> There are a suprising number of API complications and "gotchas" when using WebGL VertexArrayObjects. The various issues and version differences described here are handled by the luma.gl `VertexArray` API.

* Constant attributes: In raw WebGL, constant values are stored on the WebGL context, not the `VertexArrayObject`. Also these "global" values are reset every time a vertex attribute is enabled (set to a buffer). luma.gl transparently works around this by updating the constants on the WebGLRenderingContext every time a `VertexArray` is bound.
* Constant attributes: Attribute location 0 cannot be set to a constant (i.e. cannot be disabled) in desktop OpenGL and in some desktop browsers (notably desktop Safari) this limitation also affects WebGL. In these cases, luma.gl transparently works around this issue by creating a buffer with the constant value repeated.

* WebGL2: The raw WebGL APIs for `WebGLVertexArray`s are exposed differently in the WebGL1 extension and WebGL2. As always, the luma.gl `VertexArray` class transparently handles the necessary API detection and selection.
* `ANGLE_instanced_arrays`: This extension allows instance divisors to be set, enabling instanced rendering under WebGL1.
* **`OES_VertexArray` Extension** Enables the application to create and "VertexArray"s to save and restore the entire global vertex attribute array with a single operation.


### WebGL2

* Setting instance divisors no longer requires a WebGL extension.
* `VertexArrays` no longer require using a WebGL extension.
* Adds support for exposing integer attribute values directly to shaders (without those values first being auto-converted to floats) The improvements cover both constant and buffer-valued attributes.
