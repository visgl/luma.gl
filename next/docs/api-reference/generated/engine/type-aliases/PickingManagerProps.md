# Type Alias: PickingManagerProps

> **PickingManagerProps** = `object`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L36)

## Properties[​](#properties "Direct link to Properties")

### ~~backend?~~[​](#backend "Direct link to backend")

> `optional` **backend?**: [`PickingBackend`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingBackend.md)

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L49)

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use `mode`.

***

### getTooltip?[​](#gettooltip "Direct link to getTooltip?")

> `optional` **getTooltip?**: (`info`) => [`PickingTooltip`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingTooltip.md)

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L45)

Returns tooltip text for the latest pick result. Returning `null` hides the tooltip.

#### Parameters[​](#parameters "Direct link to Parameters")

##### info[​](#info "Direct link to info")

[`PickInfo`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickInfo.md)

#### Returns[​](#returns "Direct link to Returns")

[`PickingTooltip`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingTooltip.md)

***

### mode?[​](#mode "Direct link to mode?")

> `optional` **mode?**: [`PickingMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingMode.md)

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L47)

Select a picking mode. Defaults to `color`. Use `auto` to prefer `index` when supported.

***

### onObjectPicked?[​](#onobjectpicked "Direct link to onObjectPicked?")

> `optional` **onObjectPicked?**: (`info`) => `void`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:40](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L40)

Callback

#### Parameters[​](#parameters-1 "Direct link to Parameters")

##### info[​](#info-1 "Direct link to info")

[`PickInfo`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickInfo.md)

#### Returns[​](#returns-1 "Direct link to Returns")

`void`

***

### shaderInputs?[​](#shaderinputs "Direct link to shaderInputs?")

> `optional` **shaderInputs?**: [`ShaderInputs`](https://luma.gl/next/docs/api-reference/generated/engine/classes/ShaderInputs.md)<{ `picking`: *typeof* `pickingUniforms.props`; }>

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:38](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L38)

Shader inputs from models to pick
