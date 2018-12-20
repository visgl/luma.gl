# Copy and Blit

`luma.gl` offers a set of functions that copy or blit data from and to Texture and Framebuffer objects. Image data can also be copied into Buffer, TypedArray, Images or Urls.


### copyToArray(opts: Object) : TypedArray

Reads data from a `Framebuffer` or `Texture` object into a TypedArray object and returns it. A new TypedArray object is created when not provided. This method requires a sync between CPU and GPU as pixel values are copied from GPU texture memory to CPU Array object memory. This could introduce a delay as it waits for GPU to finish updating the texture. For asynchronous read, check `copyToBuffer` method.

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `opts.x` - (*number*, default: 0) X offset of the area to be copied,
  * `opts.y` - (*number*, default: 0) Y offset of the area to be copied,
  * `opts.width` - (*number*, default: source width) The width of the area to be copied,
  * `opts.height` - (*number*, default: framebuffer height) The height of the area to be copied,
  * `opts.format` - (*GLenum*, default: GL.RGBA) The format of the data.
  * `opts.type` - (*GLenum*, default: type of `pixelArray` or `UNSIGNED_BYTE`) The type of the data.
  * `opts.attachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.

Target options:
  * `opts.targetPixelArray` - (*TypedArray*, default: null) Array object, into which data to be copied.

Notes:
  * Reading from floating point textures is dependent on an extension both in WebGL1 and WebGL2.
  * When supported, the `{format: GL.RGBA, type: GL.FLOAT, ...}` combination becomes valid for reading from a floating-point color buffer.
  * When color attachment is a float texture with format less than 4 channels, i.e, `GL.R32F`, or  `GL.RG32F`, `readPixels` should still be called with a 4 component `format`(`GL.RGBA`), and default value (R:0, G:0, B: 0 and A: 1) will be returned for un-used channel.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


### copyToBuffer(opts: Object) : Buffer (WebGL2)

Reads data from a `Framebuffer` or `Texture` object into A `Buffer` object and returns it. A new `Buffer` object is created when not provided. This method avoids a sync between CPU and GPU as pixel values are copied from GPU texture memory to GPU Buffer memory. This method returns right away without any delays.

A CPU and GPU sync will be triggered when the returned buffer data is read using `buffer.getData()`, but applications can delay this read, which can reduces the delay due to the sync, or the sync can be completely avoided by using the `Buffer` as the source of input to the GPU (either as `ARRAY_BUFFER` or `PIXEL_UNPACK_BUFFER`).

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `opts.x` - (*number*, default: 0) X offset of the area to be copied,
  * `opts.y` - (*number*, default: 0) Y offset of the area to be copied,
  * `opts.width` - (*number*, default: framebuffer width) The width of the area to be copied,
  * `opts.height` - (*number*, default: framebuffer height) The height of the area to be copied,
  * `opts.format` - (*GLenum*, default: GL.RGBA) The format of the data.
  * `opts.type` - (*GLenum*, default: type of `buffer` or `UNSIGNED_BYTE`) The type of the data.

Target options:
  * `opts.buffer` - (*Buffer*) Buffer object, into which data to be copied.
  * `opts.byteOffset` - (*number*, default: 0) Byte offset from which data should be copied into buffer.

Notes:
  * Reading from floating point textures is dependent on an extension both in WebGL1 and WebGL2.
  * When supported, the `{format: GL.RGBA, type: GL.FLOAT, ...}` combination becomes valid for reading from a floating-point color buffer.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer), [`gl.bindBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer)


### copyToTexture(opts: Object) : Texture

Copies pixels from a `Framebuffer` or `Texture` object into the specified area of a two-dimensional texture image or cube-map texture image. (gl.copyTexImage2D, gl.copyTexSubImage2D and gl.copyTexSubImage3D wrapper)

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - If provided this object will be bound and data copied from it.
  * `opts.x` (`GLint`, optional, default: 0) - x coordinate of the lower left corner where to start copying.
  * `opts.y` (`GLint`, optional, default: 0) - y coordinate of the lower left corner where to start copying.

Target options:
  * `opts.texture` (`Texture`, optional) - If provided this object will be bound and data copied into it, if not provided `target` must be set and data will be copied to currenlty bound `Texture` object.
  * `opts.target` (`GLenum`, optional) - Binding point where target texture is currently bound. Either `texture` or `target` must be specified.
  * `opts.xoffset` (`GLint`, optional) - X offset with in target texture.
  * `opts.yoffset` (`GLint`, optional) - Y offset with in target texture.
  * `opts.zoffset` (`GLint`, optional, WebGL2) - Z offset with in target texture, when using copying into 2D Array of 3D texture.
  * `opts.width` (`GLint`, optional, default: texture.width) - Width of the target texture.
  * `opts.height` (`GLint`, optional, default: texture.height) - Height of the target texture.

