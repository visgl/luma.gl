# Function: makeStrokeGeometry()

> **makeStrokeGeometry**(`path`, `options?`): [`Geometry`](https://luma.gl/docs/api-reference/generated/engine/classes/Geometry.md)

Defined in: [modules/engine/src/geometry/stroke-geometry.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/stroke-geometry.ts#L32)

Triangulates a local XY stroke; optional source elevations are preserved at each path vertex.

## Parameters[​](#parameters "Direct link to Parameters")

### path[​](#path "Direct link to path")

readonly [`StrokePosition`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/StrokePosition.md)\[]

### options?[​](#options "Direct link to options?")

[`StrokeGeometryOptions`](https://luma.gl/docs/api-reference/generated/engine/type-aliases/StrokeGeometryOptions.md) = `{}`

## Returns[​](#returns "Direct link to Returns")

[`Geometry`](https://luma.gl/docs/api-reference/generated/engine/classes/Geometry.md)
