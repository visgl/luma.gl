---
layout: docs
title: Overview
categories: [Documentation]
---

This is the main page of the reference documentation for **luma.gl**.

## WebGL Classes and Functions
---------------------------

At its core, luma.gl provides JavaScript classes that manage basic
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

To maximize interoperability with WebGL code that does not use luma.gl, the main
class does not have a corresponding JavaScript class but is used
directly by the application. Instead a couple of functions are provided to
simplify working with gl contexts.

|========|========|
| **Function** | **Description** |
|========|========|
| **hasWebGL** | Check if WebGL is availble |
| **createGLContext** | Create a WebGLRenderingContext |
| **hasExtension** | Check if extension is availble |
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
