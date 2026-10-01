# Type Alias: DeviceProps

> **DeviceProps** = `object`

Defined in: [modules/core/src/adapter/device.ts:384](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L384)

Device properties

## Properties[​](#properties "Direct link to Properties")

### \_cachePipelines?[​](#_cachepipelines "Direct link to _cachePipelines?")

> `optional` **\_cachePipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:468](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L468)

Enable pipeline caching (via PipelineFactory)

***

### \_cacheShaders?[​](#_cacheshaders "Direct link to _cacheShaders?")

> `optional` **\_cacheShaders?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:460](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L460)

Enable shader caching (via ShaderFactory)

***

### \_destroyPipelines?[​](#_destroypipelines "Direct link to _destroyPipelines?")

> `optional` **\_destroyPipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:476](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L476)

Destroy cached pipelines when they become unused. Defaults to `false` so repeated create/destroy cycles can still reuse cached pipelines. Enable this if the application creates very large numbers of distinct pipelines and needs cache eviction.

***

### \_destroyShaders?[​](#_destroyshaders "Direct link to _destroyShaders?")

> `optional` **\_destroyShaders?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:466](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L466)

Destroy cached shaders when they become unused. Defaults to `false` so repeated create/destroy cycles can still reuse cached shaders. Enable this if the application creates very large numbers of distinct shaders and needs cache eviction.

***

### \_disabledFeatures?[​](#_disabledfeatures "Direct link to _disabledFeatures?")

> `optional` **\_disabledFeatures?**: `Partial`<`Record`<[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md), `boolean`>>

Defined in: [modules/core/src/adapter/device.ts:456](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L456)

Disable specific features

***

### ~~\_handle?~~[​](#_handle "Direct link to _handle")

> `optional` **\_handle?**: `unknown`

Defined in: [modules/core/src/adapter/device.ts:479](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L479)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Internal, Do not use directly! Use `luma.attachDevice()` to attach to pre-created contexts/devices.

***

### \_initializeFeatures?[​](#_initializefeatures "Direct link to _initializeFeatures?")

> `optional` **\_initializeFeatures?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:458](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L458)

WebGL specific - Initialize all features on startup

***

### \_reuseDevices?[​](#_reusedevices "Direct link to _reuseDevices?")

> `optional` **\_reuseDevices?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:454](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L454)

adapter.create() returns the existing Device if the provided canvas' WebGL context is already associated with a Device.

***

### \_sharePipelines?[​](#_sharepipelines "Direct link to _sharePipelines?")

> `optional` **\_sharePipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:470](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L470)

Enable sharing of backend render-pipeline implementations when caching is enabled. Currently used by WebGL.

***

### createCanvasContext?[​](#createcanvascontext "Direct link to createCanvasContext?")

