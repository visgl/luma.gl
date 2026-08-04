# Type Alias: DeviceProps

> **DeviceProps** = `object`

Defined in: [modules/core/src/adapter/device.ts:365](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L365)

Device properties

## Properties[​](#properties "Direct link to Properties")

### \_cachePipelines?[​](#_cachepipelines "Direct link to _cachePipelines?")

> `optional` **\_cachePipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:438](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L438)

Enable pipeline caching (via PipelineFactory)

***

### \_cacheShaders?[​](#_cacheshaders "Direct link to _cacheShaders?")

> `optional` **\_cacheShaders?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:430](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L430)

Enable shader caching (via ShaderFactory)

***

### \_destroyPipelines?[​](#_destroypipelines "Direct link to _destroyPipelines?")

> `optional` **\_destroyPipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:446](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L446)

Destroy cached pipelines when they become unused. Defaults to `false` so repeated create/destroy cycles can still reuse cached pipelines. Enable this if the application creates very large numbers of distinct pipelines and needs cache eviction.

***

### \_destroyShaders?[​](#_destroyshaders "Direct link to _destroyShaders?")

> `optional` **\_destroyShaders?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:436](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L436)

Destroy cached shaders when they become unused. Defaults to `false` so repeated create/destroy cycles can still reuse cached shaders. Enable this if the application creates very large numbers of distinct shaders and needs cache eviction.

***

### \_disabledFeatures?[​](#_disabledfeatures "Direct link to _disabledFeatures?")

> `optional` **\_disabledFeatures?**: `Partial`<`Record`<[`DeviceFeature`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceFeature.md), `boolean`>>

Defined in: [modules/core/src/adapter/device.ts:426](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L426)

Disable specific features

***

### ~~\_handle?~~[​](#_handle "Direct link to _handle")

> `optional` **\_handle?**: `unknown`

Defined in: [modules/core/src/adapter/device.ts:449](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L449)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Internal, Do not use directly! Use `luma.attachDevice()` to attach to pre-created contexts/devices.

***

### \_initializeFeatures?[​](#_initializefeatures "Direct link to _initializeFeatures?")

> `optional` **\_initializeFeatures?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:428](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L428)

WebGL specific - Initialize all features on startup

***

### \_reuseDevices?[​](#_reusedevices "Direct link to _reuseDevices?")

> `optional` **\_reuseDevices?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:424](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L424)

adapter.create() returns the existing Device if the provided canvas' WebGL context is already associated with a Device.

***

### \_sharePipelines?[​](#_sharepipelines "Direct link to _sharePipelines?")

> `optional` **\_sharePipelines?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:440](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L440)

Enable sharing of backend render-pipeline implementations when caching is enabled. Currently used by WebGL.

***

### createCanvasContext?[​](#createcanvascontext "Direct link to createCanvasContext?")

> `optional` **createCanvasContext?**: [`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md) | `true`

Defined in: [modules/core/src/adapter/device.ts:369](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L369)

Properties for creating a default canvas context

***

### debug?[​](#debug "Direct link to debug?")

> `optional` **debug?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:405](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L405)

Turn on implementation defined checks that slow down execution but help break where errors occur

***

### debugFactories?[​](#debugfactories "Direct link to debugFactories?")

> `optional` **debugFactories?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:413](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L413)

Traces resource caching, reuse, and destroys in the PipelineFactory

***

### debugFramebuffers?[​](#debugframebuffers "Direct link to debugFramebuffers?")

> `optional` **debugFramebuffers?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:411](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L411)

Renders a small version of updated Framebuffers into the primary canvas context. Can be set in console luma.log.set('debug-framebuffers', true)

***

### debugGPUTime?[​](#debuggputime "Direct link to debugGPUTime?")

> `optional` **debugGPUTime?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:407](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L407)

Enable GPU timestamp collection without enabling all debug validation paths.

***

### debugShaders?[​](#debugshaders "Direct link to debugShaders?")

> `optional` **debugShaders?**: `"never"` | `"errors"` | `"warnings"` | `"always"`

Defined in: [modules/core/src/adapter/device.ts:409](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L409)

Show shader source in browser? The default is `'error'`, meaning that logs are shown when shader compilation has errors

***

### debugSpectorJS?[​](#debugspectorjs "Direct link to debugSpectorJS?")

> `optional` **debugSpectorJS?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:417](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L417)

WebGL specific - Initialize the SpectorJS WebGL debugger. Can be set in console luma.log.set('debug-spectorjs', true)

***

### debugSpectorJSUrl?[​](#debugspectorjsurl "Direct link to debugSpectorJSUrl?")

> `optional` **debugSpectorJSUrl?**: `string`

Defined in: [modules/core/src/adapter/device.ts:419](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L419)

WebGL specific - SpectorJS URL. Override if CDN is down or different SpectorJS version is desired.

***

### debugWebGL?[​](#debugwebgl "Direct link to debugWebGL?")

> `optional` **debugWebGL?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:415](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L415)

WebGL specific - Trace WebGL calls (instruments WebGL2RenderingContext at the expense of performance). Can be set in console luma.log.set('debug-webgl', true)

***

### failIfMajorPerformanceCaveat?[​](#failifmajorperformancecaveat "Direct link to failIfMajorPerformanceCaveat?")

> `optional` **failIfMajorPerformanceCaveat?**: `boolean`

Defined in: [modules/core/src/adapter/device.ts:373](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L373)

Hints that device creation should fail if no hardware GPU is available (if the system performance is "low").

***

### featureLevel?[​](#featurelevel "Direct link to featureLevel?")

> `optional` **featureLevel?**: [`WebGPUFeatureLevel`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/WebGPUFeatureLevel.md)

Defined in: [modules/core/src/adapter/device.ts:375](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L375)

WebGPU only: selects the feature/limit profile. Defaults to `'core'`; use `'max'` to request every supported adapter feature and limit, `'compatibility'` to opt into compatibility mode, or `'best-available'` to upgrade a compatibility adapter to core when possible.

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/core/src/adapter/device.ts:367](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L367)

string id for debugging. Stored on the object, used in logging and set on underlying GPU objects when feasible.

***

### onDevicePixelRatioChange?[​](#ondevicepixelratiochange "Direct link to onDevicePixelRatioChange?")

> `optional` **onDevicePixelRatioChange?**: (`ctx`, `info`) => `unknown`

Defined in: [modules/core/src/adapter/device.ts:397](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L397)

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

Defined in: [modules/core/src/adapter/device.ts:383](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L383)

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

Defined in: [modules/core/src/adapter/device.ts:390](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L390)

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

Defined in: [modules/core/src/adapter/device.ts:385](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L385)

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

Defined in: [modules/core/src/adapter/device.ts:395](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L395)

Called when the visibility of a CanvasContext's canvas changes

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### ctx[​](#ctx-3 "Direct link to ctx")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`unknown`

***

### powerPreference?[​](#powerpreference "Direct link to powerPreference?")

> `optional` **powerPreference?**: `"default"` | `"high-performance"` | `"low-power"`

Defined in: [modules/core/src/adapter/device.ts:371](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L371)

Control which type of GPU is preferred on systems with both integrated and discrete GPU. Defaults to "high-performance" / discrete GPU.

***

### webgl?[​](#webgl "Direct link to webgl?")

> `optional` **webgl?**: `WebGLContextProps`

Defined in: [modules/core/src/adapter/device.ts:378](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L378)

WebGL specific: Properties passed through to WebGL2RenderingContext creation: `canvas.getContext('webgl2', props.webgl)`
