# Function: getFirstScenegraphInteractionHit()

> **getFirstScenegraphInteractionHit**<`Hit`>(`hits`, `kind`): `Hit` | `undefined`

Defined in: [modules/engine/src/scenegraph/scenegraph-interaction.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/scenegraph-interaction.ts#L33)

Finds the first eligible hit without letting an ineligible hit occlude later candidates.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Hit[​](#hit "Direct link to Hit")

`Hit` *extends* [`ScenegraphInteractionHit`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphInteractionHit.md)

## Parameters[​](#parameters "Direct link to Parameters")

### hits[​](#hits "Direct link to hits")

readonly `Hit`\[]

### kind[​](#kind "Direct link to kind")

[`ScenegraphInteractionKind`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ScenegraphInteractionKind.md)

## Returns[​](#returns "Direct link to Returns")

`Hit` | `undefined`
