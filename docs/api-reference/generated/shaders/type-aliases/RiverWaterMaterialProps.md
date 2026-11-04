# Type Alias: RiverWaterMaterialProps

> **RiverWaterMaterialProps** = `object`

Defined in: [modules/lighting/water-material/river-water-material.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/water-material/river-water-material.ts#L9)

## Properties[​](#properties "Direct link to Properties")

### enabled?[​](#enabled "Direct link to enabled?")

> `optional` **enabled?**: `number`

Defined in: [modules/lighting/water-material/river-water-material.ts:10](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/water-material/river-water-material.ts#L10)

***

### flowDirection?[​](#flowdirection "Direct link to flowDirection?")

> `optional` **flowDirection?**: \[`number`, `number`]

Defined in: [modules/lighting/water-material/river-water-material.ts:12](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/water-material/river-water-material.ts#L12)

Local east/north direction of river flow.

***

### skyUpDirection?[​](#skyupdirection "Direct link to skyUpDirection?")

> `optional` **skyUpDirection?**: \[`number`, `number`, `number`]

Defined in: [modules/lighting/water-material/river-water-material.ts:16](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/water-material/river-water-material.ts#L16)

Unit up direction in the same coordinate frame as the supplied surface normal.

***

### skyZenithColor?[​](#skyzenithcolor "Direct link to skyZenithColor?")

> `optional` **skyZenithColor?**: \[`number`, `number`, `number`]

Defined in: [modules/lighting/water-material/river-water-material.ts:14](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/water-material/river-water-material.ts#L14)

Linear sky tint above the horizon. The horizon uses waterMaterial.fresnelColor.
