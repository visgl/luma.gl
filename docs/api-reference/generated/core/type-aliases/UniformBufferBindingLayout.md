# Type Alias: UniformBufferBindingLayout

> **UniformBufferBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L80)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L85)

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L90)

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L87)

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:91](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L91)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L83)

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"uniform"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L81)

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: [`UniformInfo`](https://luma.gl/docs/api-reference/generated/core/type-aliases/UniformInfo.md)\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:93](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L93)

The uniforms in this uniform buffer

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L89)

Which shader stages can access this binding
