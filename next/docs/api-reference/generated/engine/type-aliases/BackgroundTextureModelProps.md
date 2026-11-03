# Type Alias: BackgroundTextureModelProps

> **BackgroundTextureModelProps** = [`ClipSpaceProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ClipSpaceProps.md) & `object`

Defined in: [modules/engine/src/models/billboard-texture-model.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/models/billboard-texture-model.ts#L74)

Props for a Model that renders a bitmap into the "background", i.e covering the screen

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### backgroundTexture[​](#backgroundtexture "Direct link to backgroundTexture")

> **backgroundTexture**: `Texture` | [`DynamicTexture`](https://luma.gl/next/docs/api-reference/generated/engine/classes/DynamicTexture.md)

The texture to render

### blend?[​](#blend "Direct link to blend?")

> `optional` **blend?**: `boolean`

If true, the texture is rendered into transparent areas of the screen only, i.e blended in where background alpha is small

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

If true, flip the sampled texture vertically before drawing.

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

id of this model
