# WebGL2

A short overview of WebGL2 and some of the additions to the luma.gl API that have been made to support it.

## New Classes

* `Texture2DArray`, `Texture3D` - for e.g. "texture atlases"
* `Query` - Asynchronously query for occlusions, transform feedback, timings
* `Sampler` - Let's shaders sample same texture in different ways
* `FenceSync` - Get notified when GPU reaches certain point in command stream
* `TransformFeedback` - Get output from vertex shaders
* `VertexArrayObject` - Stores multiple attribute bindings

Note that `VertexArrayObject` and `Query` can be used in WebGL1 with certain restrictions.

## WebGL2 - Features added to existing API

* WebGL2 constants added to `GL` export

* Textures
    * Can now created from `WebGLBuffers` in addition to typed arrays
    * Tons of new texture formats
    * Compressed textures from

    * GLSL `dFdx`, `dFdy` Texture derivatives - (e.g. to compute normals in fragment shader)
    * GLSL `texelFetch` - (e.g. for manual bilinear filtering)
    * GLSL `textureGrad` - (e.g. for tweaking mipmap levels)
    * Immutable texture?
    * Integer texture - uint sampler
    * Texture LOD
    * GLSL `textureOffset`
    * pixelStore
    * srbg
    * texture vertex (e.g. for displacement mapping)

* Vertex Formats (GL.HALF_FLOAT)

* GLSL
    * centroid
    * discard
    * flat_smooth_interpolators
    * non_square_matrix

* TBD
    * Uniform buffers

* Misc
    * New blending modes: `GL.MIN` and `GL.MAX`

* Efficiency

WebGL2 introduces objects that collect state allowing applications to switch state with a single call:

* `VertexArrayObject`s - holds a set of vertex array buffer bindings
* Uniform Buffers - holds a set of uniforms
* `Sampler` - holds a set of texture sampling parameters
* `TransformFeedback` - holds a set of transform feedback output buffer bindings.

* Uniform Buffers

luma.gl provides a `UniformBufferLayout` helper class to make manipulation of uniform values in an `std140 memory layout easy.
