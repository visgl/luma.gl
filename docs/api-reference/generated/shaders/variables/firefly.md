# Variable: firefly

> `const` **firefly**: `object`

Defined in: [modules/lighting/firefly/firefly.ts:18](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/firefly/firefly.ts#L18)

Seeded smooth wandering and independently phased bioluminescence. Positions are in metres.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object` = `uniforms`

#### defaultUniforms.enabled[​](#defaultuniformsenabled "Direct link to defaultUniforms.enabled")

> **enabled**: `number` = `0`

#### defaultUniforms.pulse[​](#defaultuniformspulse "Direct link to defaultUniforms.pulse")

> **pulse**: `number` = `0.85`

#### defaultUniforms.radius[​](#defaultuniformsradius "Direct link to defaultUniforms.radius")

> **radius**: `number` = `8`

#### defaultUniforms.speed[​](#defaultuniformsspeed "Direct link to defaultUniforms.speed")

> **speed**: `number` = `0.6`

#### defaultUniforms.time[​](#defaultuniformstime "Direct link to defaultUniforms.time")

> **time**: `number` = `0`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"firefly"` = `'firefly'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct FireflyUniforms {enabled: f32, time: f32, radius: f32, speed: f32, pulse: f32};\n @group(3) @binding(auto) var\<uniform> firefly: FireflyUniforms;\n fn firefly\_getPosition(position: vec3f, seed: f32, time: f32) -> vec3f {\n if (firefly.enabled <= 0.0) { return position; }\n let phase = seed \* 2.399963;\n let travel = time \* firefly.speed;\n let offset = vec3f(sin(travel \* 0.71 + phase) + sin(travel \* 1.31 + phase \* 1.7) \* 0.35,\n cos(travel \* 0.83 + phase \* 1.2) + sin(travel \* 0.47 + phase \* 2.3) \* 0.4,\n sin(travel \* 0.59 + phase \* 1.9) \* 0.3);\n return position + offset \* firefly.radius \* firefly.enabled;\n }\n fn firefly\_getBrightness(seed: f32, time: f32) -> f32 {\n if (firefly.enabled <= 0.0) { return 1.0; }\n let phase = seed \* 2.399963;\n let pulse = pow(0.5 + 0.5 \* sin(time \* firefly.speed \* (1.6 + fract(seed \* 0.37)) + phase), 3.0);\n return mix(1.0, mix(0.08, 1.0, pulse), firefly.pulse \* firefly.enabled);\n }"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.enabled[​](#uniformtypesenabled "Direct link to uniformTypes.enabled")

> `readonly` **enabled**: `"f32"` = `'f32'`

#### uniformTypes.pulse[​](#uniformtypespulse "Direct link to uniformTypes.pulse")

> `readonly` **pulse**: `"f32"` = `'f32'`

#### uniformTypes.radius[​](#uniformtypesradius "Direct link to uniformTypes.radius")

> `readonly` **radius**: `"f32"` = `'f32'`

#### uniformTypes.speed[​](#uniformtypesspeed "Direct link to uniformTypes.speed")

> `readonly` **speed**: `"f32"` = `'f32'`

#### uniformTypes.time[​](#uniformtypestime "Direct link to uniformTypes.time")

> `readonly` **time**: `"f32"` = `'f32'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "layout(std140) uniform fireflyUniforms {\n float enabled;\n float time;\n float radius;\n float speed;\n float pulse;\n } firefly;\n vec3 firefly\_getPosition(vec3 position, float seed, float time) {\n if (firefly.enabled <= 0.0) { return position; }\n float phase = seed \* 2.399963;\n float travel = time \* firefly.speed;\n vec3 offset = vec3(sin(travel \* 0.71 + phase) + sin(travel \* 1.31 + phase \* 1.7) \* 0.35,\n cos(travel \* 0.83 + phase \* 1.2) + sin(travel \* 0.47 + phase \* 2.3) \* 0.4,\n sin(travel \* 0.59 + phase \* 1.9) \* 0.3);\n return position + offset \* firefly.radius \* firefly.enabled;\n }\n float firefly\_getBrightness(float seed, float time) {\n if (firefly.enabled <= 0.0) { return 1.0; }\n float phase = seed \* 2.399963;\n float pulse = pow(0.5 + 0.5 \* sin(time \* firefly.speed \* (1.6 + fract(seed \* 0.37)) + phase), 3.0);\n return mix(1.0, mix(0.08, 1.0, pulse), firefly.pulse \* firefly.enabled);\n }"

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`, `previous?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`Partial`<[`FireflyProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/FireflyProps.md)> = `{}`

##### previous?[​](#previous "Direct link to previous?")

`Required`<[`FireflyProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/FireflyProps.md)> | `undefined`

#### Returns[​](#returns "Direct link to Returns")

`object`

##### enabled[​](#enabled "Direct link to enabled")

> **enabled**: `number`

##### pulse[​](#pulse "Direct link to pulse")

> **pulse**: `number`

##### radius[​](#radius "Direct link to radius")

> **radius**: `number`

##### speed[​](#speed "Direct link to speed")

> **speed**: `number`

##### time[​](#time "Direct link to time")

> **time**: `number`
