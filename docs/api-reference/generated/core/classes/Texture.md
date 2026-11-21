# Abstract Class: Texture

Defined in: [modules/core/src/adapter/resources/texture.ts:203](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L203)

Abstract Texture interface Texture Object <https://gpuweb.github.io/gpuweb/#gputexture>

## Extends[​](#extends "Direct link to Extends")

* [`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`TextureProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureProps.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new Texture**(`device`, `props`, `backendProps?`): `Texture`

Defined in: [modules/core/src/adapter/resources/texture.ts:260](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L260)

Do not use directly. Create with device.createTexture()

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

##### props[​](#props "Direct link to props")

[`TextureProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureProps.md)

##### backendProps?[​](#backendprops "Direct link to backendProps?")

###### byteAlignment?[​](#bytealignment "Direct link to byteAlignment?")

`number`

#### Returns[​](#returns "Direct link to Returns")

`Texture`

#### Overrides[​](#overrides "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`constructor`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### baseDimension[​](#basedimension "Direct link to baseDimension")

> `readonly` **baseDimension**: `"1d"` | `"2d"` | `"3d"`

Defined in: [modules/core/src/adapter/resources/texture.ts:223](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L223)

base dimension of this texture

***

### byteAlignment[​](#bytealignment-1 "Direct link to byteAlignment")

> `readonly` **byteAlignment**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:237](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L237)

Rows are multiples of this length, padded with extra bytes if needed

***

### depth[​](#depth "Direct link to depth")

> `readonly` **depth**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:231](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L231)

depth of this texture

***

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/core/src/adapter/resources/resource.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L131)

Whether this resource has been destroyed

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyed`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyed)

***

### device[​](#device-1 "Direct link to device")

> `abstract` `readonly` **device**: [`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/adapter/resources/resource.ts:124](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L124)

The device that this resource is associated with

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`device`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#device)

***

### dimension[​](#dimension "Direct link to dimension")

> `readonly` **dimension**: `"1d"` | `"2d"` | `"2d-array"` | `"cube"` | `"cube-array"` | `"3d"`

Defined in: [modules/core/src/adapter/resources/texture.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L221)

dimension of this texture

***

### format[​](#format "Direct link to format")

> `readonly` **format**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:225](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L225)

format of this texture

***

### handle[​](#handle "Direct link to handle")

> `abstract` `readonly` **handle**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L126)

The handle for the underlying resource, e.g. WebGL object or WebGPU handle

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`handle`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#handle)

***

### height[​](#height "Direct link to height")

> `readonly` **height**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:229](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L229)

height in pixels of this texture

***

### id[​](#id "Direct link to id")

> **id**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L118)

props.id, for debugging.

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`id`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#id)

***

### isReady[​](#isready "Direct link to isReady")

> `readonly` **isReady**: `boolean` = `true`

Defined in: [modules/core/src/adapter/resources/texture.ts:246](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L246)

isReady is always true. It is provided for type compatibility with DynamicTexture.

***

### mipLevels[​](#miplevels "Direct link to mipLevels")

> `readonly` **mipLevels**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:233](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L233)

mip levels in this texture

***

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: `Required`<`Props`>

Defined in: [modules/core/src/adapter/resources/resource.ts:120](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L120)

The props that this resource was created with

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`props`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#props-1)

***

### ready[​](#ready "Direct link to ready")

> `readonly` **ready**: `Promise`<`Texture`>

Defined in: [modules/core/src/adapter/resources/texture.ts:244](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L244)

The ready promise is always resolved. It is provided for type compatibility with DynamicTexture.

***

### sampler[​](#sampler "Direct link to sampler")

> `abstract` **sampler**: [`Sampler`](https://luma.gl/docs/api-reference/generated/core/classes/Sampler.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:239](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L239)

Default sampler for this texture

***

### samples[​](#samples "Direct link to samples")

> `readonly` **samples**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:235](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L235)

sample count

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

> **updateTimestamp**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:249](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L249)

"Time" of last update. Monotonically increasing timestamp. TODO move to DynamicTexture?

***

### userData[​](#userdata "Direct link to userData")

> `readonly` **userData**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/core/src/adapter/resources/resource.ts:122](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L122)

User data object, reserved for the application

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`userData`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#userdata)

***

### view[​](#view "Direct link to view")

> `abstract` **view**: [`TextureView`](https://luma.gl/docs/api-reference/generated/core/classes/TextureView.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:241](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L241)

Default view for this texture

***

### width[​](#width "Direct link to width")

> `readonly` **width**: `number`

Defined in: [modules/core/src/adapter/resources/texture.ts:227](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L227)

width in pixels of this texture

***

### COPY\_DST[​](#copy_dst "Direct link to COPY_DST")

> `static` **COPY\_DST**: `number` = `0x02`

Defined in: [modules/core/src/adapter/resources/texture.ts:213](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L213)

he texture can be used as the destination of a copy or write operation

***

### COPY\_SRC[​](#copy_src "Direct link to COPY_SRC")

> `static` **COPY\_SRC**: `number` = `0x01`

Defined in: [modules/core/src/adapter/resources/texture.ts:211](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L211)

The texture can be used as the source of a copy operation

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`TextureProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureProps.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:699](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L699)

Default properties for resource

#### Overrides[​](#overrides-1 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`defaultProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#defaultprops)

***

### RENDER[​](#render "Direct link to RENDER")

> `static` **RENDER**: `number` = `0x10`

Defined in: [modules/core/src/adapter/resources/texture.ts:209](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L209)

The texture can be used as a color or depth/stencil attachment in a render pass

***

### ~~RENDER\_ATTACHMENT~~[​](#render_attachment "Direct link to render_attachment")

> `static` **RENDER\_ATTACHMENT**: `number` = `0x10`

Defined in: [modules/core/src/adapter/resources/texture.ts:218](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L218)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use Texture.RENDER

***

### SAMPLE[​](#sample "Direct link to SAMPLE")

> `static` **SAMPLE**: `number` = `0x04`

Defined in: [modules/core/src/adapter/resources/texture.ts:205](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L205)

The texture can be bound for use as a sampled texture in a shader

***

### STORAGE[​](#storage "Direct link to STORAGE")

> `static` **STORAGE**: `number` = `0x08`

Defined in: [modules/core/src/adapter/resources/texture.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L207)

The texture can be bound for use as a storage texture in a shader

***

### ~~TEXTURE~~[​](#texture "Direct link to texture")

> `static` **TEXTURE**: `number` = `0x04`

Defined in: [modules/core/src/adapter/resources/texture.ts:216](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L216)

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use Texture.SAMPLE

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/adapter/resources/texture.ts:251](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L251)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-2 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`[toStringTag]`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostringtag)

