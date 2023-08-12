# Debugging

Debugging GPU code can be quite tricky. It is not possible to put breakpoints in or 
single step through GPU shaders, and when they fail, a black screen may not provide much
information. The error can be in the shader, in the data that was provided to the GPU,
or in one of the many GPU pipeline settings, or in the way the APIs were called.

luma.gl provides a number of facilities for debugging your GPU code, to help you save time during development:

- Object tracking via `id` fields.
- Log levels, verbose logs display all values being passed to each draw call.
- Detailed shader compilation logs. 
- Parameter validation
- Spector.js integration
- Khronos WebGL debug integration - Synchronous WebGL error capture (optional module).

## id strings

Most classes in luma.gl allow you to supply an optional `id` string to their constructors. 
This allows you to later easily check in the debugger which object 
(which specific instance of that class) you are looking at when debugging code.

```typescript
const program = device.createRenderPipeline({id: 'cube-program', ...});
const program = device.createRenderPipeline({id: 'pyramid-program', ...});
```

Apart from providing a human-readable `id` field when inspecting objects in the debugger,  
the `id`s that the application provides are used in multiple places:

- luma.gl's built-in logging (see next section) often includes object `id`s.
- `id` is copied into the WebGPU object `label` field which is designed to support debugging.
- `id` is exposed to Specter.js (luma.gl sets the [`__SPECTOR_Metadata`](https://github.com/BabylonJS/Spector.js#custom-data field on WebGL object handles).

## Logging

luma.gl logs its activities. 

Set the global variable `luma.log.level` (this can be done in the browser console at any time) 

```typescript
luma.log.level=1 
```

| `luma.log.level` | luma.gl will print |
| --- | --- |
| `1` | modest amount of initialization information. |
| `3` | tables for uniforms and attributes providing information about their values and types before each render call. This can be extremely helpful for checking that shaders are getting valid inputs. |

## Shader compilation errors

luma.gl takes care to extract as much information as possible about shader compiler errors etc, 
and will throw exceptions with detailed error strings when shaders fail to compile. 
luma.gl also injects and parses `glslify` style `#define SHADER_NAME` "shader names". 

Naming shaders directly in the shader code can help identify which 
shader is involved when debugging shader parsing errors occur.

## Parameter Validation

luma.gl runs checks on attributes and buffers when they are being set, catching many trivial errors such as setting uniforms to `undefined` or wrong type (scalar vs array etc).

Buffers will also have their first values checked to ensure that they are not NaN. As an example, setting uniforms to illegal values now throws an exception containing a helpful error message including the name of the problematic uniform.

## Resource Leak Detection

See the chapter on Profiling for tools that can help spot resource leaks.

## WebGL API tracing integration (WebGL only)

luma.gl is pre-integrated with the Khronos group's WebGL developer tools (the [WebGLDeveloperTools](https://github.com/KhronosGroup/WebGLDeveloperTools)) which provide the following features:

- **WebGL API tracing** - Logs each call to the WebGL context with parameters.
- **Synchronous WebGL Error Detections** - Checks the WebGL error status after each WebGL call and throws an exception if an error was detected, breaking the debugger at the correct place, and also extract helpful information about the error. 
- **WebGL Parameters Checking** - Checks that WebGL parameters are set to valid values.

The most flexible way to enable WebGL API tracing is by typing the following command into the browser developer tools console:

Note that the developer tools module is loaded dynamically when a device is created with the debug flag set, so the developer tools can be activated in production code by opening the browser console and typing:

`luma.set('debug', true)`

and then reloading the browser tab.

While usually not recommended, it is also possible to activate the developer tools manually. Call [`luma.createDevice`](/docs/api-reference-v8/webgl-legacy/context/context-api) with `debug: true` to create a WebGL context instrumented with the WebGL developer tools:

```typescript
import {luma} from '@luma.gl/api';
import '@luma.gl/debug';
const device = luma.createDevice({type: 'webgl', debug: true});
```

> Warning: WebGL debug contexts impose a significant performance penalty (luma waits for the GPU after each WebGL call to check error codes) and should not be activated in production code.

## Spector.js integration (WebGL only)

luma.gl integrates with [Spector.js](https://spector.babylonjs.com/), a powerful debug tool created by the BabylonJS team.

The most flexible way to enable Spector.js is by typing the following command into the browser developer tools console:

```
luma.log.set('spector', true);
```

And then restarting the application (e.g. via Command-R on MacOS),


You can also enable spector when creating a device  by adding the `spector: true` option.

To display Spector.js stats when loaded.

```
luma.spector.displayUI()
```

:::info
Spector.js is dynamically loaded into your application, so there is no bundle size penalty.
:::