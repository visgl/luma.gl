# v8 API Reference

Starting from luma.gl v9, the `@luma.gl/gltools` exports the now deprecated luma.gl v8 WebGL API.

The module provides WebGL context related functionality as well as WebGL API classes.

> These docs are work in progress

## WebGL Classes

luma.gl provides a set of JavaScript classes that wrap WebGL resource objects,
with the goal of making WebGL easier to work with and to learn.

These objects all inherit from the [`Resource`](/docs/api-reference-v8/webgl-legacy/classes/resource) class.

| ----------------------------------- | ============== | =============== |
| **Resource Class**                  | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`Buffer`](./classes/buffer)             | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`Framebuffer`](./classes/framebuffer)   | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Off-screen render target, Container for textures and renderbuffers. |
| [`Renderbuffer`](./classes/renderbuffer) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds image data that is optimized for rendering but does not supporting sampling |
| [`Program`](./classes/program)           | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms. |
| [`Shader`](./classes/shader)             | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Holds a compiled GLSL shader program. |
| [`Texture2D`](./classes/texture-2d)         | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture in a format that supports sampling |
| [`TextureCube`](./classes/texture-cube)       | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds 6 textures |
| [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds an array of textures |
| [`Texture3D`](./classes/texture-3d) **WebGL2** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a stack of textures |
| [`Query`](./classes/query) **WebGL2/ext*** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
| [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| [`Sync`](/#/documentation/api-reference/sync) **WebGL2**      | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](./classes/transform-feedback) **WebGL2** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](./classes/vertex-array) **WebGL2/ext** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |

| ----------------------------------- | ============== | =============== |
| **Class/Module**                    | **WebGL Type** | **Description** |
| ----------------------------------- | ============== | =============== |
| [`context`](/#/documentation/api-reference/webgl-context)           | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`VertexAttributes`](/docs/api-reference-v8/webgl-legacy/classes/vertex-array) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |


| **Class/Module** | **WebGL Type** | **Description** |
| --- | --- | --- |
| [`createGLContext`](/docs/api-reference-v8/webgl-legacy/context/context-api#createGLContext) | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`Buffer`](/docs/api-reference-v8/webgl-legacy/classes/buffer)  | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`FrameBuffer`](/docs/api-reference-v8/webgl-legacy/classes/framebuffer) | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |
| [`RenderBuffer`](/docs/api-reference-v8/webgl-legacy/classes/renderbuffer) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds a renderbuffer |
| [`Program`](/docs/api-reference-v8/webgl-legacy/classes/program)  | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Shader`](/docs/api-reference-v8/webgl-legacy/classes/shader)  | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Texture2D`](/docs/api-reference-v8/webgl-legacy/classes/texture)  | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`TextureCube`](/docs/api-reference-v8/webgl-legacy/classes/texture) | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture2DArray`](/docs/api-reference-v8/webgl-legacy/classes/texture) **`WebGL2`** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture3D`](/docs/api-reference-v8/webgl-legacy/classes/texture) **`WebGL2`** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Query`](/docs/api-reference-v8/webgl-legacy/classes/query) **`WebGL2`/`ext`** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](/docs/api-reference-v8/webgl-legacy/classes/transform-feedback) **`WebGL2`** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](/docs/api-reference-v8/webgl-legacy/classes/vertex-array-object) **`WebGL2`/`ext`** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |
| [`VertexAttributes`](/docs/api-reference-v8/webgl-legacy/classes/vertex-array) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |
| [`VertexAttributes`](/docs/api-reference-v8/webgl-legacy/classes/vertex-array) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes |


## General Comments

The `@luma.gl/gltools` module provides JavaScript classes that manage core WebGL object types, making these WebGL objects easier to work with in JavaScript without adding an abstraction layer.

The WebGL classes manage the resources that can be created in WebGL and naturally collect related functionality from the sprawling WebGL2 API into methods on classes. Each class provides methods that closely matches the operations supported by the underlying WebGL object, trying carefully not to alter semantics, while reducing the boilerplate often required by the verbose low-level WebGL functions (such as long, repeated argument lists, as well as the additional WebGL calls that are often necessary to bind and configure parameters before doing an actual operation), or automatically selecting the correct function among a family of similar overloaded functions.
