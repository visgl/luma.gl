# Debugging

luma.gl has a number of provisions for debugging that can help you save a lot
of time during development.

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

* luma.gl takes care to extract as much information as possible about shader compiler errors etc, and will throw exceptions with very detailed error strings when shaders fail to compile.
* luma.gl also understands `glslify` "names", making it possible to name shaders inside the shader code, which makes it easier to identify which shader is being called.


## Parameter Validation

luma.gl runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).

Buffers will also have their first values checked to ensure that they are not NaN.


## Debug Contexts

The application can create debug contexts from normal contexts.

When the `luma.log.debug` flag is set, debug contexts do the following:

* Checks the WebGL error status after each WebGL call and throws an exception if an error was reported. Raw WebGL calls tend to either fail silently or log something cryptic in the console without making it clear what call generated the warning, so being able to break on exceptions where they happen in the luma code can be very helpful.

* *Parameter checking* - Parameter checks help catch a number of common WebGL coding mistakes, which is important since bad parameters in WebGL often lead to silent failure to render, or to inscrutable error messages in the console, both of which can be hard to debug. As an example, setting uniforms to illegal values now throws an exception containing a helpful error message including the name of the problematic uniform.

## Error Handling

* *Error handling* - Methods carefully check WebGL return values and throw exceptions when things go wrong, taking care to extract helpful information into the error message. As an example, a failed shader compilation will throw an Error with a message indicating the problem inline in the shader's GLSL source.


* Note: Debug contexts impose a significant performance penalty (due to constantly waiting for the GPU to return error codes) and should not be used in production builds.


## Seer Integration

luma.gl is integrated with the `seer` Chrome extension, giving you a powerful tool for viewing and inspecting luma.gl state at runtime


## Short List
TODO - duplicate of above, review and cut

* Luma checks the gl error status after each WebGL call and throws an exception if an error was reported. Raw WebGL calls tend to either fail silently or log something cryptic in the console without making it clear what call generated the warning, so being able to break on exceptions where they happen in the luma code can be very helpful.
* Luma allows you to set `id`s on many classes, which allows you to easily check in the debugger which object is involved in a stack trace.
* Luma has takes care to extract as much information as possible about shader compiler errors etc, and will throw exceptions with very detailed error strings when shaders fail to compile.
* Luma also understands `glslify` "names", making it possible to name shaders inside the shader code, which makes it easier to identify which shader is being called.
* Luma runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).
* Luma has a logging mechanism. Set the global variable lumaLog.priority to 3 (can be done in the browser console at any time) and luma will print tables for uniforms and attributes providing information about their values and types before each render call. This can be extremely helpful for checking that shaders are getting valid inputs.
* Seer integration
