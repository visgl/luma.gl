# Type Alias: DeviceLostInfo

> **DeviceLostInfo** = `object`

Defined in: [modules/core/src/adapter/device.ts:103](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L103)

Information supplied when a device is lost.

The reason values intentionally mirror WebGPU. `destroyed` means an application-initiated loss and `unknown` means any unexpected or platform-initiated loss. The message is diagnostic text and must not be parsed by applications.

## Properties[​](#properties "Direct link to Properties")

### message[​](#message "Direct link to message")

> `readonly` **message**: `string`

Defined in: [modules/core/src/adapter/device.ts:105](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L105)

***

### reason[​](#reason "Direct link to reason")

> `readonly` **reason**: `"unknown"` | `"destroyed"`

Defined in: [modules/core/src/adapter/device.ts:104](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/device.ts#L104)
