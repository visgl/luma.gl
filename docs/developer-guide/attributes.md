# Attributes

Attributes are the main mechanism through which the application feeds data to the GPU.

Attributes are "flat" arrays of numbers stored in GPU Memory (together with some metadata describing how the GPU should access that memory).

Note: GPUs shaders do parallel processing on an array of vertices, and one value in the attributes is made available to the particular shader invocation that processes the corresponding "vertex". Because of this, WebGL documentation often refers to "attributes" as "vertex attributes".

To provide data to the GPU, the program need to prepare one or more "attributes" (the exact number depends on the vertex shader program).

* Attributes contains the data for each vertex, i.e. each GPU call.
* Attributes are typically backed by GPU Buffers but can also be set to a constant value.


## VertexArrays (aka VertexArrayObjects)

A shader can make use of multiple attributes. To allow multiple attributes to be staged so that the shader can access them, WebGL provides so called vertex attribute objects (managed by the luma.gl `VertexArray` class).

In WebGL, sets of attributes are managed through `VertexArrayObjects`


### About Vertex Attributes

In WebGL, **vertex attributes** (often just called **attributes**) are input data to the Vertex Shader, the first shader stage in the GPU rendering pipeline.

These vertex attributes are stored in a "conceptual" array with indices from 0 and up, where each  This array is referred to as a `VertexArrayObject`, or `VertexArray` for short).

At the start of shader execution, these indices (or 'locations') are matched with small integer indices assigned to shader attributes during shader compilation and program linking. This makes the data the application has set up in the vertex attributes available during shader execution. Vertex attributes thus represent one of the primary mechanisms for communication between JavaScript code and GPU code (GLSL shaders).



## Attributes as Views into Buffers


## Interleaving Data

Note: The performance gains of interleaving data will vary between GPUs. On modern GPUs the difference may be small enough that the additional complexity is not justified.


## Constant Attributes

Constant attributes


## Attribute Metadata

### Instanced Attributes



## Transform Feedback


### Global Vertex Array

Note that while you can create your own `VertexArrays` there is a global "vertex attributes array" that is always available (even in core WebGL1) which is where vertex data is staged for vertex shader execution.


### Vertex Attribute API

* Methods in this class take a `location` index to specify which vertex attribute in the array they are operating on. This location needs to be matched with the location (i.e. index) selected by the compiler when compiling a Shader. Therefore it is usually better to work with symbolic names for vertex attributes, which is supported by other luma.gl classes.
* It is strongly recommended to only enable attributes that are actually used by a program. Other attributes can be left unchanged but disabled.


### Vertex Attribute Values and Properties

Each vertex attribute has these properties:
- A value (constant or a buffered array with one set of values per vertex) that is accessible in shaders.
- Enabled status: Can be enabled or disabled.
- Data layout information: `size` (1-4 values per vertex), `type`, `offset`, `stride`.
- An instance `divisor` (which enables/disables instancing) **WebGL2/Extension**.
- An integer normalization policy (see below).
- An integer conversion policy (see below) **WebGL2**.

Normally attributes are set to a [`WebGLBuffer`](/docs/api-reference/webgl/buffer.md) that stores unique values for each vertex/instance, combined with information about the layout of data in the memory managed by the buffer.

Attributes can also be set to a single "constant" vertex value instead of a full buffer/array. This single value will then be passed to every invocation of the vertex shader effectively representing a constant attribute value. A typical example could be to specify a single color for all vertices, instead of providing a buffer with unique colors per vertex.


### Integer to Float Conversion and Normalization

Integer values in attributes (e.g in an `Int32Array`) are converted to floats before being passed to the shader.

In addition, normalization, maps values stored in an integer format to a normalized floating point range before they are passed to the shader:
* `[-1,1]` (SNORM, for signed integers)
* `[0,1]` (UNORM, for unsigned integers)

In WebGL2, it is possible to disable automatic conversion of integers to integers, enabling shaders to work directly with integer values. This works with all the integer types: `gl.BYTE`, `gl.UNSIGNED_BYTE`,
`gl.SHORT`, `gl.UNSIGNED_SHORT`, `gl.INT` and `gl.UNSIGNED_INT`.


### WebGL2 Changes

> The differences described here are hidden by the luma.gl `VertexArray` API.

The raw WebGL APIs for `WebGLVertexArray`s are exposed differently in the WebGL1 extension and WebGL2. As always, the luma.gl `VertexArray` class transparently handles the necessary API detection and selection.

**`ANGLE_instanced_arrays` Extension** Allows instance divisors to be set, enabling instanced rendering.
* **`OES_VertexArray` Extension** Enables the application to create and "VertexArray"s to save and restore the entire global vertex attribute array with a single operation. luma.gl provides a class wrapper for `VertexArrays`.

* Setting instance divisors no longer requires a WebGL extension.
* `VertexArrays` no longer require using a WebGL extension.
* Adds support for exposing integer attribute values directly to shaders (without those values first being auto-converted to floats) The improvements cover both constant and buffer-valued attributes.



## Remarks

* Attributes are sometimes referred to as "vertex attributes"
* Note: WebGL documentation often refers to "attributes" as "vertex attributes". The reason is that shaders do parallel processing on "vertices", and one value in each attribute is made available to the particular shader invocation that processes the corresponding "vertex".
