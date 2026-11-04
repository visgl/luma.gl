# Type Alias: LightingUniforms

> **LightingUniforms** = `object`

Defined in: [modules/lighting/lights/lighting.ts:125](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L125)

Fully normalized uniform values produced by the `lighting` shader module.

## Properties[​](#properties "Direct link to Properties")

### ambientColor[​](#ambientcolor "Direct link to ambientColor")

> **ambientColor**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:135](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L135)

Accumulated ambient color converted to normalized shader-space RGB.

***

### areaLightCount[​](#arealightcount "Direct link to areaLightCount")

> **areaLightCount**: `number`

Defined in: [modules/lighting/lights/lighting.ts:138](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L138)

***

### areaLights[​](#arealights "Direct link to areaLights")

> **areaLights**: readonly `AreaLightUniform`\[]

Defined in: [modules/lighting/lights/lighting.ts:139](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L139)

***

### directionalLightCount[​](#directionallightcount "Direct link to directionalLightCount")

> **directionalLightCount**: `number`

Defined in: [modules/lighting/lights/lighting.ts:129](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L129)

Number of packed directional lights in the `lights` array.

***

### enabled[​](#enabled "Direct link to enabled")

> **enabled**: `number`

Defined in: [modules/lighting/lights/lighting.ts:127](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L127)

`1` when lighting is enabled, otherwise `0`.

***

### lights[​](#lights "Direct link to lights")

> **lights**: `ReadonlyArray`<[`LightingLightUniform`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/LightingLightUniform.md)>

Defined in: [modules/lighting/lights/lighting.ts:137](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L137)

Packed trailing array of non-ambient light structs.

***

### pointLightCount[​](#pointlightcount "Direct link to pointLightCount")

> **pointLightCount**: `number`

Defined in: [modules/lighting/lights/lighting.ts:131](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L131)

Number of packed point lights in the `lights` array.

***

### spotLightCount[​](#spotlightcount "Direct link to spotLightCount")

> **spotLightCount**: `number`

Defined in: [modules/lighting/lights/lighting.ts:133](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L133)

Number of packed spot lights in the `lights` array.
