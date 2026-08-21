# Type Alias: UniformBufferBindingLayout

> **UniformBufferBindingLayout** = `object`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:79](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L79)

## Properties[​](#properties "Direct link to Properties")

### group[​](#group "Direct link to group")

> **group**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:84](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L84)

Bind group index. Always 0 in WebGL

***

### hasDynamicOffset?[​](#hasdynamicoffset "Direct link to hasDynamicOffset?")

> `optional` **hasDynamicOffset?**: `boolean`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:89](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L89)

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:86](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L86)

Binding index within the bind group

***

### minBindingSize?[​](#minbindingsize "Direct link to minBindingSize?")

> `optional` **minBindingSize?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:90](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L90)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:82](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L82)

Name of the binding. Used by luma to map bindings by name

***

### type[​](#type "Direct link to type")

> **type**: `"uniform"`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L80)

***

### uniforms?[​](#uniforms "Direct link to uniforms?")

> `optional` **uniforms?**: `UniformInfo`\[]

Defined in: [modules/core/src/adapter/types/shader-layout.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L92)

The uniforms in this uniform buffer

***

### visibility?[​](#visibility "Direct link to visibility?")

> `optional` **visibility?**: `number`

Defined in: [modules/core/src/adapter/types/shader-layout.ts:88](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter/types/shader-layout.ts#L88)

Which shader stages can access this binding
