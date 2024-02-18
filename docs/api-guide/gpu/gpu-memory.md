# GPU Memory

Memory on GPU is managed through [Buffer](/docs/api-guide/gpu/gpu-buffers) and [Texture](/docs/api-guide/gpu/gpu-textures) resources.

This article provides some background information on how GPU memory works that can be helpful in understanding limitations and performance characteristics.

## Memory Upload Considerations

Many GPUs are separated from the main CPU and cannot directly access main memory. 

There are configurations, such as built-in GPUs like Intel Iris, that share memory with the CPU using a "Unified Memory Architecture". 

While the upload and download of data between GPU and CPU is still very fast, it does add complications:
- requires copying of potentially big memory blocks which takes some time
- can increase memory pressure by permanently or temporarily requiring the application to allocate two copies of each memory block, one on the GPU and one on the CPU.
- makes the amount of memory limited to whichever is smaller, GPU memory or CPU memory.

In addition, this means that upload and download API is asynchronous which can add additional complexity to applications.

## Memory Operation Synchronization

A GPU memory read or write may not always be completed immediately.

GPUs executes its own commands queues independently from the CPU (the GPU and GPU driver may even optimize execution by rearranging order of operations). Therefore, to avoid unpredictable results, GPUs typically track the memory dependencies of each GPU operation, making sure that all preceding commands affecting a Buffer or Texture have completed in order before issuing e.g. a write or read. 

This is sometimes referred to as a read forcing a synchronization of the GPU.

## Synchronous Reads

WebGL is plagued by a synchronous `Buffer` readout limitation. Not only does the CPU block while waiting for the computers DMA system to read out the memory from the GPU, it also forces a synchronization, meaning that now the GPU must complete any pending commands before the GPU gets control back and can continue execution.
 
Note that a WebGL extension does exist that enables asynchronous buffer reads, but it is not implemented on MacOS which is the primary development environment for luma.gl, so at the moment of writing it is not supported by luma.gl.
