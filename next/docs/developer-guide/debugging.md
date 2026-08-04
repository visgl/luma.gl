# Debugging

[Overview](https://luma.gl/next/docs/developer-guide.md)[Installing](https://luma.gl/next/docs/developer-guide/installing.md)[AI Agents](https://luma.gl/next/docs/developer-guide/working-with-ai.md)[Contributing](https://luma.gl/next/docs/developer-guide/contributing.md)[Editing](https://luma.gl/next/docs/developer-guide/editing.md)[Testing](https://luma.gl/next/docs/developer-guide/testing.md)[Debugging](https://luma.gl/next/docs/developer-guide/debugging.md)[Profiling](https://luma.gl/next/docs/developer-guide/profiling.md)[Bundling](https://luma.gl/next/docs/developer-guide/bundling.md)

## Why GPU Debugging can be hard[​](#why-gpu-debugging-can-be-hard "Direct link to Why GPU Debugging can be hard")

Debugging GPU code can be challenging. Standard CPU-side debugging tools like breakpoints and single stepping are not available in GPU shaders. when shaders fail, the result is often a blank screen that does not provide much information about what went wrong. In addition, the error behind a failed render can be located in very different parts of the code:

* it can be in the shader code itself
* but it can also be in the data that was provided to the GPU (attributes, bindings, uniforms etc)
* or in one of the many GPU pipeline settings
* or in the way the APIs were called.

## Debug Support Overview[​](#debug-support-overview "Direct link to Debug Support Overview")

luma.gl provides a number of facilities for debugging your GPU code, to help you save time during development. These features include

* All GPU objects have auto-populated but configurable `id` fields.
* Configurable logging of GPU operations, with optional verbose logs that display all values being passed to each draw call.
* Propagates detailed logs of errors and warnings during shader compilation.
* WebGL Parameter validation.
* Spector.js integration
* Khronos WebGL debug integration - Synchronous WebGL error capture (optional module).

## Debug flags[​](#debug-flags "Direct link to Debug flags")

The `luma.createDevice()` API accepts a number of debug parameters

```
const device = luma.createDevice({

  debugFramebuffers: true,

  debugWebGL: true,

  debugSpectorJS: true,

});
```

## Browser console debug API[​](#browser-console-debug-api "Direct link to Browser console debug API")

luma.gl exposes a global variable `luma.log` that can be manipulated in your browser dev tools console window to activate debugging. A nice aspect of this system is that it keeps state when refreshing the browser page, meaning that you can change log level, refresh the browser tab and get logs while your program reinitializes.

You can enable and disable debug features using the `luma.log.set` feature. In your browser console tab, type:

```
luma.log.set('debug-webgl', true)
```

You can also control the amount of logging you get by changing `luma.log.level`:

```
luma.log.level=1 
```

## id strings[​](#id-strings "Direct link to id strings")

Most classes in luma.gl allow you to supply an optional `id` string to their constructors. This allows you to later easily check in the debugger which object (which specific instance of that class) you are looking at when debugging code.

```
const program = device.createRenderPipeline({id: 'cube-program', ...});

const program = device.createRenderPipeline({id: 'pyramid-program', ...});
```

Apart from providing a human-readable `id` field when inspecting objects in the debugger,<br /><!-- -->the `id` is used in the following ways:

* luma.gl's built-in logging (see next section) often includes the `id`s.
* `id` is copied into the WebGPU object `label` field which is designed to support debugging.
* `id` is exposed to the WebGL Spector.js library (when activated, luma.gl sets the \[`__SPECTOR_Metadata`]\(<https://github.com/BabylonJS/Spector.js#custom-data> field on WebGL object handles).

## Logging[​](#logging "Direct link to Logging")

luma.gl logs a number of activities which can be helpful to understanding what is happening. Set the global variable `luma.log.level` (this can be done in the browser console at any time)

```
luma.log.level=1 
```

| `luma.log.level` | luma.gl will print                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1`              | modest amount of initialization information.                                                                                                                                                     |
| `3`              | tables for uniforms and attributes providing information about their values and types before each render call. This can be extremely helpful for checking that shaders are getting valid inputs. |

## Shader compilation errors[​](#shader-compilation-errors "Direct link to Shader compilation errors")

luma.gl extract as much information as possible about shader compiler errors etc, and will throw exceptions with messages intended to help narrow down the problematic shader code when a shader fails to compile.

When running in the browser, luma.gl will open a shader source code viewer window inside the application's canvas. This window shows both the shader source as well as any error messages and warnings from the shader compiler. If available translated native source is also shown. Normally this window is shown only if errors occur. By setting `Model.props.debugShaders: 'always'` the application can force the debug window to always appear.

Note that luma.gl also injects and parses `glslify`-style `#define SHADER_NAME` "shader names". Naming shaders directly in the shader code can help identify which shader is involved when debugging shader parsing errors occur.

## Buffer data inspection[​](#buffer-data-inspection "Direct link to Buffer data inspection")

On backends that support it, creating the device with `debug: true` enables a CPU side copy of the first few bytes of each `Buffer` in the `buffer.debugData` field. This field is refreshed whenever data is written or read from the CPU side, using `buffer.write()`, `buffer.readAsync()` etc and can be inspected in the debugger to inspect the contents of the buffer. When device debugging is disabled, `buffer.debugData` remains empty to avoid adding CPU allocations and copies to buffer updates.

Note that this CPU side data copy can become invalid when buffers are updated on the GPU by compute shaders or transform feedback operations, in which case reading from the buffer would be necessary to refresh the CPU side data.

## Parameter Validation[​](#parameter-validation "Direct link to Parameter Validation")

luma.gl runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).

Buffers will also have their first values checked to ensure that they are not NaN. As an example, setting uniforms to illegal values now throws an exception containing a helpful error message including the name of the problematic uniform.

## Resource Leak Detection[​](#resource-leak-detection "Direct link to Resource Leak Detection")

See the chapter on Profiling for tools that can help spot resource leaks.

## WebGL API tracing integration (WebGL only)[​](#webgl-api-tracing-integration-webgl-only "Direct link to WebGL API tracing integration (WebGL only)")

luma.gl is pre-integrated with the Khronos group's WebGL developer tools (the [WebGLDeveloperTools](https://github.com/KhronosGroup/WebGLDeveloperTools)) which provide the following features:

* **WebGL API tracing** - Logs each call to the WebGL context with parameters.
* **Synchronous WebGL Error Detections** - Checks the WebGL error status after each WebGL call and throws an exception if an error was detected, breaking the debugger at the correct place, and also extract helpful information about the error.
* **WebGL Parameters Checking** - Checks that WebGL parameters are set to valid values.

The most flexible way to enable WebGL API tracing is by typing the following command into the browser developer tools console:

Applications that want browser-console activation must include the optional debug registration entry:

```
import '@luma.gl/webgl/debug';
```

The developer tools script is then loaded dynamically when a device is created with the debug flag set, so the tools can be activated by opening the browser console and typing:

```
luma.set('debug-webgl', true)
```

then reload your browser tab.

While usually not recommended, it is also possible to activate the developer tools directly. Import the optional registration entry, then call [`luma.createDevice`](https://luma.gl/next/docs/api-reference/core/luma.md#lumacreatedevice) with `debugWebGL: true`:

```
import {luma} from '@luma.gl/core';

import '@luma.gl/webgl/debug';



const device = await luma.createDevice({type: 'webgl', debugWebGL: true});
```

> Warning: WebGL debug contexts impose a significant performance penalty (luma waits for the GPU after each WebGL call to check error codes) and should not be activated in production code.

## Spector.js integration (WebGL only)[​](#spectorjs-integration-webgl-only "Direct link to Spector.js integration (WebGL only)")

luma.gl integrates with [Spector.js](https://spector.babylonjs.com/), a powerful debug tool created by the BabylonJS team.

The most flexible way to enable Spector.js is by typing the following command into the browser developer tools console:

```
luma.log.set('debug-spectorjs', true);
```

And then restarting the application (e.g. via Command-R on MacOS),

You can also enable Spector when creating a device by importing `@luma.gl/webgl/debug` and adding the `debugSpectorJS: true` option.

To display Spector.js stats when loaded.

```
luma.spector.displayUI()
```

info

Spector.js itself is loaded from a CDN. The optional `@luma.gl/webgl/debug` registration entry keeps the integration code out of normal WebGL application bundles.