***

### isHandleBorrowed[​](#ishandleborrowed "Direct link to isHandleBorrowed")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isHandleBorrowed**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L147)

Whether luma.gl may only reference the opaque externally owned resource handle.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`isHandleBorrowed`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#ishandleborrowed)

***

### ownsHandle[​](#ownshandle "Direct link to ownsHandle")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **ownsHandle**(): `boolean`

Defined in: [modules/core/src/adapter/resources/resource.ts:140](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L140)

Whether luma.gl created and owns the underlying resource handle.

##### Returns[​](#returns-3 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`ownsHandle`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#ownshandle)

## Methods[​](#methods "Direct link to Methods")

### \_initializeData()[​](#_initializedata "Direct link to _initializeData()")

> **\_initializeData**(`data`): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:452](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L452)

Initialize texture with supplied props

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### data[​](#data "Direct link to data")

[`ExternalImage`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ExternalImage.md) | [`TypedArray`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TypedArray.md) | `null` | `undefined`

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### \_normalizeCopyElementImageOptions()[​](#_normalizecopyelementimageoptions "Direct link to _normalizeCopyElementImageOptions()")

> **\_normalizeCopyElementImageOptions**(`options_`): `Required`<[`CopyElementImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyElementImageOptions.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:514](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L514)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### options\_[​](#options_ "Direct link to options_")

[`CopyElementImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyElementImageOptions.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`Required`<[`CopyElementImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyElementImageOptions.md)>

***

### \_normalizeCopyExternalImageOptions()[​](#_normalizecopyexternalimageoptions "Direct link to _normalizeCopyExternalImageOptions()")

> **\_normalizeCopyExternalImageOptions**(`options_`): `Required`<[`CopyExternalImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyExternalImageOptions.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:494](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L494)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### options\_[​](#options_-1 "Direct link to options_")

[`CopyExternalImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyExternalImageOptions.md)

#### Returns[​](#returns-6 "Direct link to Returns")

`Required`<[`CopyExternalImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyExternalImageOptions.md)>

***

### \_normalizeCopyImageDataOptions()[​](#_normalizecopyimagedataoptions "Direct link to _normalizeCopyImageDataOptions()")

> **\_normalizeCopyImageDataOptions**(`options_`): `Required`<[`CopyImageDataOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyImageDataOptions.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:485](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L485)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options\_[​](#options_-2 "Direct link to options_")

[`CopyImageDataOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyImageDataOptions.md)

#### Returns[​](#returns-7 "Direct link to Returns")

`Required`<[`CopyImageDataOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyImageDataOptions.md)>

***

### \_normalizeTextureReadOptions()[​](#_normalizetexturereadoptions "Direct link to _normalizeTextureReadOptions()")

> **\_normalizeTextureReadOptions**(`options_`): `Required`<[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:531](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L531)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### options\_[​](#options_-3 "Direct link to options_")

[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)

#### Returns[​](#returns-8 "Direct link to Returns")

`Required`<[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)>

***

### \_normalizeTextureWriteOptions()[​](#_normalizetexturewriteoptions "Direct link to _normalizeTextureWriteOptions()")

> **\_normalizeTextureWriteOptions**(`options_`): `Required`<[`TextureWriteOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureWriteOptions.md)>

Defined in: [modules/core/src/adapter/resources/texture.ts:615](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L615)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### options\_[​](#options_-4 "Direct link to options_")

[`TextureWriteOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureWriteOptions.md)

#### Returns[​](#returns-9 "Direct link to Returns")

`Required`<[`TextureWriteOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureWriteOptions.md)>

***

### attachResource()[​](#attachresource "Direct link to attachResource()")

> **attachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:200](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L200)

