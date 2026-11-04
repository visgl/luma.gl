# Type Alias: MakeEdgeGeometryOptions

> **MakeEdgeGeometryOptions** = `object`

Defined in: [modules/engine/src/geometry/edge-geometry.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L10)

## Properties[​](#properties "Direct link to Properties")

### angleThreshold?[​](#anglethreshold "Direct link to angleThreshold?")

> `optional` **angleThreshold?**: `number`

Defined in: [modules/engine/src/geometry/edge-geometry.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L14)

Minimum angle between adjacent face normals, in degrees. Defaults to 30.

***

### includeCoplanarEdges?[​](#includecoplanaredges "Direct link to includeCoplanarEdges?")

> `optional` **includeCoplanarEdges?**: `boolean`

Defined in: [modules/engine/src/geometry/edge-geometry.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L12)

Keep coplanar internal edges to inspect the original triangulation. Defaults to false.

***

### positionAttribute?[​](#positionattribute "Direct link to positionAttribute?")

> `optional` **positionAttribute?**: `string`

Defined in: [modules/engine/src/geometry/edge-geometry.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L18)

Packed three-component CPU position attribute. Defaults to POSITION.

***

### weldTolerance?[​](#weldtolerance "Direct link to weldTolerance?")

> `optional` **weldTolerance?**: `number`

Defined in: [modules/engine/src/geometry/edge-geometry.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/geometry/edge-geometry.ts#L16)

Position welding distance in source units. Zero (default) welds exact duplicates.
