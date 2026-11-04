# Function: normalizeByteColor3()

> **normalizeByteColor3**(`color?`, `useByteColors?`): `NumberArray3`

Defined in: [lib/color/normalize-byte-colors.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L26)

Normalizes an RGB semantic color to float space when byte-style colors are enabled.

## Parameters[​](#parameters "Direct link to Parameters")

### color?[​](#color "Direct link to color?")

readonly \[`number`, `number`, `number`] = `...`

Input RGB semantic color.

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean` = `true`

When `true`, divide components by `255`.

## Returns[​](#returns "Direct link to Returns")

`NumberArray3`

The normalized RGB color.
