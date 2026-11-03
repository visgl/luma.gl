# Type Alias: AttributeDeclaration

> **AttributeDeclaration** = `object`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:42

Declares one for attributes

## Properties[​](#properties "Direct link to Properties")

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:46

The index into the GPU's vertex array buffer bank (usually between 0-15)

***

### name[​](#name "Direct link to name")

> **name**: `string`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:44

The name of this attribute in the shader

***

### stepMode?[​](#stepmode "Direct link to stepMode?")

> `optional` **stepMode?**: `"vertex"` | `"instance"`

Defined in: modules/shaders/dist/types/shader-layout.d.ts:50

Inferred from attribute name.

#### Note[​](#note "Direct link to Note")

Technically not part of static structure of shader

***

### type[​](#type "Direct link to type")

> **type**: [`AttributeShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/AttributeShaderType.md)

Defined in: modules/shaders/dist/types/shader-layout.d.ts:48

WebGPU-style shader type. The declared format of the attribute in the shader code. Buffer's vertex format needs to map to this.
