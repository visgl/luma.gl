# Type Alias: MakeInterleavedGeometryOptions

> **MakeInterleavedGeometryOptions** = `object`

Defined in: [modules/engine/src/geometry/geometry-utils.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-utils.ts#L19)

Options for [makeInterleavedGeometry](https://luma.gl/docs/api-reference/generated/engine/functions/makeInterleavedGeometry.md).

## Properties[​](#properties "Direct link to Properties")

### attributes?[​](#attributes "Direct link to attributes?")

> `optional` **attributes?**: `string`\[]

Defined in: [modules/engine/src/geometry/geometry-utils.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-utils.ts#L24)

Attribute names to pack. Defaults to all non-index geometry attributes.

***

### bufferName?[​](#buffername "Direct link to bufferName?")

> `optional` **bufferName?**: `string`

Defined in: [modules/engine/src/geometry/geometry-utils.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-utils.ts#L21)

Name of the packed geometry buffer. Defaults to `geometry`.

***

### minAttributeAlignment?[​](#minattributealignment "Direct link to minAttributeAlignment?")

> `optional` **minAttributeAlignment?**: `number`

Defined in: [modules/engine/src/geometry/geometry-utils.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-utils.ts#L31)

Minimum byte alignment for each packed attribute and for the final byte stride.

Defaults to 4 bytes, matching WebGPU and WebGL vertex-buffer alignment constraints.
