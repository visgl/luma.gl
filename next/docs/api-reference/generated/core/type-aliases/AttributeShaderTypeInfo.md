# Type Alias: AttributeShaderTypeInfo

> **AttributeShaderTypeInfo** = `object`

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:9

Information extracted from a AttributeShaderType constant

## Properties[​](#properties "Direct link to Properties")

### byteLength?[​](#bytelength "Direct link to byteLength?")

> `optional` **byteLength?**: `number`

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:15

Length in bytes of the data for one vertex

***

### components[​](#components "Direct link to components")

> **components**: `1` | `2` | `3` | `4`

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:13

Whether this is a normalized integer (that must be used as float)

***

### integer[​](#integer "Direct link to integer")

> **integer**: `boolean`

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:17

Whether this is for integer or float vert

***

### primitiveType[​](#primitivetype "Direct link to primitiveType")

> **primitiveType**: [`PrimitiveDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveDataType.md)

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:11

WGSL-style primitive data type, f32, i32, u32

***

### signed[​](#signed "Direct link to signed")

> **signed**: `boolean`

Defined in: modules/shaders/dist/types/shader-type-decoder.d.ts:19

Whether this data type is signed
