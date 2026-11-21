# Type Alias: DeviceResourceProps

> **DeviceResourceProps** = `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L81)

## Properties[​](#properties "Direct link to Properties")

### handle?[​](#handle "Direct link to handle?")

> `optional` **handle?**: `unknown`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L85)

Handle for the underlying resources (WebGL object or WebGPU handle)

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L83)

Name of resource, mainly for debugging purposes. A unique name will be assigned if not provided

***

### userData?[​](#userdata "Direct link to userData?")

> `optional` **userData?**: `object`

Defined in: [modules/core/src/api/adapter/resources/device-resource.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/core/src/api/adapter/resources/device-resource.ts#L92)

User provided data stored on this resource

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `unknown`
