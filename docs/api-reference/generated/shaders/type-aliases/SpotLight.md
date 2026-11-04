# Type Alias: SpotLight

> **SpotLight** = `object`

Defined in: [modules/lighting/lights/lighting.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L61)

Cone-shaped light emitted from a position and focused along a direction.

## Properties[​](#properties "Direct link to Properties")

### attenuation?[​](#attenuation "Direct link to attenuation?")

> `optional` **attenuation?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:73](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L73)

Constant, linear, and quadratic attenuation coefficients.

***

### color?[​](#color "Direct link to color?")

> `optional` **color?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:69](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L69)

RGB light color in the existing `0..255` convention used by luma.gl materials.

***

### direction[​](#direction "Direct link to direction")

> **direction**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L67)

World-space light direction.

***

### innerConeAngle?[​](#innerconeangle "Direct link to innerConeAngle?")

> `optional` **innerConeAngle?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:75](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L75)

Inner spotlight cone angle in radians.

***

### intensity?[​](#intensity "Direct link to intensity?")

> `optional` **intensity?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:71](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L71)

Scalar intensity multiplier applied to the light color.

***

### outerConeAngle?[​](#outerconeangle "Direct link to outerConeAngle?")

> `optional` **outerConeAngle?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:77](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L77)

Outer spotlight cone angle in radians.

***

### position[​](#position "Direct link to position")

> **position**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L65)

World-space light position.

***

### type[​](#type "Direct link to type")

> **type**: `"spot"`

Defined in: [modules/lighting/lights/lighting.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L63)

Discriminator used to identify spot lights in `lights: Light[]`.
