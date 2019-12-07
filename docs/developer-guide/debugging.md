# Debugging

luma.gl has a number of provisions for debugging designed to help you save time during development.

## id strings

Most classes in luma.gl allow you to supply and optional `id` string to their constructors. This allows you to later easily check in the debugger which object (which specific instance of that class) is involved in a stack trace.

```js
const program = new Program(gl, {id: 'cube-program', ...});
const program = new Program(gl, {id: 'pyramid-program', ...});
```

`id`s that you provide are also used by the built-in logging.


## Logging

luma.gl has a logging mechanism. Set the global variable luma.log.level to 3 (can be done in the browser console at any time) and luma will print tables for uniforms and attributes providing information about their values and types before each render call. This can be extremely helpful for checking that shaders are getting valid inputs.


## Shader compilation errors

luma.gl takes care to extract as much information as possible about shader compiler errors etc, and will throw exceptions with very detailed error strings when shaders fail to compile. luma.gl also injects and parses `glslify` "shader names", making it possible to name shaders inside the shader code, making it easier to identify which shader is involved when e.g shader parsing errors occur.


## Parameter Validation

luma.gl runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).

Buffers will also have their first values checked to ensure that they are not NaN. As an example, setting uniforms to illegal values now throws an exception containing a helpful error message including the name of the problematic uniform.


## Debug Module

Importing `@luma.gl/debug` will enable creation of debug contexts for several **luma.gl** functions. See [@luma.gl/debug](/docs/api-reference/debug.md) for more information.

```js
import {createGLContext} from '@luma.gl/gltools';
import '@luma.gl/debug';
const gl = createGLContext(gl, {debug: true});
```




