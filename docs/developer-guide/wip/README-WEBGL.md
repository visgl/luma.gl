# WebGL Module Reference

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
| [`Buffer`](/docs/api-reference/webgl/buffer.md)             | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`Framebuffer`](/docs/api-reference/webgl/framebuffer.md)   | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Off-screen render target, Container for textures and renderbuffers. |
| [`Renderbuffer`](/docs/api-reference/webgl/renderbuffer.md) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds image data that is optimized for rendering but does not supporting sampling |
| [`Program`](/docs/api-reference/webgl/program.md)           | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms. |
| [`Shader`](/docs/api-reference/webgl/shader.md)             | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Holds a compiled GLSL shader program. |
| [`Texture2D`](/docs/api-reference/webgl/texture-2d.md)         | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture in a format that supports sampling |
| [`TextureCube`](/docs/api-reference/webgl/texture-cube.md)       | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds 6 textures |
| [`Texture2DArray`](/docs/api-reference/webgl/texture-2d-array.md) **WebGL2** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds an array of textures |
| [`Texture3D`](/docs/api-reference/webgl/texture-3d.md) **WebGL2** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a stack of textures |
| [`Query`](/docs/api-reference/webgl/query.md) **WebGL2/ext*** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
| [`Sampler`](/docs/api-reference/webgl/sampler.md) **WebGL2** | [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| [`Sync`](/#/documentation/api-reference/sync) **WebGL2**      | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](/docs/api-reference/webgl/transform-feedback.md) **WebGL2** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](/docs/api-reference/webgl/vertex-array.md) **WebGL2/ext** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |

| ----------------------------------- | ============== | =============== |
| **Class/Module**                    | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`context`](/#/documentation/api-reference/webgl-context)           | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |


| **Class/Module** | **WebGL Type** | **Description** |
| --- | --- | --- |
| [`createGLContext`](context.html#createGLContext) | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`Buffer`](buffer.html)  | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`FrameBuffer`](frame-buffer.html) | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |
| [`RenderBuffer`](render-buffer.html) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds a renderbuffer |
| [`Program`](program.html)  | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Shader`](shader.html)  | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Texture2D`](texture.html)  | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`TextureCube`](texture.html) | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture2DArray`](texture.html) **`WebGL2`** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture3D`](texture.html) **`WebGL2`** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Query`](query.html) **`WebGL2`/`ext`** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
| [`Sampler`](sampler.html) **`WebGL2`** | [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| [`Sync`](sync.html) **`WebGL2`** | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](transform-feedback.html) **`WebGL2`** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](vertex-array-object.html) **`WebGL2`/`ext`** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes |


## General Comments

luma.gl provides JavaScript classes that manage core WebGL object types, with the intention of making these WebGL objects easier to work with in JavaScript, without adding an abstraction layer.

The WebGL classes manage the resources that can be created in WebGL and naturally collect related functionality from the sprawling WebGL2 API into methods on classes. Each class provides methods that closely matches the operations supported by the underlying WebGL object, trying carefully not to alter semantics, while reducing the boilerplate often required by the verbose low-level WebGL functions (such as long, repeated argument lists, as well as the additional WebGL calls that are often necessary to bind and configure parameters before doing an actual operation), or automatically selecting the correct function among a family of similar overloaded functions.
