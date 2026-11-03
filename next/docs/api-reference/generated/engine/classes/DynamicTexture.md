# Class: DynamicTexture

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:37

Dynamic Textures

* Mipmaps - DynamicTexture can generate mipmaps for textures (WebGPU does not provide built-in mipmap generation).

* Texture initialization and updates - complex textures (2d array textures, cube textures, 3d textures) need multiple images `DynamicTexture` provides an API that makes it easy to provide the required data.

* Texture resizing - Textures are immutable in WebGPU, meaning that they cannot be resized after creation. DynamicTexture provides a `resize()` method that internally creates a new texture with the same parameters but a different size.

* Async image data initialization - It is often very convenient to be able to initialize textures with promises returned by image or data loading functions, as it allows a callback-free linear style of programming.

## Note[​](#note "Direct link to Note")

GPU Textures are quite complex objects, with many subresources and modes of usage. The `DynamicTexture` class allows luma.gl to provide some support for working with textures without accumulating excessive complexity in the core Texture class which is designed as an immutable nature of GPU resource.

## Implements[​](#implements "Direct link to Implements")

* [`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new DynamicTexture**(`device`, `props`): `DynamicTexture`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:67

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`DynamicTextureProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/DynamicTextureProps.md)

#### Returns[​](#returns "Direct link to Returns")

`DynamicTexture`

## Properties[​](#properties "Direct link to Properties")

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:49

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:38

***

### generation[​](#generation "Direct link to generation")

> **generation**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:51

Monotonic version that increments whenever texture, view, or sampler identity changes.

#### Implementation of[​](#implementation-of "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`generation`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#generation)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:39

Stable resource identifier used in loading and debug messages.

#### Implementation of[​](#implementation-of-1 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#id)

***

### isReady[​](#isready "Direct link to isReady")

> **isReady**: `boolean`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:48

Whether the source can resolve a concrete binding for the current draw.

#### Implementation of[​](#implementation-of-2 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`isReady`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#isready)

***

### props[​](#props-1 "Direct link to props")

> **props**: `Readonly`<`Required`<[`DynamicTextureProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/DynamicTextureProps.md)>>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:41

Props with defaults resolved (except `data` which is processed separately)

***

### ready[​](#ready "Direct link to ready")

> `readonly` **ready**: `Promise`<`Texture`>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:47

Ready when GPU texture has been created and data (if any) uploaded

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

> **updateTimestamp**: `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:53

Last update timestamp for texture content, readiness, or identity changes.

#### Implementation of[​](#implementation-of-3 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`updateTimestamp`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#updatetimestamp)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`DynamicTextureProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/DynamicTextureProps.md)>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:113

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:59

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### sampler[​](#sampler "Direct link to sampler")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **sampler**(): `Sampler`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:57

##### Returns[​](#returns-2 "Direct link to Returns")

`Sampler`

***

### texture[​](#texture "Direct link to texture")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **texture**(): `Texture`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:56

##### Returns[​](#returns-3 "Direct link to Returns")

`Texture`

***

### view[​](#view "Direct link to view")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **view**(): `TextureView`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:58

##### Returns[​](#returns-4 "Direct link to Returns")

`TextureView`

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:70

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### generateMipmaps()[​](#generatemipmaps "Direct link to generateMipmaps()")

> **generateMipmaps**(): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:71

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### getCubeArrayFaceIndex()[​](#getcubearrayfaceindex "Direct link to getCubeArrayFaceIndex()")

> **getCubeArrayFaceIndex**(`cubeIndex`, `face`): `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:92

Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### cubeIndex[​](#cubeindex "Direct link to cubeIndex")

`number`

##### face[​](#face "Direct link to face")

[`TextureCubeFace`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureCubeFace.md)

#### Returns[​](#returns-7 "Direct link to Returns")

`number`

***

### getCubeFaceIndex()[​](#getcubefaceindex "Direct link to getCubeFaceIndex()")

> **getCubeFaceIndex**(`face`): `number`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:90

Convert cube face label to texture slice index. Index can be used with `setTexture2DData()`.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### face[​](#face-1 "Direct link to face")

[`TextureCubeFace`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureCubeFace.md)

#### Returns[​](#returns-8 "Direct link to Returns")

`number`

***

### initAsync()[​](#initasync "Direct link to initAsync()")

> **initAsync**(`originalPropsWithAsyncData`): `Promise`<`void`>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:69

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### originalPropsWithAsyncData[​](#originalpropswithasyncdata "Direct link to originalPropsWithAsyncData")

[`DynamicTextureProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/DynamicTextureProps.md)

#### Returns[​](#returns-9 "Direct link to Returns")

`Promise`<`void`>

#### Note[​](#note-1 "Direct link to Note")

Fire and forget; caller can await `ready`

***

### readAsync()[​](#readasync "Direct link to readAsync()")

> **readAsync**(`options?`): `Promise`<`ArrayBuffer`>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:80

Reads texture contents back to CPU memory.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

`TextureReadOptions`

#### Returns[​](#returns-10 "Direct link to Returns")

