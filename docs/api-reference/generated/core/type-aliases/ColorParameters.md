# Type Alias: ColorParameters

> **ColorParameters** = `object`

Defined in: [modules/core/src/adapter/types/parameters.ts:152](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L152)

Color parameters are set on the RenderPipeline

## Todo[​](#todo "Direct link to Todo")

* this needs to be settable on a per-attachment basis, not just for first attachment

## Properties[​](#properties "Direct link to Properties")

### blend?[​](#blend "Direct link to blend?")

> `optional` **blend?**: `boolean`

Defined in: [modules/core/src/adapter/types/parameters.ts:154](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L154)

Enable blending

***

### blendAlphaDstFactor?[​](#blendalphadstfactor "Direct link to blendAlphaDstFactor?")

> `optional` **blendAlphaDstFactor?**: [`BlendFactor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:168](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L168)

Defines the operation to be performed on values from the target attachment.

***

### blendAlphaOperation?[​](#blendalphaoperation "Direct link to blendAlphaOperation?")

> `optional` **blendAlphaOperation?**: [`BlendOperation`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:164](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L164)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendAlphaSrcFactor?[​](#blendalphasrcfactor "Direct link to blendAlphaSrcFactor?")

> `optional` **blendAlphaSrcFactor?**: [`BlendFactor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:166](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L166)

Defines the operation to be performed on values from the fragment shader.

***

### blendColorDstFactor?[​](#blendcolordstfactor "Direct link to blendColorDstFactor?")

> `optional` **blendColorDstFactor?**: [`BlendFactor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:161](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L161)

Defines the operation to be performed on values from the target attachment.

***

### blendColorOperation?[​](#blendcoloroperation "Direct link to blendColorOperation?")

> `optional` **blendColorOperation?**: [`BlendOperation`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:157](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L157)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendColorSrcFactor?[​](#blendcolorsrcfactor "Direct link to blendColorSrcFactor?")

> `optional` **blendColorSrcFactor?**: [`BlendFactor`](https://luma.gl/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/adapter/types/parameters.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L159)

Defines the operation to be performed on values from the fragment shader.

***

### colorMask?[​](#colormask "Direct link to colorMask?")

> `optional` **colorMask?**: `number`

Defined in: [modules/core/src/adapter/types/parameters.ts:171](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/parameters.ts#L171)

Bitmask controlling which channels are are written to when drawing to this color target. defaulting to 0xF
