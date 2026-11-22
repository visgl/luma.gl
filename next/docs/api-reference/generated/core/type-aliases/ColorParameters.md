# Type Alias: ColorParameters

> **ColorParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L160)

Color parameters are set on the RenderPipeline

## Todo[​](#todo "Direct link to Todo")

* this needs to be settable on a per-attachment basis, not just for first attachment

## Properties[​](#properties "Direct link to Properties")

### blend?[​](#blend "Direct link to blend?")

> `optional` **blend?**: `boolean`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:162](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L162)

Enable blending

***

### blendAlphaDstFactor?[​](#blendalphadstfactor "Direct link to blendAlphaDstFactor?")

> `optional` **blendAlphaDstFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:176](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L176)

Defines the operation to be performed on values from the target attachment.

***

### blendAlphaOperation?[​](#blendalphaoperation "Direct link to blendAlphaOperation?")

> `optional` **blendAlphaOperation?**: [`BlendOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:172](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L172)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendAlphaSrcFactor?[​](#blendalphasrcfactor "Direct link to blendAlphaSrcFactor?")

> `optional` **blendAlphaSrcFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L174)

Defines the operation to be performed on values from the fragment shader.

***

### blendColorDstFactor?[​](#blendcolordstfactor "Direct link to blendColorDstFactor?")

> `optional` **blendColorDstFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:169](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L169)

Defines the operation to be performed on values from the target attachment.

***

### blendColorOperation?[​](#blendcoloroperation "Direct link to blendColorOperation?")

> `optional` **blendColorOperation?**: [`BlendOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:165](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L165)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendColorSrcFactor?[​](#blendcolorsrcfactor "Direct link to blendColorSrcFactor?")

> `optional` **blendColorSrcFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:167](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L167)

Defines the operation to be performed on values from the fragment shader.

***

### colorMask?[​](#colormask "Direct link to colorMask?")

> `optional` **colorMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:179](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L179)

Bitmask controlling which channels are are written to when drawing to this color target. defaulting to 0xF
