# Class: ShaderPassRenderer

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L89)

Runs one or more shader passes against a source texture.

The renderer owns:

* a shared ping-pong pair for the logical `previous` chain
* any named render targets declared by `CompositeShaderPass`
* a fullscreen model used both to seed the chain and to present to the screen

Per-draw `uniforms` and `bindings` passed to `renderToTexture()` or `renderToScreen()` are merged on top of the renderer's `shaderInputs`, which lets callers reuse one renderer instance while varying pass inputs frame to frame.

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new ShaderPassRenderer**(`device`, `props`): `ShaderPassRenderer`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:96](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L96)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`ShaderPassRendererProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererProps.md)

#### Returns[​](#returns "Direct link to Returns")

`ShaderPassRenderer`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> **device**: `Device`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L90)

***

### passRenderers[​](#passrenderers "Direct link to passRenderers")

> **passRenderers**: `PassRenderer`\[]

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L92)

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L91)

***

### swapFramebuffers[​](#swapframebuffers "Direct link to swapFramebuffers")

> **swapFramebuffers**: [`SwapFramebuffers`](https://luma.gl/next/docs/api-reference/generated/engine/classes/SwapFramebuffers.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L93)

***

### textureModel[​](#texturemodel "Direct link to textureModel")

> **textureModel**: [`BackgroundTextureModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/BackgroundTextureModel.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L94)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L127)

Destroys resources created by this ShaderPassRenderer

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### encodeToScreen()[​](#encodetoscreen "Direct link to encodeToScreen()")

> **encodeToScreen**(`commandEncoder`, `options`): `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:159](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L159)

Records the shader-pass chain and presentation into a caller-owned command encoder. The encoder must belong to this renderer's device and have no active pass. This method does not finish or submit the encoder.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

##### options[​](#options "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

***

### encodeToTexture()[​](#encodetotexture "Direct link to encodeToTexture()")

> **encodeToTexture**(`commandEncoder`, `options`): `Texture` | `null`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:197](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L197)

Records the shader-pass chain into a caller-owned command encoder. The encoder must belong to this renderer's device and have no active pass. This method does not finish or submit the encoder.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder-1 "Direct link to commandEncoder")

`CommandEncoder`

##### options[​](#options-1 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`Texture` | `null`

***

### renderToScreen()[​](#rendertoscreen "Direct link to renderToScreen()")

> **renderToScreen**(`options`): `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:150](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L150)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### options[​](#options-2 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

***

### renderToTexture()[​](#rendertotexture "Direct link to renderToTexture()")

> **renderToTexture**(`options`): `Texture` | `null`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:188](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L188)

Runs the shaderPasses in sequence on the sourceTexture and returns a texture with the results.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options[​](#options-3 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`Texture` | `null`

null if the the sourceTexture has not yet been loaded

***

### resetHistory()[​](#resethistory "Direct link to resetHistory()")

> **resetHistory**(): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L144)

Invalidates persistent composite-pass targets without destroying their allocations.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

***

### resize()[​](#resize "Direct link to resize()")

> **resize**(`size?`): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:135](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L135)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### size?[​](#size "Direct link to size?")

\[`number`, `number`]

#### Returns[​](#returns-7 "Direct link to Returns")

`void`
