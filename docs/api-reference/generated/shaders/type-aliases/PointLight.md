# Type Alias: PointLight

> **PointLight** = `object`

Defined in: [modules/lighting/lights/lighting.ts:35](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L35)

Omnidirectional point light emitted from a world-space position.

## Properties[​](#properties "Direct link to Properties")

### attenuation?[​](#attenuation "Direct link to attenuation?")

> `optional` **attenuation?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L45)

Constant, linear, and quadratic attenuation coefficients.

***

### color?[​](#color "Direct link to color?")

> `optional` **color?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:41](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L41)

RGB light color in the existing `0..255` convention used by luma.gl materials.

***

### intensity?[​](#intensity "Direct link to intensity?")

> `optional` **intensity?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:43](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L43)

Scalar intensity multiplier applied to the light color.

***

### position[​](#position "Direct link to position")

> **position**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:39](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L39)

World-space light position.

***

### type[​](#type "Direct link to type")

> **type**: `"point"`

Defined in: [modules/lighting/lights/lighting.ts:37](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L37)

Discriminator used to identify point lights in `lights: Light[]`.