> `optional` **createCanvasContext?**: [`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md) | `true`

Defined in: [modules/core/src/adapter/device.ts:388](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L388)

Properties for creating a default canvas context

***

### debug?[​](#debug "Direct link to debug?")

> `optional` **debug?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:435](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L435)

Turn on implementation defined checks that slow down execution but help break where errors occur

***

### debugFactories?[​](#debugfactories "Direct link to debugFactories?")

> `optional` **debugFactories?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:443](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L443)

Traces resource caching, reuse, and destroys in the PipelineFactory

***

### debugFramebuffers?[​](#debugframebuffers "Direct link to debugFramebuffers?")

> `optional` **debugFramebuffers?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:441](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L441)

Renders a small version of updated Framebuffers into the primary canvas context. Can be set in console luma.log.set('debug-framebuffers', true)

***

### debugGPUTime?[​](#debuggputime "Direct link to debugGPUTime?")

> `optional` **debugGPUTime?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:437](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L437)

Enable GPU timestamp collection without enabling all debug validation paths.

***

### debugShaders?[​](#debugshaders "Direct link to debugShaders?")

> `optional` **debugShaders?**: `"never"` | `"errors"` | `"warnings"` | `"always"`

Defined in: [modules/core/src/adapter/device.ts:439](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L439)

Show shader source in browser? The default is `'error'`, meaning that logs are shown when shader compilation has errors

***

### debugSpectorJS?[​](#debugspectorjs "Direct link to debugSpectorJS?")

> `optional` **debugSpectorJS?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:447](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L447)

WebGL specific - Initialize the SpectorJS WebGL debugger. Can be set in console luma.log.set('debug-spectorjs', true)

***

### debugSpectorJSUrl?[​](#debugspectorjsurl "Direct link to debugSpectorJSUrl?")

> `optional` **debugSpectorJSUrl?**: `string`

Defined in: [modules/core/src/adapter/device.ts:449](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L449)

WebGL specific - SpectorJS URL. Override if CDN is down or different SpectorJS version is desired.

***

### debugWebGL?[​](#debugwebgl "Direct link to debugWebGL?")

> `optional` **debugWebGL?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:445](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L445)

WebGL specific - Trace WebGL calls (instruments WebGL2RenderingContext at the expense of performance). Can be set in console luma.log.set('debug-webgl', true)

***

### failIfMajorPerformanceCaveat?[​](#failifmajorperformancecaveat "Direct link to failIfMajorPerformanceCaveat?")

> `optional` **failIfMajorPerformanceCaveat?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:392](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L392)

Hints that device creation should fail if no hardware GPU is available (if the system performance is "low").

***

### featureLevel?[​](#featurelevel "Direct link to featureLevel?")

> `optional` **featureLevel?**: [`WebGPUFeatureLevel`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/WebGPUFeatureLevel.md)

Defined in: [modules/core/src/adapter/device.ts:394](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L394)

WebGPU only: selects the feature/limit profile. Defaults to `'core'`; use `'max'` to request every supported adapter feature and limit, `'compatibility'` to opt into compatibility mode, or `'best-available'` to upgrade a compatibility adapter to core when possible.

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/core/src/adapter/device.ts:386](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L386)

string id for debugging. Stored on the object, used in logging and set on underlying GPU objects when feasible.

***

### onDevicePixelRatioChange?[​](#ondevicepixelratiochange "Direct link to onDevicePixelRatioChange?")

> `optional` **onDevicePixelRatioChange?**: (`ctx`, `info`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:427](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L427)

Called when the device pixel ratio of a CanvasContext's canvas changes

#### Parameters[​](#parameters "Direct link to Parameters")

##### ctx[​](#ctx "Direct link to ctx")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

##### info[​](#info "Direct link to info")

###### oldRatio[​](#oldratio "Direct link to oldRatio")

`number`

#### Returns[​](#returns "Direct link to Returns")

`unknown`

***

### onError?[​](#onerror "Direct link to onError?")

> `optional` **onError?**: (`error`, `context?`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:413](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L413)

Error handler. If it returns a probe logger style function, it will be called at the site of the error to optimize console error links.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### error[​](#error "Direct link to error")

`Error`

##### context?[​](#context "Direct link to context?")

`unknown`

#### Returns[​](#returns-1 "Direct link to Returns")

`unknown`

***

### onPositionChange?[​](#onpositionchange "Direct link to onPositionChange?")

> `optional` **onPositionChange?**: (`ctx`, `info`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:420](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L420)

Called when the absolute position of a CanvasContext's canvas changes. Must set `CanvasContextProps.trackPosition: true`

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### ctx[​](#ctx-1 "Direct link to ctx")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

##### info[​](#info-1 "Direct link to info")

###### oldPosition[​](#oldposition "Direct link to oldPosition")

\[`number`, `number`]

#### Returns[​](#returns-2 "Direct link to Returns")

`unknown`

***

### onResize?[​](#onresize "Direct link to onResize?")

> `optional` **onResize?**: (`ctx`, `info`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:415](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L415)

Called when the size of a CanvasContext's canvas changes

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### ctx[​](#ctx-2 "Direct link to ctx")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

##### info[​](#info-2 "Direct link to info")

###### oldPixelSize[​](#oldpixelsize "Direct link to oldPixelSize")

\[`number`, `number`]

#### Returns[​](#returns-3 "Direct link to Returns")

`unknown`

***

### onVisibilityChange?[​](#onvisibilitychange "Direct link to onVisibilityChange?")

> `optional` **onVisibilityChange?**: (`ctx`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:425](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L425)

Called when the visibility of a CanvasContext's canvas changes

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### ctx[​](#ctx-3 "Direct link to ctx")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`unknown`

***

### optionalFeatures?[​](#optionalfeatures "Direct link to optionalFeatures?")

> `optional` **optionalFeatures?**: readonly [`WebGPUDeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/WebGPUDeviceFeature.md)\[]

Defined in: [modules/core/src/adapter/device.ts:396](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L396)

WebGPU only: additional supported device features to request without enabling the full `'max'` profile. Unsupported entries are ignored.

***

### powerPreference?[​](#powerpreference "Direct link to powerPreference?")

> `optional` **powerPreference?**: `"default"` | `"high-performance"` | `"low-power"`

Defined in: [modules/core/src/adapter/device.ts:390](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L390)

Control which type of GPU is preferred on systems with both integrated and discrete GPU. Defaults to "high-performance" / discrete GPU.

***

### requiredLimits?[​](#requiredlimits "Direct link to requiredLimits?")

> `optional` **requiredLimits?**: `Partial`<`Record`\<keyof [`DeviceLimits`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceLimits.md), `number`>>

Defined in: [modules/core/src/adapter/device.ts:405](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L405)

WebGPU only: device limits to request, forwarded to `GPUDeviceDescriptor.requiredLimits`. The device gets exactly these values when they are better than the spec defaults; values worse than the defaults are raised to the defaults. Values the adapter cannot provide make device creation fail. Ignored by `attach()`, WebGL, and null devices.

***

### webgl?[​](#webgl "Direct link to webgl?")

> `optional` **webgl?**: `WebGLContextProps`

Defined in: [modules/core/src/adapter/device.ts:408](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L408)

WebGL specific: Properties passed through to WebGL2RenderingContext creation: `canvas.getContext('webgl2', props.webgl)`

***

### xrCompatible?[​](#xrcompatible "Direct link to xrCompatible?")

> `optional` **xrCompatible?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:398](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L398)

WebGPU only: requests an adapter that can present frames to a WebXR session.
