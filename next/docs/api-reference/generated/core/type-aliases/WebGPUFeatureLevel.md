# Type Alias: WebGPUFeatureLevel

> **WebGPUFeatureLevel** = `"core"` | `"max"` | `"compatibility"` | `"best-available"`

Defined in: [modules/core/src/adapter/device.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L86)

WebGPU feature/limit profile requested during device creation.

* `'core'` requests the portable WebGPU core profile.
* `'max'` requests every adapter feature and supported limit that luma.gl can forward.
* `'compatibility'` requests WebGPU compatibility mode.
* `'best-available'` requests compatibility mode, then upgrades to core when available.
