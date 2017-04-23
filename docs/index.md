---
layout: docs
title: Overview
categories: [Documentation]
---

This is the main page of the reference documentation for luma.gl.

As a guide for getting started, for most applications,
the [`Model`](model.html), is likely the primary luma.gl class.
It ties together many concepts in luma.gl and is a good place
to start reading.

## Core Classes
---------------------------------

The basic building blocks of most applications.

| ========= | =============== |
| **Class** | **Description** |
| ========= | =============== |
| [`Model`](model.html) | A renderable object with attributes and uniforms. |
| [`Geometry`](geometry.html) | Holds attributes and drawType for a geometric primitive |
| [`Group`](group.html) | Supports recursive travesal and matrix transformation |
| [`AnimationFrame`](animation-frame.html) | render loop / app life cycle support |
| [`Object3D`](object3d.html) | Base class, golds position, rotation, scale (TBD) |

## WebGL Classes
---------------------------

luma.gl is built on top of a set of JavaScript classes that wrap the
WebGL API objects, making WebGL easier to work with in JavaScript.

| ================ | ============== | =============== |
| **Class/Module** | **WebGL Type** | **Description** |
| ================ | ============== | =============== |
| [`createGLContext`](context.html#createGLContext) | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`Buffer`](buffer.html)  | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`FrameBuffer`](frame-buffer.html) | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |
| [`RenderBuffer`](render-buffer.html) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds a renderbuffer |
| [`Program`](program.html)  | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Shader`](shader.html)  | [`WebGLShader`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Texture2D`](texture.html)  | [`WebGLTexture(GL.TEXTURE_2D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`TextureCube`](texture.html) | [`WebGLTexture(GL.TEXTURE_CUBE)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture2DArray`](texture.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_2D_ARRAY)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Texture3D`](texture.html) **WebGL2** | [`WebGLTexture(GL.TEXTURE_3D)`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`Query`](query.html) **WebGL2/ext*** | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, Tranform Feedback and Performance Queries |
| [`Sampler`](sampler.html) **WebGL2** | [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| [`Sync`](sync.html) **WebGL2** | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| [`TransformFeedback`](transform-feedback.html) **WebGL2** | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| [`VertexArrayObject`](vertex-array-object.html) **WebGL2/ext** | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes (TBD merge with VAO?) |

## WebGL Extensions
---------------------------------

luma.gl uses [`WebGL Extensions`](extensions.html) to make WebGL 2 features
(conditionally) available under WebGL1 and to enable an improved
debugging/profiling experience.

## Supporting Modules
---------------------------------

| ========= | =============== |
| **Class** | **Description** |
| ========= | =============== |
| [`Math`](math.html) | Small math library, Vec3, Vec4, Mat4, Quat |
| [`IO`](io.html)     | Node.js loader support. Also enables using streams in browser. |


## Geometric Primitives
---------------------------------

A geometry holds a set of attributes (native JavaScript arrays)
(vertices, normals, texCoords, indices) and a drawType.

| ========= | =============== |
| **Class** | **Description** |
| ========= | =============== |
| [`Geometry`](geometry.html#Geometry) | Base class, holds vertex attributes and drawType |
| [`ConeGeometry`](geometry.html#ConeGeometry) | Vertex attributes for a cone |
| [`CubeGeometry`](geometry.html#CubeGeometry) | Vertex attributes for a cube |
| [`IcoSphereGeometry`](geometry.html#IcoSphereGeometry) | Vertex attributes for an icosahedron |
| [`PlaneGeometry`](geometry.html#PlaneGeometry) | Vertex attributes for a plane |
| [`SphereGeometry`](geometry.html#SphereGeometry) | Vertex attributes for a sphere |

It is straightforward to use other primitives, e.g. from npm modules.
As long as you have a number of attributes you can wrap them in a `Geometry`
or set them directly on a `Model` or a `Program`.


## Addons
---------------------------------

Functions that are not considered a core part of the library are
collected in the `addons` folder. These are not guaranteed to remain in future
versions of the library, but in such cases they can be copied into the
application if still useful.

| ========= | =============== |
| **Class** | **Description** |
| ========= | =============== |
| [`Event`](event.html)  | Event handling |

## Deprecated Classes
---------------------------------

Will be removed in next major version of luma.gl

| ========= | =============== |
| **Class** | **Description** |
| ========= | =============== |
| [`PerspectiveCamera`](camera.html#PerspectiveCamera) | Generates uniform matrices for perspective viewing |
| [`OrthoCamera`](camera.html#OrthoCamera)  | Generates uniform matrices for orthographic viewing |
| [`Scene`](scene.html) | A Group with settings that can be rendered using default shaders |
| [`Math`](math.html) | Old math library, Vec3, Vec4, Mat4, Quat |
| [`Fx`](fx.html) | render loop support (or use `window.requestAnimationFrame`) |
