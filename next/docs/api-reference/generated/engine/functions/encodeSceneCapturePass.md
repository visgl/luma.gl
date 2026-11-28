# Function: encodeSceneCapturePass()

> **encodeSceneCapturePass**<`Frame`, `Target`, `DrawResult`>(`definition`, `options`): `DrawResult`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L29)

Records a capture pass and returns its synchronous draw result.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Frame[​](#frame "Direct link to Frame")

`Frame`

### Target[​](#target "Direct link to Target")

`Target` *extends* `string`

### DrawResult[​](#drawresult "Direct link to DrawResult")

`DrawResult`

## Parameters[​](#parameters "Direct link to Parameters")

### definition[​](#definition "Direct link to definition")

[`SceneCapturePassDefinition`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/SceneCapturePassDefinition.md)<`Frame`, `Target`, `DrawResult`>

### options[​](#options "Direct link to options")

#### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

#### frame[​](#frame-1 "Direct link to frame")

`Frame`

#### framebuffers[​](#framebuffers "Direct link to framebuffers")

`Record`<`Target`, `Framebuffer`>

#### id?[​](#id "Direct link to id?")

`string`

## Returns[​](#returns "Direct link to Returns")

`DrawResult`
