# Type Alias: LogicalAttributeMapping

> **LogicalAttributeMapping** = `object`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L13)

Backend-agnostic attribute mapping derived from a shader layout and buffer layout.

## Properties[​](#properties "Direct link to Properties")

### attributeName[​](#attributename "Direct link to attributeName")

> **attributeName**: `string`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L15)

Attribute name from the shader layout.

***

### bufferName[​](#buffername "Direct link to bufferName")

> **bufferName**: `string`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L17)

Logical buffer name supplying this attribute.

***

### byteOffset[​](#byteoffset "Direct link to byteOffset")

> **byteOffset**: `number`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L23)

Byte offset of the attribute inside the logical buffer.

***

### byteStride[​](#bytestride "Direct link to byteStride")

> **byteStride**: `number`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L25)

Byte stride of the logical buffer.

***

### location[​](#location "Direct link to location")

> **location**: `number`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L19)

Attribute location in the shader.

***

### stepMode[​](#stepmode "Direct link to stepMode")

> **stepMode**: `"vertex"` | `"instance"`

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L27)

Step mode used when advancing the attribute.

***

### vertexFormat[​](#vertexformat "Direct link to vertexFormat")

> **vertexFormat**: [`VertexFormat`](https://luma.gl/next/docs/api-reference/generated/core/type-aliases/VertexFormat.md)

Defined in: [modules/core/src/adapter-utils/buffer-layout-utils.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/core/src/adapter-utils/buffer-layout-utils.ts#L21)

Vertex format used to read the attribute data.
