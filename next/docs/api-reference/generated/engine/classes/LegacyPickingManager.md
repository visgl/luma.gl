# Class: LegacyPickingManager

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L13)

Helper class for using the legacy picking module

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new LegacyPickingManager**(`device`, `shaderInputs`): `LegacyPickingManager`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L18)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### shaderInputs[​](#shaderinputs "Direct link to shaderInputs")

[`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)

#### Returns[​](#returns "Direct link to Returns")

`LegacyPickingManager`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> **device**: `Device`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L14)

***

### framebuffer[​](#framebuffer "Direct link to framebuffer")

> **framebuffer**: `Framebuffer` | `null` = `null`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L15)

***

### shaderInputs[​](#shaderinputs-1 "Direct link to shaderInputs")

> **shaderInputs**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)<{ `picking`: `PickingProps`; }>

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L16)

## Methods[​](#methods "Direct link to Methods")

### beginRenderPass()[​](#beginrenderpass "Direct link to beginRenderPass()")

> **beginRenderPass**(): `RenderPass`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L43)

Prepare for rendering picking colors

#### Returns[​](#returns-1 "Direct link to Returns")

`RenderPass`

***

### clearPickState()[​](#clearpickstate "Direct link to clearPickState()")

> **clearPickState**(): `void`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L38)

Clear highlighted / picked object

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L23)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### getFramebuffer()[​](#getframebuffer "Direct link to getFramebuffer()")

> **getFramebuffer**(): `Framebuffer`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L27)

#### Returns[​](#returns-4 "Direct link to Returns")

`Framebuffer`

***

### getPickPosition()[​](#getpickposition "Direct link to getPickPosition()")

> **getPickPosition**(`mousePosition`): \[`number`, `number`]

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L93)

Get pick position in device pixel range use the center pixel location in device pixel range

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### mousePosition[​](#mouseposition "Direct link to mousePosition")

\[`number`, `number`]

#### Returns[​](#returns-5 "Direct link to Returns")

\[`number`, `number`]

***

### updatePickState()[​](#updatepickstate "Direct link to updatePickState()")

> **updatePickState**(`mousePosition`): `void`

Defined in: [modules/engine/src/modules/picking/legacy-picking-manager.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/legacy-picking-manager.ts#L58)

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### mousePosition[​](#mouseposition-1 "Direct link to mousePosition")

\[`number`, `number`]

#### Returns[​](#returns-6 "Direct link to Returns")

`void`
