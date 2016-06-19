---
layout: docs
title: WebGL Context
categories: [Documentation]
---

Provides functions to create and initialize a WebGL context, and
to check for presence of WebGL and extensions.

* Provides the `createGLContext` method which can create WebGLContexts
  both in browsers and under Node.js.
* Also provides `getGLExtension` that throws an `Error` if
  the requested extension cannot be returned.

Note that the use of these functions is NOT required to use the remaining
functions and classes in luma.gl.
You could e.g. manually create a WebGLContext by using canvas.getContext,
or use a context created by another WebGL library.
In fact, luma.gl is explicitly designed to work with any WebGL context, and
in contrast to some other approaches, luma.gl maintains no "hidden state"
that might complicate composing your code with other WebGL based modules.


Function: createGLContext {#createGLContext}
------------------------------------------------

Creates and returns a WebGL context, both in browsers and in Node.js.

### Syntax:

  const gl = createGLContext(canvas[, options]);

### Arguments:

1. **canvas** (*mixed*) - Can be a string with the canvas id or the canvas element itself.
2. **options** (*object*) - An object with the following properties:

### Options:

* **debug** (*boolean*, false) - If true, all gl calls will be `console.log`-ged and errors thrown to the console.
* **webgl2** (*boolean*, false) - If true, will attempt to create WebGL2 context
* **width** (*boolean*) - for headless contexts

### Remarks

* In browser environments, contexts are created via canvas.getContext,
  first using `webgl` and then falls back to `experimental-webgl`. If
  `webgl2` option is set, this function will first try `webgl2` and then
  `experimental-webgl2`, before falling back to webgl1.
* In Node.js environments, the context is created using headless-gl.
  In this case width and height options are important.
* The `preserveDrawingBuffers` option  defaults to `true` if not overriden.
  This differs from the normal WebGL context creation defaults.


Static Method: getGLExtension {#getGLExtension}
-----------------------------------------------------------

Returns the WebGL extension with the given name,
For example `OES_texture_float`.
Throws an Error if the extension is not available.

More info [here](http://www.khronos.org/registry/webgl/extensions/).

### Syntax:

  getGLExtension(gl, name);


### Arguments:

1. **name** (*string*) - The name of the extension.


## luma.gl WebGL Wrappers - Design Goals
---------------------------------

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
WebGLRendingContexttype does not have a corresponding luma.gl wrapper class,
but is instead used directly by the luma.gl API.
A simple global function is provided to help in creating gl contexts.


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

