# Function: makeInterleavedGeometry()

> **makeInterleavedGeometry**(`geometry`, `options?`): [`Geometry`](https://luma.gl/docs/api-reference/generated/engine/classes/Geometry.md)

Defined in: [modules/engine/src/geometry/geometry-utils.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/geometry-utils.ts#L52)

Packs a CPU [Geometry](https://luma.gl/docs/api-reference/generated/engine/classes/Geometry.md) into one interleaved vertex buffer.

The returned value is a normal `Geometry` whose `attributes` contains one packed typed array, and whose `bufferLayout` maps that packed buffer back to the original shader attributes. Calling this function on an already interleaved geometry with the same `bufferName` is idempotent and returns the original instance.

## Parameters[​](#parameters "Direct link to Parameters")

### geometry[​](#geometry "Direct link to geometry")

`Geometry` & `object`

### options?[​](#options "Direct link to options?")

[`MakeInterleavedGeometryOptions`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/MakeInterleavedGeometryOptions.md) = `{}`

## Returns[​](#returns "Direct link to Returns")

[`Geometry`](https://luma.gl/docs/api-reference/generated/engine/classes/Geometry.md)
