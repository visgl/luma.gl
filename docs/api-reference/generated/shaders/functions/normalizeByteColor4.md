# Function: normalizeByteColor4()

> **normalizeByteColor4**(`color`, `useByteColors?`): `NumberArray4`

Defined in: [lib/color/normalize-byte-colors.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L43)

Normalizes an RGBA semantic color to float space when byte-style colors are enabled.

## Parameters[​](#parameters "Direct link to Parameters")

### color[​](#color "Direct link to color")

readonly \[`number`, `number`, `number`] | readonly \[`number`, `number`, `number`, `number`]

Input RGB or RGBA semantic color.

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean` = `true`

When `true`, divide components by `255`.

## Returns[​](#returns "Direct link to Returns")

`NumberArray4`

The normalized RGBA color, adding an opaque alpha channel when needed.
