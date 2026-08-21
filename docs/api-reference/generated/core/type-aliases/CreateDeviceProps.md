# Type Alias: CreateDeviceProps

> **CreateDeviceProps** = `object` & [`DeviceProps`](https://luma.gl/docs/api-reference/generated/core/type-aliases/DeviceProps.md)

Defined in: [modules/core/src/adapter/luma.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/luma.ts#L23)

Properties for creating a new device

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### adapters?[​](#adapters "Direct link to adapters?")

> `optional` **adapters?**: [`Adapter`](https://luma.gl/docs/api-reference/generated/core/classes/Adapter.md)\[]

List of adapters. Will also search any pre-registered adapters

### type?[​](#type "Direct link to type?")

> `optional` **type?**: `"webgl"` | `"webgpu"` | `"null"` | `"unknown"` | `"best-available"`

Selects the type of device. `best-available` uses webgpu if available, then webgl.

### waitForPageLoad?[​](#waitforpageload "Direct link to waitForPageLoad?")

> `optional` **waitForPageLoad?**: `boolean`

Whether to wait for page to be loaded so that CanvasContext's can access the DOM. The browser only supports one 'load' event listener so it may be necessary for the application to set this to false to avoid conflicts.
