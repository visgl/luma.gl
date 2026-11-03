# Type Alias: ColorParameters

> **ColorParameters** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L144)

Color parameters are set on the RenderPipeline

## Todo[​](#todo "Direct link to Todo")

* this needs to be settable on a per-attachment basis, not just for first attachment

## Properties[​](#properties "Direct link to Properties")

### blend?[​](#blend "Direct link to blend?")

> `optional` **blend?**: `boolean`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L146)

Enable blending

***

### blendAlphaDstFactor?[​](#blendalphadstfactor "Direct link to blendAlphaDstFactor?")

> `optional` **blendAlphaDstFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L160)

Defines the operation to be performed on values from the target attachment.

***

### blendAlphaOperation?[​](#blendalphaoperation "Direct link to blendAlphaOperation?")

> `optional` **blendAlphaOperation?**: [`BlendOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:156](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L156)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendAlphaSrcFactor?[​](#blendalphasrcfactor "Direct link to blendAlphaSrcFactor?")

> `optional` **blendAlphaSrcFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:158](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L158)

Defines the operation to be performed on values from the fragment shader.

***

### blendColorDstFactor?[​](#blendcolordstfactor "Direct link to blendColorDstFactor?")

> `optional` **blendColorDstFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L153)

Defines the operation to be performed on values from the target attachment.

***

### blendColorOperation?[​](#blendcoloroperation "Direct link to blendColorOperation?")

> `optional` **blendColorOperation?**: [`BlendOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:149](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L149)

Defines the operation used to calculate the values written to the target attachment components.

***

### blendColorSrcFactor?[​](#blendcolorsrcfactor "Direct link to blendColorSrcFactor?")

> `optional` **blendColorSrcFactor?**: [`BlendFactor`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/BlendFactor.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L151)

Defines the operation to be performed on values from the fragment shader.

***

### colorMask?[​](#colormask "Direct link to colorMask?")

> `optional` **colorMask?**: `number`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:163](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L163)

Bitmask controlling which channels are are written to when drawing to this color target. defaulting to 0xF
