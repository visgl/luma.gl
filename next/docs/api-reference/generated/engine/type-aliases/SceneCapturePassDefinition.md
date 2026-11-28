# Type Alias: SceneCapturePassDefinition\<Frame, Target, DrawResult>

> **SceneCapturePassDefinition**<`Frame`, `Target`, `DrawResult`> = `object`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L13)

A scene draw into a named framebuffer. The scene owns the framebuffer and its attachments, so a definition can run against different views or slices on each frame.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### Frame[​](#frame "Direct link to Frame")

`Frame`

### Target[​](#target "Direct link to Target")

`Target` *extends* `string`

### DrawResult[​](#drawresult "Direct link to DrawResult")

`DrawResult` = `void`

## Properties[​](#properties "Direct link to Properties")

### draw[​](#draw "Direct link to draw")

> **draw**: (`renderPass`, `frame`) => `DrawResult`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L25)

Records geometry using the active render pass.

#### Parameters[​](#parameters "Direct link to Parameters")

##### renderPass[​](#renderpass "Direct link to renderPass")

`RenderPass`

##### frame[​](#frame-1 "Direct link to frame")

`Frame`

#### Returns[​](#returns "Direct link to Returns")

`DrawResult`

***

### getPassProps?[​](#getpassprops "Direct link to getPassProps?")

> `optional` **getPassProps?**: (`frame`) => `SceneCapturePassProps`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L21)

Frame-dependent settings, such as a slice scissor rectangle or attachment clear value.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### frame[​](#frame-2 "Direct link to frame")

`Frame`

#### Returns[​](#returns-1 "Direct link to Returns")

`SceneCapturePassProps`

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L15)

Default GPU command label. A caller can supply a label for a particular view.

***

### pass?[​](#pass "Direct link to pass?")

> `optional` **pass?**: `SceneCapturePassProps`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L19)

Static attachment clear, load, and access settings.

***

### prepare?[​](#prepare "Direct link to prepare?")

> `optional` **prepare?**: (`commandEncoder`, `frame`) => `void`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L23)

Prepare GPU resources before the render pass opens.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

##### frame[​](#frame-3 "Direct link to frame")

`Frame`

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### target[​](#target-1 "Direct link to target")

> **target**: `Target`

Defined in: [modules/engine/src/passes/scene-capture-pass.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/scene-capture-pass.ts#L17)

Name of the framebuffer bound for this draw.
