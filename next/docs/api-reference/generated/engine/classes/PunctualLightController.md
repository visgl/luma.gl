# Class: PunctualLightController

Defined in: [modules/engine/src/scenegraph/controllers/punctual-light-controller.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/punctual-light-controller.ts#L31)

Projects bound lights using live node transforms and inherited visibility.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new PunctualLightController**(`bindings`, `useByteColors?`): `PunctualLightController`

Defined in: [modules/engine/src/scenegraph/controllers/punctual-light-controller.ts:34](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/punctual-light-controller.ts#L34)

#### Parameters[​](#parameters "Direct link to Parameters")

##### bindings[​](#bindings "Direct link to bindings")

readonly [`PunctualLightBinding`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PunctualLightBinding.md)\[]

##### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean` = `true`

#### Returns[​](#returns "Direct link to Returns")

`PunctualLightController`

## Properties[​](#properties "Direct link to Properties")

### lights[​](#lights "Direct link to lights")

> `readonly` **lights**: `Light`\[] = `[]`

Defined in: [modules/engine/src/scenegraph/controllers/punctual-light-controller.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/punctual-light-controller.ts#L32)

## Methods[​](#methods "Direct link to Methods")

### update()[​](#update "Direct link to update()")

> **update**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/punctual-light-controller.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/punctual-light-controller.ts#L42)

Refreshes the stable light array after node or light properties change.

#### Returns[​](#returns-1 "Direct link to Returns")

`void`
