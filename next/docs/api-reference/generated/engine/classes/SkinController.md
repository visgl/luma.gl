# Class: SkinController

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L33)

Updates resolved joint palettes independently of their source asset format.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new SkinController**(`props`): `SkinController`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L41)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`SkinControllerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinControllerProps.md)

#### Returns[​](#returns "Direct link to Returns")

`SkinController`

## Properties[​](#properties "Direct link to Properties")

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: readonly [`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L34)

## Methods[​](#methods "Direct link to Methods")

### claimGPUPalette()[​](#claimgpupalette "Direct link to claimGPUPalette()")

> **claimGPUPalette**(`binding`): () => `void`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L92)

Borrow a WebGPU storage palette and suspend CPU writes until the lease is released.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### binding[​](#binding "Direct link to binding")

[`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md)

#### Returns[​](#returns-1 "Direct link to Returns")

() => `void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L112)

Releases GPU palette transports owned by this controller.

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### getBinding()[​](#getbinding "Direct link to getBinding()")

> **getBinding**(`node`): [`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md) | `undefined`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L107)

Finds the palette driven by a scenegraph node.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### node[​](#node "Direct link to node")

[`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md) | `undefined`

#### Returns[​](#returns-3 "Direct link to Returns")

[`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md) | `undefined`

***

### update()[​](#update "Direct link to update()")

> **update**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L48)

Re-evaluates every source skin after its animated node transforms have changed.

#### Returns[​](#returns-4 "Direct link to Returns")

`void`
