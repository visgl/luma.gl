# The WebGL Classes

luma.gl's WebGL classes are designed to offer a simpler way to work with WebGL in JavaScript, without hiding or interfering with the WebGL API.

Highlights:
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
* luma.gl organizes the WebGL API in a set JavaScript classes that manage the underlying WebGL objects
* Instead of accessing all WebGL methods through the WebGL context, the methods that manipulate a certain WebGL object are collected in a class.
* This makes it easy see at a glance what classes WebGL offers, and allows you to quickly read up on what functionality is offered by each specific class.

Note: luma.gl is not a "classic WebGL framework", in the sense that it intentionally
doesn't try to hide WebGL from the developer under higher levels of abstraction (while a couple of higher level classes, like [Model](model.md), are offered, they do not ).


## WebGL Resources

luma.gl provides a set of JavaScript classes that wrap WebGL resource objects,
with the goal of making WebGL easier to work with and to learn.

These objects all inherit from the [`Resource`](resource.html) class.

| ----------------------------------- | ============== | =============== |
| **Resource Class**                  | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`Buffer`](buffer.html)             | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`Framebuffer`](framebuffer.html)   | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Off-screen render target, Container for textures and renderbuffers. |
| [`Renderbuffer`](renderbuffer.html) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds image data that is optimized for rendering but does not supporting sampling |
| [`Program`](program.html)           | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms. |
| [`Shader`](shader.html)             | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Holds a compiled GLSL shader program. |
| [`Texture2D`](texture-2d.html)         | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture in a format that supports sampling |
| [`TextureCube`](texture-cube.html)       | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds 6 textures |
| [`Texture2DArray`](texture-2d-array.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds an array of textures |
| [`Texture3D`](texture-3d.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a stack of textures |
| [`Query`](query.html) **WebGL2/ext*** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
| [`Sampler`](sampler.html) **WebGL2** | [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| [`Sync`](sync.html) **WebGL2**      | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](transform-feedback.html) **WebGL2** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](vertex-array-object.html) **WebGL2/ext** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |

| ----------------------------------- | ============== | =============== |
| **Class/Module**                    | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`context`](context.html)           | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |


## WebGL Extensions

luma.gl uses [`WebGL Extensions`](extensions.html) to make WebGL2 features
(conditionally) available under WebGL1 and to enable an improved
debugging/profiling experience.


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
