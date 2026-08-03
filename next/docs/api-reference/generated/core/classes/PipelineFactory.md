# Class: PipelineFactory

Defined in: [modules/core/src/factories/pipeline-factory.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L21)

Efficiently creates / caches pipelines

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new PipelineFactory**(`device`): `PipelineFactory`

Defined in: [modules/core/src/factories/pipeline-factory.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L47)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

#### Returns[​](#returns "Direct link to Returns")

`PipelineFactory`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> `readonly` **device**: [`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L31)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`PipelineFactoryProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PipelineFactoryProps.md)>

Defined in: [modules/core/src/factories/pipeline-factory.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L22)

## Accessors[​](#accessors "Direct link to Accessors")

### \[toStringTag][​](#tostringtag "Direct link to \[toStringTag]")

#### Get Signature[​](#get-signature "Direct link to Get Signature")

> **get** **\[toStringTag]**(): `string`

Defined in: [modules/core/src/factories/pipeline-factory.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L39)

##### Returns[​](#returns-1 "Direct link to Returns")

`string`

## Methods[​](#methods "Direct link to Methods")

### createComputePipeline()[​](#createcomputepipeline "Direct link to createComputePipeline()")

> **createComputePipeline**(`props`): [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L104)

Return a ComputePipeline matching supplied props. Reuses an equivalent pipeline if already created.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`ComputePipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/ComputePipelineProps.md)

#### Returns[​](#returns-2 "Direct link to Returns")

[`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

***

### createRenderPipeline()[​](#createrenderpipeline "Direct link to createRenderPipeline()")

> **createRenderPipeline**(`props`): [`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L64)

Return a RenderPipeline matching supplied props. Reuses an equivalent pipeline if already created.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### props[​](#props-1 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-3 "Direct link to Returns")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

***

### createSharedRenderPipeline()[​](#createsharedrenderpipeline "Direct link to createSharedRenderPipeline()")

> **createSharedRenderPipeline**(`props`): [`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

Defined in: [modules/core/src/factories/pipeline-factory.ts:161](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L161)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### props[​](#props-2 "Direct link to props")

[`RenderPipelineProps`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/RenderPipelineProps.md)

#### Returns[​](#returns-4 "Direct link to Returns")

[`SharedRenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/SharedRenderPipeline.md)

***

### release()[​](#release "Direct link to release()")

> **release**(`pipeline`): `void`

Defined in: [modules/core/src/factories/pipeline-factory.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L138)

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### pipeline[​](#pipeline "Direct link to pipeline")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md) | [`ComputePipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/ComputePipeline.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`void`

***

### releaseSharedRenderPipeline()[​](#releasesharedrenderpipeline "Direct link to releaseSharedRenderPipeline()")

> **releaseSharedRenderPipeline**(`pipeline`): `void`

Defined in: [modules/core/src/factories/pipeline-factory.ts:173](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L173)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### pipeline[​](#pipeline-1 "Direct link to pipeline")

[`RenderPipeline`](https://luma.gl/next/docs/api-reference/generated/core/classes/RenderPipeline.md)

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### toString()[​](#tostring "Direct link to toString()")

> **toString**(): `string`

Defined in: [modules/core/src/factories/pipeline-factory.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L43)

#### Returns[​](#returns-7 "Direct link to Returns")

`string`

***

### getDefaultPipelineFactory()[​](#getdefaultpipelinefactory "Direct link to getDefaultPipelineFactory()")

> `static` **getDefaultPipelineFactory**(`device`): `PipelineFactory`

Defined in: [modules/core/src/factories/pipeline-factory.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/factories/pipeline-factory.ts#L25)

Get the singleton default pipeline factory for the specified device

#### Parameters[​](#parameters-6 "Direct link to Parameters")

##### device[​](#device-2 "Direct link to device")

[`Device`](https://luma.gl/next/docs/api-reference/generated/core/classes/Device.md)

#### Returns[​](#returns-8 "Direct link to Returns")

`PipelineFactory`
