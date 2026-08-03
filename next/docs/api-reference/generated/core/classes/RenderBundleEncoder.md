# Abstract Class: RenderBundleEncoder

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L75)

Records reusable WebGPU draw commands without beginning a render pass.

## Remarks[​](#remarks "Direct link to Remarks")

Call [RenderBundleEncoder.finish](#finish) to create an immutable [RenderBundle](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md). The attachment formats and sample count supplied when creating the encoder must match every [RenderPass](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md) that executes the finished bundle.

## Extends[​](#extends "Direct link to Extends")

* [`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new RenderBundleEncoder**(`device`, `props?`): `RenderBundleEncoder`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L84)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props?[​](#props "Direct link to props?")

[`RenderBundleEncoderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderBundleEncoderProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`RenderBundleEncoder`

#### Overrides[​](#overrides "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/core/src/adapter/resources/resource.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L131)

Whether this resource has been destroyed

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`destroyed`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#destroyed)

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/resources/resource.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L124)

The device that this resource is associated with

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`device`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#device)

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`handle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#handle)

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`id`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#id)

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`props`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#props)

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`userData`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#userdata)

***

### defaultClearColor[​](#defaultclearcolor "Direct link to defaultClearColor")

> `static` **defaultClearColor**: \[`number`, `number`, `number`, `number`]

Defined in: [modules/core/src/adapter/resources/render-pass.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L104)

TODO - should be \[0, 0, 0, 0], update once deck.gl tests run clean

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`defaultClearColor`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#defaultclearcolor)

***

### defaultClearDepth[​](#defaultcleardepth "Direct link to defaultClearDepth")

> `static` **defaultClearDepth**: `number` = `1`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L106)

Depth 1.0 represents the far plance

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`defaultClearDepth`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#defaultcleardepth)

***

### defaultClearStencil[​](#defaultclearstencil "Direct link to defaultClearStencil")

> `static` **defaultClearStencil**: `number` = `0`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L108)

Clears all stencil bits

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`defaultClearStencil`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#defaultclearstencil)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`RenderPassProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassProps.md)>

Defined in: [modules/core/src/adapter/resources/render-pass.ts:177](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L177)

Default properties for RenderPass

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`defaultProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#defaultprops)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L76)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`[toStringTag]`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#tostringtag)

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`isHandleBorrowed`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#ishandleborrowed)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`ownsHandle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#ownshandle)

## Methods[​](#methods "Direct link to Methods")

### attachResource()[​](#attachresource "Direct link to attachResource()")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L200)

Attaches a resource. Attached resources are auto destroyed when this resource is destroyed Called automatically when sub resources are auto created but can be called by application

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`attachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#attachresource)

***

### beginOcclusionQuery()[​](#beginocclusionquery "Direct link to beginOcclusionQuery()")

> **beginOcclusionQuery**(`_queryIndex`): `void`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L119)

Render bundle encoders cannot begin occlusion queries.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### \_queryIndex[​](#_queryindex "Direct link to _queryIndex")

`number`

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

#### Throws[​](#throws "Direct link to Throws")

Always throws.

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`beginOcclusionQuery`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#beginocclusionquery)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-6 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use destroy()

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`delete`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L173)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`destroyAttachedResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-16 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`destroyAttachedResources`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/next/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-17 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`detachResource`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#detachresource)

***

### draw()[​](#draw "Direct link to draw()")

> `abstract` **draw**(`options`): `boolean`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L145)

Issues a draw using the currently selected pipeline, bindings, and vertex array.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

[`RenderPassDrawOptions`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassDrawOptions.md)

#### Returns[​](#returns-11 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-18 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`draw`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#draw)

***

### drawIndexedIndirect()[​](#drawindexedindirect "Direct link to drawIndexedIndirect()")

> `abstract` **drawIndexedIndirect**(`indirectBuffer`, `indirectByteOffset?`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L151)

Issues an indexed draw using five 32-bit arguments stored in an indirect buffer.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### indirectBuffer[​](#indirectbuffer "Direct link to indirectBuffer")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

##### indirectByteOffset?[​](#indirectbyteoffset "Direct link to indirectByteOffset?")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-19 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`drawIndexedIndirect`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#drawindexedindirect)

***

### drawIndirect()[​](#drawindirect "Direct link to drawIndirect()")

> `abstract` **drawIndirect**(`indirectBuffer`, `indirectByteOffset?`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:148](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L148)

Issues a non-indexed draw using four uint32 arguments stored in an indirect buffer.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### indirectBuffer[​](#indirectbuffer-1 "Direct link to indirectBuffer")

