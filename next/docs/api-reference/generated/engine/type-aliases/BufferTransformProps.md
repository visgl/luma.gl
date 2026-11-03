# Type Alias: BufferTransformProps

> **BufferTransformProps** = `Omit`<[`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md), `"fs"`> & `object`

Defined in: [modules/engine/src/compute/buffer-transform.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/compute/buffer-transform.ts#L26)

Properties for creating a [BufferTransform](https://luma.gl/next/docs/api-reference/generated/engine/classes/BufferTransform.md)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### feedbackBufferMode?[​](#feedbackbuffermode "Direct link to feedbackBufferMode?")

> `optional` **feedbackBufferMode?**: `"interleaved"` | `"separate"`

bufferMode when binding varyings <https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings>

### ~~feedbackBuffers?~~[​](#feedbackbuffers "Direct link to feedbackbuffers")

> `optional` **feedbackBuffers?**: `Record`<`string`, `Buffer` | `BufferRange`>

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use `run({outputBuffers})` instead - Map of output buffers that the shaders will write results of computations to

### fs?[​](#fs "Direct link to fs?")

> `optional` **fs?**: [`GPUVectorModelProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelProps.md)\[`"fs"`]

Optional fragment shader - normally not used in transforms

### inputVectors?[​](#inputvectors "Direct link to inputVectors?")

> `optional` **inputVectors?**: [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

Borrowed contiguous vectors mapped to vertex-buffer layout names.

### outputs?[​](#outputs "Direct link to outputs?")

> `optional` **outputs?**: `string`\[]

A list of named outputs corresponding to shader declarations (varyings in WebGL)

### outputVectors?[​](#outputvectors "Direct link to outputVectors?")

> `optional` **outputVectors?**: [`GPUVectorModelInputs`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/GPUVectorModelInputs.md)

Borrowed contiguous vectors mapped to transform-feedback varying names.

## Note[​](#note "Direct link to Note")

Only works under WebGL2.
