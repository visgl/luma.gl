# Class: ShaderFactory

Defined in: [modules/core/src/factories/shader-factory.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L13)

Manages a cached pool of Shaders for reuse.

## Properties[​](#properties "Direct link to Properties")

### device[​](#device "Direct link to device")

> `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/factories/shader-factory.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L23)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `readonly` `static` **defaultProps**: `Required`<[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)>

Defined in: [modules/core/src/factories/shader-factory.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L14)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/factories/shader-factory.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L27)

##### Returns[​](#returns "Direct link to Returns")

`string`

## Methods[​](#methods "Direct link to Methods")

### createShader()[​](#createshader "Direct link to createShader()")

> **createShader**(`props`): [`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

Defined in: [modules/core/src/factories/shader-factory.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L41)

Requests a [Shader](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md) from the cache, creating a new Shader only if necessary.

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ShaderProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderProps.md)

#### Returns[​](#returns-1 "Direct link to Returns")

[`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

***

### release()[​](#release "Direct link to release()")

> **release**(`shader`): `void`

Defined in: [modules/core/src/factories/shader-factory.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L72)

Releases a previously-requested [Shader](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md), destroying it if no users remain.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### shader[​](#shader "Direct link to shader")

[`Shader`](https://luma.gl/next/docs/api-reference/generated/core/classes/Shader.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/factories/shader-factory.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L31)

#### Returns[​](#returns-3 "Direct link to Returns")

`string`

***

### getDefaultShaderFactory()[​](#getdefaultshaderfactory "Direct link to getDefaultShaderFactory()")

> `static` **getDefaultShaderFactory**(`device`): `ShaderFactory`

Defined in: [modules/core/src/factories/shader-factory.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/shader-factory.ts#L17)

Returns the default ShaderFactory for the given [Device](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md), creating one if necessary.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### device[​](#device-1 "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`ShaderFactory`
