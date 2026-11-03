# Class: VideoTexture

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L26)

Live video binding source.

GLSL `sampler2D` and WGSL `texture_2d` bindings resolve to copied luma textures. WGSL `texture_external` bindings resolve to native WebGPU external textures.

## Implements[​](#implements "Direct link to Implements")

* [`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new VideoTexture**(`device`, `props`): `VideoTexture`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L81)

Creates a live video binding source.

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

Device that resolves copied or native external bindings.

##### props[​](#props "Direct link to props")

[`VideoTextureProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/VideoTextureProps.md)

Live video source and copied texture options.

#### Returns[​](#returns "Direct link to Returns")

`VideoTexture`

## Properties[​](#properties "Direct link to Properties")

### destroyed[​](#destroyed "Direct link to destroyed")

> **destroyed**: `boolean` = `false`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L33)

Whether this video binding source has been destroyed.

***

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L28)

Device used to create copied and native external texture bindings.

***

### generation[​](#generation "Direct link to generation")

> **generation**: `number` = `0`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L35)

Monotonic binding generation advanced when concrete draw bindings may need recreation.

#### Implementation of[​](#implementation-of "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`generation`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#generation)

***

### id[​](#id "Direct link to id")

> `readonly` **id**: `string`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L30)

Stable resource identifier used in loading and debug messages.

#### Implementation of[​](#implementation-of-1 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`id`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#id)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L66)

Resource label used by debug output.

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

***

### isReady[​](#isready "Direct link to isReady")

#### Get Signature[​](#get-signature-1 "Direct link to Get Signature")

> **get** **isReady**(): `boolean`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L54)

Whether the current source exposes dimensions and a current frame.

##### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

Whether the source can resolve a concrete binding for the current draw.

#### Implementation of[​](#implementation-of-2 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`isReady`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#isready)

***

### source[​](#source "Direct link to source")

#### Get Signature[​](#get-signature-2 "Direct link to Get Signature")

> **get** **source**(): `VideoFrame` | `HTMLVideoElement`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L49)

Current caller-owned live video source.

##### Returns[​](#returns-3 "Direct link to Returns")

`VideoFrame` | `HTMLVideoElement`

***

### updateTimestamp[​](#updatetimestamp "Direct link to updateTimestamp")

#### Get Signature[​](#get-signature-3 "Direct link to Get Signature")

> **get** **updateTimestamp**(): `number`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L60)

Device timestamp of the most recent source content or binding identity update.

##### Returns[​](#returns-4 "Direct link to Returns")

`number`

Device timestamp of the most recent source content or binding identity update.

#### Implementation of[​](#implementation-of-3 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`updateTimestamp`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#updatetimestamp)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:142](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L142)

Releases owned copied/external bindings without closing the caller-owned source.

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### resolveTextureBinding()[​](#resolvetexturebinding "Direct link to resolveTextureBinding()")

> **resolveTextureBinding**(`bindingLayout`): `Texture` | `ExternalTexture` | `null`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:117](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L117)

Resolves one reflected shader texture slot for the current video frame.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

[`TextureBindingLayout`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/TextureBindingLayout.md)

Reflected `texture` or `external-texture` shader slot.

#### Returns[​](#returns-6 "Direct link to Returns")

`Texture` | `ExternalTexture` | `null`

A copied texture, native external texture, or `null` while unavailable.

#### Implementation of[​](#implementation-of-4 "Direct link to Implementation of")

[`TextureBindingSource`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md).[`resolveTextureBinding`](https://luma.gl/next/docs/api-reference/generated/engine/interfaces/TextureBindingSource.md#resolvetexturebinding)

***

### setSampler()[​](#setsampler "Direct link to setSampler()")

> **setSampler**(`sampler`): `void`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L134)

Replaces the default sampler used by copied and native external bindings.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### sampler[​](#sampler "Direct link to sampler")

`Sampler` | `SamplerProps`

Sampler instance or sampler properties to use for future resolutions.

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### setSource()[​](#setsource "Direct link to setSource()")

> **setSource**(`source`): `void`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L99)

Replaces the caller-owned video source and invalidates resolved bindings.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### source[​](#source-1 "Direct link to source")

`VideoFrame` | `HTMLVideoElement`

Next caller-owned video source to follow.

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/engine/src/dynamic-texture/video-texture.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/dynamic-texture/video-texture.ts#L71)

Formats the current source dimensions and readiness for debug output.

#### Returns[​](#returns-9 "Direct link to Returns")

`string`
