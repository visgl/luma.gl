# Type Alias: SamplerBindingLayout

> **SamplerBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:146](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L146)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:151](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L151)

Bind group index. Always 0 in WebGL

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:153](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L153)

Binding index within the bind group

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:149](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L149)

Name of the binding. Used by luma to map bindings by name

***

### samplerType?[​](#samplertype "Direct link to samplerType?")

> `optional` **samplerType?**: `"filtering"` | `"non-filtering"` | `"comparison"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:156](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L156)

***

### type[​](#type "Direct link to type")

> **type**: `"sampler"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:147](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L147)

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:155](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L155)

Which shader stages can access this binding