Notes:
  * `xoffset`, `yoffset`, `zoffset` : when an offset is specified, it implies we are copying data into a sub region of the target texture and internally `gl.copyTexSubImage2D` or `gl.copyTexSubImage3D` are used based on the `target`, for these cases it is assumed that target texture has enough GPU memory already allocated. When none of the offsets are specified, `gl.copyTexImage2D` is used to copy data to entire target region and GPU memory is allocated if needed, target texture GPU memory doesn't have to be pre-allocated.

This function makes calls to the following WebGL APIs:

[`gl.copyTexImage2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexImage2D), [`gl.copyTexSubImage2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/copyTexSubImage2D) and [`gl,copyTexSubImage3D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/copyTexSubImage3D)


### copyToDataUrl(opts: Object) : Data URL

Reads data form a `Texture` or `Framebuffer` object and returns a `Data URL` containing the pixel data in PNG format.

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `opts.attachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.

Target options:
  * `opts.maxHeight` - (*number*, default: Number.MAX_SAFE_INTEGER) Maximum height of the image to be in returned Data URL.

Note:
  * Works only under a browser environment, doesn't work under Node.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


### copyToImage(opts: Object) : Image

Reads data form a `Texture` or `Framebuffer` object and returns a `Image` containing the pixel data in PNG format.

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `opts.attachment` - (*GLenum*, default: `COLOR_ATTACHMENT0`) Used to deduce the `type` when not provided.

Target options:
  * `opts.targetImage` - (`Image`, Optional) `Image` to to which pixel data to be copied, new one is created if not provide.

Note:
  * Works only under a browser environment, doesn't work under Node.

This function makes calls to the following WebGL APIs:

[`gl.readPixels`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


### blit(opts: Object) : (WebGL2)

Copies a rectangle of pixels from a `Texture` or `Framebuffer` object into a `Texture` or `Framebuffer` object.

Source options:
  * `opts.source` (`Texture` or `Framebuffer`) - This object will be bound and data copied from it.
  * `opts.attachment` (`GLenum`, default: `COLOR_ATTACHMENT0`) - Attachment index from which data to be copied from.
  * `opts.srcX0` (`GLint`, default: `0`) - Lower X bound of copy rectangle in source.
  * `opts.srcY0` (`GLint`, default: `0`) - Lower Y bound of copy rectangle in source.
  * `opts.srcX1` (`GLint`) - Higher X bound of copy rectangle in source.
  * `opts.srcY1` (`GLint`) - Higher Y bound of copy rectangle in source.

Target options:
  * `opts.destination` (`Texture` or `Framebuffer`) - This object will be bound and data is copied into it.
  * `opts.dstX0` (`GLint`, default: `0`) - Lower X bound of copy rectangle in destination.
  * `opts.dstY0` (`GLint`, default: `0`) - Lower Y bound of copy rectangle in destination.
  * `opts.dstX1` (`GLint`) - Higher X bound of copy rectangle in destination.
  * `opts.dstY1` (`GLint`) - Higher Y bound of copy rectangle in destination.

Common options
  * `opts.mask` (`GLbitfild`, default: `0`) - A `GLbitfield` specifying a bitwise OR mask indicating which buffers are to be copied, possible buffers masks are `GL.COLOR_BUFFER_BIT`, `GL.DEPTH_BUFFER_BIT` and ` GL.STENCIL_BUFFER_BIT`
  * `opts.color` (`Boolean`, default: `true`) - When true `GL.COLOR_BUFFER_BIT` is added to the mask.
  * `opts.depth` (`Boolean`, default: `false`) - When true `GL.DEPTH_BUFFER_BIT` is added to the mask.
  * `opts.stencil` (`Boolean`, default: `false`) - When true `GL.STENCIL_BUFFER_BIT` is added to the mask.
  * `opts.filter`=`GL.NEAREST` - specifies interpolation mode if stretching is needed. `GL.LINEAR` can be used exclusively for color buffers.

Notes:
  * There are a number of restrictions when blitting between integer and floating point formats.

This function makes calls to the following WebGL APIs:

[`gl.blitFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/blitFramebuffer), [`gl.readBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/readBuffer), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)
