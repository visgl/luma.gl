# Type Alias: ShaderPassRendererProps

> **ShaderPassRendererProps** = `object`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L66)

Construction props for [ShaderPassRenderer](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).

## Properties[​](#properties "Direct link to Properties")

### colorFormat?[​](#colorformat "Direct link to colorFormat?")

> `optional` **colorFormat?**: `TextureFormatColor`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:72](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L72)

Format of the shared previous-chain textures. Defaults to the canvas-preferred format.

***

### flipY?[​](#flipy "Direct link to flipY?")

> `optional` **flipY?**: `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:74](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L74)

Flip source and presentation sampling vertically. Defaults to true on WebGPU.

***

### shaderInputs?[​](#shaderinputs "Direct link to shaderInputs?")

> `optional` **shaderInputs?**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:70](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L70)

Optional typed ShaderInputs object for setting uniforms

***

### shaderPasses[​](#shaderpasses "Direct link to shaderPasses")

> **shaderPasses**: `ShaderPassLike`\[]

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L68)

List of ShaderPasses or CompositeShaderPasses to apply to the sourceTexture
