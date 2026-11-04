# ~~Class: TextureTransform~~

Defined in: [modules/engine/src/compute/texture-transform.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L47)

Creates a pipeline for texture→texture transforms.

## Deprecated[​](#deprecated "Direct link to Deprecated")

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new TextureTransform**(`device`, `props`): `TextureTransform`

Defined in: [modules/engine/src/compute/texture-transform.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L57)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`TextureTransformProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureTransformProps.md)

#### Returns[​](#returns "Direct link to Returns")

`TextureTransform`

## Properties[​](#properties "Direct link to Properties")

### ~~bindings~~[​](#bindings "Direct link to bindings")

> **bindings**: `TextureBinding`\[] = `[]`

Defined in: [modules/engine/src/compute/texture-transform.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L54)

***

### ~~currentIndex~~[​](#currentindex "Direct link to currentindex")

> **currentIndex**: `number` = `0`

Defined in: [modules/engine/src/compute/texture-transform.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L52)

***

### ~~device~~[​](#device-1 "Direct link to device-1")

> `readonly` **device**: `Device`

Defined in: [modules/engine/src/compute/texture-transform.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L48)

***

### ~~model~~[​](#model "Direct link to model")

> `readonly` **model**: [`GPUVectorModel`](https://luma.gl/docs/api-reference/generated/engine/classes/GPUVectorModel.md)

Defined in: [modules/engine/src/compute/texture-transform.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L49)

***

### ~~resources~~[​](#resources "Direct link to resources")

> **resources**: `Record`<`string`, `unknown`> = `{}`

Defined in: [modules/engine/src/compute/texture-transform.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L55)

***

### ~~sampler~~[​](#sampler "Direct link to sampler")

> `readonly` **sampler**: `Sampler`

Defined in: [modules/engine/src/compute/texture-transform.ts:50](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L50)

***

### ~~samplerTextureMap~~[​](#samplertexturemap "Direct link to samplertexturemap")

> **samplerTextureMap**: `Record`<`string`, `unknown`> | `null` = `null`

Defined in: [modules/engine/src/compute/texture-transform.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L53)

## Methods[​](#methods "Direct link to Methods")

### ~~\_initialize()~~[​](#_initialize "Direct link to _initialize")

> **\_initialize**(`props`): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L126)

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

[`TextureTransformProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureTransformProps.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### ~~\_setSourceTextureParameters()~~[​](#_setsourcetextureparameters "Direct link to _setsourcetextureparameters")

> **\_setSourceTextureParameters**(): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L167)

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### ~~\_updateBinding()~~[​](#_updatebinding "Direct link to _updatebinding")

> **\_updateBinding**(`binding`, `__namedParameters`): `TextureBinding`

Defined in: [modules/engine/src/compute/texture-transform.ts:134](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L134)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### binding[​](#binding "Direct link to binding")

`TextureBinding`

##### \_\_namedParameters[​](#__namedparameters "Direct link to __namedParameters")

[`TextureTransformProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureTransformProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`TextureBinding`

***

### ~~\_updateBindings()~~[​](#_updatebindings "Direct link to _updatebindings")

> **\_updateBindings**(`props`): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:130](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L130)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

[`TextureTransformProps`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/TextureTransformProps.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`void`

***

### ~~delete()~~[​](#delete "Direct link to delete")

> **delete**(): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L97)

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use [destroy](#destroy).

***

### ~~destroy()~~[​](#destroy "Direct link to destroy")

> **destroy**(): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L89)

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### ~~getFramebuffer()~~[​](#getframebuffer "Direct link to getframebuffer")

> **getFramebuffer**(): `Framebuffer` | `undefined`

Defined in: [modules/engine/src/compute/texture-transform.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L119)

#### Returns[​](#returns-7 "Direct link to Returns")

`Framebuffer` | `undefined`

***

### ~~getTargetTexture()~~[​](#gettargettexture "Direct link to gettargettexture")

> **getTargetTexture**(): `Texture`

Defined in: [modules/engine/src/compute/texture-transform.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L114)

#### Returns[​](#returns-8 "Direct link to Returns")

`Texture`

***

### ~~run()~~[​](#run "Direct link to run")

> **run**(`options?`): `void`

Defined in: [modules/engine/src/compute/texture-transform.ts:101](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/texture-transform.ts#L101)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options?[​](#options "Direct link to options?")

`ResourceProps` & `object` & `object`

#### Returns[​](#returns-9 "Direct link to Returns")

`void`