Attaches a resource. Attached resources are auto destroyed when this resource is destroyed Called automatically when sub resources are auto created but can be called by application

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### resource[​](#resource "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-10 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`attachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#attachresource)

***

### clone()[​](#clone "Direct link to clone()")

> **clone**(`size?`): `Texture`

Defined in: [modules/core/src/adapter/resources/texture.ts:306](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L306)

Create a new texture with the same parameters and optionally a different size

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### size?[​](#size "Direct link to size?")

###### height[​](#height-1 "Direct link to height")

`number`

###### width[​](#width-1 "Direct link to width")

`number`

#### Returns[​](#returns-11 "Direct link to Returns")

`Texture`

#### Note[​](#note "Direct link to Note")

Textures are immutable and cannot be resized after creation, but we can create a similar texture with the same parameters but a new size.

#### Note[​](#note-1 "Direct link to Note")

Does not copy contents of the texture

***

### computeMemoryLayout()[​](#computememorylayout "Direct link to computeMemoryLayout()")

> **computeMemoryLayout**(`options_?`): [`TextureMemoryLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureMemoryLayout.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:345](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L345)

Calculates the memory layout of the texture, required when reading and writing data.

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### options\_?[​](#options_-5 "Direct link to options_?")

[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md) = `{}`

#### Returns[​](#returns-12 "Direct link to Returns")

[`TextureMemoryLayout`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureMemoryLayout.md)

the backend-aligned linear layout, in particular bytesPerRow which includes any required padding for buffer copy/read paths

***

### copyElementImage()[​](#copyelementimage "Direct link to copyElementImage()")

> `abstract` **copyElementImage**(`options`): `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:322](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L322)

