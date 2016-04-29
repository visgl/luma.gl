---
layout: docs
title: Core
categories: [Documentation]
---

Script: Core {#Core}
===========================

At its core, luma.gl provides JavaScript classes that manage
core WebGL object types, with the intention of making these WebGL objects
easier to work with in JavaScript.

* *Boilerplate reduction* - These classes provide an API that closely matches
  the operations supported by the underlying WebGL object, while reducing
  the boilerplate often required by low-level WebGL functions (such as long,
  repeated argument lists, or the multiple WebGL calls that are often
  necessary to select and set up things before doing an actual operation).

* *Parameter checking* - Parameter checks help catch a number of common
  WebGL coding mistakes, which is important since bad parameters in WebGL
  often lead to silent failure to render, or to inscrutable error messages
  in the console, both of which can be hard to debug. As an example,
  setting uniforms to illegal values now throws an exception containing a
  helpful error message including the name of the problematic uniform.

* *Error handling* - Methods carefully check WebGL return values and
  throw exceptions when things go wrong, taking care to extract helpful
  information into the error message.
  As an example, a failed shader compilation will throw an Error with a
  message indicating the problem inline in the shader's GLSL source.


Provides functions to create and initialize a WebGL context, and
to check for presence of WebGL and extensions.

Function: hasWebGL {#LumaGL:hasWebGL}
------------------------------------------------------

Returns true or false whether the browser supports WebGL or not.

### Syntax:

	LumaGL.hasWebGL();


Static Method: hasExtension {#LumaGL:hasExtension}
-----------------------------------------------------------

Returns true or false whether the browser supports a given WebGL
extension or not.

### Syntax:

	LumaGL.hasExtension(name);

### Arguments:

1. name  - (*string*) The name of the extension. For example `OES_texture_float`. More info [here](http://www.khronos.org/registry/webgl/extensions/).


---
layout: docs
title: WebGL
categories: [Documentation]
---

Module: WebGL {#WebGL}
===============================

Provides the `getContext` method which is a wrapper around the method that returns the native context for a 3D canvas. Also
has the code to add `LumaGL.hasWebGL()` that returns a *boolean* whether the current browser supports WebGL or not. Also provides
`LumaGL.hasExtension( name )` which returns if some WebGL extensions
are provided by the browser.

WebGL Function: getContext {#WebGL:getContext}
------------------------------------------------

Returns a WebGL context. Tries to get the context via `experimental-webgl` or just plain `webgl` if the first one fails.

### Syntax:

  var gl = LumaGL.WebGL.getContext(canvas[, options]);

### Arguments:

1. canvas - (*mixed*) Can be a string with the canvas id or the canvas element itself.
2. options - (*object*) An object with the following properties:

### Options:

* debug - (*boolean*) If true, all gl calls will be `console.log`-ged and errors thrown to the console.


WebGL Class: WebGL.Application {#WebGL:Application}
-----------------------------------------------------

The WebGL Application class has useful methods to manipulate
buffers, textures and other things. Some of these methods can also be
found in the [Program](program.md) class, but in this case these aren't bound to any
particular program. A WebGL Application is created via the
[LumaGL](core.html) constructor function and returned on the `onLoad`
callback. The application carries all the state regardless of the number of programs and other buffers defined via
the WebGL Application or any other [Program](program.html) instance. This
design facilitates multiple program state and management.


### Properties:

A program instance has multiple public properties.

* gl - (*object*) - The `WebGLRenderingContext`
* canvas - (*object*) The Canvas DOM element where the 3D context has been retrieved.
* program - (*object*) A [Program](program.html) instance. Can also be an object with program ids as keys and [Program](program.html) instances as values.
* camera - (*object*) A [Camera](camera.html) instance.
* scene - (*object*) A [Scene](scene.html) instance.
* buffers - (*object*) An object with buffer string id as key, buffer object as value.
* frameBuffers - (*object*) An object with framebuffer string id as key, framebuffer object as value.
* renderBuffers - (*object*) An object with renderbuffer string id as key, renderbuffer object as value.
* textures - (*object*) An object with texture string id as key, texture object as value.
* usedProgram - (*object*) The current [Program](program.html) being used.


WebGL.Application Method: setBuffer {#WebGL:Application:setBuffer}
-------------------------------------------------------------------

This method is useful to set properties (and data) to a buffer and/or attributes. If the buffer does not exist it will be created.
Also, for all properties set to a buffer, these properties are remembered so they're optional for later calls.

### Syntax:

  app.setBuffer(name, options);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer. If no `attribute` value is set in `options` then the buffer name will be used as attribute name.
2. options - (*object*) An object with options/data described below:

### Options:

* attribute - (*string*, optional) The name of the attribute to generate attribute calls to. If this parameter is not specified then the attribute name will
be the buffer name.
* bufferType - (*enum*, optional) The type of the buffer. Possible options are `gl.ELEMENT_ARRAY_BUFFER`, `gl.ARRAY_BUFFER`. Default's `gl.ARRAY_BUFFER`.
* size - (*numer*, optional) The size of the components in the buffer. Default's 1.
* dataType - (*enum*, optional) The type of the data being stored in the buffer. Default's `gl.FLOAT`.
* stride - (*number*, optional) The `stride` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* offset - (*number*, optional) The `offset` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* drawType - (*enum*, optional) The type of draw used when setting the `gl.bufferData`. Default's `gl.STATIC_DRAW`.

### Examples:

Set buffer values for the vertices of a triangle.
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
app.setBuffer('triangle', {
  attribute: 'aVertexPosition',
  value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
  size: 3
});
{% endhighlight %}


WebGL.Application Method: setBuffers {#WebGL:Application:setBuffers}
---------------------------------------------------------------------

For each `key, value` of the object passed in it executes `setBuffer(key, value)`.

### Syntax:

  app.setBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a buffer name and its value respectively.

### Examples:

Set buffer values for the vertices of a triangle and a square.
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
app.setBuffers({
  'triangle': {
    attribute: 'aVertexPosition',
    value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
    size: 3
  },

  'square': {
    attribute: 'aVertexPosition',
    value: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
    size: 3
  }
});
{% endhighlight %}


WebGL.Application Method: setFrameBuffer {#WebGL:Application:setFrameBuffer}
-----------------------------------------------------------------------------

Creates or binds/unbinds a framebuffer. You can also use this method to bind the framebuffer to a texture and renderbuffers. If the
framebuffer already exists then calling `setFrameBuffer` with `true` or `false` as options will bind/unbind the framebuffer.
Also, for all properties set to a buffer, these properties are remembered so they're optional for later calls.

### Syntax:

  app.setFrameBuffer(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer.
2. options - (*mixed*) Can be a boolean used to bind/unbind the framebuffer or an object with options/data described below:

### Options:

* width - (*number*) The width of the framebuffer. Default's 0.
* height - (*number*) The height of the framebuffer. Default's 0.
* bindToTexture - (*mixed*, optional) Whether to bind the framebuffer onto a texture. If false the framebuffer wont be bound to a texture. Else you should provide an object
with the same options as in `setTexture`.
* textureOptions - (*object*, optional) Some extra options for binding the framebuffer to the texture. Default's `{ attachment: gl.COLOR_ATTACHMENT0 }`.
* bindToRenderBuffer - (*boolean*) Whether to bind the framebuffer to a renderbuffer. The `width` and `height` of the renderbuffer are the same as the ones specified above.
* renderBufferOptions - (*object*, optional) Some extra options for binding the framebuffer to the renderbuffer. Default's `{ attachment: gl.DEPTH_ATTACHMENT }`.

### Examples:

Using a frambuffer to render a scene into a texture. Taken from [lesson 16](http://uber-common.github.com/luma.gl/examples/lessons/16/).

{% highlight js %}
//create framebuffer
app.setFrameBuffer('monitor', {
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


WebGL.Application Method: setFrameBuffers {#WebGL:Application:setFrameBuffers}
-------------------------------------------------------------------------------

For each `key, value` of the object passed in it executes `setFrameBuffer(key, value)`.

### Syntax:

  app.setFrameBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a buffer name and its value respectively.


WebGL.Application Method: setRenderBuffer {#WebGL:Application:setRenderBuffer}
-------------------------------------------------------------------------------

Creates or binds/unbinds a renderbuffer. If the renderbuffer already exists and the second parameter is a boolean it'll bind or unbind the renderbuffer.
 Also, for all properties set to a buffer, these properties are remembered so they're optional for later calls.

### Syntax:

  app.setRenderBuffer(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer.
2. options - (*mixed*) Can be a boolean used to bind/unbind the renderbuffer or an object with options/data described below:

### Options:

* width - (*number*) The width of the renderbuffer. Default's 0.
* height - (*number*) The height of the renderbuffer. Default's 0.
* storageType - (*enum*, optional) The storage type. Default's `gl.DEPTH_COMPONENT16`.


WebGL.Application Method: setRenderBuffers {#WebGL:Application:setRenderBuffers}
--------------------------------------------------------------------------------

For each `key, value` of the object passed in it executes `setRenderBuffer(key, value)`.

### Syntax:

  app.setRenderBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a buffer name and its value respectively.


WebGL.Application Method: setTexture {#WebGL:Application:setTexture}
---------------------------------------------------------------------

This method is used to either bind/unbind an existing texture or also to create a new texture form an `Image` element or
to create an empty texture with specified dimensions. Also, for all properties set to a texture, these properties are remembered so they're optional for later calls.

### Syntax:

  app.setTexture(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the texture.
2. options - (*mixed*) Can be a boolean or enum used to bind/unbind the texture (or set the enum as active texture) or an object with options/data described below:

### Options:

* textureType - (*enum*, optional) The texture type used to call `gl.bindTexture` with. Default's `gl.TEXTURE_2D`.
* pixelStore - (*array*, optional) An array of objects with name, value options to be set with `gl.pixelStorei` calls. Default's

        pixelStore: [{
          name: gl.UNPACK_FLIP_Y_WEBGL,
          value: true
        }, {
          name: gl.UNPACK_ALIGNMENT,
          value: 1
        }]

* parameters - (*array*, optional) An array of objects with nane, value options to be set with `gl.texParameteri`. Default's

        parameters: [{
          name: gl.TEXTURE_MAG_FILTER,
          value: gl.NEAREST
        }, {
          name: gl.TEXTURE_MIN_FILTER,
          value: gl.NEAREST
        }, {
          name: gl.TEXTURE_WRAP_S,
          value: gl.CLAMP_TO_EDGE
        }, {
          name: gl.TEXTURE_WRAP_T,
          value: gl.CLAMP_TO_EDGE
        }]

* data - (*object*, optional) An object with properties described below:
  * format - (*enum*, optional) The format used for `gl.texImage2D` calls. Default's `gl.RGBA`.
  * type - (*enum*, optional) The texture pixel component type used for `gl.texImage2D` calls. Default's `gl.UNSIGNED_BYTE`. Needs `'OES_texture_float'` extension to use `gl.FLOAT`. The extension will be enabled automatically.
  * value - (*object*, optional) If set to an `Image` object then this image will be used to fill the texture. Default's false. If no image is set then we might want to
set the width and height of the texture.
  * width - (*number*, optional) The width of the texture. Default's 0.
  * height - (*number*, optional) The height of the texture. Default's 0.
  * border - (*number*, optional) The border of the texture. Default's 0.

### Examples:

Setting a texture for a box. Adapted from [lesson 6](http://uber-common.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
var img = new Image();

img.onload = function() {
  app.setTexture('nearest', {
    data: {
      value: img
    }
  });
};

img.src = 'path/to/image.png';
{% endhighlight %}


WebGL.Application Method: setTextures {#WebGL:Application:setTextures}
-----------------------------------------------------------------------

For each `key, value` of the object passed in it executes `setTexture(key, value)`.

### Syntax:

  app.setTextures(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a texture name and its value respectively.

### Examples:

Set multiple type of textures from the same image. Taken from [lesson 6](http://uber-common.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
//load textures from image
var img = new Image();
img.onload = function() {
  app.setTextures({
    'nearest': {
      data: {
        value: img
      }
    },

    'linear': {
      data: {
        value: img
      },
      parameters: [{
        name: gl.TEXTURE_MAG_FILTER,
        value: gl.LINEAR
      }, {
        name: gl.TEXTURE_MIN_FILTER,
        value: gl.LINEAR
      }]
    },

    'mipmap': {
      data: {
        value: img
      },
      parameters: [{
        name: gl.TEXTURE_MAG_FILTER,
        value: gl.LINEAR
      }, {
        name: gl.TEXTURE_MIN_FILTER,
        value: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }]
    }
  });
};

img.src = 'path/to/image.png';
{% endhighlight %}


WebGL.Application Method: use {#WebGL:Application:use}
-------------------------------------------------------------

Calls `gl.useProgram(program)` with the given program.

### Syntax:

  app.use(program);

### Arguments:

program - (*object*) A [Program](program.html) instance.

