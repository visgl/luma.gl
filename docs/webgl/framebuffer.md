# Framebuffer

Encapsulates a WebGLFramebuffer object. In WebGL/OpenGL, a framebuffer is an
object that the application can use for "off screen" rendering. A framebuffer
can optionally contain color buffers, a depth buffer and a stencil buffer.

Note that in spite of its name, a Framebuffer does not actually contain
any image data. It relies on attachments in the form of Textures and
Renderbuffers to store data.

In the raw WebGL API, creating a set of properly configured and matching
textures and renderbuffers can require a lot of careful coding and boilerplate,
which is further complicated by many capabilities (such as support for
multiple color buffers and various image formats) depend on WebGL extensions.

Some of the main advantages of the luma.gl Framebuffer class is that it
makes it easy to create a WebGLFramebuffer with all the proper attachments,
(automatically using extensions or WebGL2 features when available)
and also makes it easy to resize a Framebuffer together with all its
attachments.

Resizing Framebuffers, which comes in handy for instance when the app is
keeping a framebuffer the same size as the window, can be achieved by
calling the Framebuffer.update methods with just the width and height
parameters.

## Usage

Creating a framebuffer
```js
const framebuffer = new Framebuffer('monitor', {
  width: screenWidth,
  height: screenHeight,
  bindToTexture: {
    parameters: [{
      name: 'TEXTURE_MAG_FILTER',
      value: 'LINEAR'
    }, {
      name: 'TEXTURE_MIN_FILTER',
      value: 'LINEAR_MIPMAP_NEAREST',
      generateMipmap: false
    }]
  },
  bindToRenderBuffer: true
});
```

Attaching textures and renderbuffers
```js
framebuffer.attachTexture...
framebuffer.checkStatus()
```

Selecting a framebuffer for rendering


Blitting between framebuffers (WebGL2)
```js
framebuffer.blit({srcFramebuffer, ...});
```

Invalidating framebuffers (WebGL2)
```js
framebuffer.invalidate({attachments: [...]});
```


## Methods

### Framebuffer Constructor

Creates or binds/unbinds a framebuffer. You can also use this method to
bind the framebuffer to a texture and renderbuffers. If the
framebuffer already exists then calling `setFramebuffer` with
`true` or `false` as options will bind/unbind the framebuffer.
Also, for all properties set to a buffer, these properties are
remembered so they're optional for later calls.

  new Framebuffer(gl, {
    id,
    width,
    height,
    depth
  })
	program.setFramebuffer(name[, options]);

### Arguments:

1. gl - (*WebGLContext*) - context
2. options - (*mixed*) Can be a boolean used to bind/unbind
   the framebuffer or an object with options/data described below:

### Options:

* id - (*String*, optional) - The name (unique id) of the buffer.
* width - (*number*, optional, default 1) The width of the framebuffer.
* height - (*number*, optional, default 1) The height of the framebuffer.
* colorAttachments - (*Texture|Textures[]|Renderbuffer|Renderbuffer[]*, optional) -
  an optional array of either Textures or Renderbuffers.
* stencilAttachment -
* depthAttachment -
* depthStencilAttachment -
* colorFormat -
* depthTexture -

bindToTexture - (*mixed*, optional) Whether to bind the framebufferx`x`
  onto a texture. If false the framebuffer wont be bound to a texture.
Else you should provide an object with the same options as in `setTexture`.
* textureOptions - (*object*, optional) Some extra options for binding the framebuffer to the texture. Default's `{ attachment: gl.COLOR_ATTACHMENT0 }`.
* bindToRenderBuffer - (*boolean*) Whether to bind the framebuffer to a renderbuffer. The `width` and `height` of the renderbuffer are the same as the ones specified above.
* renderBufferOptions - (*object*, optional) Some extra options for binding the framebuffer to the renderbuffer. Default's `{ attachment: gl.DEPTH_ATTACHMENT }`.


### `Framebuffer.update`

Syntax:
    program.setFramebuffers(object);

Arguments:
1. object - (*object*) An object with key value pairs matching a
   buffer name and its value respectively.


### `Framebuffer:delete`

Destroys the underlying WebGL object. When destroying Framebuffers it can
be important to consider that a Framebuffer can manage other objects that
also need to be destroyed.


### Framebuffer.attachRenderbuffer

Used to attach a framebuffer to a framebuffer, the textures will store
the various buffers.

* `opts.renderbuffer=null` {RenderBuffer|WebGLRenderBuffer|null} - renderbuffer to bind. default is null which unbinds the renderbuffer for the attachment
* `opts.attachment=` {String|Number} - which buffer to bind
@returns {FrameBuffer} returns itself to enable chaining

WebGL calls [`gl.framebufferRenderbuffer`](), [`gl.bindFramebuffer`]()


### Framebuffer.attachTexture

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


### Framebuffer.attachTextureLayer (WebGL2)

WebGL calls [`gl.framebufferTextureLayer`](), [`gl.bindFramebuffer`]()


### Framebuffer.checkStatus

Check that the framebuffer contains a valid combination of attachments

[`gl.framebufferCheckStatus`](), [`gl.bindFramebuffer`]()

### Framebuffer.readPixels

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

### Framebuffer.readBuffer

Selects a color buffer as the source for pixels for subsequent calls to
copyTexImage2D, copyTexSubImage2D, copyTexSubImage3D or readPixels.

Parameters: src
* `gl.BACK` - Reads from the back color buffer.
* `gl.NONE` - Reads from no color buffer.
* `gl.COLOR_ATTACHMENT{0-15}` - Reads from one of 16 color attachment buffers.


### Framebuffer.blit (WebGL2)

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
