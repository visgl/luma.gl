# Abstract Class: Resource\<Props>

Defined in: [modules/core/src/adapter/resources/resource.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L97)

Base class for GPU (WebGPU/WebGL) Resources

## Extended by[​](#extended-by "Direct link to Extended by")

* [`Buffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Buffer.md)
* [`Texture`](https://luma.gl/next/docs/api-reference/generated/core/classes/Texture.md)
* [`TextureView`](https://luma.gl/next/docs/api-reference/generated/core/classes/TextureView.md)
* [`ExternalTexture`](https://luma.gl/next/docs/api-reference/generated/core/classes/ExternalTexture.md)
* [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)
* [`Sampler`](https://luma.gl/next/docs/api-reference/generated/core/classes/Sampler.md)
* [`Framebuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/Framebuffer.md)
* [`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)
* [`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)
* [`RenderPass`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md)
* [`RenderBundle`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderBundle.md)
* [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)
* [`ComputePass`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePass.md)
* [`CommandEncoder`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandEncoder.md)
* [`CommandBuffer`](https://luma.gl/next/docs/api-reference/generated/core/classes/CommandBuffer.md)
* [`VertexArray`](https://luma.gl/next/docs/api-reference/generated/core/classes/VertexArray.md)
* [`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)
* [`QuerySet`](https://luma.gl/next/docs/api-reference/generated/core/classes/QuerySet.md)
* [`Fence`](https://luma.gl/next/docs/api-reference/generated/core/classes/Fence.md)
* [`PipelineLayout`](https://luma.gl/next/docs/api-reference/generated/core/classes/PipelineLayout.md)

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Props[​](#props "Direct link to Props")

`Props` *extends* [`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Resource**<`Props`>(`device`, `props`, `defaultProps`): `Resource`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L154)

Create a new Resource. Called from Subclass

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props-1 "Direct link to props")

`Props`

##### defaultProps[​](#defaultprops "Direct link to defaultProps")

`Required`<`Props`>

#### Returns[​](#returns "Direct link to Returns")

`Resource`<`Props`>

## Properties[​](#properties "Direct link to Properties")

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/core/src/adapter/resources/resource.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L131)

Whether this resource has been destroyed

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/resources/resource.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L124)

The device that this resource is associated with

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

***

### props[​](#props-2 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

***

### defaultProps[​](#defaultprops-1 "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

Defined in: [modules/core/src/adapter/resources/resource.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L99)

Default properties for resource

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** `abstract` **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L106)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

## Methods[​](#methods "Direct link to Methods")

### attachResource()[​](#attachresource "Direct link to attachResource()")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L200)

Attaches a resource. Attached resources are auto destroyed when this resource is destroyed Called automatically when sub resources are auto created but can be called by application

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

`Resource`<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-5 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use destroy()

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L173)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

`Resource`<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

`Resource`<[`ResourceProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-9 "Direct link to Returns")

`void`

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-10 "Direct link to Returns")

`object`

returns a map of overridden default props

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-11 "Direct link to Returns")

`string`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L108)

#### Returns[​](#returns-12 "Direct link to Returns")

`string`
