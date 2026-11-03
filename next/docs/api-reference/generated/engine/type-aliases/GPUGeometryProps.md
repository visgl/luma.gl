# Type Alias: GPUGeometryProps

> **GPUGeometryProps** = `object`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L13)

Properties used to create a [GPUGeometry](https://luma.gl/next/docs/api-reference/generated/engine/classes/GPUGeometry.md).

## Properties[​](#properties "Direct link to Properties")

### attributes[​](#attributes "Direct link to attributes")

> **attributes**: `Record`<`string`, `Buffer`>

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:30](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L30)

GPU vertex buffers, keyed by buffer layout name.

***

### bufferLayout[​](#bufferlayout "Direct link to bufferLayout")

> **bufferLayout**: `BufferLayout`\[]

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:24](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L24)

Buffer layout matching the supplied GPU vertex buffers.

***

### id?[​](#id "Direct link to id?")

> `optional` **id?**: `string`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L15)

Application-provided identifier.

***

### indices?[​](#indices "Direct link to indices?")

> `optional` **indices?**: `Buffer` | `null`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L27)

Optional GPU index buffer.

***

### topology[​](#topology "Direct link to topology")

> **topology**: `"point-list"` | `"line-list"` | `"line-strip"` | `"triangle-list"` | `"triangle-strip"`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L18)

Determines how vertices are assembled into primitives.

***

### vertexCount[​](#vertexcount "Direct link to vertexCount")

> **vertexCount**: `number`

Defined in: [modules/engine/src/geometry/gpu-geometry.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/gpu-geometry.ts#L21)

Draw vertex count.
