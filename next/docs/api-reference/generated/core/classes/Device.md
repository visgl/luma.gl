# Abstract Class: Device

Defined in: [modules/core/src/adapter/device.ts:492](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L492)

WebGPU Device/WebGL context abstraction

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Device**(`props`): `Device`

Defined in: [modules/core/src/adapter/device.ts:551](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L551)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)

#### Returns[​](#returns "Direct link to Returns")

`Device`

## Properties[​](#properties "Direct link to Properties")

### \_factories[​](#_factories "Direct link to _factories")

> **\_factories**: `DeviceFactories` = `{}`

Defined in: [modules/core/src/adapter/device.ts:522](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L522)

Internal per-device factory storage

***

### \_reused[​](#_reused "Direct link to _reused")

> **\_reused**: `boolean` = `false`

Defined in: [modules/core/src/adapter/device.ts:527](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L527)

True if this device has been reused during device creation (app has multiple references)

***

### canvasContext[​](#canvascontext "Direct link to canvasContext")

> `abstract` **canvasContext**: [`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md) | `null`

Defined in: [modules/core/src/adapter/device.ts:720](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L720)

Default / primary canvas context. Can be null as WebGPU devices can be created without a CanvasContext

***

### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

> `abstract` **commandEncoder**: [`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)

Defined in: [modules/core/src/adapter/device.ts:513](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L513)

***

### features[​](#features "Direct link to features")

> `abstract` **features**: [`DeviceFeatures`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceFeatures.md)

Defined in: [modules/core/src/adapter/device.ts:536](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L536)

Optional capability discovery

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/device.ts:512](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L512)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/core/src/adapter/device.ts:509](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L509)

id of this device, primarily for debugging

***

### info[​](#info "Direct link to info")

> `abstract` **info**: [`DeviceInfo`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceInfo.md)

Defined in: [modules/core/src/adapter/device.ts:534](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L534)

Information about the device (vendor, versions etc)

***

### lost[​](#lost "Direct link to lost")

> `abstract` `readonly` **lost**: `Promise`<{ `message`: `string`; `reason`: `"destroyed"`; }>

Defined in: [modules/core/src/adapter/device.ts:653](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L653)

Promise that resolves when device is lost

***

### preferredColorFormat[​](#preferredcolorformat "Direct link to preferredColorFormat")

> `abstract` **preferredColorFormat**: `"rgba8unorm"` | `"bgra8unorm"` | `"rgba16float"`

Defined in: [modules/core/src/adapter/device.ts:543](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L543)

Optimal presentation format, including rgba16float for high-dynamic-range canvases.

***

### preferredDepthFormat[​](#preferreddepthformat "Direct link to preferredDepthFormat")

> `abstract` **preferredDepthFormat**: `"depth24plus"` | `"depth32float"` | `"depth16"`

Defined in: [modules/core/src/adapter/device.ts:545](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L545)

Default depth format used on this system

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)>

Defined in: [modules/core/src/adapter/device.ts:516](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L516)

A copy of the device props

***

### statsManager[​](#statsmanager "Direct link to statsManager")

> `readonly` **statsManager**: [`StatsManager`](https://luma.gl/next/docs/api-reference/generated/core/interfaces/StatsManager.md) = `lumaStats`

Defined in: [modules/core/src/adapter/device.ts:520](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L520)

stats

***

### timestamp[​](#timestamp "Direct link to timestamp")

> **timestamp**: `number` = `0`

Defined in: [modules/core/src/adapter/device.ts:524](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L524)

An abstract timestamp used for change tracking

***

### type[​](#type "Direct link to type")

> `abstract` `readonly` **type**: `"webgl"` | `"webgpu"` | `"null"` | `"unknown"`

Defined in: [modules/core/src/adapter/device.ts:511](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L511)

type of this device

***

### userData[​](#userdata "Direct link to userData")

> **userData**: `object` = `{}`

Defined in: [modules/core/src/adapter/device.ts:518](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L518)

Available for the application to store data on the device

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `unknown`

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)>

Defined in: [modules/core/src/adapter/device.ts:493](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L493)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/device.ts:495](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L495)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### isLost[​](#islost "Direct link to isLost")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** `abstract` **isLost**(): `boolean`

Defined in: [modules/core/src/adapter/device.ts:650](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L650)

`true` if device is already lost

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

***

### limits[​](#limits "Direct link to limits")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** `abstract` **limits**(): [`DeviceLimits`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceLimits.md)

Defined in: [modules/core/src/adapter/device.ts:538](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L538)

WebGPU style device limits

##### Returns[​](#returns-3 "Direct link to Returns")

