# Attributes

Attributes are the main mechanism through which the application feeds data to the GPU.

Attributes are (potentially long) arrays stored in GPU Memory, with metadata describing how the GPU should access that memory.

Note: GPUs shaders do parallel processing on an array of vertices, and one value in the attributes is made available to the particular shader invocation that processes the corresponding "vertex". Because of this, WebGL documentation often refers to "attributes" as "vertex attributes".


## Attribute Arrays

Each shader can make use of multiple attributes. To allow multiple attributes to be staged so that the shader can access them, WebGL provides an attribute array class (VertexArray).



## Transform Feedback


To provide data to the GPU, the program need to prepare one or more "attributes" (the exact number depends on the vertex shader program).

Attributes contains the data for each vertex, i.e. each GPU call.

Attributes are typically backed by GPU Buffers but can also be set to a constant value.


## Attributes as Views into Buffers


## Interleaving Data

Note: The performance gains of interleaving data will vary between GPUs. On modern GPUs the difference may be small enough that the additional complexity is not justified.


## Instanced Attributes



## Constant Attributes

Constant attributes


## VertexArrays (aka VertexArrayObjects)


In WebGL, sets of attributes are managed through `VertexArrayObjects`


## Remarks

* Attributes are sometimes referred to as "vertex attributes"
