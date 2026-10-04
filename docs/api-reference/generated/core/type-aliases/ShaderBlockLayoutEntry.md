# Type Alias: ShaderBlockLayoutEntry

> **ShaderBlockLayoutEntry** = `object`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L16)

Describes the packing for one flattened field in a shader block.

Offsets, sizes, and strides are expressed in 32-bit words so the result can be consumed directly by typed-array writers.

## Properties[​](#properties "Direct link to Properties")

### columns[​](#columns "Direct link to columns")

> **columns**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L24)

Number of matrix columns, or `1` for scalars and vectors.

***

### columnStride[​](#columnstride "Direct link to columnStride")

> **columnStride**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:28](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L28)

Distance between matrix columns in 32-bit words.

***

### components[​](#components "Direct link to components")

> **components**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:22](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L22)

Number of logical scalar components in the declared value.

***

### offset[​](#offset "Direct link to offset")

> **offset**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L18)

Offset in 32-bit words from the start of the block.

***

### rows[​](#rows "Direct link to rows")

> **rows**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L26)

Number of rows in each column, or vector length for vectors.

***

### shaderType[​](#shadertype "Direct link to shaderType")

> **shaderType**: [`VariableShaderType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/VariableShaderType.md)

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L30)

Canonical shader type after alias resolution.

***

### size[​](#size "Direct link to size")

> **size**: `number`

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:20](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L20)

Occupied size in 32-bit words, excluding external array stride.

***

### type[​](#type "Direct link to type")

> **type**: [`PrimitiveDataType`](https://luma.gl/docs/api-reference/generated/core/type-aliases/PrimitiveDataType.md)

Defined in: [modules/core/src/shadertypes/shader-types/shader-block-layout.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/core/src/shadertypes/shader-types/shader-block-layout.ts#L32)

Scalar data type used to write the value.
