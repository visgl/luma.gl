# Class: UniformBlock\<TUniforms>

Defined in: [modules/core/src/portable/uniform-block.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L18)

A uniform block holds values of the of uniform values for one uniform block / buffer. It also does some book keeping on what has changed, to minimize unnecessary writes to uniform buffers.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TUniforms[​](#tuniforms "Direct link to TUniforms")

`TUniforms` *extends* `Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)> = `Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new UniformBlock**<`TUniforms`>(`props?`): `UniformBlock`<`TUniforms`>

Defined in: [modules/core/src/portable/uniform-block.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L30)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

###### name?[​](#name "Direct link to name?")

`string`

###### shaderLayout?[​](#shaderlayout "Direct link to shaderLayout?")

[`ShaderLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ShaderLayout.md)

###### uniformTypes?[​](#uniformtypes "Direct link to uniformTypes?")

`Record`\<keyof `TUniforms`, `Record`<`string`, [`VariableShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VariableShaderType.md)>>

#### Returns[​](#returns "Direct link to Returns")

`UniformBlock`<`TUniforms`>

## Properties[​](#properties "Direct link to Properties")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: `Record`<`string`, `UniformInfo`> = `{}`

Defined in: [modules/core/src/portable/uniform-block.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L27)

***

### modified[​](#modified "Direct link to modified")

> **modified**: `boolean` = `true`

Defined in: [modules/core/src/portable/uniform-block.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L25)

***

### modifiedUniforms[​](#modifieduniforms "Direct link to modifiedUniforms")

> **modifiedUniforms**: `Record`\<keyof `TUniforms`, `boolean`>

Defined in: [modules/core/src/portable/uniform-block.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L24)

***

### name[​](#name-1 "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/portable/uniform-block.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L21)

***

### needsRedraw[​](#needsredraw "Direct link to needsRedraw")

> **needsRedraw**: `string` | `false` = `'initialized'`

Defined in: [modules/core/src/portable/uniform-block.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L28)

***

### uniforms[​](#uniforms "Direct link to uniforms")

> **uniforms**: `Record`\<keyof `TUniforms`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

Defined in: [modules/core/src/portable/uniform-block.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L23)

## Methods[​](#methods "Direct link to Methods")

### getAllUniforms()[​](#getalluniforms "Direct link to getAllUniforms()")

> **getAllUniforms**(): `Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

Defined in: [modules/core/src/portable/uniform-block.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L68)

Returns all uniforms

#### Returns[​](#returns-1 "Direct link to Returns")

`Record`<`string`, [`UniformValue`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/UniformValue.md)>

***

### setNeedsRedraw()[​](#setneedsredraw "Direct link to setNeedsRedraw()")

> **setNeedsRedraw**(`reason`): `void`

Defined in: [modules/core/src/portable/uniform-block.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L63)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### reason[​](#reason "Direct link to reason")

`string`

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### setUniforms()[​](#setuniforms "Direct link to setUniforms()")

> **setUniforms**(`uniforms`): `void`

Defined in: [modules/core/src/portable/uniform-block.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/portable/uniform-block.ts#L54)

Set a map of uniforms

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### uniforms[​](#uniforms-1 "Direct link to uniforms")

`Partial`<`TUniforms`>

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
