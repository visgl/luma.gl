# GPU Buffers

GPU buffers are effectively arrays of contiguous memory that has been "uploaded" to the GPU and can be accessed efficiently by the GPU.

References:
* [OpenGL Wiki: Buffer Object](https://www.khronos.org/opengl/wiki/Buffer_Object)


## Buffer Features

In WebGL1, buffers can be:

* initialized to a certain size
* initialized to a size and data uploaded.
* a sub section of the data can be updated

Buffers were significantly improved in WebGL2. In WebGL2 it is possible to:

* copy data directly between buffers on the GPU (without "involving" the CPU)
* read back data from GPU buffers to the CPU


## Buffer Uses

In WebGL1 buffers are mainly used to

* store vertex attributes, i.e. long arrays of the same value (type), int float etc.

In WebGL2 buffers can also be used to:

* Receive output of GPU computations
* Store image data
* Store uniforms


## Buffer Types

WebGL defines a number of binding points for buffers. These are all managed under the hood by luma.gl. In WebGL buffer can be used repeatedly to represent different types of data (i.e. bound to different WebGL binding points) with one exception.

Any buffer that has been used to describe indices (`target: GL.ELEMENT_ARRAY_BUFFER`), can not be used in any other context.


## Buffer Usage

Buffers have a `usage` parameter that is a hint describing how they are updated. The default value is `GL.STATIC_DRAW`.


## Performance Considerations

### Memory Transfer

The cost of transferring memory between CPU and GPU depends on many factors. E.g. on whether your GPU is using a unified memory architecture or not, the memory bandwidth of your system etc.

Some good rules of thumb:

* Uploading memory to GPU buffers is typically very fast, but not completely free.
* Download of memry from GPU buffers can be quite slow, due to synchronous WebGL API and GPU pipeline stalls.
* Copying between GPU Buffers (WebGL2), while not free, should be considered very fast.


### Buffer Updates

When updating buffers setting the `usage` parameter on creation can have an impact.
