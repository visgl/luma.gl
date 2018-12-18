# Debugging

luma.gl has a number of provisions for debugging designed to help you save time during development.


## Seer Integration

luma.gl is integrated with the [`seer`](https://chrome.google.com/webstore/detail/seer/eogckabefmgphfgngjdmmlfbddmonfdh) Chrome extension, giving you a powerful tool for viewing and inspecting luma.gl state at runtime when developing in Chrome. Installing the extension gives you a new tab in the developer tools where you can:

* See list of created `Models`
* Inspect values of uniforms and vertex attributes
* See GPU render timings for each model
* and much more.


## id strings

Most classes in luma.gl allow you to supply and optional `id` string to their constructors. This allows you to later easily check in the debugger which object (which specific instance of that class) is involved in a stack trace.

```js
const program = new Program(gl, {id: 'cube-program', ...});
const program = new Program(gl, {id: 'pyramid-program', ...});
```

`id`s that you provide are also used by the built-in logging.


## Logging

luma.gl has a logging mechanism. Set the global variable luma.log.priority to 3 (can be done in the browser console at any time) and luma will print tables for uniforms and attributes providing information about their values and types before each render call. This can be extremely helpful for checking that shaders are getting valid inputs.


## Shader compilation errors

luma.gl takes care to extract as much information as possible about shader compiler errors etc, and will throw exceptions with very detailed error strings when shaders fail to compile. luma.gl also injects and parses `glslify` "shader names", making it possible to name shaders inside the shader code, making it easier to identify which shader is involved when e.g shader parsing errors occur.


## Parameter Validation

luma.gl runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).

Buffers will also have their first values checked to ensure that they are not NaN. As an example, setting uniforms to illegal values now throws an exception containing a helpful error message including the name of the problematic uniform.


## Debug Mode Contexts

> Warning: Debug contexts impose a significant performance penalty (due to waiting for the GPU after each WebGL call to check error codes) and should not be used in production builds.

luma.gl is pre-integrated with the Khronos group's WebGL debug tools (the [WebGLDeveloperTools](https://github.com/KhronosGroup/WebGLDeveloperTools)) and can use these to "instrument" `WebGLRenderingContext`s.

The `WebGLDeveloperTools` are automatically installed when luma.gl is installed, but are not actually bundled into the application unless explicitly imported. This avoids impacting the size of production bundles built on luma.gl that typically do not need debug support.

To use debug support, first import the debug tools, then call `getDebugContext` to create a debug contexts from a normal WebGL context:

```js
import '@luma.gl/debug';
const gl = getDebugContext(gl);
```

If the debug tools haven't been imported, `getDebugContext` will print a warning and simply return the original context, so the debug code can be left in the applicatin even when debug support is not imported.

When the `luma.log.debug` flag is set, a debug contexts does the following:

* **Detects WebGL Errors** - Check the WebGL error status after each WebGL call and throws an exception if an error was detected, taking care to extract helpful information into the error message. Raw WebGL calls tend to either fail silently or log something cryptic in the console without making it clear what call generated the warning.

* **Checks WebGL Parameters** - WebGL parameter checks help catch a number of common WebGL coding mistakes, which is important since bad parameters in WebGL often lead to hard to debug symptoms such as silent failures to render, or to inscrutable error messages in the console.




