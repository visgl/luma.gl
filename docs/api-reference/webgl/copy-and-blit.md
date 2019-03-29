# Readback, Copy and Blit

`luma.gl` offers a set of functions that copy or blit data from and to Texture and Framebuffer objects. Image data can also be copied into Buffer, TypedArray, Images or Urls.


## Readback Functions

### readPixelsToArray(source : Framebuffer|Texture [, options: Object]) : TypedArray

Reads data from a `Framebuffer` or `Texture` object into a TypedArray object and returns it. A new TypedArray object is created when not provided. This method requires a sync between CPU and GPU as pixel values are copied from GPU texture memory to CPU Array object memory. This could introduce a delay as it waits for GPU to finish updating the texture. For asynchronous read, check `copyToBuffer` method.

  * `source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.

  Optional parameters:
  * `options.sourceX` - (*number*, default: 0) X offset of the area to be copied,
  * `options.sourceY` - (*number*, default: 0) Y offset of the area to be copied,
  * `options.sourceFormat` - (*GLenum*, default: GL.RGBA) The format of the data.
  * `options.sourceAttachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.
  * `options.target` - (*TypedArray*, default: null) Array object, into which data to be copied, new object is created when not provided.
  * `options.sourceWidth` - (*number*, default: source width) The width of the area to be copied.
  * `options.sourceHeight` - (*number*, default: source height) The height of the area to be copied.
  * `options.sourceType` - (*GLenum*, default: type of `pixelArray` or `UNSIGNED_BYTE`) The type of the data.

Notes:
  * Reading from floating point textures is dependent on an extension both in WebGL1 and WebGL2.
  * When supported, the `{format: GL.RGBA, type: GL.FLOAT, ...}` combination becomes valid for reading from a floating-point color buffer.
  * When color attachment is a float texture with format less than 4 channels, i.e, `GL.R32F`, or  `GL.RG32F`, `readPixels` should still be called with a 4 component `format`(`GL.RGBA`), and default value (R:0, G:0, B: 0 and A: 1) will be returned for un-used channel.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)

### readPixelsToBuffer(source : Framebuffer|Texture, options: Object) : Buffer (WebGL2)

Reads data from a `Framebuffer` or `Texture` object into A `Buffer` object and returns it. A new `Buffer` object is created when not provided. This method avoids a sync between CPU and GPU as pixel values are copied from GPU texture memory to GPU Buffer memory. This method returns right away without any delays.

A CPU and GPU sync will be triggered when the returned buffer data is read using `buffer.getData()`, but applications can delay this read, which can reduces the delay due to the sync, or the sync can be completely avoided by using the `Buffer` as the source of input to the GPU (either as `ARRAY_BUFFER` or `PIXEL_UNPACK_BUFFER`).

  * `source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.

  Optional parameters:
  * `options.sourceX` - (*number*, default: 0) X offset of the area to be copied,
  * `options.sourceY` - (*number*, default: 0) Y offset of the area to be copied,
  * `options.sourceFormat` - (*GLenum*, default: GL.RGBA) The format of the data.
  * `options.target` - (*Buffer*) Buffer object, into which data to be copied, new object is created when not provided.
  * `options.targetByteOffset` - (*number*, default: 0) Byte offset from which data should be copied into buffer.
  * `options.sourceWidth` - (*number*, default: source.width) The width of the area to be copied,
  * `options.sourceHeight` - (*number*, default: source.height) The height of the area to be copied,
  * `options.sourceType` - (*GLenum*, default: type of `target` or `UNSIGNED_BYTE`) The type of the data.

Notes:
  * Reading from floating point textures is dependent on an extension both in WebGL1 and WebGL2.
  * When supported, the `{format: GL.RGBA, type: GL.FLOAT, ...}` combination becomes valid for reading from a floating-point color buffer.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer), [`gl.bindBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer)


## Copy Functions

### copyToDataUrl(source : Framebuffer|Texture, options: Object) : Data URL

Reads data form a `Texture` or `Framebuffer` object and returns a `Data URL` containing the pixel data in PNG format.

  * `source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.

  Optional parameters:
  * `options.sourceAttachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.
  * `options.targetMaxHeight` - (*number*, default: Number.MAX_SAFE_INTEGER) Maximum height of the image to be in returned Data URL.

Note:
  * Works only under a browser environment, doesn't work under Node.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)

### copyToImage(source : Framebuffer|Texture, options: Object) : Image

Reads data form a `Texture` or `Framebuffer` object and copies it to provided image, new `Image` instance is created if not provided.

  * `source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.

  Optional parameters:
  * `options.sourceAttachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.
  * `options.targetImage` - (`Image`, Optional) `Image` to to which pixel data to be copied, new one is created if not provide.

