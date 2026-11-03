# ~~Variable: resolvePickingBackend~~

> `const` **resolvePickingBackend**: (`deviceType`, `mode`, `indexPickingSupported`) => [`ResolvedPickingMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ResolvedPickingMode.md) = `resolvePickingMode`

Defined in: [modules/engine/src/modules/picking/picking-manager.ts:78](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/modules/picking/picking-manager.ts#L78)

## Parameters[​](#parameters "Direct link to Parameters")

### deviceType[​](#devicetype "Direct link to deviceType")

`"webgl"` | `"webgpu"` | `"null"` | `"unknown"`

### mode?[​](#mode "Direct link to mode?")

[`PickingMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/PickingMode.md) = `'color'`

### indexPickingSupported?[​](#indexpickingsupported "Direct link to indexPickingSupported?")

`boolean` = `...`

## Returns[​](#returns "Direct link to Returns")

[`ResolvedPickingMode`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/ResolvedPickingMode.md)

## Deprecated[​](#deprecated "Direct link to Deprecated")

Use `resolvePickingMode`.
