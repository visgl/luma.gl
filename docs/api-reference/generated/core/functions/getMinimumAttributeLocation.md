# Function: getMinimumAttributeLocation()

> **getMinimumAttributeLocation**(`locations`): `number`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L64)

Returns the lowest defined attribute location from a set of candidate locations.

## Parameters[​](#parameters "Direct link to Parameters")

### locations[​](#locations "Direct link to locations")

`Iterable`<`number` | `undefined`>

Candidate attribute locations.

## Returns[​](#returns "Direct link to Returns")

`number`

The minimum defined location, or `Infinity` when none are defined.
