# Type Alias: TorusGeometryProps

> **TorusGeometryProps** = `PrimitiveGeometryProps` & `object`

Defined in: node\_modules/@math.gl/geometry/dist/parametric/torus-geometry.d.ts:3

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### arc?[​](#arc "Direct link to arc?")

> `optional` **arc?**: `number`

Sweep in radians, (0, 2π]. Partial sweeps have open ends unless cap is enabled.

### cap?[​](#cap "Direct link to cap?")

> `optional` **cap?**: `boolean`

Close partial sweeps with flat end disks. Ignored for a full revolution.

### majorRadius?[​](#majorradius "Direct link to majorRadius?")

> `optional` **majorRadius?**: `number`

### majorSegments?[​](#majorsegments "Direct link to majorSegments?")

> `optional` **majorSegments?**: `number`

### minorRadius?[​](#minorradius "Direct link to minorRadius?")

> `optional` **minorRadius?**: `number`

### minorSegments?[​](#minorsegments "Direct link to minorSegments?")

> `optional` **minorSegments?**: `number`

### startAngle?[​](#startangle "Direct link to startAngle?")

> `optional` **startAngle?**: `number`

Rotation in radians about Y; positive angles turn toward negative Z.
