# Type Alias: ResourceProps

> **ResourceProps** = `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L80)

## Properties[​](#properties "Direct link to Properties")

### handle?[​](#handle "Direct link to handle?")

> `optional` **handle?**: `unknown`

Defined in: [modules/core/src/adapter/resources/resource.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L84)

Handle for the underlying resources (WebGL object or WebGPU handle)

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/core/src/adapter/resources/resource.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L82)

Name of resource, mainly for debugging purposes. A unique name will be assigned if not provided

***

### userData?[​](#userdata "Direct link to userData?")

> `optional` **userData?**: `object`

Defined in: [modules/core/src/adapter/resources/resource.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/resources/resource.ts#L91)

User provided data stored on this resource

#### Index Signature[​](#index-signature "Direct link to Index Signature")

\[`key`: `string`]: `any`
