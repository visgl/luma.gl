# Type Alias: PBRShadowProps

> **PBRShadowProps** = `object`

Defined in: [modules/lighting/pbr-shadow/pbr-shadow.ts:9](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-shadow/pbr-shadow.ts#L9)

## Properties[​](#properties "Direct link to Properties")

### enabled?[​](#enabled "Direct link to enabled?")

> `optional` **enabled?**: `boolean`

Defined in: [modules/lighting/pbr-shadow/pbr-shadow.ts:13](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-shadow/pbr-shadow.ts#L13)

Toggle receiving while retaining allocated maps and bindings. Defaults to true.

***

### viewMatrix?[​](#viewmatrix "Direct link to viewMatrix?")

> `optional` **viewMatrix?**: `Readonly`<`NumberArray16`>

Defined in: [modules/lighting/pbr-shadow/pbr-shadow.ts:11](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-shadow/pbr-shadow.ts#L11)

Receiver camera view matrix, used for directional cascade selection.
