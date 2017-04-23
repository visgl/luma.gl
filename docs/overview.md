
# Overview

## Core classes

* **Model** - Smart wrapper around the WebGL `Program` class.
* **AnimationFrame** - Smart wrapper around 'requestAnimationFrame'


## Companion Modules

luma.gl offers a number of companion "modules":

* **WebGL Classes** - Make working with WebGL a little easier.
* **Math Library** - A math library with basic 2, 3 and 4 dimensional
  vectors and matrices. Allows you to manipulate arrays as if they were
  JavaScript objects.
* **Shader Assembly** - Registry of reusable shader packages, with platform
  patching support.
* **Geometry Primitives** - Cubes, Spheres, Cones etc.
* **IO** - Load images and data both in the Browser and under Node.js.


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

| ==== | ===== |
| Buffer |

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

