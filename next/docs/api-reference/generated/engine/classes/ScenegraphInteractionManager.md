# Class: ScenegraphInteractionManager

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L54)

Caller-owned hit testing with per-controller hover tracking and subtree event propagation.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ScenegraphInteractionManager**(`onEvent`): `ScenegraphInteractionManager`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L60)

Creates a controller that reports bubbled selection and hover events.

#### Parameters[​](#parameters "Direct link to Parameters")

##### onEvent[​](#onevent "Direct link to onEvent")

(`event`) => `void`

#### Returns[​](#returns "Direct link to Returns")

`ScenegraphInteractionManager`

## Methods[​](#methods "Direct link to Methods")

### clearHover()[​](#clearhover "Direct link to clearHover()")

> **clearHover**(`controllerIndex?`): `void`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:114](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L114)

Emits exits for one controller and drops its tracked hover path.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### controllerIndex?[​](#controllerindex "Direct link to controllerIndex?")

`number` = `0`

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### select()[​](#select "Direct link to select()")

> **select**<`Hit`>(`hits`, `controllerIndex?`): `Hit` | `undefined`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L65)

Selects the first eligible nearest-first hit and bubbles from target to root.

#### Type Parameters[​](#type-parameters "Direct link to Type Parameters")

##### Hit[​](#hit "Direct link to Hit")

`Hit` *extends* [`ScenegraphInteractionHit`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphInteractionHit.md)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### hits[​](#hits "Direct link to hits")

readonly `Hit`\[]

##### controllerIndex?[​](#controllerindex-1 "Direct link to controllerIndex?")

`number` = `0`

#### Returns[​](#returns-2 "Direct link to Returns")

`Hit` | `undefined`

***

### updateHover()[​](#updatehover "Direct link to updateHover()")

> **updateHover**<`Hit`>(`hits`, `controllerIndex?`): `Hit` | `undefined`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L76)

Updates hover from current hits; call after pointer, camera, object, or flag changes.

#### Type Parameters[​](#type-parameters-1 "Direct link to Type Parameters")

##### Hit[​](#hit-1 "Direct link to Hit")

`Hit` *extends* [`ScenegraphInteractionHit`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphInteractionHit.md)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### hits[​](#hits-1 "Direct link to hits")

readonly `Hit`\[]

##### controllerIndex?[​](#controllerindex-2 "Direct link to controllerIndex?")

`number` = `0`

#### Returns[​](#returns-3 "Direct link to Returns")

`Hit` | `undefined`
