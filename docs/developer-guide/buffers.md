# GPU Buffers

GPU buffers are effectively arrays of contiguous memory that has been "uploaded" to the GPU and can be accessed efficiently by the GPU.

The cost of transferring memory between CPU and GPU depends. E.g. on whether your GPU is using a unified memory architecture or not, the memory bandwidth of your system etc. 

A good rule of thumb:

* Uploading memory to GPU buffers is typically very fast, but not completely free.
* Download of memry from GPU buffers can be quite slow, due to synchronous WebGL API and GPU pipeline stalls.


## WebGL2 vs WebGL1

The WebGL Buffer API was significantly improved in WebGL2. It is now possible to copy data directly between buffers on the GPU and to read back data from buffers.


