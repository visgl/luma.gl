---
layout: docs
title: Overview
categories: [Documentation]
---

# WebGL Classes
---------------------------

At its core, luma.gl provides JavaScript classes that manage
core WebGL object types, with the intention of making these WebGL objects
easier to work with in JavaScript.

* *Boilerplate reduction* - These classes provide an API that closely matches
  the operations supported by the underlying WebGL object, while reducing
  the boilerplate often required by low-level WebGL functions (such as long,
  repeated argument lists, or the multiple WebGL calls that are often
  necessary to select and set up things before doing an actual operation).

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

|========|========|========|
| **Class** | **WebGL Type** | **Description** |
|========|========|========|
| **Program**  | [WebGLProgram](https://developer.mozilla.org/en-US/docs/Web/API/WebGLProgram) | Compiles and stores shaders, methods for setting attributes and uniforms
| **Buffer**  | [WebGLBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLBuffer) | Holds memory on GPU |
| **Texture**  | [WebGLTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture) | Holds a loaded texture |
| **FrameBuffer** | [WebGLFrameBuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFrameBuffer) | Holds a framebuffer |


# WebGL functions
---------------------------------

To maximize interoperability with WebGL code that does not use luma.gl, the main
[WebGLRenderingContext]
(https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext)
class does not have a corresponding JavaScript class but is instead used
directly by the application. Instead a number of
functions are provided.

|========|========|
| **Function** | **Description** |
|========|========|
| **hasWebGL** | Check if WebGL is availble |
| **createGLContext** | Create a WebGLRenderingContext |
| **hasExtension** | Check if extension is availble |
| **getExtension** | Get extension object |


# Scenegraph classes
---------------------------------

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **Object3D** | Base class for scene graph objects, rarely used directly. Holds position, rotation, scale and manages the transformation matrices and uniforms |
| **Group** | An Object3D that can hold a list of children, including other groups. Supports recursive travesal and matrix transformation |
| **Scene**  | A group of objects with settings that can be rendered using a camera |
| **Model** | A renderable scene graph object that holds a Program, a Geometry (attributes), and uniforms. |

# Geometry classes
---------------------------------

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **Geometry** | Holds a set of attributes (vertices, normals, texCoords, indices) and drawType for a geometric primitive |
| **ConeGeometry** | Creates attributes for a cone |
| **CubeGeometry** | Creates attributes for a cube |
| **IcoSphereGeometry** | Creates attributes for an icosahedron |
| **PlaneGeometry** | Creates attributes for a plane |
| **SphereGeometry** | Creates attributes for a sphere |

# Other
---------------------------------

|========|========|========|
| **Class** | **Description** |
|========|========|========|
| **PerspectiveCamera**  | Camera - calculates uniforms for perspective viewing |
| **OrthoCamera**  | Camera - calculates uniforms for orthographic viewing |
| **Math** | Small math library, Vec3, Vec4, Mat4, Quat |
| **Event**  | Event handling |
| **IO** | Loader support |

# Render Loop
---------------------------------

Application can use the render loop support in the Fx addon, or set up its
own render loop, normally using `window.requestAnimationFrame`.

# Addons
---------------------------------

Functions that are not considered a core part of the library are
collected in an addons folder.
