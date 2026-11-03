# Type Alias: CloudUniforms

> **CloudUniforms** = `object`

Defined in: [modules/lighting/clouds/clouds.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L8)

## Properties[​](#properties "Direct link to Properties")

### altitude[​](#altitude "Direct link to altitude")

> **altitude**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L12)

Bottom and thickness of the cloud slab, in metres above the coordinate origin.

***

### cover[​](#cover "Direct link to cover")

> **cover**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L10)

Fractional cloud cover, from clear (0) to overcast (1).

***

### density[​](#density "Direct link to density")

> **density**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:17](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L17)

Extinction coefficient, in inverse metres.

***

### scale[​](#scale "Direct link to scale")

> **scale**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:15](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L15)

Horizontal size of cloud formations, in metres.

***

### sunColor[​](#suncolor "Direct link to sunColor")

> **sunColor**: \[`number`, `number`, `number`]

Defined in: [modules/lighting/clouds/clouds.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L25)

Linear sunlight tint.

***

### sunDirection[​](#sundirection "Direct link to sunDirection")

> **sunDirection**: \[`number`, `number`, `number`]

Defined in: [modules/lighting/clouds/clouds.ts:23](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L23)

Direction toward the sun in east/north/up coordinates; nonzero.

***

### thickness[​](#thickness "Direct link to thickness")

> **thickness**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L13)

***

### time[​](#time "Direct link to time")

> **time**: `number`

Defined in: [modules/lighting/clouds/clouds.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L19)

Elapsed seconds; callers own animation.

***

### velocity[​](#velocity "Direct link to velocity")

> **velocity**: \[`number`, `number`]

Defined in: [modules/lighting/clouds/clouds.ts:21](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L21)

East/north drift velocity in metres per second.
