# Attributes

:::info
Note that while **attributes** is a structured and performant mechanism to provide columnar data to shaders that works on both WebGPU and WebGL, they are rather rigid and have a number of limitations. In WebGPU a more significantly more flexible approach is to use [storage buffers](./gpu-storage-buffers).
:::

The traditional 3D GPU execution model is that shaders work on vertexes, each vertex having a number of unique values such as position, normal, texture coordinates etc. 

In this model, the purpose of GPU vertex **attributes** is to 
let the application provide arrays of vertex data
describing the 3D models that are to be rendered.
Each attribute would be an array containing values for each vertex such as positions, normals, texture coordinates).

More generally, in this model a GPU can be thought of as operating on "binary columnar tables", where:
- Attributes are "columnar binary arrays" with the same number of elements that each contain one value for each row. 
- Each column is an array of either floating point values, or signed or unsigned integers.
- A row can use up either a single value, or represent a vector of 2, 3 or 4 elements.
- All rows in a column must be of the same format (single value or vector)

## Structure

In luma.gl attribute structure is described by two complementary concepts:

A `ShaderLayout` describes the static structure of attributes 
declared in the shader source code. This includes:
- the "location" (the index of the attribute in the GPU's attribute bank)
- the type of the attribute declared in the shader (f32, i32, u32), and number of components.
- a step mode ('vertex' or 'instance').
- whether calculations will be performed in integer or floating point arithmetic.

A `BufferLayout` describes the dynamic structure of one buffer (the actual GPU memory) 
that is expected be bound to the pipeline before `draw()` or `run()` is called. 
Specifically it

## VertexFormats

The format of a vertex attribute indicates how data from a vertex buffer 
will be interpreted and exposed to the shader. Each format has a name that encodes
the order of components, bits per component, and vertex data type for the component.
The `VertexFormat` type is a string union of all the defined vertex formats.

See the [VertexFormat reference](/docs/api-reference/core/vertex-formats) for information about which formats are available..

Note that [WebGPU](https://www.w3.org/TR/webgpu/#vertex-state) is more restrictive than WebGL in terms of supported data formats for vertex attributes.

## Buffer Memory Layout

A `BufferLayout` enumerates the attributes that will be read from the memory in each bound buffer.
- the data format of the memory in the buffer, i.e: the primitive data type (float, int, short, byte etc)
- and the number of components per "row" or "vertex"
- the data format also describes if the memory represents normalized integers.

Note that data formats are allowed to differ between attributes even when they are stored in the same GPU buffer.

## Interleaved Data

While buffers supplied by applications to define attribute values often contain 
only a contiguous block of memory for a single attribute, a buffer can also be set up to 
contain the memory for multiple attributes, either in sequence, or interleaved.

## Binding Buffers

Attributes define binding points for memory arrays in the form of `Buffer`s. 

The structure (memory layout and format) of these memory contained in these buffers.
must match the constraints imposed by the shader source code, 
and the structure of the data in the buffers must also be communicated to the GPU.

## Index Buffers

An index buffer can be provided to provide a list of indices into the vertex array attributes. This allows vertexes to be reordered, filtered out, or duplicated without copying / modifying any memory other than the index array.
