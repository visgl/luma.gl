# Type Alias: DynamicTextureProps

> **DynamicTextureProps** = `Omit`<`TextureProps`, `"data"` | `"mipLevels"` | `"width"` | `"height"`> & `TextureDataAsyncProps` & `object`

Defined in: modules/core/dist/dynamic/dynamic-texture/dynamic-texture.d.ts:8

Properties for a dynamic texture

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### height?[​](#height "Direct link to height?")

> `optional` **height?**: `number`

Height - can be auto-calculated when initializing from ExternalImage

### mipLevels?[​](#miplevels "Direct link to mipLevels?")

> `optional` **mipLevels?**: `number` | `"auto"`

nipLevels can be set to 'auto' to generate max number of mipLevels

### mipmaps?[​](#mipmaps "Direct link to mipmaps?")

> `optional` **mipmaps?**: `boolean`

Generate mipmaps after creating textures and setting data

### width?[​](#width "Direct link to width?")

> `optional` **width?**: `number`

Width - can be auto-calculated when initializing from ExternalImage