[`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)

##### indirectByteOffset?[​](#indirectbyteoffset-1 "Direct link to indirectByteOffset?")

`number`

#### Returns[​](#returns-13 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-20 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`drawIndirect`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#drawindirect)

***

### end()[​](#end "Direct link to end()")

> **end**(): `void`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L103)

Render bundle encoders cannot be ended like render passes.

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

#### Throws[​](#throws-1 "Direct link to Throws")

Always throws. Call [RenderBundleEncoder.finish](#finish) instead.

#### Overrides[​](#overrides-3 "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`end`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#end)

***

### endOcclusionQuery()[​](#endocclusionquery "Direct link to endOcclusionQuery()")

> **endOcclusionQuery**(): `void`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L127)

Render bundle encoders cannot end occlusion queries.

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Throws[​](#throws-2 "Direct link to Throws")

Always throws.

#### Overrides[​](#overrides-4 "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`endOcclusionQuery`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#endocclusionquery)

***

### executeBundles()[​](#executebundles "Direct link to executeBundles()")

> `abstract` **executeBundles**(`bundles`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:158](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L158)

Replays reusable draw commands recorded by one or more render bundle encoders.

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### bundles[​](#bundles "Direct link to bundles")

`Iterable`<[`RenderBundle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md)>

Bundles whose attachment formats and sample count are compatible with this pass.

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

#### Throws[​](#throws-3 "Direct link to Throws")

On backends other than WebGPU.

#### Inherited from[​](#inherited-from-21 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`executeBundles`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#executebundles)

***

### finish()[​](#finish "Direct link to finish()")

> `abstract` **finish**(): [`RenderBundle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md)

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L97)

Completes recording and invalidates this encoder.

#### Returns[​](#returns-17 "Direct link to Returns")

[`RenderBundle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md)

An immutable reusable bundle that inherits this encoder's `id` and `userData`.

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-18 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-22 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`getProps`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#getprops)

***

### insertDebugMarker()[​](#insertdebugmarker "Direct link to insertDebugMarker()")

> `abstract` **insertDebugMarker**(`markerLabel`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:170](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L170)

Marks a point in a stream of commands with a label

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### markerLabel[​](#markerlabel "Direct link to markerLabel")

`string`

#### Returns[​](#returns-19 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-23 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`insertDebugMarker`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#insertdebugmarker)

***

### popDebugGroup()[​](#popdebuggroup "Direct link to popDebugGroup()")

> `abstract` **popDebugGroup**(): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:168](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L168)

Ends the labeled debug group most recently started by pushDebugGroup()

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-24 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`popDebugGroup`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#popdebuggroup)

***

### pushDebugGroup()[​](#pushdebuggroup "Direct link to pushDebugGroup()")

> `abstract` **pushDebugGroup**(`groupLabel`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:166](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L166)

Begins a labeled debug group containing subsequent commands

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### groupLabel[​](#grouplabel "Direct link to groupLabel")

`string`

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-25 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`pushDebugGroup`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#pushdebuggroup)

***

### setBindings()[​](#setbindings "Direct link to setBindings()")

> `abstract` **setBindings**(`bindings`, `options?`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L136)

Replaces the complete binding set used by subsequent draw commands. A pipeline must be selected first so bindings can be resolved against its shader layout.

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### bindings[​](#bindings "Direct link to bindings")

[`Bindings`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/Bindings.md) | `Partial`<`Record`<`number`, [`Bindings`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/Bindings.md)>>

##### options?[​](#options-1 "Direct link to options?")

[`RenderPassBindingOptions`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassBindingOptions.md)

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-26 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`setBindings`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#setbindings)

***

### setParameters()[​](#setparameters "Direct link to setParameters()")

> **setParameters**(`_parameters`): `void`

Defined in: [modules/core/src/adapter/resources/render-bundle.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-bundle.ts#L111)

Render bundle encoders do not support render-pass dynamic state.

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### \_parameters[​](#_parameters "Direct link to _parameters")

[`RenderPassParameters`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPassParameters.md)

#### Returns[​](#returns-23 "Direct link to Returns")

`void`

#### Throws[​](#throws-4 "Direct link to Throws")

Always throws.

#### Overrides[​](#overrides-5 "Direct link to Overrides")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`setParameters`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#setparameters)

***

### setPipeline()[​](#setpipeline "Direct link to setPipeline()")

> `abstract` **setPipeline**(`pipeline`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L130)

Selects the pipeline used by subsequent binding and draw commands.

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### pipeline[​](#pipeline "Direct link to pipeline")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

#### Returns[​](#returns-24 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-27 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`setPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#setpipeline)

***

### setVertexArray()[​](#setvertexarray "Direct link to setVertexArray()")

> `abstract` **setVertexArray**(`vertexArray`): `void`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:142](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L142)

Selects the vertex array used by subsequent draw commands.

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### vertexArray[​](#vertexarray "Direct link to vertexArray")

[`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)

#### Returns[​](#returns-25 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-28 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`setVertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#setvertexarray)

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-26 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-29 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`toJSON`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-27 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-30 "Direct link to Inherited from")

[`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).[`toString`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md#tostring)
