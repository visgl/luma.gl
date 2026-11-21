# Type Alias: ShadowProps\<TextureT, SamplerT>

> **ShadowProps**<`TextureT`, `SamplerT`> = `object`

Defined in: [modules/lighting/shadow/shadow-types.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L52)

Fully resolved props returned by the renderer and consumed by the `shadow` shader module.

## Type Parameters[​](#type-parameters "Direct link to Type Parameters")

### TextureT[​](#texturet "Direct link to TextureT")

`TextureT` *extends* [`ShadowTexture`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShadowTexture.md) = [`ShadowTexture`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ShadowTexture.md)

### SamplerT[​](#samplert "Direct link to SamplerT")

`SamplerT` = `unknown`

## Properties[​](#properties "Direct link to Properties")

### blockerSampleCount[​](#blockersamplecount "Direct link to blockerSampleCount")

> **blockerSampleCount**: `number`

Defined in: [modules/lighting/shadow/shadow-types.ts:56](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L56)

***

### cascadeCount[​](#cascadecount "Direct link to cascadeCount")

> **cascadeCount**: `number`

Defined in: [modules/lighting/shadow/shadow-types.ts:54](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L54)

***

### cascadeSplits[​](#cascadesplits "Direct link to cascadeSplits")

> **cascadeSplits**: readonly `number`\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:55](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L55)

***

### comparisonSampler[​](#comparisonsampler "Direct link to comparisonSampler")

> **comparisonSampler**: `SamplerT`

Defined in: [modules/lighting/shadow/shadow-types.ts:67](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L67)

***

### directionalLights[​](#directionallights "Direct link to directionalLights")

> **directionalLights**: readonly [`DirectionalShadowLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/DirectionalShadowLight.md)\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:58](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L58)

***

### directionalShadowTexture[​](#directionalshadowtexture "Direct link to directionalShadowTexture")

> **directionalShadowTexture**: `TextureT`

Defined in: [modules/lighting/shadow/shadow-types.ts:64](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L64)

***

### directionalViewProjectionMatrices[​](#directionalviewprojectionmatrices "Direct link to directionalViewProjectionMatrices")

> **directionalViewProjectionMatrices**: readonly `Readonly`<`Matrix4` | `NumberArray16`>\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:61](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L61)

***

### filterSampleCount[​](#filtersamplecount "Direct link to filterSampleCount")

> **filterSampleCount**: `number`

Defined in: [modules/lighting/shadow/shadow-types.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L57)

***

### nonFilteringSampler[​](#nonfilteringsampler "Direct link to nonFilteringSampler")

> **nonFilteringSampler**: `SamplerT`

Defined in: [modules/lighting/shadow/shadow-types.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L68)

***

### pointLights[​](#pointlights "Direct link to pointLights")

> **pointLights**: readonly [`PointShadowLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PointShadowLight.md)\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:60](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L60)

***

### pointShadowTexture[​](#pointshadowtexture "Direct link to pointShadowTexture")

> **pointShadowTexture**: `TextureT`

Defined in: [modules/lighting/shadow/shadow-types.ts:66](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L66)

***

### pointViewProjectionMatrices[​](#pointviewprojectionmatrices "Direct link to pointViewProjectionMatrices")

> **pointViewProjectionMatrices**: readonly `Readonly`<`Matrix4` | `NumberArray16`>\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:63](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L63)

***

### quality[​](#quality "Direct link to quality")

> **quality**: `"low"` | `"balanced"` | `"cinematic"`

Defined in: [modules/lighting/shadow/shadow-types.ts:53](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L53)

***

### spotLights[​](#spotlights "Direct link to spotLights")

> **spotLights**: readonly [`SpotShadowLight`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/SpotShadowLight.md)\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:59](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L59)

***

### spotShadowTexture[​](#spotshadowtexture "Direct link to spotShadowTexture")

> **spotShadowTexture**: `TextureT`

Defined in: [modules/lighting/shadow/shadow-types.ts:65](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L65)

***

### spotViewProjectionMatrices[​](#spotviewprojectionmatrices "Direct link to spotViewProjectionMatrices")

> **spotViewProjectionMatrices**: readonly `Readonly`<`Matrix4` | `NumberArray16`>\[]

Defined in: [modules/lighting/shadow/shadow-types.ts:62](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/shadow/shadow-types.ts#L62)
