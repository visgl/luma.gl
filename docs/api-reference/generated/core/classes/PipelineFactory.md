# Class: PipelineFactory

Defined in: [modules/core/src/factories/pipeline-factory.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L27)

Efficiently creates / caches pipelines

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new PipelineFactory**(`device`): `PipelineFactory`

Defined in: [modules/core/src/factories/pipeline-factory.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L87)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

#### Returns[​](#returns "Direct link to Returns")

`PipelineFactory`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: [`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L67)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`PipelineFactoryProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PipelineFactoryProps.md)>

Defined in: [modules/core/src/factories/pipeline-factory.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L28)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/factories/pipeline-factory.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L79)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

## Methods[​](#methods "Direct link to Methods")

### createComputePipeline()[​](#createcomputepipeline "Direct link to createComputePipeline()")

> **createComputePipeline**(`props`): [`ComputePipeline`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:174](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L174)

Return a ComputePipeline matching supplied props. Reuses an equivalent pipeline if already created.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ComputePipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ComputePipelineProps.md)

#### Returns[​](#returns-2 "Direct link to Returns")

[`ComputePipeline`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePipeline.md)

***

### createComputePipelineAsync()[​](#createcomputepipelineasync "Direct link to createComputePipelineAsync()")

> **createComputePipelineAsync**(`props`): `Promise`<[`ComputePipeline`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePipeline.md)>

Defined in: [modules/core/src/factories/pipeline-factory.ts:213](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L213)

Asynchronously returns a compute pipeline matching the supplied props.

Concurrent requests for an equivalent pipeline share one pending backend compilation.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

[`ComputePipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/ComputePipelineProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`Promise`<[`ComputePipeline`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePipeline.md)>

***

### createRenderPipeline()[​](#createrenderpipeline "Direct link to createRenderPipeline()")

> **createRenderPipeline**(`props`): [`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L104)

Return a RenderPipeline matching supplied props. Reuses an equivalent pipeline if already created.

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-4 "Direct link to Returns")

[`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md)

***

### createRenderPipelineAsync()[​](#createrenderpipelineasync "Direct link to createRenderPipelineAsync()")

> **createRenderPipelineAsync**(`props`): `Promise`<[`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md)>

Defined in: [modules/core/src/factories/pipeline-factory.ts:148](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L148)

Asynchronously returns a render pipeline matching the supplied props.

Concurrent requests for an equivalent pipeline share one pending backend compilation.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### props[​](#props-3 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`Promise`<[`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md)>

***

### createSharedRenderPipeline()[​](#createsharedrenderpipeline "Direct link to createSharedRenderPipeline()")

> **createSharedRenderPipeline**(`props`): [`SharedRenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:255](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L255)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### props[​](#props-4 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-6 "Direct link to Returns")

[`SharedRenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

***

### release()[​](#release "Direct link to release()")

> **release**(`pipeline`): `void`

Defined in: [modules/core/src/factories/pipeline-factory.ts:232](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L232)

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### pipeline[​](#pipeline "Direct link to pipeline")

[`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md) | [`ComputePipeline`](https://luma.gl/docs/api-reference/generated/core/classes/ComputePipeline.md)

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

***

### releaseSharedRenderPipeline()[​](#releasesharedrenderpipeline "Direct link to releaseSharedRenderPipeline()")

> **releaseSharedRenderPipeline**(`pipeline`): `void`

Defined in: [modules/core/src/factories/pipeline-factory.ts:267](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L267)

#### Parameters[​](#parameters-7 "Direct link to Parameters")

##### pipeline[​](#pipeline-1 "Direct link to pipeline")

[`RenderPipeline`](https://luma.gl/docs/api-reference/generated/core/classes/RenderPipeline.md)

#### Returns[​](#returns-8 "Direct link to Returns")

`void`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/factories/pipeline-factory.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L83)

#### Returns[​](#returns-9 "Direct link to Returns")

`string`

***

### getDefaultPipelineFactory()[​](#getdefaultpipelinefactory "Direct link to getDefaultPipelineFactory()")

> `static` **getDefaultPipelineFactory**(`device`): `PipelineFactory`

Defined in: [modules/core/src/factories/pipeline-factory.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L31)

Get the singleton default pipeline factory for the specified device

#### Parameters[​](#parameters-8 "Direct link to Parameters")

##### device[​](#device-2 "Direct link to device")

[`Device`](https://luma.gl/docs/api-reference/generated/core/classes/Device.md)

#### Returns[​](#returns-10 "Direct link to Returns")

`PipelineFactory`
