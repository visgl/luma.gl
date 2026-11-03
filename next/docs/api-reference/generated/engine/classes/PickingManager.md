# Class: PickingManager

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L105)

Helper class for using object picking with backend-specific readback.

## Todo[​](#todo "Direct link to Todo")

Support multiple models

## Todo[​](#todo-1 "Direct link to Todo")

Switching picking module

## Constructors[​](#constructors "Direct link to Constructors")

### Constructor[​](#constructor "Direct link to Constructor")

> **new PickingManager**(`device`, `props`): `PickingManager`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:126](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L126)

#### Parameters[​](#parameters "Direct link to Parameters")

##### device[​](#device "Direct link to device")

`Device`

##### props[​](#props "Direct link to props")

[`PickingManagerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingManagerProps.md)

#### Returns[​](#returns "Direct link to Returns")

`PickingManager`

## Properties[​](#properties "Direct link to Properties")

### device[​](#device-1 "Direct link to device")

> **device**: `Device`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:106](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L106)

***

### framebuffer[​](#framebuffer "Direct link to framebuffer")

> **framebuffer**: `Framebuffer` | `null` = `null`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:112](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L112)

Framebuffer used for picking

***

### mode[​](#mode "Direct link to mode")

> **mode**: [`ResolvedPickingMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ResolvedPickingMode.md)

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:108](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L108)

***

### pickInfo[​](#pickinfo "Direct link to pickInfo")

> **pickInfo**: [`PickInfo`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickInfo.md)

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:110](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L110)

Info from latest pick operation

***

### props[​](#props-1 "Direct link to props")

> **props**: `Required`<[`PickingManagerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingManagerProps.md)>

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L107)

***

### defaultProps[​](#defaultprops "Direct link to defaultProps")

> `static` **defaultProps**: `Required`<[`PickingManagerProps`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingManagerProps.md)>

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:118](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L118)

## Methods[​](#methods "Direct link to Methods")

### beginRenderPass()[​](#beginrenderpass "Direct link to beginRenderPass()")

> **beginRenderPass**(): `RenderPass`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:188](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L188)

Prepare for rendering picking colors

#### Returns[​](#returns-1 "Direct link to Returns")

`RenderPass`

***

### clearPickState()[​](#clearpickstate "Direct link to clearPickState()")

> **clearPickState**(): `void`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L155)

Clear highlighted / picked object

#### Returns[​](#returns-2 "Direct link to Returns")

`void`

***

### destroy()[​](#destroy "Direct link to destroy()")

> **destroy**(): `void`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L139)

#### Returns[​](#returns-3 "Direct link to Returns")

`void`

***

### getFramebuffer()[​](#getframebuffer "Direct link to getFramebuffer()")

> **getFramebuffer**(): `Framebuffer`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L146)

#### Returns[​](#returns-4 "Direct link to Returns")

`Framebuffer`

***

### getPickPosition()[​](#getpickposition "Direct link to getPickPosition()")

> **getPickPosition**(`mousePosition`): \[`number`, `number`]

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:234](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L234)

Get pick position in device pixel range use the center pixel location in device pixel range

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### mousePosition[​](#mouseposition "Direct link to mousePosition")

\[`number`, `number`]

#### Returns[​](#returns-5 "Direct link to Returns")

\[`number`, `number`]

***

### shouldPick()[​](#shouldpick "Direct link to shouldPick()")

> **shouldPick**(`mousePosition`, `options?`): `mousePosition is [number, number]`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:162](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L162)

Return whether callers need to render a fresh picking pass for this cursor position.

#### Parameters[​](#parameters-2 "Direct link to Parameters")

##### mousePosition[​](#mouseposition-1 "Direct link to mousePosition")

\[`number`, `number`] | `null` | `undefined`

##### options?[​](#options "Direct link to options?")

[`PickingShouldPickOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingShouldPickOptions.md) = `{}`

#### Returns[​](#returns-6 "Direct link to Returns")

`mousePosition is [number, number]`

***

### updatePickInfo()[​](#updatepickinfo "Direct link to updatePickInfo()")

> **updatePickInfo**(`mousePosition`): `Promise`<[`PickInfo`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickInfo.md) | `null`>

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:207](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L207)

#### Parameters[​](#parameters-3 "Direct link to Parameters")

##### mousePosition[​](#mouseposition-2 "Direct link to mousePosition")

\[`number`, `number`]

#### Returns[​](#returns-7 "Direct link to Returns")

`Promise`<[`PickInfo`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickInfo.md) | `null`>