Copy live DOM element pixels into the texture when supported by the current browser backend.

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### options[​](#options "Direct link to options")

[`CopyElementImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyElementImageOptions.md)

#### Returns[​](#returns-13 "Direct link to Returns")

`object`

##### height[​](#height-2 "Direct link to height")

> **height**: `number`

##### width[​](#width-2 "Direct link to width")

> **width**: `number`

***

### copyExternalImage()[​](#copyexternalimage "Direct link to copyExternalImage()")

> `abstract` **copyExternalImage**(`options`): `object`

Defined in: [modules/core/src/adapter/resources/texture.ts:319](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L319)

Copy an image (e.g an ImageBitmap) into the texture

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### options[​](#options-1 "Direct link to options")

[`CopyExternalImageOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyExternalImageOptions.md)

#### Returns[​](#returns-14 "Direct link to Returns")

`object`

##### height[​](#height-3 "Direct link to height")

> **height**: `number`

##### width[​](#width-3 "Direct link to width")

> **width**: `number`

***

### ~~copyImageData()~~[​](#copyimagedata "Direct link to copyimagedata")

> **copyImageData**(`options`): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:333](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L333)

Copy raw image data (bytes) into the texture.

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### options[​](#options-2 "Direct link to options")

[`CopyImageDataOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/CopyImageDataOptions.md)

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Note[​](#note-2 "Direct link to Note")

Deprecated compatibility wrapper over [writeData](#writedata).

#### Note[​](#note-3 "Direct link to Note")

Uses the same layout defaults and alignment rules as [writeData](#writedata).

#### Note[​](#note-4 "Direct link to Note")

Tightly packed CPU uploads can omit `bytesPerRow` and `rowsPerImage`.

#### Note[​](#note-5 "Direct link to Note")

If the CPU source rows are padded, pass explicit `bytesPerRow` and `rowsPerImage`.

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Use writeData()

***

### createView()[​](#createview "Direct link to createView()")

> `abstract` **createView**(`props`): [`TextureView`](https://luma.gl/docs/api-reference/generated/core/classes/TextureView.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:316](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L316)

Create a texture view for this texture

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

[`TextureViewProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureViewProps.md)

#### Returns[​](#returns-16 "Direct link to Returns")

[`TextureView`](https://luma.gl/docs/api-reference/generated/core/classes/TextureView.md)

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `this`

Defined in: [modules/core/src/adapter/resources/resource.ts:181](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L181)

#### Returns[​](#returns-17 "Direct link to Returns")

`this`

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Use destroy()

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`delete`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#delete)

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L173)

destroy can be called on any resource to release it before it is garbage collected.

#### Returns[​](#returns-18 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroy`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroy)

***

### destroyAttachedResource()[​](#destroyattachedresource "Direct link to destroyAttachedResource()")

> **destroyAttachedResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:214](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L214)

Destroys a resource (only if owned), and removes from the owned (auto-destroy) list for this resource.

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### resource[​](#resource-1 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-19 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresource)

***

### destroyAttachedResources()[​](#destroyattachedresources "Direct link to destroyAttachedResources()")

> **destroyAttachedResources**(): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:221](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L221)

Destroy all owned resources. Make sure the resources are no longer needed before calling.

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-12 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`destroyAttachedResources`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#destroyattachedresources)

***

### detachResource()[​](#detachresource "Direct link to detachResource()")

> **detachResource**(`resource`): `void`

Defined in: [modules/core/src/adapter/resources/resource.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L207)

