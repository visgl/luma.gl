# Framebuffer

A `Framebuffer` is a WebGL container object that the application can use for "off screen" rendering. A framebuffer does not itself contain any image data but can optionally contain attachments (one or more color buffers, a depth buffer and a stencil buffer) that store data. Attachments must be in the form of `Texture`s and `Renderbuffer`s.

For additional information, see OpenGL Wiki [Framebuffer](https://www.khronos.org/opengl/wiki/Framebuffer) and [Framebuffer Object](https://www.khronos.org/opengl/wiki/Framebuffer_Object)


## Functionality

luma.gl adds



## Usage

Creating a framebuffer with default color and depth attachments

```js
const framebuffer = new Framebuffer(gl, {
  width: window.innerWidth,
  height: window.innerHeight,
  color: true,
  depth: true
});

```

Attaching textures and renderbuffers

```js
framebuffer.attach({
  [GL.DEPTH_ATTACHMENT]: new Renderbuffer(gl, {...}),
  [GL.COLOR_ATTACHMENT_0]: new Texture(gl, {...}),
  [GL.COLOR_ATTACHMENT_1]: [new TextureCube(gl, {...}), GL.TEXTURE_CUBE_MAP_POSITIVE_X],
  [GL.COLOR_ATTACHMENT_2]: [new TextureArray2D(gl, {...}), 0],
  [GL.COLOR_ATTACHMENT_3]: [new TextureArray2D(gl, {...}), 1],
  [GL.COLOR_ATTACHMENT_4]: [new Texture3D(gl, {..., depth: 8}), 2]
});
framebuffer.checkStatus(); // optional
```

Resizing a framebuffer to the size of a window. Resizes all attachements with a single `framebuffer.resize()` call


```js
// Note: this resizes (and possibly clears) all attachments
framebuffer.resize({width: window.innerWidth, height: window.innerHeight});
```

Clearing a framebuffer

```js
framebuffer.clear();
framebuffer.clear({color: [0, 0, 0, 0], depth: 1, stencil: 0});
```

Specifying a framebuffer for rendering in each render calls

```js
const offScreenBuffer = new Framebuffer();
program1.draw({
  framebuffer: offScreenBuffer,
  parameters: {}
});
model.draw({
  framebuffer: null, // the default drawing buffer
  parameters: {}
});
```

Binding a framebuffer for multiple render calls

```js
const framebuffer1 = ...;
const framebuffer2 = ...;
withParameters(gl, {framebuffer: framebuffer1}, () => {
  // Any draw call that doesn't specify a framebuffer will now draw into framebuffer1
  program1.draw({...}); // -> framebuffer1
  program2.draw({...}); // -> framebuffer1
  // Explicit specification of framebuffer overrides (for that call only)
  program2.draw({framebuffer: framebuffer1, ...); // -> framebuffer2
  program2.draw({...}); // -> framebuffer1
});
// framebuffer1 is not longer bound
```

### Reading, copying or blitting data from a Framebuffer attachment.

For reading data into CPU memory check [`readPixelsToArray`](/docs/api-reference/webgl/copy-and-blit.md)

For reading into a Buffer object (GPU memory), doesn't result in CPU and GPU sync, check [`readPixelsToBuffer`](/docs/api-reference/webgl/copy-and-blit.md)

For reading into a Texture object (GPU memory), doesn't result in CPU and GPU sync, check [`copyToTexture`](/docs/api-reference/webgl/copy-and-blit.md)

For blitting between framebuffers (WebGL2), check [`blit`](/docs/api-reference/webgl/copy-and-blit.md)


### Using Multiple Render Targets

Specify which framebuffer attachments the fragment shader will be writing to when assigning to `gl_FragData[]`

```js
framebuffer.configure({
  drawBuffers: [
    GL.COLOR_ATTACHMENT0, // gl_FragData[0]
    GL.COLOR_ATTACHMENT1, // gl_FragData[1]
    GL.COLOR_ATTACHMENT2, // gl_FragData[2]
    GL.COLOR_ATTACHMENT3  // gl_FragData[3]
  ]
})
```

Writing to multiple framebuffer attachments in GLSL fragment shader

```
#extension GL_EXT_draw_buffers : require
precision highp float;
void main(void) {
  gl_FragData[0] = vec4(0.25);
  gl_FragData[1] = vec4(0.5);
  gl_FragData[2] = vec4(0.75);
  gl_FragData[3] = vec4(1.0);
}
```

Clearing a specific draw buffer in a framebuffer (WebGL2)
```js
framebuffer.clear({
  [GL.COLOR]: [0, 0, 1, 1], // Blue
  [GL.COLOR]: new Float32Array([0, 0, 0, 0]), // Black/transparent
  [GL.DEPTH_BUFFER]: 1, // Infinity
  [GL.STENCIL_BUFFER]: 0, // no stencil
});

framebuffer.clear({
  [GL.DEPTH_STENCIL_BUFFER]: [1, 0], // Infinity, no stencil
});
```


## Methods

### constructor(gl : WebGLRenderingContext, props : Object)

Creates a new framebuffer, optionally creating and attaching `Texture` and `Renderbuffer` attachments.

```
new Framebuffer(gl, {
  id,
  width,
  height,
  attachments,
  color,
  depth,
  stencil
})
```

* `id`= - (*String*) - An optional name (id) of the buffer.
* `width`=`1` - (*number*) The width of the framebuffer.
* `height`=`1` - (*number*) The height of the framebuffer.
* `attachments`={} - (*Object*, optional) - a map of Textures and/or Renderbuffers, keyed be "attachment points" (see below).
* `color` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `depth` - shortcut to the attachment in `GL.DEPTH_ATTACHMENT`
* `stencil` - shortcut to the attachment in `GL.STENCIL_ATTACHMENT`

The luma.gl `Framebuffer` constructor enables the creation of a framebuffer with all the proper attachments in a single step and also the `resize` method makes it easy to efficiently resize a all the attachments of a `Framebuffer` with a single method.

When no attachments are provided during `Framebuffer` object creation, new resources are created and used as default attachments for enabled targets (color and depth).
For color, new `Texture2D` object is created with no mipmaps and following filtering parameters are set.

| Texture parameter       | Value |
| ---                     | --- |
| `GL.TEXTURE_MIN_FILTER` | `GL.NEAREST` |
| `GL.TEXTURE_MAG_FILTER` | `GL.NEAREST` |
| `GL.TEXTURE_WRAP_S`     | `GL.CLAMP_TO_EDGE` |
| `GL.TEXTURE_WRAP_T`     | `GL.CLAMP_TO_EDGE` |

For depth, new `Renderbuffer` object is created with `GL.DEPTH_COMPONENT16` format.


### delete()

Destroys the underlying WebGL object. When destroying `Framebuffer`s it can be important to consider that a `Framebuffer` can manage other objects that may also need to be destroyed.


### initialize(props : Object) : Framebuffer

Initializes the `Framebuffer` to match the supplied parameters. Unattaches any existing attachments, attaches any supplied attachments. All new attachments will be resized if they are not already at the right size.

`Framebuffer.initialize({width, height})`

* `width`=`1` - (*number*) The width of the framebuffer.
* `height`=`1` - (*number*) The height of the framebuffer.
* `attachments`={} - (*Object*, optional) - a map of Textures and/or Renderbuffers, keyed be "attachment points" (see below).
* `texture` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `color` - shortcut to the attachment in `GL.COLOR_ATTACHMENT0`
* `depth` - shortcut to the attachment in `GL.DEPTH_ATTACHMENT`
* `stencil` - shortcut to the attachment in `GL.STENCIL_ATTACHMENT`


### update(opts: Object) : Framebuffer

Updates Framebuffers attachments using provided Texture and Renderbuffer objects. Optionally sets read and draw buffers when using WebGL2 context.

* `attachments` - a map of attachments.
* `readBuffer` - Buffer to be set as read buffer (WebGL2)
* `drawBuffers` - Buffers to be set as draw buffers (WebGL2)
* `clearAttachments` - When set to true, will first unattach all  binding points, default value is `false`.
* `resizeAttachments` - When set to true, all attachments will be re-sized to Framebuffers size, default value is `true`.

### resize({width: Number, height: Number}) : Framebuffer

`Framebuffer.resize({width, height})`

Resizes all the `Framebuffer`'s current attachments to the new `width` and `height` by calling `resize` on those attachments.

* `width` (GLint) - width of `Framebuffer` in pixels
* `height` (GLint) - height of `Framebuffer` in pixels

Returns itself to enable chaining

* Each attachment's `resize` method checks if `width` or `height` have actually changed before reinitializing their data store, so calling `resize` multiple times with the same `width` and `height` does not trigger multiple resizes.
* If a resize happens, `resize` erases the current content of the attachment in question.

WebGL References see `initialize`.


### attach(attachments : Object, opts: Object) : Framebuffer

Used to attach or unattach `Texture`s and `Renderbuffer`s from the `Framebuffer`s various attachment points.

`Framebuffer.attach(attachments)`

* `attachments` - a map of attachments.
* opts
  * `clearAttachments` - When set to true, will first unattach all  binding points, default value is `false`.
  * `resizeAttachments` - When set to true, all attachments will be re-sized to Framebuffers size, default value is `true`.


Returns itself to enable chaining.

The key of an attachment must be a valid attachment point, see below.

The following values can be provided for each attachment
* `null` - unattaches any current binding
* `Renderbuffer` - attaches the `Renderbuffer`
* `Texture` - attaches the `Texture`
* [`Texture`, layer=0 (Number), mipmapLevel=0 (Number)] - attaches the specific layer from the `Texture` (WebGL2)

This function makes calls to the following WebGL APIs:

[`gl.framebufferRenderbuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer),
[`gl.framebufferTexture2D`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer),
[`gl.framebufferTextureLayer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/framebufferTextureLayer),
[`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer) (This is for WebGL2 only)


### checkStatus() : Framebuffer

Check that the framebuffer contains a valid combination of attachments

[`gl.checkFramebufferStatus`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


### clear(opts: Object) : Framebuffer

Clears the contents (pixels) of the framebuffer attachments.

* opts
  * `color` (Boolean or Array) - clears all active color buffers (any selected `drawBuffer`s) with either the provided color or the default color.
  * `depth`
  * `stencil`
  * `drawBuffers`=`[]` - An array of color values, with indices matching the buffers selected by `drawBuffers` argument.

Notes:
* The scissor box bounds the cleared region.
* The pixel ownership test, the scissor test, dithering, and the buffer writemasks affect the operation of `clear`.
* Alpha function, blend function, logical operation, stenciling, texture mapping, and depth-buffering are ignored by `clear`.

### invalidate (WebGL2)

Signals to the GL that it need not preserve the pixels of a specified region of the framebuffer (by default all pixels of the specified framebuffer attachments are invalidated).

Parameters
* attachments - list of attachments to invalidate

This function makes calls to the following WebGL APIs:

[`gl.invalidateFramebuffer`](WebGL2RenderingContext.invalidateFramebuffer()), [`gl.invalidateSubFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/invalidateSubFramebuffer), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


### clearBuffers (WebGL2)

Use to clear specific buffers

* `GL.COLOR` - Color buffer
* `GL.DEPTH` - Depth buffer
* `GL.STENCIL` - Stencil buffer
* `GL.DEPTH_STENCIL` - clears depth and stencil buffers (used with `clearBufferfi`)

[`gl.clearBufferfv`](), [`gl.clearBufferiv`](), [`gl.clearBufferuiv`](), [`gl.clearBufferf`](), [`gl.bindFramebuffer`]()

| `GL.COLOR_ATTACHMENT`{0-15}   | Attaches the texture to one of the framebuffer's color buffers |


### configure (WebGL2)

* `readBuffer`= (GLenum) - If supplied, sets the target color buffer for reading.
* `drawBuffers`= (GLEnum[]) - If supplied, sets the first draw buffer indices to the color attachments in the supplied array.

* Read buffers are `gl.COLOR_ATTACHMENT{0-15}` - Reads from one of 16 color attachment buffers.
* `readBuffer` selects a color buffer as the source for pixels for subsequent calls to `Framebuffer.readPixels`, `Framebuffer.copyToTexture`, `Framebuffer.blit`.

Parameters: src
* `gl.BACK` - Reads from the back color buffer.
* `gl.NONE` - Reads from no color buffer.



### drawBuffers (WebGL2 or WebGL_draw_buffers)

glDrawBuffers defines an array of buffers into which outputs from the fragment shader data will be written. If a fragment shader writes a value to one or more user defined output variables, then the value of each variable will be written into the buffer specified at a location within bufs corresponding to the location assigned to that user defined output. The draw buffer used for user defined outputs assigned to locations greater than or equal to n is implicitly set to GL_NONE and any data written to such an output is discarded.

Parameters
* `buffers` (Array) - Array of GLenum specifying the buffers into which fragment colors will be written.

| Value     | Fragment shader output is: |
| ---       | --- |
| `GL.NONE` | not written into any color buffer. |
| `GL.BACK` | written into the back color buffer. |
| `GL.COLOR_ATTACHMENT{0-15}` |: written in the nth color attachment of the current framebuffer. |

* Except for `GL_NONE`, a constants may not appear more than once.
* The maximum number of draw buffers.

This function makes calls to the following WebGL APIs:

[`gl.drawBuffers`](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers), [`gl.bindFramebuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer)


## Limits

* `GL.MAX_COLOR_ATTACHMENTS` - The maximum number of color attachments supported. Can be `0` in WebGL1.
* `GL.MAX_DRAW_BUFFERS` - The maximum number of draw buffers supported. Can be `0` in WebGL1, which means that `gl_FragData[]` is not available in shaders.

It is possible that you can have a certain number of attachments, but you can't draw to all of them at the same time.


## Framebuffer Parameters

### Framebuffer Attachment Points

| Attachment Point              | Description |
| ---                           | --- |
| `GL.COLOR_ATTACHMENT0`   | Attaches the texture to one of the framebuffer's color buffers |
| `GL.COLOR_ATTACHMENT`{1-15}   | Attaches the texture to one of the framebuffer's color buffers |
| `GL.DEPTH_ATTACHMENT`         | Attaches the texture to the framebuffer's depth buffer |
| `GL.STENCIL_ATTACHMENT`       | Attaches the texture to the framebuffer's stencil buffer |
| `GL.DEPTH_STENCIL_ATTACHMENT` | Combined depth and stencil buffer |

* The attachment point `GL.BACK` refersn to the default framebuffer's back buffer.

* The set of available attachments is larger in WebGL2, and also the extensions `WEBGL_draw_buffers` and `WEBGL_depth_texture` provide additional attachments that match or exceed the WebGL2 set.


### Framebuffer Attachment Values

The following values can be provided for each attachment point
* `null` - unattaches any current binding
* `Renderbuffer` - attaches the `Renderbuffer`
* `Texture2D` - attaches at mipmapLevel 0 of the supplied `Texture2D`.
* [`Texture2D`, 0, mipmapLevel] - attaches the specified mipmapLevel from the supplied `Texture2D` (WebGL2), or cubemap face. The second element in the array must be `0`. In WebGL1, mipmapLevel must be 0.
* [`TextureCube`, face (Number), mipmapLevel=0 (Number)] - attaches the specifed cubemap face from the `Texture`, at the specified mipmap level. In WebGL1, mipmapLevel must be 0.
* [`Texture2DArray`, layer (Number), mipmapLevel=0 (Number)] - attaches the specifed layer from the `Texture2DArray`, at the specified mipmap level.
* [`Texture3D`, layer (Number), mipmapLevel=0 (Number)] - attaches the specifed layer from the `Texture3D`, at the specified mipmap level.


## Remarks

* In the raw WebGL API, creating a set of properly configured and matching textures and renderbuffers can require a lot of careful coding and boilerplate.
* This is further complicated by many capabilities (such as support for multiple color buffers and various image formats) depending on WebGL extensions or WebGL versions.
