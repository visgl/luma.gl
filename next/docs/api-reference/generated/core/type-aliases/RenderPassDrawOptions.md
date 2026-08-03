# Type Alias: RenderPassDrawOptions

> **RenderPassDrawOptions** = `object`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L21)

Draw arguments consumed by the active state on a [RenderPass](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPass.md).

## Properties[​](#properties "Direct link to Properties")

### baseVertex?[​](#basevertex "Direct link to baseVertex?")

> `optional` **baseVertex?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L37)

Base vertex added to indexed draws.

***

### firstIndex?[​](#firstindex "Direct link to firstIndex?")

> `optional` **firstIndex?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L33)

First index to draw from.

***

### firstInstance?[​](#firstinstance "Direct link to firstInstance?")

> `optional` **firstInstance?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L35)

First instance to draw from.

***

### firstVertex?[​](#firstvertex "Direct link to firstVertex?")

> `optional` **firstVertex?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L31)

First vertex to draw from.

***

### indexCount?[​](#indexcount "Direct link to indexCount?")

> `optional` **indexCount?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L27)

Number of indices to draw.

***

### instanceCount?[​](#instancecount "Direct link to instanceCount?")

> `optional` **instanceCount?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L29)

Number of instances to draw.

***

### isInstanced?[​](#isinstanced "Direct link to isInstanced?")

> `optional` **isInstanced?**: `boolean`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L23)

Use instanced rendering? WebGL compatibility only; WebGPU infers this from instanceCount.

***

### ~~parameters?~~[​](#parameters "Direct link to parameters")

> `optional` **parameters?**: [`RenderPipelineParameters`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineParameters.md)

Defined in: [modules/core/src/adapter/resources/render-pass.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L39)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

WebGL-only compatibility override. Prefer fixed pipeline parameters.

***

### ~~topology?~~[​](#topology "Direct link to topology")

> `optional` **topology?**: [`PrimitiveTopology`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveTopology.md)

Defined in: [modules/core/src/adapter/resources/render-pass.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L41)

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

WebGL-only compatibility override. Prefer fixed pipeline topology.

***

### ~~transformFeedback?~~[​](#transformfeedback "Direct link to transformfeedback")

> `optional` **transformFeedback?**: [`TransformFeedback`](https://luma.gl/next/docs/api-reference/generated/core/classes/TransformFeedback.md)

Defined in: [modules/core/src/adapter/resources/render-pass.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L43)

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

WebGL-only compatibility state.

***

### ~~uniforms?~~[​](#uniforms "Direct link to uniforms")

> `optional` **uniforms?**: `Record`<`string`, `unknown`>

Defined in: [modules/core/src/adapter/resources/render-pass.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L45)

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

WebGL-only compatibility uniforms. Prefer buffer bindings.

***

### vertexCount?[​](#vertexcount "Direct link to vertexCount?")

> `optional` **vertexCount?**: `number`

Defined in: [modules/core/src/adapter/resources/render-pass.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/render-pass.ts#L25)

Number of vertices to draw.
