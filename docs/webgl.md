---
layout: docs
title: WebGL
categories: [Documentation]
---

Module: WebGL {#WebGL}
===============================

Provides the `getContext` method which is a wrapper around the method that returns the native context for a 3D canvas. Also
has the code to add `LumaGL.hasWebGL()` that returns a *boolean* whether the current browser supports WebGL or not. Also provides
`LumaGL.hasExtension( name )` which returns if some WebGL extensions
are provided by the browser.


Script: Core {#Core}
===========================

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


Provides functions to create and initialize a WebGL context, and
to check for presence of WebGL and extensions.

Function: hasWebGL {#LumaGL:hasWebGL}
------------------------------------------------------

Returns true or false whether the browser supports WebGL or not.

### Syntax:

	LumaGL.hasWebGL();


Static Method: hasExtension {#LumaGL:hasExtension}
-----------------------------------------------------------

Returns true or false whether the browser supports a given WebGL
extension or not.

### Syntax:

	LumaGL.hasExtension(name);

### Arguments:

1. name  - (*string*) The name of the extension. For example `OES_texture_float`. More info [here](http://www.khronos.org/registry/webgl/extensions/).



WebGL Function: getContext {#WebGL:getContext}
------------------------------------------------

Returns a WebGL context. Tries to get the context via `experimental-webgl` or just plain `webgl` if the first one fails.

### Syntax:

  var gl = LumaGL.WebGL.getContext(canvas[, options]);

### Arguments:

1. canvas - (*mixed*) Can be a string with the canvas id or the canvas element itself.
2. options - (*object*) An object with the following properties:

### Options:

* debug - (*boolean*) If true, all gl calls will be `console.log`-ged and errors thrown to the console.

