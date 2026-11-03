# Type Alias: AreaLight

> **AreaLight** = `object`

Defined in: [modules/lighting/area-lighting/area-light-types.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L9)

A uniformly emitting, one-sided rectangle or disk in world space.

## Properties[​](#properties "Direct link to Properties")

### color?[​](#color "Direct link to color?")

> `optional` **color?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/area-lighting/area-light-types.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L17)

***

### halfAxisX[​](#halfaxisx "Direct link to halfAxisX")

> **halfAxisX**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/area-lighting/area-light-types.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L13)

Orthogonal world-space half-extent vectors; disk vectors represent radii.

***

### halfAxisY[​](#halfaxisy "Direct link to halfAxisY")

> **halfAxisY**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/area-lighting/area-light-types.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L14)

***

### intensity?[​](#intensity "Direct link to intensity?")

> `optional` **intensity?**: `number`

Defined in: [modules/lighting/area-lighting/area-light-types.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L19)

Luminance in nits (cd/m²), independent of surface area.

***

### normal[​](#normal "Direct link to normal")

> **normal**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/area-lighting/area-light-types.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L16)

World-space emitting normal, corresponding to local -Z.

***

### position[​](#position "Direct link to position")

> **position**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/area-lighting/area-light-types.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L11)

***

### type[​](#type "Direct link to type")

> **type**: `"rect"` | `"disk"`

Defined in: [modules/lighting/area-lighting/area-light-types.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/area-lighting/area-light-types.ts#L10)
