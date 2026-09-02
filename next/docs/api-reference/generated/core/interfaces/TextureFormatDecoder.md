# Interface: TextureFormatDecoder

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:44](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L44)

Class that helps applications work with texture formats

## Methods[​](#methods "Direct link to Methods")

### computeMemoryLayout()[​](#computememorylayout "Direct link to computeMemoryLayout()")

> **computeMemoryLayout**(`opts`): [`TextureMemoryLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureMemoryLayout.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L80)

Computes the memory layout for a texture, in particular including row byte alignment

#### Parameters[​](#parameters "Direct link to Parameters")

##### opts[​](#opts "Direct link to opts")

`TextureMemoryLayoutOptions`

#### Returns[​](#returns "Direct link to Returns")

[`TextureMemoryLayout`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureMemoryLayout.md)

***

### getCapabilities()[​](#getcapabilities "Direct link to getCapabilities()")

> **getCapabilities**(`format`): [`TextureFormatCapabilities`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatCapabilities.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L66)

"static" capabilities of a texture format.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### format[​](#format "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-1 "Direct link to Returns")

[`TextureFormatCapabilities`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatCapabilities.md)

#### Note[​](#note "Direct link to Note")

Needs to be adjusted against current device

***

### getInfo()[​](#getinfo "Direct link to getInfo()")

> **getInfo**(`format`): [`TextureFormatInfo`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatInfo.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L61)

Returns information about a texture format, e.g. attachment type, components, byte length and flags (integer, signed, normalized)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### format[​](#format-1 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-2 "Direct link to Returns")

[`TextureFormatInfo`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormatInfo.md)

***

### getWebGPUCapabilities()[​](#getwebgpucapabilities "Direct link to getWebGPUCapabilities()")

> **getWebGPUCapabilities**(`format`): `number`

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L71)

Returns the compact WebGPU capability mask stored in the canonical format table.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### format[​](#format-2 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`number`

***

### isColor()[​](#iscolor "Direct link to isColor()")

> **isColor**(`format`): `format is TextureFormatColor`

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:46](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L46)

Checks if a texture format is color

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### format[​](#format-3 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`format is TextureFormatColor`

***

### isCompressed()[​](#iscompressed "Direct link to isCompressed()")

> **isCompressed**(`format`): `format is TextureFormatCompressed`

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L56)

Checks if a texture format is compressed

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### format[​](#format-4 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`format is TextureFormatCompressed`

***

### isDepthStencil()[​](#isdepthstencil "Direct link to isDepthStencil()")

> **isDepthStencil**(`format`): `format is TextureFormatDepthStencil`

Defined in: [modules/core/src/shadertypes/texture-types/texture-format-decoder.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-format-decoder.ts#L51)

Checks if a texture format is depth or stencil

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### format[​](#format-5 "Direct link to format")

[`TextureFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

#### Returns[​](#returns-6 "Direct link to Returns")

`format is TextureFormatDepthStencil`
