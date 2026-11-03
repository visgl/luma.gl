# Function: makeEdgeGeometryFromGeometries()

> **makeEdgeGeometryFromGeometries**(`geometries`, `options?`): [`Geometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Geometry.md)

Defined in: [modules/engine/src/geometry/edge-geometry.ts:144](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L144)

Classifies adjacent meshes together to suppress coplanar tile seams and duplicate edges.

## Parameters[​](#parameters "Direct link to Parameters")

### geometries[​](#geometries "Direct link to geometries")

readonly `Geometry`\[]

### options?[​](#options "Direct link to options?")

[`MakeEdgeGeometryOptions`](https://luma.gl/next/docs/api-reference/generated/engine/type-aliases/MakeEdgeGeometryOptions.md) = `{}`

## Returns[​](#returns "Direct link to Returns")

[`Geometry`](https://luma.gl/next/docs/api-reference/generated/engine/classes/Geometry.md)
