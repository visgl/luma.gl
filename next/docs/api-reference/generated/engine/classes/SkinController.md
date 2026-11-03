# Class: SkinController

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L33)

Updates resolved joint palettes independently of their source asset format.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new SkinController**(`props`): `SkinController`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L38)

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

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L93)

Releases GPU palette transports owned by this controller.

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### getBinding()[​](#getbinding "Direct link to getBinding()")

> **getBinding**(`node`): [`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md) | `undefined`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L88)

Finds the palette driven by a scenegraph node.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### node[​](#node "Direct link to node")

[`GroupNode`](https://luma.gl/next/docs/api-reference/generated/engine/classes/GroupNode.md) | `undefined`

#### Returns[​](#returns-2 "Direct link to Returns")

[`SkinBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SkinBinding.md) | `undefined`

***

### update()[​](#update "Direct link to update()")

> **update**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/skin-controller.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/skin-controller.ts#L45)

Re-evaluates every source skin after its animated node transforms have changed.

#### Returns[​](#returns-3 "Direct link to Returns")

`void`
