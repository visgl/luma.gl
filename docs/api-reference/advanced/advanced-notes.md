# WebGL Notes (Advanced)

This is a scratch pad with various notes made during research of the luma.gl API that currently don't fit cleanly into the docs (e.g. becasue too much detail).

* Familiar API - Work directly with classes mapping to the familiar OpenGL
  objects (Buffers, Textures, Programs, Framebuffers etc) and use the standard
  GL constants just like you always have.
* Stateless WebGL - Easy to locally override global GL state.
* Portability - luma.gl simplifies working with WebGL extensions and
  creating code that works across WebGL versions (WebGL 1 and WebGL 2).
  And `Capabilities` helps your app determine what features are available.
* Boilerplate reduction - luma.gl automatically deduces common parameters and
  binds/unbinds your resources as needed.
* No ownership of WebGL context. Use your luma.gl context with other WebGL
  code, or use luma.gl with WebGL contexts created by other frameworks.

API Design
Note: luma.gl is not a "classic WebGL framework", in the sense that it intentionally
doesn't try to hide WebGL from the developer under higher levels of abstraction (while a couple of higher level classes, like [Model](model.md), are offered, they do not ).


## WebGL Extensions

luma.gl uses [`WebGL Extensions`](extensions.html) to make WebGL2 features (conditionally) available under WebGL1 and to enable an improved debugging/profiling experience.

## Using the WebGL Classes versus the Raw WebGL API

luma.gl provides JavaScript classes that manage core WebGL object types,
with the intention of making these WebGL objects easier to work with in
JavaScript, without adding an abstraction layer.

### Advantages

* *Boilerplate reduction* - These classes provide an API that closely matches
  the operations supported by the underlying WebGL object, while reducing
  the boilerplate often required by low-level WebGL functions (such as long,
  repeated argument lists, or the multiple WebGL calls that are often
  necessary to bind and configure parameters before doing an actual operation).

### Disavdantages

* Executable size - any type of wrapper layer will add some overhead. Care has been taken to keep the overhead reasonable, and to support tree-shaking so that unused parts of the library will not be included in application bundles.
* Occasionally issues more WebGL calls - the classes automatically bind objects before calling methods. When you repeatedly call methods on the same class, there is no memory of which object was bound last, and multiple binding calls will be issued.
* Slight runtime overhead - A very slight runtime overhead since WebGL functions are wrapped in luma.gl methods.

### Interoperability

To maximize interoperability with WebGL code that does not use luma.gl, the
WebGLRendingContext type does not have a corresponding luma.gl wrapper class,
but is instead used directly by the luma.gl API.
A simple global function is provided to help in creating gl contexts.


## Buffers

This section can be skipped as the luma.gl API will handle binding (and unbinding) of buffers to the appropriate "targets". Still it can be good to have some understanding of buffer binding points as these feature prominently in the WebGL API.

Rather than taking buffers as arguments, WebGL functions that operate on buffers expect any necessary buffers to have been bound to various specific "binding points" or "targets" before the function is called.

In WebGL1 there are only two binding points:

* `GL.ELEMENT_ARRAY_BUFFER` - used by `drawElements` (and `drawElementsInstanced`)
* `GL.ARRAY_BUFFER` - used by `vertexAttribPointer` (and `vertexAttribIPointer`)

However, WebGL2 allows buffers to be used in a number of additional contexts:

* `GL.PIXEL_PACK_BUFFER` - used by `readPixels`
* `GL.PIXEL_UNPACK_BUFFER` - used by `texImage2D`, `texSubImage2D`, `texImage3D`, `texSubImage3D`
* `GL.TRANSFORM_FEEDBACK_BUFFER` - `beginTransformFeedback`
* `GL.UNIFORM_BUFFER` - `drawArrays` and `drawArraysInstanced`, `drawElements` and `drawElementsInstanced` (requires `uniformBlockBinding` to have been called).

In addition, some WebGL2 functions (such as `copyBufferSubData`, `getBufferSubData`) allow the app to specify which buffer binding point to use. For these applications WebGL2 also provides two extra, "virtual" binding points (in the sense that no WebGL function unconditionally uses them).

* `GL.COPY_READ_BUFFER`: Buffer for copying from one buffer object to another.
* `GL.COPY_WRITE_BUFFER`: Buffer for copying from one buffer object to another.

A primary reason to use these targets is to avoid overwriting other binding points (which can be important when integrating with external WebGL code), so luma.gl will use these bindings when possible (but only for methods that are WebGL2 specific).

Also note that `GL.TRANSFORM_FEEDBACK_BUFFER` and `GL.UNIFORM_BUFFER` bindings are special in that they have multiple binding points and they need to be bound to a certain "index" to affect WebGL state (using `bindBufferBase` or `bindBufferRange`)


## Textures

* Textures are special because when you first bind them to a target, they get special information. When you first bind a texture as a GL_TEXTURE_2D, you are actually setting special state in the texture. You are saying that this texture is a 2D texture. And it will always be a 2D texture; this state cannot be changed ever. If you have a texture that was first bound as a GL_TEXTURE_2D, you must always bind it as a GL_TEXTURE_2D; attempting to bind it as GL_TEXTURE_1D will give rise to an error (while run-time).

