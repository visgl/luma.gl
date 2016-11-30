---
layout: docs
title: Program
categories: [Documentation]
---

The Program class encapsulates a WebGLProgram object. It contains a matched
pair of vertex and fragment shaders.

`Program` handles
- Compilation and linking of shaders
- Setting and unsetting buffers (attributes)
- Setting uniform values
- Setting buffers
- Setting textures
and more.

Calling `Program.use()` after construction
will cause any subsequent `draw*` calls to use the shaders from this program.

### Notes on Shader Programming

* Shader sources: A Program needs to be constructed with two strings
  containing source code for vertex and fragment shaders. While it is of course
  possible to store shader sources inline in JavaScript strings,
  when doing extensive shader programming, use of a tool like
  [glslify](https://github.com/stackgl/glslify)
  is recommended, as it supports organization of shader code
  directly in an applications source file tree.
  luma.gl is fully integrated with glslify and the babel plugin
  babel-plugin-glslify was written specifically to support luma.gl.

  Also, for smaller examples, there are functions to help load shaders
  from HTML templates or URLs in `addons/helpers.js`.

* Default Shaders: Luma.GL comes with a set of default shaders that can
  be used for basic rendering and picking.

### Program Methods

| **Method** | **Description** |
|====|====|
| `constructor` | creates a Program |
| `delete` | deletes resources held by program |
| `getAttributeCount` | Gets number of active attributes |
| `getAttributeInfo` | Gets {name, type, size} for attribute at index |
| `getAttributeName` | Gets name for attribute at index |
| `getAttributeLocation` | Gets index for attribute with name |
| `getAttributeNames` |  |
| `getAttributeLocations` |  |
| `setAttributes` | Sets named uniforms from a map, ignoring names |
| `getUniformCount` | Gets number of active uniforms |
| `getUniformInfo` | Gets {name, type, size} for uniform at index |
| `setUniforms` | Sets named uniforms from a map, ignoring names |
| `isFlaggedForDeletion`  | DELETE_STATUS |
| `getLastLinkStatus`  | LINK_STATUS |
| `getLastValidationStatus`  | gl.VALIDATE_STATUS |
| `getAttachedShadersCount`  | gl.ATTACHED_SHADERS |
| `getTransformFeedbackBufferMode` WebGL2 | gl.TRANSFORM_FEEDBACK_BUFFER_MODE |
| `getTransformFeedbackVaryingsCount` WebGL2 | gl.TRANSFORM_FEEDBACK_VARYINGS |
| `getActiveUniformBlocksCount` WebGL2 | gl.ACTIVE_UNIFORM_BLOCKS |
| `getFragDataLocation` WebGL2 | |

### Remarks

* All instance methods in a program (unless they return some documented value)
  are chainable.



Class: Program {#Program}
===========================

### Properties:

A program instance has as public properties:

* handle - (WebGLProgram) The native WebGL program instance.


Program constructor {#Program:constructor}
----------------------------------------------------------------------

Creates a new program by using the strings passed as arguments
as source for the shaders. The shaders are compiled into WebGLShaders
and a WebGLProgram is created and the shaders are linked.

### Syntax:

{% highlight js %}
	const program = new Program(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    id: 'my-identifier'
  });
{% endhighlight %}

### Arguments:

1. **gl** (*WebGLRenderingContext*)
2. **opts.vs** (VertexShader|*string*) - A vertex shader object, or source as a string.
3. **opts.fs** (FragmentShader|*string*) - A fragment shader object, ot source as a string.
4. **opts.id** (*string*) - Optional string id to help indentify the program
   during debugging.

### Examples:

Create a Program from the given vertex and fragment shader source code.

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


Program Method: use {#Program:use}
-----------------------------------

Calls `gl.useProgram(this.program)`. To set the current program as active.
After this call, `draw` calls will run the shaders in this program.

### Syntax:

  program.use();


Program Method: setUniforms {#Program:setUniforms}
--------------------------------------------------

For each `key, value` of the object passed in it executes `setUniform(key, value)`.

### Syntax:

	program.setUniforms(object);

### Arguments:

1. object - (*object*) An object with key value pairs matching a
                       uniform name and its value respectively.


1. key - (*string*) The name of the uniform to be set.
                    The name of the uniform will be matched with the name of
                    the uniform declared in the shader. You can set more
                    uniforms on the Program than its shaders use, the extra
                    uniforms will simply be ignored.
2. value - (*mixed*) The value to be set.
                     Can be a float, an array of floats, a boolean, etc.
                     When the shaders are run (through a draw call),
                     The must match the declaration.
                     There's no need to convert arrays into a typed array,
                     that's done automatically.

### Examples:

Set matrix information for the projection matrix and element matrix of the
camera and world.
The context of this example can be seen
[here]http://uber.github.io/luma.gl/examples/lessons/3/).

{% highlight js %}
program.setUniforms({
  'uMVMatrix': view,
  'uPMatrix': camera.projection
});
{% endhighlight %}


Program Method: setBuffer {#Program:setBuffer}
--------------------------------------------------

Sets a WebGLBuffer to a specific attribute


### Syntax:

	program.setBuffer(name, options);

### Arguments:

1. name - (*string*) The name (unique id) of the buffer. If no `attribute`
value is set in `options` then the buffer name will be used as attribute name.
2. options - (*object*) An object with options/data described below:

### Examples:

Set buffer values for the vertices of a triangle. 
The context of this example can be seen
[here]http://uber.github.io/luma.gl/examples/lessons/1/).

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
[here]http://uber.github.io/luma.gl/examples/lessons/1/).

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
[lesson 6]http://uber.github.io/luma.gl/examples/lessons/6/).

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

Sets a number of textures on the program.

