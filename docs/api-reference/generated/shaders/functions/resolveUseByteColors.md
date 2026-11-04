# Function: resolveUseByteColors()

> **resolveUseByteColors**(`useByteColors?`, `defaultUseByteColors?`): `boolean`

Defined in: [lib/color/normalize-byte-colors.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L13)

Resolves whether semantic colors should be interpreted as byte-style `0..255` values.

## Parameters[​](#parameters "Direct link to Parameters")

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean`

Explicit color interpretation flag.

### defaultUseByteColors?[​](#defaultusebytecolors "Direct link to defaultUseByteColors?")

`boolean` = `true`

Fallback value when `useByteColors` is omitted.

## Returns[​](#returns "Direct link to Returns")

`boolean`

`true` when semantic colors should be normalized from bytes, otherwise `false`.
