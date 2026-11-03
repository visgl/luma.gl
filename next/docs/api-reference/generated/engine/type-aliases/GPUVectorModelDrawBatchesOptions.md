# Type Alias: GPUVectorModelDrawBatchesOptions\<Inputs>

> **GPUVectorModelDrawBatchesOptions**<`Inputs`> = `object`

Defined in: [modules/engine/src/model/gpu-vector-model-batches.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model-batches.ts#L49)

Per-draw options for rendering aligned vectors without creating table wrappers.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Inputs[​](#inputs "Direct link to Inputs")

`Inputs` *extends* [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md) = [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

## Properties[​](#properties "Direct link to Properties")

### onBatch?[​](#onbatch "Direct link to onBatch?")

> `optional` **onBatch?**: (`batch`) => `void`

Defined in: [modules/engine/src/model/gpu-vector-model-batches.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model-batches.ts#L58)

Runs synchronously before each chunk draw. Managed uniforms use distinct aligned slots within this call; submit before reusing slots with different values in another call. External buffers remain caller-managed. Row offsets are cumulative.

#### Parameters[​](#parameters "Direct link to Parameters")

##### batch[​](#batch "Direct link to batch")

[`GPUVectorModelBatch`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelBatch.md)<`NonNullable`<`Inputs`\[keyof `Inputs`]>\[`"data"`]\[`number`]>

#### Returns[​](#returns "Direct link to Returns")

`void`

***

### vectors[​](#vectors "Direct link to vectors")

> **vectors**: `Inputs`

Defined in: [modules/engine/src/model/gpu-vector-model-batches.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/model/gpu-vector-model-batches.ts#L52)
