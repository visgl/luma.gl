# Function: getGPUVectorModelBatches()

> **getGPUVectorModelBatches**<`Inputs`>(`ownerName`, `vectors`): [`GPUVectorModelBatch`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelBatch.md)<`NonNullable`<`Inputs`\[keyof `Inputs`]>\[`"data"`]\[`number`]>\[]

Defined in: [modules/engine/src/model/gpu-vector-model-batches.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model-batches.ts#L94)

Validates fixed-width vector alignment and returns borrowed batch-local chunk references.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Inputs[​](#inputs "Direct link to Inputs")

`Inputs` *extends* [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

## Parameters[​](#parameters "Direct link to Parameters")

### ownerName[​](#ownername "Direct link to ownerName")

`string`

### vectors[​](#vectors "Direct link to vectors")

`Inputs`

## Returns[​](#returns "Direct link to Returns")

[`GPUVectorModelBatch`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelBatch.md)<`NonNullable`<`Inputs`\[keyof `Inputs`]>\[`"data"`]\[`number`]>\[]
