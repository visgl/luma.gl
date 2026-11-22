# Type Alias: StencilFaceState

> **StencilFaceState** = `object`

Defined in: [modules/core/src/api/adapter/types/parameters.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L91)

Comparison and operations for one stencil face. Omitted fields inherit the flat parameters.

## Properties[​](#properties "Direct link to Properties")

### compare?[​](#compare "Direct link to compare?")

> `optional` **compare?**: [`CompareFunction`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/CompareFunction.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L93)

Comparison of the masked reference against the masked stored value.

***

### depthFailOp?[​](#depthfailop "Direct link to depthFailOp?")

> `optional` **depthFailOp?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L97)

Operation on stencil success followed by depth failure.

***

### failOp?[​](#failop "Direct link to failOp?")

> `optional` **failOp?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L95)

Operation on stencil failure.

***

### passOp?[​](#passop "Direct link to passOp?")

> `optional` **passOp?**: [`StencilOperation`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/StencilOperation.md)

Defined in: [modules/core/src/api/adapter/types/parameters.ts:99](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/types/parameters.ts#L99)

Operation when both tests pass.
