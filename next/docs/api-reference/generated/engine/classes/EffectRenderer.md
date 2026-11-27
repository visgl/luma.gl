# Class: EffectRenderer

Defined in: [modules/engine/src/passes/effect-renderer.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L93)

Runs a chain of reusable fullscreen effects for a single device.

Resize to the desired output size before rendering. Supply scene textures and per-frame uniforms to the render call. Reset history when the camera cuts or scene changes invalidate temporal data, and destroy the renderer when the chain is no longer needed.

## Extends[​](#extends "Direct link to Extends")

* [`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md)

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new EffectRenderer**(`device`, `__namedParameters`): `EffectRenderer`

Defined in: [modules/engine/src/passes/effect-renderer.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/effect-renderer.ts#L94)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### \_\_namedParameters[​](#__namedparameters "Direct link to __namedParameters")

[`EffectRendererProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/EffectRendererProps.md)

#### Returns[​](#returns "Direct link to Returns")

`EffectRenderer`

#### Overrides[​](#overrides "Direct link to Overrides")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`constructor`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#constructor)

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> **device**: `Device`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L91)

#### Inherited from[​](#inherited-from "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`device`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#device)

***

### passRenderers[​](#passrenderers "Direct link to passRenderers")

> **passRenderers**: `PassRenderer`\[]

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L93)

#### Inherited from[​](#inherited-from-1 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`passRenderers`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#passrenderers)

***

### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L92)

#### Inherited from[​](#inherited-from-2 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`shaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#shaderinputs)

***

### swapFramebuffers[​](#swapframebuffers "Direct link to swapFramebuffers")

> **swapFramebuffers**: [`SwapFramebuffers`](https://luma.gl/next/docs/api-reference/generated/engine/classes/SwapFramebuffers.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:94](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L94)

#### Inherited from[​](#inherited-from-3 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`swapFramebuffers`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#swapframebuffers)

***

### textureModel[​](#texturemodel "Direct link to textureModel")

> **textureModel**: [`BackgroundTextureModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/BackgroundTextureModel.md)

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:95](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L95)

#### Inherited from[​](#inherited-from-4 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`textureModel`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#texturemodel)

## Methods[​](#methods "Direct link to Methods")

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:128](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L128)

Destroys resources created by this ShaderPassRenderer

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-5 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`destroy`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#destroy)

***

### encodeToScreen()[​](#encodetoscreen "Direct link to encodeToScreen()")

> **encodeToScreen**(`commandEncoder`, `options`): `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:160](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L160)

Records the shader-pass chain and presentation into a caller-owned command encoder. The encoder must belong to this renderer's device and have no active pass. This method does not finish or submit the encoder.

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder "Direct link to commandEncoder")

`CommandEncoder`

##### options[​](#options "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-2 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-6 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`encodeToScreen`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#encodetoscreen)

***

### encodeToTexture()[​](#encodetotexture "Direct link to encodeToTexture()")

> **encodeToTexture**(`commandEncoder`, `options`): `Texture` | `null`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:198](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L198)

Records the shader-pass chain into a caller-owned command encoder. The encoder must belong to this renderer's device and have no active pass. This method does not finish or submit the encoder.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### commandEncoder[​](#commandencoder-1 "Direct link to commandEncoder")

`CommandEncoder`

##### options[​](#options-1 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-3 "Direct link to Returns")

`Texture` | `null`

#### Inherited from[​](#inherited-from-7 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`encodeToTexture`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#encodetotexture)

***

### renderToScreen()[​](#rendertoscreen "Direct link to renderToScreen()")

> **renderToScreen**(`options`): `boolean`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L151)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### options[​](#options-2 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-4 "Direct link to Returns")

`boolean`

#### Inherited from[​](#inherited-from-8 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`renderToScreen`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#rendertoscreen)

***

### renderToTexture()[​](#rendertotexture "Direct link to renderToTexture()")

> **renderToTexture**(`options`): `Texture` | `null`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:189](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L189)

Runs the shaderPasses in sequence on the sourceTexture and returns a texture with the results.

#### Parameters[​](#parameters-4 "Direct link to Parameters")

##### options[​](#options-3 "Direct link to options")

[`ShaderPassRendererRenderOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ShaderPassRendererRenderOptions.md)

#### Returns[​](#returns-5 "Direct link to Returns")

`Texture` | `null`

null if the the sourceTexture has not yet been loaded

#### Inherited from[​](#inherited-from-9 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`renderToTexture`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#rendertotexture)

***

### resetHistory()[​](#resethistory "Direct link to resetHistory()")

> **resetHistory**(): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:145](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L145)

Invalidates persistent composite-pass targets without destroying their allocations.

#### Returns[​](#returns-6 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-10 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`resetHistory`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#resethistory)

***

### resize()[​](#resize "Direct link to resize()")

> **resize**(`size?`): `void`

Defined in: [modules/engine/src/passes/shader-pass-renderer.ts:136](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/passes/shader-pass-renderer.ts#L136)

#### Parameters[​](#parameters-5 "Direct link to Parameters")

##### size?[​](#size "Direct link to size?")

\[`number`, `number`]

#### Returns[​](#returns-7 "Direct link to Returns")

`void`

#### Inherited from[​](#inherited-from-11 "Direct link to Inherited from")

[`ShaderPassRenderer`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md).[`resize`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderPassRenderer.md#resize)
