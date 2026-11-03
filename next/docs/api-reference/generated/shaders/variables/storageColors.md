# Variable: storageColors

> `const` **storageColors**: `object`

Defined in: [modules/color/float-colors.ts:316](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/color/float-colors.ts#L316)

WGSL reader for packed RGBA storage rows.

Include [colors](https://luma.gl/next/docs/api-reference/generated/shaders/variables/colors.md) separately when semantic color normalization helpers are also needed.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"storageColors"`; }, { `group`: `0`; `name`: `"storageColorsBuffer"`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: [`StorageColorsBindings`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorsBindings.md)

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object` = `STORAGE_COLORS_DEFAULT_UNIFORMS`

#### defaultUniforms.\_padding[​](#defaultuniforms_padding "Direct link to defaultUniforms._padding")

> `readonly` **\_padding**: `0` = `0`

#### defaultUniforms.format[​](#defaultuniformsformat "Direct link to defaultUniforms.format")

> `readonly` **format**: `0` = `STORAGE_COLOR_FORMAT.RGBA8UNORM`

#### defaultUniforms.wordOffset[​](#defaultuniformswordoffset "Direct link to defaultUniforms.wordOffset")

> `readonly` **wordOffset**: `0` = `0`

#### defaultUniforms.wordStride[​](#defaultuniformswordstride "Direct link to defaultUniforms.wordStride")

> `readonly` **wordStride**: `number`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"storageColors"` = `'storageColors'`

### props[​](#props "Direct link to props")

> `readonly` **props**: [`StorageColorsProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorsProps.md)

### source[​](#source "Direct link to source")

> `readonly` **source**: `string` = `STORAGE_COLORS_WGSL`

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`StorageColorsUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorsUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object` = `STORAGE_COLORS_UNIFORM_TYPES`

#### uniformTypes.\_padding[​](#uniformtypes_padding "Direct link to uniformTypes._padding")

> `readonly` **\_padding**: `"u32"` = `'u32'`

#### uniformTypes.format[​](#uniformtypesformat "Direct link to uniformTypes.format")

> `readonly` **format**: `"u32"` = `'u32'`

#### uniformTypes.wordOffset[​](#uniformtypeswordoffset "Direct link to uniformTypes.wordOffset")

> `readonly` **wordOffset**: `"u32"` = `'u32'`

#### uniformTypes.wordStride[​](#uniformtypeswordstride "Direct link to uniformTypes.wordStride")

> `readonly` **wordStride**: `"u32"` = `'u32'`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props-1 "Direct link to props?")

[`StorageColorsProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorsProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

##### \_padding[​](#_padding "Direct link to _padding")

> **\_padding**: `number`

Reserved field retaining a 16-byte uniform block.

##### format[​](#format "Direct link to format")

> **format**: [`StorageColorFormatValue`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/StorageColorFormatValue.md)

Numeric `STORAGE_COLOR_FORMAT` tag used by WGSL.

##### storageColorsBuffer?[​](#storagecolorsbuffer "Direct link to storageColorsBuffer?")

> `optional` **storageColorsBuffer?**: `object` = `props.colorBuffer`

##### wordOffset[​](#wordoffset "Direct link to wordOffset")

> **wordOffset**: `number`

Uint32 word offset to the first storage color row.

##### wordStride[​](#wordstride "Direct link to wordStride")

> **wordStride**: `number`

Uint32 words between storage color rows.
