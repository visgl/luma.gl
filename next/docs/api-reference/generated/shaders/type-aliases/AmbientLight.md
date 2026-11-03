# Type Alias: AmbientLight

> **AmbientLight** = `object`

Defined in: [modules/lighting/lights/lighting.ts:25](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L25)

Ambient light contribution shared across the entire scene.

## Properties[​](#properties "Direct link to Properties")

### color?[​](#color "Direct link to color?")

> `optional` **color?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:29](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L29)

RGB light color in the existing `0..255` convention used by luma.gl materials.

***

### intensity?[​](#intensity "Direct link to intensity?")

> `optional` **intensity?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:31](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L31)

Scalar intensity multiplier applied to the light color.

***

### type[​](#type "Direct link to type")

> **type**: `"ambient"`

Defined in: [modules/lighting/lights/lighting.ts:27](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L27)

Discriminator used to identify ambient lights in `lights: Light[]`.
