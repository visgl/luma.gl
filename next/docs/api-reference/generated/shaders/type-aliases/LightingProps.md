# Type Alias: LightingProps

> **LightingProps** = `object`

Defined in: [modules/lighting/lights/lighting.ts:81](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L81)

Public JavaScript props accepted by the `lighting` shader module.

## Properties[​](#properties "Direct link to Properties")

### ~~ambientLight?~~[​](#ambientlight "Direct link to ambientlight")

> `optional` **ambientLight?**: [`AmbientLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/AmbientLight.md)

Defined in: [modules/lighting/lights/lighting.ts:92](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L92)

Legacy ambient-light prop.

#### Deprecated[​](#deprecated "Direct link to Deprecated")

Use `lights` with `{type: 'ambient', ...}` entries instead.

***

### ~~directionalLights?~~[​](#directionallights "Direct link to directionallights")

> `optional` **directionalLights?**: [`DirectionalLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/DirectionalLight.md)\[]

Defined in: [modules/lighting/lights/lighting.ts:107](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L107)

Legacy directional-light prop.

#### Deprecated[​](#deprecated-1 "Direct link to Deprecated")

Use `lights` with `{type: 'directional', ...}` entries instead.

***

### enabled?[​](#enabled "Direct link to enabled?")

> `optional` **enabled?**: `boolean`

Defined in: [modules/lighting/lights/lighting.ts:83](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L83)

Enables or disables lighting calculations for the module.

***

### lights?[​](#lights "Direct link to lights?")

> `optional` **lights?**: [`Light`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/Light.md)\[]

Defined in: [modules/lighting/lights/lighting.ts:87](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L87)

Preferred API for supplying mixed ambient, point, spot, directional, rectangle, and disk lights.

***

### ~~pointLights?~~[​](#pointlights "Direct link to pointlights")

> `optional` **pointLights?**: [`PointLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PointLight.md)\[]

Defined in: [modules/lighting/lights/lighting.ts:97](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L97)

Legacy point-light prop.

#### Deprecated[​](#deprecated-2 "Direct link to Deprecated")

Use `lights` with `{type: 'point', ...}` entries instead.

***

### ~~spotLights?~~[​](#spotlights "Direct link to spotlights")

> `optional` **spotLights?**: [`SpotLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SpotLight.md)\[]

Defined in: [modules/lighting/lights/lighting.ts:102](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L102)

Legacy spot-light prop.

#### Deprecated[​](#deprecated-3 "Direct link to Deprecated")

Use `lights` with `{type: 'spot', ...}` entries instead.

***

### useByteColors?[​](#usebytecolors "Direct link to useByteColors?")

> `optional` **useByteColors?**: `boolean`

Defined in: [modules/lighting/lights/lighting.ts:85](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L85)

When true, light colors are interpreted as byte-style 0-255 values.
