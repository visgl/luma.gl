# Type Alias: ShaderPassRendererProps

> **ShaderPassRendererProps** = `object`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L53)

Construction props for [ShaderPassRenderer](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).

## Properties[​](#properties "Direct link to Properties")

### colorFormat?[​](#colorformat "Direct link to colorFormat?")

> `optional` **colorFormat?**: `TextureFormatColor`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L59)

Format of the shared previous-chain textures. Defaults to the canvas-preferred format.

***

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L61)

Flip source and presentation sampling vertically. Defaults to true on WebGPU.

***

### shaderInputs?[​](#shaderinputs "Direct link to shaderInputs?")

> `optional` **shaderInputs?**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L57)

Optional typed ShaderInputs object for setting uniforms

***

### shaderPasses[​](#shaderpasses "Direct link to shaderPasses")

> **shaderPasses**: `ShaderPassLike`\[]

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L55)

List of ShaderPasses or CompositeShaderPasses to apply to the sourceTexture
