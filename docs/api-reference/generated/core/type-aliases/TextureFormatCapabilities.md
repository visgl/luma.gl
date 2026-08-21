# Type Alias: TextureFormatCapabilities

> **TextureFormatCapabilities** = `object`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L53)

Texture format capabilities.

## Note[​](#note "Direct link to Note")

Not directly usable. Can contain TextureFeature strings that need to be checked against a specific device.

## Properties[​](#properties "Direct link to Properties")

### blend[​](#blend "Direct link to blend")

> **blend**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L62)

If a feature string, the specified device feature determines if format is blendable.

***

### create[​](#create "Direct link to create")

> **create**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L56)

Can the format be created

***

### filter[​](#filter "Direct link to filter")

> **filter**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L60)

If a feature string, the specified device feature determines if format is filterable.

***

### format[​](#format "Direct link to format")

> **format**: [`TextureFormat`](https://luma.gl/docs/api-reference/generated/core/type-aliases/TextureFormat.md)

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L54)

***

### render[​](#render "Direct link to render")

> **render**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L58)

If a feature string, the specified device feature determines if format is renderable.

***

### store[​](#store "Direct link to store")

> **store**: `TextureFeature` | `boolean`

Defined in: [modules/core/src/shadertypes/texture-types/texture-formats.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/texture-types/texture-formats.ts#L64)

If a feature string, the specified device feature determines if format is storeable.
