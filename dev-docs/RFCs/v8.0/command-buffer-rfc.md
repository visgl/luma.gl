# RFC: CommandBuffer Style Copy API for GPU Compute

**Author**: Ib Green
**Date**: Oct 22, 2019
**Status**: Draft

References

- [WebGPU CommandBuffer](https://gpuweb.github.io/gpuweb/#command-buffer)
- [WebCLCommandEncoder API](https://www.khronos.org/registry/webcl/specs/1.0.0/#3.5)
- [Vulkan Copy Commands](https://www.khronos.org/registry/vulkan/specs/1.0/pdf/vkspec.pdf)
- [RFC](https://github.com/uber/luma.gl/blob/master/dev-docs/RFCs/v7.0/framebuffer-texture-api-rfc.md). Similar methods were moved to global scoped functions in luma.gl v7.0, and in some sense this proposal can be seen as a continuation in the same direction.

## Abstract

This RFC proposes a set of GPGPU-focused global methods for interchangeably copying data between buffer and texture objects (primarily `copyBufferToBuffer`, `copyTextureToTexure`, `copyBufferToTexture`, `copyTextureToBuffer`). The new APIs are modelled after (and can be implemented on top of) "command buffer type functions/classes" in modern GPU APIs.

## Motivations

The current set of global texture read/copy/write functions are still designed around the graphics use case and are not "GPGPU programmer friendly", in particular when working with data textures.

It is not immediately clear how to copy data between buffers and textures in the current API, and knowledge of one type of copy function is not sufficient to suggest what the orthogonal copy functions would be.

Also:
- Command Buffer type APIs appear to be present in most modern graphics APIs, but are currently missing in the OpenGL-based luma.gl API (see references above and appendices).
- In general, it is desirable for the luma.gl API to evolve towards the WebGPU API, as this will enable a future WebGPU port of luma.gl to take maximum advantage of WebGPU.

## Proposal: Primary Functions for GPU-side copying

| Proposed Function         | Current  |
| ---                       | ---         |
| `copyBufferToBuffer`      | `Buffer.copy` Current version only WebGL2 |
| `copyTextureToTexture`    | `setTextureImageData`, `setTextureSubImageData`, `setImage3D`? |
| `copyBufferToTexture`     | `setTextureImageData`, `setTextureSubImageData`, `setImage3D`? |
| `copyTextureToBuffer`     | `readPixelsToBuffer` |

WebGPU also has the following function, for completeness. Does not seem critical at this time, however we are moving towards `ImageBitmap` in v8.0, and this is part of the WebGPU standard...

| Proposed Function          | Current  |
| ---                        | ---         |
| `copyImageBitmapToTexture` |  `copyToTexture`? |

## Proposal: Existing Graphics Focused Functions

| Proposed Function       | Current  |
| ---                     | ---         |
|  `copyToDataUrl`        | Rename to `copyTextureToDataUrl` |
|  `copyToImage`          | Rename to `copyTextureToImage`? Add new `copyTextureToImageBitmap`? |
|  `copyToTexture`        | |
|  `blit`                 | |
|  `copyToTexture`        | |
|  setTextureImageData    | |
|  setTextureSubImageData | |
|  setImage3D             | |

## Open Questions

- There are some limitations around data textures and buffers. Some operations cannot be done in WebGL1, should we try to "polyfill" them in this API, or create FEATURES to detect what can be done.
- Should the existing "graphics" functions be rewritten to just call the new "GPGPU" functions?
- `copyToImage` loaders.gl v2.0 returns an ImageBitmap if platform supports it (and also allows control with an option). Should this function implement similar semantics?

## Appendix: WebGPU Command Encoder

```
interface GPUCommandEncoder {
    GPURenderPassEncoder beginRenderPass(GPURenderPassDescriptor descriptor);
    GPUComputePassEncoder beginComputePass(optional GPUComputePassDescriptor descriptor = {});

    void copyBufferToBuffer(
        GPUBuffer source,
        GPUBufferSize sourceOffset,
        GPUBuffer destination,
        GPUBufferSize destinationOffset,
        GPUBufferSize size);

    void copyBufferToTexture(
        GPUBufferCopyView source,
        GPUTextureCopyView destination,
        GPUExtent3D copySize);

    void copyTextureToBuffer(
        GPUTextureCopyView source,
        GPUBufferCopyView destination,
        GPUExtent3D copySize);

    void copyTextureToTexture(
        GPUTextureCopyView source,
        GPUTextureCopyView destination,
        GPUExtent3D copySize);

    void copyImageBitmapToTexture(
        GPUImageBitmapCopyView source,
        GPUTextureCopyView destination,
        GPUExtent3D copySize);

    void pushDebugGroup(DOMString groupLabel);
    void popDebugGroup();
    void insertDebugMarker(DOMString markerLabel);

    GPUCommandBuffer finish(optional GPUCommandBufferDescriptor descriptor = {});
};
```

## Appendix WebCL: WebCLCommandQueue

```
interface WebCLCommandQueue {

  ////////////////////////////////////////////////////////////////////////////
  //
  // Copying: Buffer <-> Buffer, Image <-> Image, Buffer <-> Image
  //

  void enqueueCopyBuffer(
                    WebCLBuffer                           srcBuffer,
                    WebCLBuffer                           dstBuffer,
                    CLuint                                srcOffset,
                    CLuint                                dstOffset,
                    CLuint                                numBytes,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueCopyBufferRect(
                    WebCLBuffer                           srcBuffer,
                    WebCLBuffer                           dstBuffer,
                    sequence<CLuint>                      srcOrigin,
                    sequence<CLuint>                      dstOrigin,
                    sequence<CLuint>                      region,
                    CLuint                                srcRowPitch,
                    CLuint                                srcSlicePitch,
                    CLuint                                dstRowPitch,
                    CLuint                                dstSlicePitch,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueCopyImage(
                    WebCLImage                            srcImage,
                    WebCLImage                            dstImage,
                    sequence<CLuint>                      srcOrigin,
                    sequence<CLuint>                      dstOrigin,
                    sequence<CLuint>                      region,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueCopyImageToBuffer(
                    WebCLImage                            srcImage,
                    WebCLBuffer                           dstBuffer,
                    sequence<CLuint>                      srcOrigin,
                    sequence<CLuint>                      srcRegion,
                    CLuint                                dstOffset,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueCopyBufferToImage(
                    WebCLBuffer                           srcBuffer,
                    WebCLImage                            dstImage,
                    CLuint                                srcOffset,
                    sequence<CLuint>                      dstOrigin,
                    sequence<CLuint>                      dstRegion,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  ////////////////////////////////////////////////////////////////////////////
  //
  // Reading: Buffer -> Host, Image -> Host
  //

  void enqueueReadBuffer(
                    WebCLBuffer                           buffer,
                    CLboolean                             blockingRead,
                    CLuint                                bufferOffset,
                    CLuint                                numBytes,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueReadBufferRect(
                    WebCLBuffer                           buffer,
                    CLboolean                             blockingRead,
                    sequence<CLuint>                      bufferOrigin,
                    sequence<CLuint>                      hostOrigin,
                    sequence<CLuint>                      region,
                    CLuint                                bufferRowPitch,
                    CLuint                                bufferSlicePitch,
                    CLuint                                hostRowPitch,
                    CLuint                                hostSlicePitch,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueReadImage(
                    WebCLImage                            image,
                    CLboolean                             blockingRead,
                    sequence<CLuint>                      origin,
                    sequence<CLuint>                      region,
                    CLuint                                hostRowPitch,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  ////////////////////////////////////////////////////////////////////////////
  //
  // Writing: Host -> Buffer, Host -> Image
  //

  void enqueueWriteBuffer(
                    WebCLBuffer                           buffer,
                    CLboolean                             blockingWrite,
                    CLuint                                bufferOffset,
                    CLuint                                numBytes,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueWriteBufferRect(
                    WebCLBuffer                           buffer,
                    CLboolean                             blockingWrite,
                    sequence<CLuint>                      bufferOrigin,
                    sequence<CLuint>                      hostOrigin,
                    sequence<CLuint>                      region,
                    CLuint                                bufferRowPitch,
                    CLuint                                bufferSlicePitch,
                    CLuint                                hostRowPitch,
                    CLuint                                hostSlicePitch,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  void enqueueWriteImage(
                    WebCLImage                            image,
                    CLboolean                             blockingWrite,
                    sequence<CLuint>                      origin,
                    sequence<CLuint>                      region,
                    CLuint                                hostRowPitch,
                    ArrayBufferView                       hostPtr,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  ////////////////////////////////////////////////////////////////////////////
  //
  // Executing kernels
  //

  void enqueueNDRangeKernel(
                    WebCLKernel                           kernel,
                    CLuint                                workDim,
                    sequence<CLuint>?                     globalWorkOffset,
                    sequence<CLuint>                      globalWorkSize,
                    optional sequence<CLuint>?            localWorkSize,
                    optional sequence<WebCLEvent>?        eventWaitList,
                    optional WebCLEvent?                  event);

  ////////////////////////////////////////////////////////////////////////////
  //
  // Synchronization
  //

  void enqueueMarker(WebCLEvent event);

  void enqueueBarrier();

  void enqueueWaitForEvents (sequence<WebCLEvent> eventWaitList);

  void finish(optional WebCLCallback whenFinished);

  void flush();

  ////////////////////////////////////////////////////////////////////////////
  //
  // Querying command queue information
  //

  any getInfo(CLenum name);

  void release();
};
```
