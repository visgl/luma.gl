# Type Alias: AttributeInfo

> **AttributeInfo** = `object`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L16)

Resolved info for a buffer / attribute combination to help backend configure it correctly

## Properties[​](#properties "Direct link to Properties")

### attributeName[​](#attributename "Direct link to attributeName")

> **attributeName**: `string`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L18)

Attribute name

***

### bufferComponents[​](#buffercomponents "Direct link to bufferComponents")

> **bufferComponents**: `1` | `2` | `3` | `4`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L37)

Components refer to the number of components in the buffer's vertex format

***

### bufferDataType[​](#bufferdatatype "Direct link to bufferDataType")

> **bufferDataType**: [`NormalizedDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/NormalizedDataType.md)

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L35)

Memory data type refers to the data type in the buffer

***

### bufferName[​](#buffername "Direct link to bufferName")

> **bufferName**: `string`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L31)

BufferName

***

### byteOffset[​](#byteoffset "Direct link to byteOffset")

> **byteOffset**: `number`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L45)

The byteOffset is encoded in or calculated from the buffer layout

***

### byteStride[​](#bytestride "Direct link to byteStride")

> **byteStride**: `number`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:47](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L47)

The byteStride is encoded in or calculated from the buffer layout

***

### integer[​](#integer "Direct link to integer")

> **integer**: `boolean`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L28)

It is the shader attribute declaration that determines whether GPU will process as integer or float

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L20)

Location in shader

***

### normalized[​](#normalized "Direct link to normalized")

> **normalized**: `boolean`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L39)

Normalization is encoded in the buffer layout's vertex format...

***

### primitiveType[​](#primitivetype "Direct link to primitiveType")

> **primitiveType**: [`PrimitiveDataType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/PrimitiveDataType.md)

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L24)

Calculations are done in this type in the shader's attribute declaration

***

### shaderComponents[​](#shadercomponents "Direct link to shaderComponents")

> **shaderComponents**: `1` | `2` | `3` | `4`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L26)

Components refer to the number of components in the shader's attribute declaration

***

### shaderType[​](#shadertype "Direct link to shaderType")

> **shaderType**: [`AttributeShaderType`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/AttributeShaderType.md)

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L22)

Type / precision used in shader (buffer values may be converted)

***

### stepMode[​](#stepmode "Direct link to stepMode")

> **stepMode**: `"vertex"` | `"instance"`

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:42](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L42)

If not specified, the step mode is inferred from the attribute name in the shader (contains string instance)

***

### vertexFormat[​](#vertexformat "Direct link to vertexFormat")

> **vertexFormat**: [`VertexFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

Defined in: [modules/core/src/adapter-utils/get-attribute-from-layouts.ts:33](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/get-attribute-from-layouts.ts#L33)

Format of buffer data
