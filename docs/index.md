---
layout: docs
title: Overview
categories: [Documentation]
---

This is the main page of the reference documentation for **luma.gl**.

As a guide for getting started, for most applications,
the [`Model`](model.html), [`Scene`](scene.html) and
[`PerspectiveCamera`](camera.html#PerspectiveCamera)
classes are likely the primary luma.gl classes.
These tie together a lot of the concepts in luma.gl and are good places
to start reading.

## Core Classes
---------------------------------

These classes are the basic building blocks of most applications.

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| [`Model`](model.html) | A renderable object with Geometry, Textures, and uniforms. |
| [`Geometry`](geometry.html) | Holds attributes and drawType for a geometric primitive |
| [`PerspectiveCamera`](camera.html#PerspectiveCamera) | Generates uniform matrices for perspective viewing |
| [`OrthoCamera`](camera.html#OrthoCamera)  | Generates uniform matrices for orthographic viewing |

## Scene Graph
---------------------------------

A basic hierarchy of 3D objects with positioning, grouping, traversal and
scene support.

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| [`Object3D`](object3d.html) | Base class, golds position, rotation, scale |
| [`Group`](group.html) | Supports recursive travesal and matrix transformation |
| [`Scene`](scene.html) | A Group with settings that can be rendered using default shaders |


## Geometric Primitives
---------------------------------

A geometry holds a set of attributes (native JavaScript arrays)
(vertices, normals, texCoords, indices) and a drawType.

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| [`Geometry`](geometry.html#Geometry) | Base class, holds vertex attributes and drawType |
| [`ConeGeometry`](geometry.html#ConeGeometry) | Vertex attributes for a cone |
| [`CubeGeometry`](geometry.html#CubeGeometry) | Vertex attributes for a cube |
| [`IcoSphereGeometry`](geometry.html#IcoSphereGeometry) | Vertex attributes for an icosahedron |
| [`PlaneGeometry`](geometry.html#PlaneGeometry) | Vertex attributes for a plane |
| [`SphereGeometry`](geometry.html#SphereGeometry) | Vertex attributes for a sphere |


## WebGL Classes
---------------------------

luma.gl is built on top of a set of JavaScript modules and classes that
manage/wrap basic WebGL API objects, making WebGL objects easier to work
with in JavaScript.

|========|========|========|
| **Class/Module** | **WebGL Type** | **Description** |
|========|========|========|
| [`createGLContext`](context.html#createGLContext) | [`WebGLRenderingContext`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| [`Program`](program.html)  | [`WebGLProgram`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| [`Buffer`](buffer.html)  | [`WebGLBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| [`Texture`](texture.html)  | [`WebGLTexture`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| [`FrameBuffer`](frame-buffer.html) | [`WebGLFrameBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |
| [`RenderBuffer`](render-buffer.html) | [`WebGLRenderBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderBuffer) | Holds a renderbuffer |
| [`VertexAttributes`](vertex-attributes.html) | [`gl.vertexAttrib*`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer)  | Manipulates shader attributes |

## WebGL2 Classes
---------------------------

luma.gl is designed to facilitate use of the latest WebGL features, so
wrapper classes are provided for the new objects in WebGL2.

|========|========|========|
| **Class/Module** | **WebGL Type** | **Description** |
|========|========|========|
| `Query` | [`WebGLQuery`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery) | Occlusion, performance queries |
| `Sampler` | [`WebGLSampler`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSampler) | Stores texture sampling params  |
| `Sync` | [`WebGLSync`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLSync) | Synchronize GPU and app. |
| `TransformFeedback` | [`WebGLTransformFeedback`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTransformFeedback) | Capture Vertex Shader output |
| `VertexArrayObject` | [`WebGLVertexArrayObject`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject) | Save global vertex attribute array. |

## Supporting Modules
---------------------------------

|========|========|========|
| **Module** | **Description** |
|========|========|========|
| [`Math`](math.html) | Small math library, Vec3, Vec4, Mat4, Quat |
| [`Event`](event.html)  | Event handling |
| [`IO`](io.html) | Loader support |
| [`Fx`](fx.html) | render loop support (or use `window.requestAnimationFrame`) |


## Addons
---------------------------------

Functions that are not considered a core part of the library are
collected in the `addons` folder. These are not guaranteed to remain in future
versions of the library, but in such cases they can be copied into the
application if still useful.
