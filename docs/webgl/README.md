

## WebGL Classes

luma.gl's WebGL classes offer a simple way to work with WebGL in JavaScript,
without hiding or interfering with the WebGL API.
In this sense, luma.gl is not a classic "WebGL Framework": it intentionally
doesn't try to manage WebGL objects, or hide them from the developer
under higher levels of abstraction.

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

## WebGL Resources
---------------------------

luma.gl provides a set of JavaScript classes that wrap WebGL resource objects,
with the goal of making WebGL a little easier to work with in JavaScript.

These objects all inherit from the [`Resource`](resource.html) class.

| ----------------------------------- | ============== | =============== |
| **Resource Class**                  | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`Buffer`](buffer.html)             | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`Framebuffer`](framebuffer.html)   | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |
| [`Renderbuffer`](renderbuffer.html) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds a renderbuffer |
| [`Program`](program.html)           | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Shader`](shader.html)             | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Texture2D`](texture.html)         | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`TextureCube`](texture.html)       | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture2DArray`](texture.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture3D`](texture.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
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
---------------------------------

luma.gl uses [`WebGL Extensions`](extensions.html) to make WebGL 2 features
(conditionally) available under WebGL1 and to enable an improved
debugging/profiling experience.

## General Comments

luma.gl provides JavaScript classes that manage core WebGL object types,
with the intention of making these WebGL objects easier to work with in
JavaScript, without adding an abstraction layer.

* *Boilerplate reduction* - These classes provide an API that closely matches
  the operations supported by the underlying WebGL object, while reducing
  the boilerplate often required by low-level WebGL functions (such as long,
  repeated argument lists, or the multiple WebGL calls that are often
  necessary to bind and configure parameters before doing an actual operation).

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

To maximize interoperability with WebGL code that does not use luma.gl, the
WebGLRendingContext type does not have a corresponding luma.gl wrapper class,
but is instead used directly by the luma.gl API.
A simple global function is provided to help in creating gl contexts.

