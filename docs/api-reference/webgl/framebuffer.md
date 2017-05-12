# Framebuffer

In WebGL/OpenGL, a framebuffer is a container object that the application can use for "off screen" rendering. A framebuffer does not actually contain any image data but can optionally contain attachments (color buffers, a depth buffer and a stencil buffer) that store data. Attachments must be in the form of `Texture`s and `Renderbuffer`s.

The luma.gl `Framebuffer` constructor enables the creation of a WebGLFramebuffer with all the proper attachments in a single step and also the `resize` method makes it easy to resize a Framebuffer together with all its attachments.


## Usage

Creating a framebuffer
```js
const framebuffer = new Framebuffer(gl, {
  width: window.innerWidth,
  height: window.innerHeight,
  colorBufferParameters: {
    [GL.TEXTURE_MAG_FILTER]: GL.LINEAR,
    [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_NEAREST,
  },
});
```

Attaching textures and renderbuffers
```js
framebuffer.attachTexture...
framebuffer.checkStatus()
```

Resizing a framebuffers to the size of a window
```js
framebuffer.resize({width: window.innerWidth, height: window.innerHeight});
```

Specifying a framebuffer for rendering
```js
const offScreenBuffer = new Framebuffer();
program1.draw({
  // ...
  settings: {framebuffer: offScreenBuffer}
});
```

Selecting a framebuffer for rendering
```js
import {withState} from 'luma.gl';
withState(gl, {framebuffer}, () => {
  program1.draw(...);
  program2.draw(...);
});
```

Blitting between framebuffers (WebGL2)
```js
framebuffer.blit({srcFramebuffer, ...});
```

Invalidating framebuffers (WebGL2)
```js
framebuffer.invalidate({attachments: [...]}); // GPU can now release the data
```


## Methods

### Framebuffer Constructor

Creates a new framebuffer, optionally creating and attaching `Texture` and `Renderbuffer` attachments

  new Framebuffer(gl, {
    id,
    width,
    height,
    depth
  })

* `gl` - (*WebGLContext*) - context
* `id` - (*String*, optional) - The name (unique id) of the buffer.
* `width` - (*number*, optional, default 1) The width of the framebuffer.
* `height` - (*number*, optional, default 1) The height of the framebuffer.
* `colorAttachments` - (*Texture|Textures[]|Renderbuffer|Renderbuffer[]*, optional) - an optional array of either Textures or Renderbuffers.
* `stencilAttachment` -
* `depthAttachment` -
* `depthStencilAttachment` -
* `colorFormat` -
* `depthTexture` -


### delete

Destroys the underlying WebGL object. When destroying Framebuffers it can
be important to consider that a Framebuffer can manage other objects that
also need to be destroyed.


### resize

Framebuffer will only be resized if the size has actually changed. Calling resize multiple times with the same width and height does not work.

`framebuffer.resize({width, height})`

Arguments:
* `width` (*number*) - An object with key value pairs matching a buffer name and its value respectively.
* `height` (*number*) - An object with key value pairs matching a buffer name and its value respectively.


### attachRenderbuffer

Used to attach a framebuffer to a framebuffer, the textures will store
the various buffers.

`framebuffer.attachRenderbuffer({...})`

* `opts.renderbuffer=null` {RenderBuffer|WebGLRenderBuffer|null} - renderbuffer to bind. default is null which unbinds the renderbuffer for the attachment
* `opts.attachment=` {String|Number} - which buffer to bind
@returns {FrameBuffer} returns itself to enable chaining

WebGL calls [`gl.framebufferRenderbuffer`](), [`gl.bindFramebuffer`]()


### attachTexture

Used to attach textures to a framebuffer, the attached textures will store the various buffers.

The set of available attachments is larger in WebGL2, and also the
extensions WEBGL_draw_buffers and WEBGL_depth_texture provide additional
attachments that match or exceed the WebGL2 set.

Parameters
* `opt.texture`=null {Texture2D|TextureCube|WebGLTexture|null} - default is null which unbinds the texture for the attachment
* `opt.attachment`= {String|Number}  - which attachment to bind defaults to gl.COLOR_ATTACHMENT0.
* `opt.textureTarget`= {String|Number}  - can be used to specify faces of a cube map.

returns {FrameBuffer} returns itself to enable chaining


WebGL calls [`gl.framebufferTexture2D`](), [`gl.bindFramebuffer`]()


### attachTextureLayer (WebGL2)

WebGL calls [`gl.framebufferTextureLayer`](), [`gl.bindFramebuffer`]()


### checkStatus

Check that the framebuffer contains a valid combination of attachments

[`gl.framebufferCheckStatus`](), [`gl.bindFramebuffer`]()

### readPixels

App can provide pixelArray or have it auto allocated by this method
    x = 0,
    y = 0,
    width,
    height,
    format = GL.RGBA,
    type,
    pixelArray = null

NOTE: Slow requires roundtrip to GPU

[gl.readPixels](), [`gl.bindFramebuffer`]()

### readBuffer

Selects a color buffer as the source for pixels for subsequent calls to
copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.

Parameters: src
* `gl.BACK` - Reads from the back color buffer.
* `gl.NONE` - Reads from no color buffer.
* `gl.COLOR_ATTACHMENT{0-15}` - Reads from one of 16 color attachment buffers.


### blit (WebGL2)

Copies a rectangle of pixels between framebuffers

Parameters
* srcFramebuffer
* srcX0
* srcY0
* srcX1
* srcY1
* dstX0
* dstY0
* dstX1
* dstY1
* mask
* filter = GL.NEAREST

[`gl.blitFramebuffer`](), [`gl.bindFramebuffer`]()


### Framebuffer.invalidate (WebGL2)

Signals to the GL that it need not preserve the pixels of a specified region of the framebuffer
(by default all pixels of the specified framebuffer attachments are invalidated).

Parameters
* attachments - list of attachments to invalidate

[`gl.invalidateFramebuffer`](), [`gl.invalidateSubFramebuffer`](), [`gl.bindFramebuffer`]()


## Remarks

* In the raw WebGL API, creating a set of properly configured and matching textures and renderbuffers can require a lot of careful coding and boilerplate.
* This is further complicated by many capabilities (such as support for multiple color buffers and various image formats) depending on WebGL extensions or WebGL versions.


