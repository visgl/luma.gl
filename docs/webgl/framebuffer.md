---
layout: docs
title: Framebuffer
categories: [Documentation]
---

Class: Framebuffer {#Framebuffer}
===========================

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


Constructor {#Framebuffer}
---------------------------------------------------------

Creates or binds/unbinds a framebuffer. You can also use this method to
bind the framebuffer to a texture and renderbuffers. If the
framebuffer already exists then calling `setFramebuffer` with
`true` or `false` as options will bind/unbind the framebuffer.
Also, for all properties set to a buffer, these properties are
remembered so they're optional for later calls.

### Syntax:

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

Examples:

Using a frambuffer to render a scene into a texture. Taken from
[lesson 16]http://uber.github.io/luma.gl/examples/lessons/16/).

{% highlight js %}
//create framebuffer
program.setFramebuffer('monitor', {
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
{% endhighlight %}


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



