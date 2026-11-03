# Class: MaterialVariants

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L31)

Selects authored source material variants without rebuilding scenegraph topology.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new MaterialVariants**(`props`): `MaterialVariants`

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L41)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`MaterialVariantsProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MaterialVariantsProps.md)

#### Returns[​](#returns "Direct link to Returns")

`MaterialVariants`

## Properties[​](#properties "Direct link to Properties")

### activeVariant[​](#activevariant "Direct link to activeVariant")

> **activeVariant**: `string` | `null` = `null`

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L37)

Currently selected variant, or `null` when source defaults are active.

***

### names[​](#names "Direct link to names")

> `readonly` **names**: readonly `string`\[]

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L35)

Application-visible source variant names.

***

### variants[​](#variants "Direct link to variants")

> `readonly` **variants**: readonly [`MaterialVariant`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MaterialVariant.md)\[]

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L33)

Source variants in their authored order.

## Methods[​](#methods "Direct link to Methods")

### resetVariant()[​](#resetvariant "Direct link to resetVariant()")

> **resetVariant**(): `void`

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L63)

Restores every primitive's authored default material and pipeline parameters.

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### selectVariant()[​](#selectvariant "Direct link to selectVariant()")

> **selectVariant**(`variantName`): `void`

Defined in: [modules/engine/src/scenegraph/controllers/material-variants.ts:48](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/controllers/material-variants.ts#L48)

Applies one named variant atomically and restores unmapped primitives to source defaults.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### variantName[​](#variantname "Direct link to variantName")

`string`

#### Returns[​](#returns-2 "Direct link to Returns")

`void`
