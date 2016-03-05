---
layout: docs
title: Program
categories: [Documentation]
---

Class: Program {#Program}
===========================

The Program class encapsulates a WebGL program object
- compilation and linking of shaders
- setting and unsetting buffers
- setting uniforms
- using textures
and more.


### Notes:

* Shader sources: A Program needs to be constructed with two strings
containin source code for vertex and fragment shaders. While it is of course
possible to store shader sources inline in JavaScript strings,
when doing extensive shader programming, use of a tool like
[glslify](https://github.com/stackgl/glslify)
is recommended, as it supports organization of shader code
directly in an applications source file tree. Also, for smaller examples,
there are functions to help load shaders from HTML templates or URLs in
`addons/helpers.js`.
* Default Shaders: Luma.GL comes with a set of default shaders that can
be used for basic rendering and picking.
* All instance methods in a program (unless they return some documented value)
are chainable.


### Properties:

A program instance has as public properties:

* program - (WebGLProgram) The native WebGL program instance.


Program constructor {#Program:constructor}
----------------------------------------------------------------------

Creates a new program by using the strings passed as arguments as source for the shaders.

### Syntax:

	var program = new Program(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    id: id
  });

### Arguments:

1. gl
1. opts.vs - (*string*) The vertex shader source as a string.
2. opts.fs - (*string*) The fragment shader source as a string.

### Examples:

Create a Program from the given sources.

{% highlight js %}
const vs = `
  attribute vec3 aVertexPosition;

  uniform mat4 uMVMatrix;
  uniform mat4 uPMatrix;

  void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
  }
`;
const fs = `
  #ifdef GL_ES
    precision highp float;
  #endif

  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

const program = new Program(gl, {vs, fs});
{% endhighlight %}


Program Method: setUniform {#Program:setUniform}
--------------------------------------------------

Sets the value of an uniform. There's no need to convert the array into a typed array, that's done automatically. 
The name of the uniform matches the name of the uniform declared in the shader.

### Syntax:

	program.setUniform(name, value);

### Arguments:

1. name - (*string*) The name of the uniform to be set.
2. value - (*mixed*) The value to be set. Can be a float, an array of floats, a boolean, etc.

### Examples:

Set matrix information for the projection matrix and element matrix
of the camera and world.
The context of this example can be seen
[here](http://uber-common.github.com/luma.gl/examples/lessons/3/).

{% highlight js %}
program.setUniform('uMVMatrix', view);
program.setUniform('uPMatrix', camera.projection);
{% endhighlight %}


Program Method: setUniforms {#Program:setUniforms}
--------------------------------------------------

For each `key, value` of the object passed in it executes `setUniform(key, value)`.

### Syntax:

	program.setUniforms(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a uniform name and its value respectively.

### Examples:

Set matrix information for the projection matrix and element matrix of the camera and world. 
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/3/).

{% highlight js %}
program.setUniforms({
  'uMVMatrix': view,
  'uPMatrix': camera.projection
});
{% endhighlight %}


Program Method: setBuffer {#Program:setBuffer}
--------------------------------------------------

This method is useful to set properties (and data) to a buffer and/or
attributes. If the buffer does not exist it will be created.
Also, for all properties set to a buffer, these properties are
remembered so they're optional for later calls.

### Syntax:

	program.setBuffer(name, options);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer. If no `attribute`
value is set in `options` then the buffer name will be used as attribute name.
2. options - (*object*) An object with options/data described below:

### Options:

* attribute - (*string*, optional) The name of the attribute to generate
  attribute calls to. If this parameter is not specified then the attribute
  name will be the buffer name.
* bufferType - (*enum*, optional) The type of the buffer. Possible
  options are `gl.ELEMENT_ARRAY_BUFFER`, `gl.ARRAY_BUFFER`. Default is 
  `gl.ARRAY_BUFFER`.
* size - (*numer*, optional) The size of the components in the buffer. Default is 1.
* dataType - (*enum*, optional) The type of the data being stored in the buffer. Default's `gl.FLOAT`.
* stride - (*number*, optional) The `stride` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* offset - (*number*, optional) The `offset` parameter when calling `gl.vertexAttribPointer`. Default's 0.
* drawType - (*enum*, optional) The type of draw used when setting the `gl.bufferData`. Default's `gl.STATIC_DRAW`.

### Examples:

Set buffer values for the vertices of a triangle. 
The context of this example can be seen [here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
program.setBuffer('triangle', {
  attribute: 'aVertexPosition',
  value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
  size: 3
});
{% endhighlight %}


Program Method: setBuffers {#Program:setBuffers}
--------------------------------------------------

For each `key, value` of the object passed in it executes `setBuffer(key, value)`.

### Syntax:

	program.setBuffers(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching
   a buffer name and its value respectively.

### Examples:

Set buffer values for the vertices of a triangle and a square.
The context of this example can be seen
[here](http://uber-common.github.com/luma.gl/examples/lessons/1/).

{% highlight js %}
program.setBuffers({
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
[lesson 16](http://uber-common.github.com/luma.gl/examples/lessons/16/).

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


Program Method: setTexture {#Program:setTexture}
-------------------------------------------------

This method is used to either bind/unbind an existing texture or also
to create a new texture form an `Image` element or
to create an empty texture with specified dimensions.
Also, for all properties set to a texture, these properties are
remembered so they're optional for later calls.

### Syntax:

	program.setTexture(name[, options]);

### Arguments:

1. name - (*string*) The name (unique id) of the texture.
2. options - (*mixed*) Can be a boolean or enum used to bind/unbind the
   texture (or set the enum as active texture) or an object with options/data
   described below:

### Options:

* textureType - (*enum*, optional) The texture type used to call `gl.bindTexture` with. Default's `gl.TEXTURE_2D`.
* pixelStore - (*array*, optional) An array of objects with name, value options to be set with `gl.pixelStorei` calls. 
Default's `[{ name: gl.UNPACK_FLIP_Y_WEBGL, value: true }]`.
* parameters - (*array*, optional) An array of objects with nane, value options to be set with `gl.texParameteri`. 
Default's `[{ name: gl.TEXTURE_MAG_FILTER, value: gl.NEAREST }, { name: gl.TEXTURE_MIN_FILTER, value: gl.NEAREST }]`.
* data - (*object*, optional) An object with properties described below:
  * format - (*enum*, optional) The format used for `gl.texImage2D` calls. Default's `gl.RGBA`.
  * value - (*object*, optional) If set to an `Image` object then this image will be used to fill the texture. Default's false. If no image is set then we might want to set the width and height of the texture.
  * width - (*number*, optional) The width of the texture. Default's 0.
  * height - (*number*, optional) The height of the texture. Default's 0.
  * border - (*number*, optional) The border of the texture. Default's 0.

### Examples:

Setting a texture for a box. Adapted from
[lesson 6](http://uber-common.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
var img = new Image();

img.onload = function() {
  program.setTexture('nearest', {
    data: {
      value: img
    }
  });
};

img.src = 'path/to/image.png';
{% endhighlight %}


Program Method: setTextures {#Program:setTextures}
----------------------------------------------------

For each `key, value` of the object passed in it executes `setTexture(key, value)`.

### Syntax:

	program.setTextures(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a texture name and its value respectively.

### Examples:

Set multiple type of textures from the same image. Taken from
[lesson 6](http://uber-common.github.com/luma.gl/examples/lessons/6/).

{% highlight js %}
//load textures from image
var img = new Image();
img.onload = function() {
  program.setTextures({
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


Program Method: use {#Program:use}
-----------------------------------

Calls `gl.useProgram(this.program)`. To set the current program as active.

### Syntax:

	program.use();


