# User's Guide


# Overview

## Core classes

* **Model** - Smart wrapper around the WebGL `Program` class.
* **AnimationFrame** - Smart wrapper around 'requestAnimationFrame'


## Companion Modules

luma.gl offers a number of companion "modules":

* **WebGL Classes** - Make working with WebGL a little easier.
* **Math Library** - A math library with basic 2, 3 and 4 dimensional vectors and matrices. Allows you to manipulate arrays as if they were JavaScript objects.
* **Shader Assembly** - Registry of reusable shader packages, with platform patching support.
* **Geometry Primitives** - Cubes, Spheres, Cones etc.
* **IO** - Load images and data both in the Browser and under Node.js.


## WebGL Classes

luma.gl's WebGL classes offer a simple way to work with WebGL in JavaScript, without hiding or interfering with the WebGL API. In this sense, luma.gl is not a classic "WebGL Framework": it intentionally doesn't try to manage WebGL objects, or hide them from the developer
under higher levels of abstraction.

Highlights:
* Familiar API - Work directly with classes mapping to the familiar OpenGL objects (Buffers, Textures, Programs, Framebuffers etc) and use the standard GL constants just like you always have.
* Stateless WebGL - Easy to locally override global GL state.
* Portability - luma.gl simplifies working with WebGL extensions and creating code that works across WebGL versions (WebGL 1 and WebGL 2). And `Capabilities` helps your app determine what features are available.
* Boilerplate reduction - luma.gl automatically deduces common parameters and binds/unbinds your resources as needed.
* No ownership of WebGL context. Use your luma.gl context with other WebGL code, or use luma.gl with WebGL contexts created by other frameworks.