Detach an attached resource. The resource will no longer be auto-destroyed when this resource is destroyed.

#### Parameters[​](#parameters-15 "Direct link to Parameters")

##### resource[​](#resource-2 "Direct link to resource")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md)<[`ResourceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ResourceProps.md)>

#### Returns[​](#returns-21 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-13 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`detachResource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#detachresource)

***

### generateMipmapsWebGL()[​](#generatemipmapswebgl "Direct link to generateMipmapsWebGL()")

> **generateMipmapsWebGL**(): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:429](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L429)

Generate mipmaps (WebGL only)

#### Returns[​](#returns-22 "Direct link to Returns")

`void`

***

### getProps()[​](#getprops "Direct link to getProps()")

> **getProps**(): `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:190](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L190)

Combines a map of user props and default props, only including props from defaultProps

#### Returns[​](#returns-23 "Direct link to Returns")

`object`

returns a map of overridden default props

#### Inherited from[​](#inherited-from-14 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`getProps`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#getprops)

***

### readBuffer()[​](#readbuffer "Direct link to readBuffer()")

> **readBuffer**(`options?`, `buffer?`): [`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

Defined in: [modules/core/src/adapter/resources/texture.ts:372](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L372)

Read the contents of a texture into a GPU Buffer.

#### Parameters[​](#parameters-16 "Direct link to Parameters")

##### options?[​](#options-3 "Direct link to options?")

[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)

##### buffer?[​](#buffer "Direct link to buffer?")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

#### Returns[​](#returns-24 "Direct link to Returns")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

A Buffer containing the texture data.

#### Note[​](#note-6 "Direct link to Note")

The memory layout of the texture data is determined by the texture format and dimensions.

#### Note[​](#note-7 "Direct link to Note")

The application can call Texture.computeMemoryLayout() to compute the backend-aligned layout.

#### Note[​](#note-8 "Direct link to Note")

The application can call Buffer.readAsync() to read the returned buffer on the CPU.

#### Note[​](#note-9 "Direct link to Note")

The destination buffer must be supplied by the caller and must be large enough for the requested region.

#### Note[​](#note-10 "Direct link to Note")

On WebGPU this corresponds to a texture-to-buffer copy and uses buffer-copy alignment rules.

#### Note[​](#note-11 "Direct link to Note")

On WebGL, luma.gl emulates the same logical readback behavior.

***

### ~~readDataAsync()~~[​](#readdataasync "Direct link to readdataasync")

> **readDataAsync**(`options?`): `Promise`<`ArrayBuffer`>

Defined in: [modules/core/src/adapter/resources/texture.ts:384](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L384)

Reads data from a texture into an ArrayBuffer.

#### Parameters[​](#parameters-17 "Direct link to Parameters")

##### options?[​](#options-4 "Direct link to options?")

[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)

#### Returns[​](#returns-25 "Direct link to Returns")

`Promise`<`ArrayBuffer`>

An ArrayBuffer containing the texture data.

#### Note[​](#note-12 "Direct link to Note")

The memory layout of the texture data is determined by the texture format and dimensions.

#### Note[​](#note-13 "Direct link to Note")

The application can call Texture.computeMemoryLayout() to compute the layout.

#### Deprecated[​](#deprecated-4 "Direct link to Deprecated")

Use Texture.readBuffer() with an explicit destination buffer, or DynamicTexture.readAsync() for convenience readback.

***

### readDataSyncWebGL()[​](#readdatasyncwebgl "Direct link to readDataSyncWebGL()")

> **readDataSyncWebGL**(`options?`): `ArrayBuffer` | `ArrayBufferView`<`ArrayBufferLike`>

Defined in: [modules/core/src/adapter/resources/texture.ts:424](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L424)

WebGL can read data synchronously.

#### Parameters[​](#parameters-18 "Direct link to Parameters")

##### options?[​](#options-5 "Direct link to options?")

