# Type Alias: LightingLightUniform

> **LightingLightUniform** = `object`

Defined in: [modules/lighting/lights/lighting.ts:111](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L111)

Packed per-light data written into the module's fixed-size uniform array.

## Properties[​](#properties "Direct link to Properties")

### attenuation[​](#attenuation "Direct link to attenuation")

> **attenuation**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:119](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L119)

Constant, linear, and quadratic attenuation coefficients.

***

### color[​](#color "Direct link to color")

> **color**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:113](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L113)

Light color converted to normalized shader-space RGB.

***

### coneCos[​](#conecos "Direct link to coneCos")

> **coneCos**: `Readonly`<`NumberArray2`>

Defined in: [modules/lighting/lights/lighting.ts:121](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L121)

Cosines of the inner and outer spotlight cone angles.

***

### direction[​](#direction "Direct link to direction")

> **direction**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:117](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L117)

World-space light direction or a default placeholder for positional lights.

***

### position[​](#position "Direct link to position")

> **position**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:115](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L115)

World-space light position or a default placeholder for non-positional lights.
