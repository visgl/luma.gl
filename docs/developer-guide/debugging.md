# Debugging

luma.gl has a number of facilities for debugging designed to help you save time during development.

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

```js
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

```js
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

## Spector.js integration (WebGL only)

luma.gl integrates with [Spector.js](https://spector.babylonjs.com/), a powerful debug tool created by the BabylonJS team.

To avoid performance impact, luma.gl doesn't load or start spector.js by default. 

- Add a `debug` search parameter 
- Add the `debug: true` option when creating a device.

To display Spector.js stats when loaded.

```
luma.spector.displayUI()
```

## Debug Module (WebGL only)

Importing `@luma.gl/debug` will enable creation of debug contexts for several **luma.gl** functions. See [@luma.gl/debug](/docs/api-reference/debug) for more information.

```js
import {createGLContext} from '@luma.gl/gltools';
import '@luma.gl/debug';
const gl = createGLContext(gl, {debug: true});
```