[`TextureReadOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureReadOptions.md)

#### Returns[​](#returns-26 "Direct link to Returns")

`ArrayBuffer` | `ArrayBufferView`<`ArrayBufferLike`>

#### Note[​](#note-14 "Direct link to Note")

While it is convenient, the performance penalty is very significant

***

### setSampler()[​](#setsampler "Direct link to setSampler()")

> **setSampler**(`sampler`): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:311](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L311)

Set sampler props associated with this texture

#### Parameters[​](#parameters-19 "Direct link to Parameters")

##### sampler[​](#sampler-1 "Direct link to sampler")

[`SamplerProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/SamplerProps.md) | [`Sampler`](https://luma.gl/docs/api-reference/generated/core/classes/Sampler.md)

#### Returns[​](#returns-27 "Direct link to Returns")

`void`

***

### toJSON()[​](#tojson "Direct link to toJSON()")

> **toJSON**(): `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L113)

Compact serialization for assertion diffs and structured debug logs.

#### Returns[​](#returns-28 "Direct link to Returns")

`string`

#### Inherited from[​](#inherited-from-15 "Direct link to Inherited from")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toJSON`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tojson)

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/adapter/resources/texture.ts:255](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L255)

#### Returns[​](#returns-29 "Direct link to Returns")

`string`

#### Overrides[​](#overrides-3 "Direct link to Overrides")

[`Resource`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md).[`toString`](https://luma.gl/docs/api-reference/generated/core/classes/Resource.md#tostring)

***

### writeBuffer()[​](#writebuffer "Direct link to writeBuffer()")

> **writeBuffer**(`buffer`, `options?`): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:398](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L398)

Writes a GPU Buffer into a texture.

#### Parameters[​](#parameters-20 "Direct link to Parameters")

##### buffer[​](#buffer-1 "Direct link to buffer")

[`Buffer`](https://luma.gl/docs/api-reference/generated/core/classes/Buffer.md)

Source GPU buffer.

##### options?[​](#options-6 "Direct link to options?")

[`TextureWriteOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureWriteOptions.md)

Destination subresource, extent, and source layout options.

#### Returns[​](#returns-30 "Direct link to Returns")

`void`

#### Note[​](#note-15 "Direct link to Note")

The memory layout of the texture data is determined by the texture format and dimensions.

#### Note[​](#note-16 "Direct link to Note")

The application can call Texture.computeMemoryLayout() to compute the backend-aligned layout.

#### Note[​](#note-17 "Direct link to Note")

On WebGPU this corresponds to a buffer-to-texture copy and uses buffer-copy alignment rules.

#### Note[​](#note-18 "Direct link to Note")

On WebGL, luma.gl emulates the same destination and layout semantics.

***

### writeData()[​](#writedata "Direct link to writeData()")

> **writeData**(`data`, `options?`): `void`

Defined in: [modules/core/src/adapter/resources/texture.ts:411](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/texture.ts#L411)

Writes an array buffer into a texture.

#### Parameters[​](#parameters-21 "Direct link to Parameters")

##### data[​](#data-1 "Direct link to data")

`ArrayBuffer` | `SharedArrayBuffer` | `ArrayBufferView`<`ArrayBufferLike`>

Source texel data.

##### options?[​](#options-7 "Direct link to options?")

[`TextureWriteOptions`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureWriteOptions.md)

Destination subresource, extent, and source layout options.

#### Returns[​](#returns-31 "Direct link to Returns")

`void`

#### Note[​](#note-19 "Direct link to Note")

If `bytesPerRow` and `rowsPerImage` are omitted, luma.gl computes a tightly packed CPU-memory layout for the requested region.

#### Note[​](#note-20 "Direct link to Note")

On WebGPU this corresponds to `GPUQueue.writeTexture()` and does not implicitly pad rows to 256 bytes.

#### Note[​](#note-21 "Direct link to Note")

On WebGL, padded CPU data is supported via the same `bytesPerRow` and `rowsPerImage` options.
