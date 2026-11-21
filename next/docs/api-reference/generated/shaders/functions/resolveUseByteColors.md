# Function: resolveUseByteColors()

> **resolveUseByteColors**(`useByteColors?`, `defaultUseByteColors?`): `boolean`

Defined in: [lib/color/normalize-byte-colors.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/lib/color/normalize-byte-colors.ts#L18)

Resolves the numeric range of untyped JavaScript color arrays. Typed color arrays carry their own encoding and ignore this flag in the normalization helpers.

## Parameters[​](#parameters "Direct link to Parameters")

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

`boolean`

Explicit convention for JavaScript arrays.

### defaultUseByteColors?[​](#defaultusebytecolors "Direct link to defaultUseByteColors?")

`boolean` = `true`

Convention to use when the flag is omitted; defaults to bytes.

## Returns[​](#returns "Direct link to Returns")

`boolean`

Whether JavaScript array components should be divided by 255.
