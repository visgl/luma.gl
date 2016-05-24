---
layout: docs
title: FrameBuffer
categories: [Documentation]
---

Class: FrameBuffer {#FrameBuffer}
===========================



Program Method: setFrameBuffer {#Program:setFrameBuffer}
---------------------------------------------------------

Creates or binds/unbinds a framebuffer. You can also use this method to
bind the framebuffer to a texture and renderbuffers. If the
framebuffer already exists then calling `setFrameBuffer` with
`true` or `false` as options will bind/unbind the framebuffer.
Also, for all properties set to a buffer, these properties are
remembered so they're optional for later calls.

### Syntax:

	program.setFrameBuffer(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer.
2. options - (*mixed*) Can be a boolean used to bind/unbind
   the framebuffer or an object with options/data described below:

### Options:

* width - (*number*) The width of the framebuffer. Default's 0.
* height - (*number*) The height of the framebuffer. Default's 0.
* bindToTexture - (*mixed*, optional) Whether to bind the framebuffer
onto a texture. If false the framebuffer wont be bound to a texture.
Else you should provide an object with the same options as in `setTexture`.
* textureOptions - (*object*, optional) Some extra options for binding the framebuffer to the texture. Default's `{ attachment: gl.COLOR_ATTACHMENT0 }`.
* bindToRenderBuffer - (*boolean*) Whether to bind the framebuffer to a renderbuffer. The `width` and `height` of the renderbuffer are the same as the ones specified above.
* renderBufferOptions - (*object*, optional) Some extra options for binding the framebuffer to the renderbuffer. Default's `{ attachment: gl.DEPTH_ATTACHMENT }`.

### Examples:

Using a frambuffer to render a scene into a texture. Taken from
[lesson 16](http://uber/.github.com/luma.gl/examples/lessons/16/).

{% highlight js %}
//create framebuffer
program.setFrameBuffer('monitor', {
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


Program Method: setFrameBuffers {#Program:setFrameBuffers}
-----------------------------------------------------------

For each `key, value` of the object passed in it executes
`setFrameBuffer(key, value)`.

### Syntax:

	program.setFrameBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a
   buffer name and its value respectively.


Program Method: setRenderBuffer {#Program:setRenderBuffer}
-----------------------------------------------------------

Creates or binds/unbinds a renderbuffer. If the renderbuffer already
exists and the second parameter is a boolean it'll bind or unbind the
renderbuffer.

Also, for all properties set to a buffer, these properties are remembered
so they're optional for later calls.

### Syntax:

	program.setRenderBuffer(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer.
2. options - (*mixed*) Can be a boolean used to bind/unbind the renderbuffer
   or an object with options/data described below:

### Options:

* width - (*number*) The width of the renderbuffer. Default's 0.
* height - (*number*) The height of the renderbuffer. Default's 0.
* storageType - (*enum*, optional) The storage type. Default's `gl.DEPTH_COMPONENT16`.


Program Method: setRenderBuffers {#Program:setRenderBuffers}
-------------------------------------------------------------

For each `key, value` of the object passed in it executes `setRenderBuffer(key, value)`.

### Syntax:

	program.setRenderBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a
   buffer name and its value respectively.

