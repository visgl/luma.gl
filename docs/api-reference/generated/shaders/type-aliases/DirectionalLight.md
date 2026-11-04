# Type Alias: DirectionalLight

> **DirectionalLight** = `object`

Defined in: [modules/lighting/lights/lighting.ts:49](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L49)

Directional light defined only by its incoming world-space direction.

## Properties[​](#properties "Direct link to Properties")

### color?[​](#color "Direct link to color?")

> `optional` **color?**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L55)

RGB light color in the existing `0..255` convention used by luma.gl materials.

***

### direction[​](#direction "Direct link to direction")

> **direction**: `Readonly`<`NumberArray3`>

Defined in: [modules/lighting/lights/lighting.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L53)

World-space direction in which light travels.

***

### intensity?[​](#intensity "Direct link to intensity?")

> `optional` **intensity?**: `number`

Defined in: [modules/lighting/lights/lighting.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L57)

Scalar intensity multiplier applied to the light color.

***

### type[​](#type "Direct link to type")

> **type**: `"directional"`

Defined in: [modules/lighting/lights/lighting.ts:51](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L51)

Discriminator used to identify directional lights in `lights: Light[]`.