[`DeviceLimits`](https://luma.gl/next/docs/api-reference/generated/core/classes/DeviceLimits.md)

## Methods[​](#methods "Direct link to Methods")

### \_createBindGroupLayoutWebGPU()[​](#_createbindgrouplayoutwebgpu "Direct link to _createBindGroupLayoutWebGPU()")

> **\_createBindGroupLayoutWebGPU**(`_pipeline`, `_group`): `unknown`

Defined in: [modules/core/src/adapter/device.ts:827](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L827)

Internal WebGPU-only helper for retrieving the native bind-group layout for a pipeline group.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### \_pipeline[​](#_pipeline "Direct link to _pipeline")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md) | [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

##### \_group[​](#_group "Direct link to _group")

`number`

#### Returns[​](#returns-4 "Direct link to Returns")

`unknown`

***

### \_createBindGroupWebGPU()[​](#_createbindgroupwebgpu "Direct link to _createBindGroupWebGPU()")

> **\_createBindGroupWebGPU**(`_bindGroupLayout`, `_shaderLayout`, `_bindings`, `_group`, `_label?`): `unknown`

Defined in: [modules/core/src/adapter/device.ts:835](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L835)

Internal WebGPU-only helper for creating a native bind group.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### \_bindGroupLayout[​](#_bindgrouplayout "Direct link to _bindGroupLayout")

`unknown`

##### \_shaderLayout[​](#_shaderlayout "Direct link to _shaderLayout")

[`ShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderLayout.md) | [`ComputeShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputeShaderLayout.md)

##### \_bindings[​](#_bindings "Direct link to _bindings")

[`Bindings`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/Bindings.md)

##### \_group[​](#_group-1 "Direct link to _group")

`number`

##### \_label?[​](#_label "Direct link to _label?")

`string`

#### Returns[​](#returns-5 "Direct link to Returns")

`unknown`

***

### \_createSharedRenderPipelineWebGL()[​](#_createsharedrenderpipelinewebgl "Direct link to _createSharedRenderPipelineWebGL()")

> **\_createSharedRenderPipelineWebGL**(`_props`): [`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

Defined in: [modules/core/src/adapter/device.ts:822](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L822)

Internal helper for creating a shareable WebGL render-pipeline implementation.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### \_props[​](#_props "Direct link to _props")

[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-6 "Direct link to Returns")

[`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

***

### \_disableDebugGPUTime()[​](#_disabledebuggputime "Direct link to _disableDebugGPUTime()")

> **\_disableDebugGPUTime**(): `void`

Defined in: [modules/core/src/adapter/device.ts:888](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L888)

Internal helper that disables device-managed GPU timing collection and restores the default command encoder to an unprofiled state.

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### \_enableDebugGPUTime()[​](#_enabledebuggputime "Direct link to _enableDebugGPUTime()")

> **\_enableDebugGPUTime**(`queryCount?`): [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md) | `null`

Defined in: [modules/core/src/adapter/device.ts:862](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L862)

Internal helper that enables device-managed GPU timing collection on the default command encoder. Reuses the existing query set if timing is already enabled.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### queryCount?[​](#querycount "Direct link to queryCount?")

`number` = `256`

Number of timestamp slots reserved for profiled passes.

#### Returns[​](#returns-8 "Direct link to Returns")

[`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md) | `null`

The device-managed timestamp QuerySet, or `null` when timing is not supported or could not be enabled.

***

### \_isDebugGPUTimeEnabled()[​](#_isdebuggputimeenabled "Direct link to _isDebugGPUTimeEnabled()")

> **\_isDebugGPUTimeEnabled**(): `boolean`

Defined in: [modules/core/src/adapter/device.ts:904](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L904)

Internal helper that returns `true` when device-managed GPU timing is currently active.

#### Returns[​](#returns-9 "Direct link to Returns")

`boolean`

***

### \_supportsDebugGPUTime()[​](#_supportsdebuggputime "Direct link to _supportsDebugGPUTime()")

> **\_supportsDebugGPUTime**(): `boolean`

Defined in: [modules/core/src/adapter/device.ts:849](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L849)

Internal helper that returns `true` when timestamp-query GPU timing should be collected for this device.

#### Returns[​](#returns-10 "Direct link to Returns")

`boolean`

***

### beginComputePass()[​](#begincomputepass "Direct link to beginComputePass()")

> **beginComputePass**(`props?`): [`ComputePass`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePass.md)

Defined in: [modules/core/src/adapter/device.ts:794](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L794)

Create a ComputePass using the default CommandEncoder

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### props?[​](#props-2 "Direct link to props?")

[`ComputePassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePassProps.md)

#### Returns[​](#returns-11 "Direct link to Returns")

[`ComputePass`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePass.md)

***

### beginRenderPass()[​](#beginrenderpass "Direct link to beginRenderPass()")

> **beginRenderPass**(`props?`): [`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)

Defined in: [modules/core/src/adapter/device.ts:789](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L789)

Create a RenderPass using the default CommandEncoder

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### props?[​](#props-3 "Direct link to props?")

[`RenderPassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassProps.md)

#### Returns[​](#returns-12 "Direct link to Returns")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)

***

### ~~clearWebGL()~~[​](#clearwebgl "Direct link to clearwebgl")

> **clearWebGL**(`options?`): `void`

Defined in: [modules/core/src/adapter/device.ts:978](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L978)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

###### color?[​](#color "Direct link to color?")

`any`

###### depth?[​](#depth "Direct link to depth?")

`any`

###### framebuffer?[​](#framebuffer "Direct link to framebuffer?")

[`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

###### stencil?[​](#stencil "Direct link to stencil?")

`any`

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

* will be removed - should use clear arguments in RenderPass

***

### createBuffer()[​](#createbuffer "Direct link to createBuffer()")

> `abstract` **createBuffer**(`props`): [`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/adapter/device.ts:742](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L742)

Create a buffer

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### props[​](#props-4 "Direct link to props")

`ArrayBuffer` | `ArrayBufferView`<`ArrayBufferLike`> | [`BufferProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BufferProps.md)

#### Returns[​](#returns-14 "Direct link to Returns")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

***

### createCanvasContext()[​](#createcanvascontext "Direct link to createCanvasContext()")

> `abstract` **createCanvasContext**(`props?`): [`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

Defined in: [modules/core/src/adapter/device.ts:731](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L731)

Creates a new CanvasContext (WebGPU only)

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### props?[​](#props-5 "Direct link to props?")

[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md)

#### Returns[​](#returns-15 "Direct link to Returns")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

***

### createCommandEncoder()[​](#createcommandencoder "Direct link to createCommandEncoder()")

> `abstract` **createCommandEncoder**(`props?`): [`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)

Defined in: [modules/core/src/adapter/device.ts:776](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L776)

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### props?[​](#props-6 "Direct link to props?")

[`CommandEncoderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CommandEncoderProps.md)

#### Returns[​](#returns-16 "Direct link to Returns")

[`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)

***

### createComputePipeline()[​](#createcomputepipeline "Direct link to createComputePipeline()")

> `abstract` **createComputePipeline**(`props`): [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

Defined in: [modules/core/src/adapter/device.ts:763](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L763)

Create a compute pipeline (aka program). WebGPU only.

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### props[​](#props-7 "Direct link to props")

[`ComputePipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePipelineProps.md)

#### Returns[​](#returns-17 "Direct link to Returns")

[`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

***

### createExternalTexture()[​](#createexternaltexture "Direct link to createExternalTexture()")

> `abstract` **createExternalTexture**(`props`): [`ExternalTexture`](https://luma.gl/next/docs/api-reference/generated/core/classes/ExternalTexture.md)

Defined in: [modules/core/src/adapter/device.ts:748](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L748)

Create a temporary external texture binding when available on this backend.

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### props[​](#props-8 "Direct link to props")

[`ExternalTextureProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ExternalTextureProps.md)

#### Returns[​](#returns-18 "Direct link to Returns")

[`ExternalTexture`](https://luma.gl/next/docs/api-reference/generated/core/classes/ExternalTexture.md)

***

### createFence()[​](#createfence "Direct link to createFence()")

> **createFence**(): [`Fence`](https://luma.gl/next/docs/api-reference/generated/core/classes/Fence.md)

Defined in: [modules/core/src/adapter/device.ts:784](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L784)

Create a fence sync object

#### Returns[​](#returns-19 "Direct link to Returns")

[`Fence`](https://luma.gl/next/docs/api-reference/generated/core/classes/Fence.md)

***

### createFramebuffer()[​](#createframebuffer "Direct link to createFramebuffer()")

> `abstract` **createFramebuffer**(`props`): [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

Defined in: [modules/core/src/adapter/device.ts:754](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L754)

Create a Framebuffer. Must have at least one attachment.

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### props[​](#props-9 "Direct link to props")

[`FramebufferProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/FramebufferProps.md)

#### Returns[​](#returns-20 "Direct link to Returns")

[`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

***

### createPresentationContext()[​](#createpresentationcontext "Direct link to createPresentationContext()")

> `abstract` **createPresentationContext**(`props?`): [`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

Defined in: [modules/core/src/adapter/device.ts:734](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L734)

Creates a presentation context for a destination canvas. WebGL requires the default canvas context to use an OffscreenCanvas.

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### props?[​](#props-10 "Direct link to props?")

[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md)

#### Returns[​](#returns-21 "Direct link to Returns")

[`PresentationContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/PresentationContext.md)

***

### createQuerySet()[​](#createqueryset "Direct link to createQuerySet()")

> `abstract` **createQuerySet**(`props`): [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)

Defined in: [modules/core/src/adapter/device.ts:781](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L781)

#### Parameters[​](#parameters-15 "Direct link to Parameters")

##### props[​](#props-11 "Direct link to props")

[`QuerySetProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/QuerySetProps.md)

#### Returns[​](#returns-22 "Direct link to Returns")

[`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)

***

### createRenderBundleEncoder()[​](#createrenderbundleencoder "Direct link to createRenderBundleEncoder()")

> `abstract` **createRenderBundleEncoder**(`props?`): [`RenderBundleEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundleEncoder.md)

Defined in: [modules/core/src/adapter/device.ts:771](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L771)

Creates an encoder for reusable WebGPU draw commands.

#### Parameters[​](#parameters-16 "Direct link to Parameters")

##### props?[​](#props-12 "Direct link to props?")

[`RenderBundleEncoderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderBundleEncoderProps.md)

Resource metadata and render-attachment compatibility requirements.

#### Returns[​](#returns-23 "Direct link to Returns")

[`RenderBundleEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundleEncoder.md)

A render bundle encoder that records without beginning a render pass.

#### Throws[​](#throws "Direct link to Throws")

On backends other than WebGPU.

***

### createRenderPipeline()[​](#createrenderpipeline "Direct link to createRenderPipeline()")

> `abstract` **createRenderPipeline**(`props`): [`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

Defined in: [modules/core/src/adapter/device.ts:760](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L760)

Create a render pipeline (aka program)

#### Parameters[​](#parameters-17 "Direct link to Parameters")

##### props[​](#props-13 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-24 "Direct link to Returns")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

***

### createSampler()[​](#createsampler "Direct link to createSampler()")

> `abstract` **createSampler**(`props`): [`Sampler`](https://luma.gl/next/docs/api-reference/generated/core/classes/Sampler.md)

Defined in: [modules/core/src/adapter/device.ts:751](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L751)

Create a sampler

#### Parameters[​](#parameters-18 "Direct link to Parameters")

##### props[​](#props-14 "Direct link to props")

[`SamplerProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/SamplerProps.md)

#### Returns[​](#returns-25 "Direct link to Returns")

[`Sampler`](https://luma.gl/next/docs/api-reference/generated/core/classes/Sampler.md)

***

### createShader()[​](#createshader "Direct link to createShader()")

> `abstract` **createShader**(`props`): [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

Defined in: [modules/core/src/adapter/device.ts:757](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L757)

Create a shader

#### Parameters[​](#parameters-19 "Direct link to Parameters")

##### props[​](#props-15 "Direct link to props")

[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)

#### Returns[​](#returns-26 "Direct link to Returns")

[`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

***

### createTexture()[​](#createtexture "Direct link to createTexture()")

> `abstract` **createTexture**(`props`): [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

Defined in: [modules/core/src/adapter/device.ts:745](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L745)

Create a texture

#### Parameters[​](#parameters-20 "Direct link to Parameters")

##### props[​](#props-16 "Direct link to props")

[`TextureProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureProps.md)

#### Returns[​](#returns-27 "Direct link to Returns")

[`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

***

### createTransformFeedback()[​](#createtransformfeedback "Direct link to createTransformFeedback()")

> `abstract` **createTransformFeedback**(`props`): [`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)

Defined in: [modules/core/src/adapter/device.ts:779](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L779)

Create a transform feedback (immutable set of output buffer bindings). WebGL only.

#### Parameters[​](#parameters-21 "Direct link to Parameters")

##### props[​](#props-17 "Direct link to props")

[`TransformFeedbackProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TransformFeedbackProps.md)

#### Returns[​](#returns-28 "Direct link to Returns")

[`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)

***

### createVertexArray()[​](#createvertexarray "Direct link to createVertexArray()")

> `abstract` **createVertexArray**(`props`): [`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)

Defined in: [modules/core/src/adapter/device.ts:774](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L774)

Create a vertex array

#### Parameters[​](#parameters-22 "Direct link to Parameters")

##### props[​](#props-18 "Direct link to props")

[`VertexArrayProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexArrayProps.md)

#### Returns[​](#returns-29 "Direct link to Returns")

[`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)

***

### debug()[​](#debug "Direct link to debug()")

> **debug**(): `void`

Defined in: [modules/core/src/adapter/device.ts:703](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L703)

Break in the debugger - if device.props.debug is true

#### Returns[​](#returns-30 "Direct link to Returns")

`void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> `abstract` **destroy**(): `void`

Defined in: [modules/core/src/adapter/device.ts:556](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L556)

#### Returns[​](#returns-31 "Direct link to Returns")

`void`

***

### generateMipmapsWebGPU()[​](#generatemipmapswebgpu "Direct link to generateMipmapsWebGPU()")

> **generateMipmapsWebGPU**(`_texture`): `void`

Defined in: [modules/core/src/adapter/device.ts:817](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L817)

Generate mipmaps for a WebGPU texture. WebGPU textures must be created up front with the required mip count, usage flags, and a format that supports the chosen generation path. WebGL uses `Texture.generateMipmapsWebGL()` directly because the backend manages mip generation on the texture object itself.

#### Parameters[​](#parameters-23 "Direct link to Parameters")

##### \_texture[​](#_texture "Direct link to _texture")

[`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)

#### Returns[​](#returns-32 "Direct link to Returns")

`void`

***

### ~~getCanvasContext()~~[​](#getcanvascontext "Direct link to getcanvascontext")

> **getCanvasContext**(): [`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

Defined in: [modules/core/src/adapter/device.ts:919](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L919)

#### Returns[​](#returns-33 "Direct link to Returns")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use getDefaultCanvasContext()

***

### getDefaultCanvasContext()[​](#getdefaultcanvascontext "Direct link to getDefaultCanvasContext()")

> **getDefaultCanvasContext**(): [`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

Defined in: [modules/core/src/adapter/device.ts:723](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L723)

Returns the default / primary canvas context. Throws an error if no canvas context is available (a WebGPU compute device)

#### Returns[​](#returns-34 "Direct link to Returns")

[`CanvasContext`](https://luma.gl/next/docs/api-reference/generated/core/classes/CanvasContext.md)

***

### getExternalImageSize()[​](#getexternalimagesize "Direct link to getExternalImageSize()")

> **getExternalImageSize**(`data`): `object`

Defined in: [modules/core/src/adapter/device.ts:596](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L596)

Get the size of an external image

#### Parameters[​](#parameters-24 "Direct link to Parameters")

##### data[​](#data "Direct link to data")

[`ExternalImage`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ExternalImage.md)

#### Returns[​](#returns-35 "Direct link to Returns")

`object`

##### height[​](#height "Direct link to height")

> **height**: `number`

##### width[​](#width "Direct link to width")

> **width**: `number`

***

### getMipLevelCount()[​](#getmiplevelcount "Direct link to getMipLevelCount()")

> **getMipLevelCount**(`width`, `height`, `depth3d?`): `number`

Defined in: [modules/core/src/adapter/device.ts:585](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L585)

Calculates the number of mip levels for a texture of width, height and in case of 3d textures only, depth

#### Parameters[​](#parameters-25 "Direct link to Parameters")

##### width[​](#width-1 "Direct link to width")

`number`

##### height[​](#height-1 "Direct link to height")

`number`

##### depth3d?[​](#depth3d "Direct link to depth3d?")

`number` = `1`

#### Returns[​](#returns-36 "Direct link to Returns")

`number`

***

### getModuleData()[​](#getmoduledata "Direct link to getModuleData()")

> **getModuleData**<`ModuleDataT`>(`moduleName`): `ModuleDataT`

Defined in: [modules/core/src/adapter/device.ts:989](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L989)

#### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

##### ModuleDataT[​](#moduledatat "Direct link to ModuleDataT")

`ModuleDataT` *extends* `Record`<`string`, `unknown`>

#### Parameters[​](#parameters-26 "Direct link to Parameters")

##### moduleName[​](#modulename "Direct link to moduleName")

`string`

#### Returns[​](#returns-37 "Direct link to Returns")

`ModuleDataT`

***

### ~~getParametersWebGL()~~[​](#getparameterswebgl "Direct link to getparameterswebgl")

> **getParametersWebGL**(`parameters`): `void`

Defined in: [modules/core/src/adapter/device.ts:968](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L968)

#### Parameters[​](#parameters-27 "Direct link to Parameters")

##### parameters[​](#parameters-28 "Direct link to parameters")

`any`

#### Returns[​](#returns-38 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

* will be removed - should use WebGPU parameters (pipeline)

***

### getSupportedCompressedTextureFormats()[​](#getsupportedcompressedtextureformats "Direct link to getSupportedCompressedTextureFormats()")

> **getSupportedCompressedTextureFormats**(): `TextureFormatCompressed`\[]

Defined in: [modules/core/src/adapter/device.ts:621](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L621)

Returns the compressed texture formats that can be created and sampled on this device

#### Returns[​](#returns-39 "Direct link to Returns")

`TextureFormatCompressed`\[]

***

### getTextureFormatCapabilities()[​](#gettextureformatcapabilities "Direct link to getTextureFormatCapabilities()")

> **getTextureFormatCapabilities**(`format`): [`DeviceTextureFormatCapabilities`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceTextureFormatCapabilities.md)

Defined in: [modules/core/src/adapter/device.ts:574](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L574)

Determines what operations are supported on a texture format on this particular device (checks against supported device features)

#### Parameters[​](#parameters-29 "Direct link to Parameters")

##### format[​](#format "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-40 "Direct link to Returns")

[`DeviceTextureFormatCapabilities`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceTextureFormatCapabilities.md)

***

### getTextureFormatInfo()[​](#gettextureformatinfo "Direct link to getTextureFormatInfo()")

> **getTextureFormatInfo**(`format`): [`TextureFormatInfo`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatInfo.md)

Defined in: [modules/core/src/adapter/device.ts:569](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L569)

Returns information about a texture format, such as data type, channels, bits per channel, compression etc

#### Parameters[​](#parameters-30 "Direct link to Parameters")

##### format[​](#format-1 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-41 "Direct link to Returns")

[`TextureFormatInfo`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatInfo.md)

***

### getVertexFormatInfo()[​](#getvertexformatinfo "Direct link to getVertexFormatInfo()")

> **getVertexFormatInfo**(`format`): `VertexFormatInfo`

Defined in: [modules/core/src/adapter/device.ts:560](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L560)

#### Parameters[​](#parameters-31 "Direct link to Parameters")

##### format[​](#format-2 "Direct link to format")

[`VertexFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

#### Returns[​](#returns-42 "Direct link to Returns")

`VertexFormatInfo`

***

### incrementTimestamp()[​](#incrementtimestamp "Direct link to incrementTimestamp()")

> **incrementTimestamp**(): `number`

Defined in: [modules/core/src/adapter/device.ts:665](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L665)

A monotonic counter for tracking buffer and texture updates

#### Returns[​](#returns-43 "Direct link to Returns")

`number`

***

### insertDebugMarker()[​](#insertdebugmarker "Direct link to insertDebugMarker()")

> **insertDebugMarker**(`markerLabel`): `void`

Defined in: [modules/core/src/adapter/device.ts:643](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L643)

#### Parameters[​](#parameters-32 "Direct link to Parameters")

##### markerLabel[​](#markerlabel "Direct link to markerLabel")

`string`

#### Returns[​](#returns-44 "Direct link to Returns")

`void`

***

### isExternalImage()[​](#isexternalimage "Direct link to isExternalImage()")

> **isExternalImage**(`data`): `data is ExternalImage`

Defined in: [modules/core/src/adapter/device.ts:591](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L591)

Check if data is an external image

#### Parameters[​](#parameters-33 "Direct link to Parameters")

##### data[​](#data-1 "Direct link to data")

`unknown`

#### Returns[​](#returns-45 "Direct link to Returns")

`data is ExternalImage`

***

### isTextureFormatCompressed()[​](#istextureformatcompressed "Direct link to isTextureFormatCompressed()")

> **isTextureFormatCompressed**(`format`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:616](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L616)

Check if a specific texture format is GPU compressed

#### Parameters[​](#parameters-34 "Direct link to Parameters")

##### format[​](#format-3 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-46 "Direct link to Returns")

`boolean`

***

### isTextureFormatFilterable()[​](#istextureformatfilterable "Direct link to isTextureFormatFilterable()")

> **isTextureFormatFilterable**(`format`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:606](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L606)

Check if linear filtering (sampler interpolation) is supported for a specific texture format

#### Parameters[​](#parameters-35 "Direct link to Parameters")

##### format[​](#format-4 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-47 "Direct link to Returns")

`boolean`

***

### isTextureFormatRenderable()[​](#istextureformatrenderable "Direct link to isTextureFormatRenderable()")

> **isTextureFormatRenderable**(`format`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:611](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L611)

Check if device supports rendering to a framebuffer color attachment of a specific texture format

#### Parameters[​](#parameters-36 "Direct link to Parameters")

##### format[​](#format-5 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-48 "Direct link to Returns")

`boolean`

***

### isTextureFormatSupported()[​](#istextureformatsupported "Direct link to isTextureFormatSupported()")

> **isTextureFormatSupported**(`format`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:601](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L601)

Check if device supports a specific texture format (creation and `nearest` sampling)

#### Parameters[​](#parameters-37 "Direct link to Parameters")

##### format[​](#format-6 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-49 "Direct link to Returns")

`boolean`

***

### isVertexFormatSupported()[​](#isvertexformatsupported "Direct link to isVertexFormatSupported()")

> **isVertexFormatSupported**(`format`): `boolean`

Defined in: [modules/core/src/adapter/device.ts:564](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L564)

#### Parameters[​](#parameters-38 "Direct link to Parameters")

##### format[​](#format-7 "Direct link to format")

[`VertexFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

#### Returns[​](#returns-50 "Direct link to Returns")

`boolean`

***

### loseDevice()[​](#losedevice "Direct link to loseDevice()")

> **loseDevice**(): `boolean`

Defined in: [modules/core/src/adapter/device.ts:660](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L660)

Trigger device loss.

#### Returns[​](#returns-51 "Direct link to Returns")

`boolean`

`true` if context loss could actually be triggered.

#### Note[​](#note "Direct link to Note")

primarily intended for testing how application reacts to device loss

***

### popDebugGroup()[​](#popdebuggroup "Direct link to popDebugGroup()")

> **popDebugGroup**(): `void`

Defined in: [modules/core/src/adapter/device.ts:639](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L639)

#### Returns[​](#returns-52 "Direct link to Returns")

`void`

***

### pushDebugGroup()[​](#pushdebuggroup "Direct link to pushDebugGroup()")

> **pushDebugGroup**(`groupLabel`): `void`

Defined in: [modules/core/src/adapter/device.ts:635](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L635)

#### Parameters[​](#parameters-39 "Direct link to Parameters")

##### groupLabel[​](#grouplabel "Direct link to groupLabel")

`string`

#### Returns[​](#returns-53 "Direct link to Returns")

`void`

***

### ~~readPixelsToArrayWebGL()~~[​](#readpixelstoarraywebgl "Direct link to readpixelstoarraywebgl")

> **readPixelsToArrayWebGL**(`source`, `options?`): `Uint16Array`<`ArrayBufferLike`> | `Uint8Array`<`ArrayBufferLike`> | `Float32Array`<`ArrayBufferLike`>

Defined in: [modules/core/src/adapter/device.ts:927](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L927)

#### Parameters[​](#parameters-40 "Direct link to Parameters")

##### source[​](#source "Direct link to source")

[`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md) | [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

##### options?[​](#options-1 "Direct link to options?")

###### sourceAttachment?[​](#sourceattachment "Direct link to sourceAttachment?")

`number`

###### sourceFormat?[​](#sourceformat "Direct link to sourceFormat?")

`number`

###### sourceHeight?[​](#sourceheight "Direct link to sourceHeight?")

`number`

###### sourceType?[​](#sourcetype "Direct link to sourceType?")

`number`

###### sourceWidth?[​](#sourcewidth "Direct link to sourceWidth?")

`number`

###### sourceX?[​](#sourcex "Direct link to sourceX?")

`number`

###### sourceY?[​](#sourcey "Direct link to sourceY?")

`number`

###### target?[​](#target "Direct link to target?")

`Uint16Array`<`ArrayBufferLike`> | `Uint8Array`<`ArrayBufferLike`> | `Float32Array`<`ArrayBufferLike`>

#### Returns[​](#returns-54 "Direct link to Returns")

`Uint16Array`<`ArrayBufferLike`> | `Uint8Array`<`ArrayBufferLike`> | `Float32Array`<`ArrayBufferLike`>

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

* will be removed - should use command encoder

***

### ~~readPixelsToBufferWebGL()~~[​](#readpixelstobufferwebgl "Direct link to readpixelstobufferwebgl")

> **readPixelsToBufferWebGL**(`source`, `options?`): [`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/adapter/device.ts:945](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L945)

#### Parameters[​](#parameters-41 "Direct link to Parameters")

##### source[​](#source-1 "Direct link to source")

[`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md) | [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)

##### options?[​](#options-2 "Direct link to options?")

###### sourceFormat?[​](#sourceformat-1 "Direct link to sourceFormat?")

`number`

###### sourceHeight?[​](#sourceheight-1 "Direct link to sourceHeight?")

`number`

###### sourceType?[​](#sourcetype-1 "Direct link to sourceType?")

`number`

###### sourceWidth?[​](#sourcewidth-1 "Direct link to sourceWidth?")

`number`

###### sourceX?[​](#sourcex-1 "Direct link to sourceX?")

`number`

###### sourceY?[​](#sourcey-1 "Direct link to sourceY?")

`number`

###### target?[​](#target-1 "Direct link to target?")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

###### targetByteOffset?[​](#targetbyteoffset "Direct link to targetByteOffset?")

`number`

#### Returns[​](#returns-55 "Direct link to Returns")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

* will be removed - should use command encoder

***

### reportError()[​](#reporterror "Direct link to reportError()")

> **reportError**(`error`, `context`, ...`args`): () => `unknown`

Defined in: [modules/core/src/adapter/device.ts:686](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L686)

Reports Device errors in a way that optimizes for developer experience / debugging.

* Logs so that the console error links directly to the source code that generated the error.
* Includes the object that reported the error in the log message, even if the error is asynchronous.

Conventions when calling reportError():

* Always call the returned function - to ensure error is logged, at the error site
* Follow with a call to device.debug() - to ensure that the debugger breaks at the error site

#### Parameters[​](#parameters-42 "Direct link to Parameters")

##### error[​](#error "Direct link to error")

`Error`

the error to report. If needed, just create a new Error object with the appropriate message.

##### context[​](#context "Direct link to context")

`unknown`

pass `this` as context, otherwise it may not be available in the debugger for async errors.

##### args[​](#args "Direct link to args")

...`unknown`\[]

#### Returns[​](#returns-56 "Direct link to Returns")

the logger function returned by device.props.onError() so that it can be called from the error site.

() => `unknown`

#### Example[​](#example "Direct link to Example")

```
device.reportError(new Error(...), this)();

  device.debug();
```

***

### ~~resetWebGL()~~[​](#resetwebgl "Direct link to resetwebgl")

> **resetWebGL**(): `void`

Defined in: [modules/core/src/adapter/device.ts:983](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L983)

#### Returns[​](#returns-57 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-5 "Direct link to Deprecated")

* will be removed - should use for debugging only

***

### ~~setParametersWebGL()~~[​](#setparameterswebgl "Direct link to setparameterswebgl")

> **setParametersWebGL**(`parameters`): `void`

Defined in: [modules/core/src/adapter/device.ts:963](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L963)

#### Parameters[​](#parameters-43 "Direct link to Parameters")

##### parameters[​](#parameters-44 "Direct link to parameters")

`any`

#### Returns[​](#returns-58 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-6 "Direct link to Deprecated")

* will be removed - should use WebGPU parameters (pipeline)

***

### submit()[​](#submit "Direct link to submit()")

> `abstract` **submit**(`commandBuffer?`): `void`

Defined in: [modules/core/src/adapter/device.ts:737](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L737)

Call after rendering a frame (necessary e.g. on WebGL OffscreenCanvas)

#### Parameters[​](#parameters-45 "Direct link to Parameters")

##### commandBuffer?[​](#commandbuffer "Direct link to commandBuffer?")

[`CommandBuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandBuffer.md)

#### Returns[​](#returns-59 "Direct link to Returns")

`void`

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/device.ts:504](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L504)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-60 "Direct link to Returns")

`string`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/device.ts:499](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L499)

#### Returns[​](#returns-61 "Direct link to Returns")

`string`

***

### ~~withParametersWebGL()~~[​](#withparameterswebgl "Direct link to withparameterswebgl")

> **withParametersWebGL**(`parameters`, `func`): `any`

Defined in: [modules/core/src/adapter/device.ts:973](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L973)

#### Parameters[​](#parameters-46 "Direct link to Parameters")

##### parameters[​](#parameters-47 "Direct link to parameters")

`any`

##### func[​](#func "Direct link to func")

`any`

#### Returns[​](#returns-62 "Direct link to Returns")

`any`

#### Deprecated[​](#deprecated-7 "Direct link to Deprecated")

* will be removed - should use WebGPU parameters (pipeline)

***

### writeBufferViaCommandEncoder()[​](#writebufferviacommandencoder "Direct link to writeBufferViaCommandEncoder()")

> **writeBufferViaCommandEncoder**(`_commandEncoder`, `_destinationBuffer`, `_data`, `_byteOffset?`): `void`

Defined in: [modules/core/src/adapter/device.ts:803](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L803)

Internal helper for encoding CPU-to-buffer uploads in submission order. Backends may record onto the supplied command encoder or fall back to an immediate write when no separate queue ordering is required.

#### Parameters[​](#parameters-48 "Direct link to Parameters")

##### \_commandEncoder[​](#_commandencoder "Direct link to _commandEncoder")

[`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)

##### \_destinationBuffer[​](#_destinationbuffer "Direct link to _destinationBuffer")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

##### \_data[​](#_data "Direct link to _data")

`ArrayBufferLike` | `ArrayBufferView`<`ArrayBufferLike`>

##### \_byteOffset?[​](#_byteoffset "Direct link to _byteOffset?")

`number` = `0`

#### Returns[​](#returns-63 "Direct link to Returns")

`void`

***

### \_getCanvasContextProps()[​](#_getcanvascontextprops "Direct link to _getCanvasContextProps()")

> `static` **\_getCanvasContextProps**(`props`): [`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md) | `undefined`

Defined in: [modules/core/src/adapter/device.ts:999](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L999)

Helper to get the canvas context props

#### Parameters[​](#parameters-49 "Direct link to Parameters")

##### props[​](#props-19 "Direct link to props")

[`DeviceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/DeviceProps.md)

#### Returns[​](#returns-64 "Direct link to Returns")

[`CanvasContextProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CanvasContextProps.md) | `undefined`