`Promise`<`ArrayBuffer`>

***

### readBuffer()[​](#readbuffer "Direct link to readBuffer()")

> **readBuffer**(`options?`): `Promise`<`Buffer`>

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:78

Copies texture contents into a GPU buffer and waits until the copy is complete. The caller owns the returned buffer and must destroy it when finished.

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### options?[​](#options-1 "Direct link to options?")

`TextureReadOptions`

#### Returns[​](#returns-11 "Direct link to Returns")

`Promise`<`Buffer`>

***

### resize()[​](#resize "Direct link to resize()")

> **resize**(`size`): `boolean`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:85

Resize by cloning the underlying immutable texture. Does not copy contents; caller may need to re-upload and/or regenerate mips.

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### size[​](#size "Direct link to size")

###### height[​](#height "Direct link to height")

`number`

###### width[​](#width "Direct link to width")

`number`

#### Returns[​](#returns-12 "Direct link to Returns")

`boolean`

***

### resolveTextureBinding()[​](#resolvetexturebinding "Direct link to resolveTextureBinding()")

> **resolveTextureBinding**(`_bindingLayout`): `Texture` | `null`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:66

Resolves this ready dynamic texture as an ordinary copied texture binding.

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### \_bindingLayout[​](#_bindinglayout "Direct link to _bindingLayout")

[`TextureBindingLayout`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureBindingLayout.md)

Reflected texture-like shader slot; DynamicTexture always resolves a copied texture.

#### Returns[​](#returns-13 "Direct link to Returns")

`Texture` | `null`

The copied texture, or `null` while the source is not ready.

#### Implementation of[​](#implementation-of-4 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`resolveTextureBinding`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#resolvetexturebinding)

***

### setSampler()[​](#setsampler "Direct link to setSampler()")

> **setSampler**(`sampler?`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:73

Set sampler or create one from props

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### sampler?[​](#sampler-1 "Direct link to sampler?")

`Sampler` | `SamplerProps`

#### Returns[​](#returns-14 "Direct link to Returns")

`void`

***

### setTexture1DData()[​](#settexture1ddata "Direct link to setTexture1DData()")

> **setTexture1DData**(`data`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:94

#### Parameters[​](#parameters-9 "Direct link to Parameters")

##### data[​](#data "Direct link to data")

`TextureSliceData`

#### Returns[​](#returns-15 "Direct link to Returns")

`void`

#### Note[​](#note-2 "Direct link to Note")

experimental: Set multiple mip levels (1D)

***

### setTexture2DData()[​](#settexture2ddata "Direct link to setTexture2DData()")

> **setTexture2DData**(`lodData`, `z?`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:96

#### Parameters[​](#parameters-10 "Direct link to Parameters")

##### lodData[​](#loddata "Direct link to lodData")

`TextureSliceData`

##### z?[​](#z "Direct link to z?")

`number`

#### Returns[​](#returns-16 "Direct link to Returns")

`void`

#### Note[​](#note-3 "Direct link to Note")

experimental: Set multiple mip levels (2D), optionally at `z`, slice (depth/array level) index

***

### setTexture3DData()[​](#settexture3ddata "Direct link to setTexture3DData()")

> **setTexture3DData**(`data`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:98

3D: multiple depth slices, each may carry multiple mip levels

#### Parameters[​](#parameters-11 "Direct link to Parameters")

##### data[​](#data-1 "Direct link to data")

[`Texture3DData`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/Texture3DData.md)

#### Returns[​](#returns-17 "Direct link to Returns")

`void`

***

### setTextureArrayData()[​](#settexturearraydata "Direct link to setTextureArrayData()")

> **setTextureArrayData**(`data`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:100

2D array: multiple layers, each may carry multiple mip levels

#### Parameters[​](#parameters-12 "Direct link to Parameters")

##### data[​](#data-2 "Direct link to data")

[`TextureArrayData`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureArrayData.md)

#### Returns[​](#returns-18 "Direct link to Returns")

`void`

***

### setTextureCubeArrayData()[​](#settexturecubearraydata "Direct link to setTextureCubeArrayData()")

> **setTextureCubeArrayData**(`data`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:104

Cube array: multiple cubes (faces×layers), each face may carry multiple mips

#### Parameters[​](#parameters-13 "Direct link to Parameters")

##### data[​](#data-3 "Direct link to data")

[`TextureCubeArrayData`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureCubeArrayData.md)

#### Returns[​](#returns-19 "Direct link to Returns")

`void`

***

### setTextureCubeData()[​](#settexturecubedata "Direct link to setTextureCubeData()")

> **setTextureCubeData**(`data`): `void`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:102

Cube: 6 faces, each may carry multiple mip levels

#### Parameters[​](#parameters-14 "Direct link to Parameters")

##### data[​](#data-4 "Direct link to data")

[`TextureCubeData`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureCubeData.md)

#### Returns[​](#returns-20 "Direct link to Returns")

`void`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:60

Returns a string representation of an object.

#### Returns[​](#returns-21 "Direct link to Returns")

`string`