Note:
  * Works only under a browser environment, doesn't work under Node.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)

### copyToTexture(source : Framebuffer|Texture, target: Texture|GL-enum, options: Object) : Texture

Copies pixels from a `Framebuffer` or `Texture` object into the specified area of a two-dimensional texture image or cube-map texture image. (gl.copyTexImage2D, gl.copyTexSubImage2D and gl.copyTexSubImage3D wrapper)

  * `source` (`Texture` or `Framebuffer`) - If provided this object will be bound and data copied from it.
  * `target` (`Texture` or `GL enum`) - Texture object or GL enum specifying the target binding point, to which data to be copied. If target binding point is specified, it is assumed that a valid texture object is already bound.
  * `options.sourceX` (`GLint`, optional, default: 0) - x coordinate of the lower left corner where to start copying.
  * `options.sourceY` (`GLint`, optional, default: 0) - y coordinate of the lower left corner where to start copying.
  * `options.targetX` (`GLint`, optional) - X offset with in target texture.
  * `options.targetY` (`GLint`, optional) - Y offset with in target texture.
  * `options.targetZ` (`GLint`, optional, WebGL2) - Z offset with in target texture, when using copying into 2D Array of 3D texture.
  * `options.width` (`GLint`, optional, default: texture.width) - Width of the pixel rectangle to be copied.
  * `options.height` (`GLint`, optional, default: texture.height) - Height of the pixel rectangle to be copied.

Notes:
  * `targetX`, `targetY`, `targetZ` : when an offset is specified, it implies we are copying data into a sub region of the target texture and internally `gl.copyTexSubImage2D` or `gl.copyTexSubImage3D` are used based on the `target`, for these cases it is assumed that target texture has enough GPU memory already allocated. When none of the offsets are specified, `gl.copyTexImage2D` is used to copy data to entire target region and GPU memory is allocated if needed, target texture GPU memory doesn't have to be pre-allocated.

This function makes calls to the following WebGL APIs:

[`gl.copyTexImage2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D), [`gl.copyTexSubImage2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D) and [`gl,copyTexSubImage3D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/copyTexSubImage3D)


## Blit Functions

### blit(options: Object) : (WebGL2)

Copies a rectangle of pixels from a `Texture` or `Framebuffer` object into a `Texture` or `Framebuffer` object.

  * `source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `options.target` (`Texture` or `Framebuffer`) - This object will be bound and data is copied into it.
  * `options.sourceAttachment` (`GLenum`, default: `COLOR_ATTACHMENT0`) - Attachment index from which data to be copied from.
  * `options.sourceX0` (`GLint`, default: `0`) - Lower X bound of copy rectangle in source.
  * `options.sourceY0` (`GLint`, default: `0`) - Lower Y bound of copy rectangle in source.
  * `options.sourceX1` (`GLint`) - Higher X bound of copy rectangle in source.
  * `options.sourceY1` (`GLint`) - Higher Y bound of copy rectangle in source.
  * `options.targetX0` (`GLint`, default: `0`) - Lower X bound of copy rectangle in destination.
  * `options.targetY0` (`GLint`, default: `0`) - Lower Y bound of copy rectangle in destination.
  * `options.targetX1` (`GLint`) - Higher X bound of copy rectangle in destination.
  * `options.targetY1` (`GLint`) - Higher Y bound of copy rectangle in destination.
  * `options.mask` (`GLbitfild`, default: `0`) - A `GLbitfield` specifying a bitwise OR mask indicating which buffers are to be copied, possible buffers masks are `GL.COLOR_BUFFER_BIT`, `GL.DEPTH_BUFFER_BIT` and ` GL.STENCIL_BUFFER_BIT`
  * `options.color` (`Boolean`, default: `true`) - When true `GL.COLOR_BUFFER_BIT` is added to the mask.
  * `options.depth` (`Boolean`, default: `false`) - When true `GL.DEPTH_BUFFER_BIT` is added to the mask.
  * `options.stencil` (`Boolean`, default: `false`) - When true `GL.STENCIL_BUFFER_BIT` is added to the mask.
  * `options.filter`=`GL.NEAREST` - specifies interpolation mode if stretching is needed. `GL.LINEAR` can be used exclusively for color buffers.

Notes:
  * There are a number of restrictions when blitting between integer and floating point formats.

This function makes calls to the following WebGL APIs:

[`gl.blitFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/blitFramebuffer), [`gl.readBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/readBuffer), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)
