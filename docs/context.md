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

  const gl = createGLContext(options);

### Arguments:

1. **options** (*object*) - An object with the following properties:

### Options:

* **canvas** (*string*|*DOMElement*,
  required for browser contexts, ignored for headless contexts)
  Can be a string with the canvas id or the canvas element itself.
* **width** (*number*,
  required for headless contexts, ignored for browser contexts) -
  width of the "vrtual screen" render target
* **height** (*number*,
  required for headless contexts, ignored for browser contexts) -
  height of the "vrtual screen" render target
* **debug** (*boolean*, `true`) - Unless set to false,
  all gl calls will be `console.log`-ged and errors thrown to the console.
  Note that catching webgl errors has a performance impact as it requires
  a GPU sync after each operation, so make sure to pass `false` in production
  environments.
* **webgl2** (*boolean*, `false`) - If true, will attempt to create a
  WebGL2 context (not supported on headless environments). Will fall back
  to WebGL1 contexts. Use `gl instanceof WebGL2RenderingContext` to determine
  what type of context was actually returned.
* **headlessGL** (*function*, null) -
  In Node.js environments, contexts are created using
  [headless-gl](https://www.npmjs.com/package/gl).
  To avoid including the `headless-gl` module in applications that don't
  use it, luma.gl requires the app to
  install and import headless-gl itself, and pass headless-gl as an
  argument to `createGLContext`.


### Remarks

* In browser environments, contexts are created via canvas.getContext,
  first using `webgl` and then falls back to `experimental-webgl`. If
  `webgl2` option is set, this function will first try `webgl2` and then
  `experimental-webgl2`, before falling back to webgl1.
* In Node.js environments, the context is created using headless-gl.
  In this case width and height options must be supplied as there is
  no canvas element to use as reference.
* While you can certainly use
  [headless-gl](https://www.npmjs.com/package/gl) directly to
  create a context (without passing it to `createGLContext`),
  the `createGLContext` method will automatically create a browser or
  headless context depending on the environment, enabling you to write
  cleaner application code that works both in both environments.
* When working with headless environments, also note that luma.gl has two
  separate implementations of its IO API functions, `loadImage`/`loadImages`,
  that work both in browser and under Node.js. (Browser apps tend to rely on
  the DOM `Image` class to load images, which is not available under Node.js).

```js
import headlessGL from 'gl';
import {createGLContext} from 'luma.gl';
const gl = createGLContext({headlessGL})
```


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
* Luma allows you to set `id`s on many classes, which allows you to easily
  check in the debugger which object is involved in a stack trace.
* Luma has takes care to extract as much information as possible about
  shader compiler errors etc, and will throw exceptions with very detailed
  error strings when shaders fail to compile.
* Luma also understands `glslify` "names", making it possible to name shaders
  inside the shader code, which makes it easier to identify which shader
  is being called.
* Luma runs checks on attributes and buffers when they are being set,
  catching many trivial errors such as setting uniforms to `undefined`
  or wrong type (scalar vs array etc).
* Luma has a logging mechanism. Set the global variable lumaLog.priority to 3
  (can be done in the browser console at any time) and luma will print
  tables for uniforms and attributes providing information
  about their values and types before each render call. This can be extremely
  helpful for checking that shaders are getting valid inputs.

