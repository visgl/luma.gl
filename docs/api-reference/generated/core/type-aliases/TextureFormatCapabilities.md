# Type Alias: TextureFormatCapabilities

> **TextureFormatCapabilities** = `object`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L73)

Texture format capabilities.

## Note[​](#note "Direct link to Note")

Not directly usable. Can contain TextureFeature strings that need to be checked against a specific device.

## Properties[​](#properties "Direct link to Properties")

### blend[​](#blend "Direct link to blend")

> **blend**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L82)

If a feature string, the specified device feature determines if format is blendable.

***

### create[​](#create "Direct link to create")

> **create**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:76](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L76)

Can the format be created

***

### filter[​](#filter "Direct link to filter")

> **filter**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L80)

If a feature string, the specified device feature determines if format is filterable.

***

### format[​](#format "Direct link to format")

> **format**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L74)

***

### render[​](#render "Direct link to render")

> **render**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L78)

If a feature string, the specified device feature determines if format is renderable.

***

### store[​](#store "Direct link to store")

> **store**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L84)

If a feature string, the specified device feature determines if format is storeable.
