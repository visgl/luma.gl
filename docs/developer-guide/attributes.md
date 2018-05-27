# Attributes

Attributes are the mechanism through which the application feeds data to the GPU.

Attributes are (potentially long) arrays stored in GPU Memory, with metadata describing how the GPU should access that memory.

Note: GPUs shaders do parallel processing on an array of vertices, and one value in the attributes is made available to the particular shader invocation that processes the corresponding "vertex". Because of this, WebGL documentation often refers to "attributes" as "vertex attributes".


## Attribute Arrays

Each shader can make use of multiple attributes. To allow multiple attributes to be staged so that the shader can access them, WebGL provides an attribute array class (VertexArray).



## Transform Feedback




