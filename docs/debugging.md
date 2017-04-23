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
* Luma takes care to extract as much information as possible about
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
