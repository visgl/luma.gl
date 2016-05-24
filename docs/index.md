---
layout: docs
title: Overview
categories: [Documentation]
---

This is the main page of the reference documentation for **luma.gl**.

As a guide for getting started: for most applications, the `Model` class is
likely the central luma.gl class. It ties together a lot of the concepts/classes
in luma.gl and is a good place to start reading.


## WebGL Classes and Functions
---------------------------

At its core, luma.gl provides JavaScript classes that manage/wrap basic
WebGL API objects, with the intention of making those objects
easier to work with in JavaScript.

|========|========|========|
| **Class** | **WebGL Type** | **Description** |
|========|========|========|
| (see below) | [WebGLRenderingContext](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext) | The main GL context. |
| **Program**  | [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Shaders, attributes and uniforms.
| **Buffer**  | [WebGLBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| **Texture**  | [WebGLTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| **FrameBuffer** | [WebGLFrameBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |

To maximize interoperability with WebGL code that does not use luma.gl, the
gl context does not have a corresponding luma class but is used
directly by the luma.gl API. Instead of a class wrapper, a couple of global
functions are provided to simplify working with gl contexts.

|========|========|
| **Function** | **Description** |
|========|========|
| **hasWebGL** | Check if WebGL is available |
| **createGLContext** | Create a WebGLRenderingContext |
| **hasExtension** | Check if extension is available |
| **getExtension** | Get extension object |


## Core Classes
---------------------------------

These classes are the basic building blocks of most applications.

| **Model** | A renderable scene graph object that holds a Program, a Geometry (attributes), and uniforms. |
| **Geometry** | Holds attributes and drawType for a geometric primitive |
| **PerspectiveCamera**  | Camera - calculates uniforms for perspective viewing |
| **OrthoCamera**  | Camera - calculates uniforms for orthographic viewing |


## Scene Graph
---------------------------------

A basic hierarchy of 3D objects with positioning, grouping, traversal and
scene support.

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **Object3D** | Base class for scene graph objects, rarely used directly. Holds position, rotation, scale and manages the transformation matrices and uniforms |
| **Group** | An Object3D that can hold a list of children, including other groups. Supports recursive travesal and matrix transformation |
| **Scene**  | A group of objects with settings that can be rendered using a camera |


## Geometric Primitives
---------------------------------

A geometry holds a set of attributes (native JavaScript arrays)
(vertices, normals, texCoords, indices) and drawType .

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **ConeGeometry** | Creates attributes for a cone |
| **CubeGeometry** | Creates attributes for a cube |
| **IcoSphereGeometry** | Creates attributes for an icosahedron |
| **PlaneGeometry** | Creates attributes for a plane |
| **SphereGeometry** | Creates attributes for a sphere |


## Other
---------------------------------

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **Math** | Small math library, Vec3, Vec4, Mat4, Quat |
| **Event**  | Event handling |
| **IO** | Loader support |


## Render Loop
---------------------------------

Application can use the render loop support in the Fx addon, or set up its
own render loop, normally using `window.requestAnimationFrame`.


## Addons
---------------------------------

Functions that are not considered a core part of the library are
collected in an addons folder.


## Debugging
---------------------------------

Luma has a number of provisions for debugging that can help you save a lot
of time during development.

* Luma checks the gl error status after each WebGL call and throws an
  exception if an error was reported. Raw WebGL calls tend to either fail
  silently or log something cryptic in the console without making it clear
  what call generated the warning, so being able to break
  on exceptions where they happen in the luma code can be very helpful.
  If you use raw gl calls and want the same behaviour, you can import
  `glCheckError` and call it after each gl call.
* Luma allows you to set `id`s on many classes, which allows you to easily
  check in the debugger which object is involved in a stack trace.
* Luma has integrated the best support for extracting information about
  shader compiler errors etc, and will throw exceptions with very detailed
  error strings when shaders fail to compile.
* Luma also understands `glslify` names, making it possible to name shaders
  inside the shader code, which makes it easier to identify which shader
  is being called.
* Luma runs checks on attributes when they are being set, catching many
  trivial errors such as setting uniforms to `undefined` or wrong type
  (scalar vs array etc).
* Luma has a logging mechanism. Set the global variable lumaLog.priority to 3
  (can be done in the browser console at any time) and luma will print
  tables for uniforms and attributes providing information
  about their values and types before each render call. This can be extremely
  helpful for checking that shaders are getting valid inputs.

**Note:** It is not currently possible to disable luma's debug support e.g.
  for a production build. However, the overhead of luma's debugging support
  should be quite small compared to rendering cost for the vast
  majority of applications.

