# The WebGL Classes

luma.gl's WebGL classes are designed to offer a simple way to work with WebGL in JavaScript, without hiding or interfering with the WebGL API.

Highlights:
* luma.gl organizes the WebGL API in a set JavaScript classes that manage the underlying WebGL objects
* Instead of accessing all WebGL methods through the WebGL context, the methods that manipulate a certain WebGL object are collected in a class.
* This makes it easy see at a glance what classes WebGL offers, and allows you to quickly read up on what functionality is offered by each specific class.


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
