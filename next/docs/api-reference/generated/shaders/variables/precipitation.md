# Variable: precipitation

> `const` **precipitation**: `object`

Defined in: [modules/geometry/precipitation/precipitation.ts:19](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/geometry/precipitation/precipitation.ts#L19)

Stateless, seeded falling particles in a movable volume. Coordinates are local metres.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `3`; `name`: `"precipitation"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.fallSpeed[​](#defaultuniformsfallspeed "Direct link to defaultUniforms.fallSpeed")

> `readonly` **fallSpeed**: `20` = `20`

#### defaultUniforms.seed[​](#defaultuniformsseed "Direct link to defaultUniforms.seed")

> `readonly` **seed**: `29` = `29`

#### defaultUniforms.time[​](#defaultuniformstime "Direct link to defaultUniforms.time")

> `readonly` **time**: `0` = `0`

#### defaultUniforms.turbulence[​](#defaultuniformsturbulence "Direct link to defaultUniforms.turbulence")

> `readonly` **turbulence**: `0` = `0`

#### defaultUniforms.volumeCenter[​](#defaultuniformsvolumecenter "Direct link to defaultUniforms.volumeCenter")

> `readonly` **volumeCenter**: \[`0`, `0`, `150`]

#### defaultUniforms.volumeSize[​](#defaultuniformsvolumesize "Direct link to defaultUniforms.volumeSize")

> `readonly` **volumeSize**: \[`1200`, `1600`, `300`]

#### defaultUniforms.wind[​](#defaultuniformswind "Direct link to defaultUniforms.wind")

> `readonly` **wind**: \[`2`, `0`]

### name[​](#name "Direct link to name")

> `readonly` **name**: `"precipitation"` = `'precipitation'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct precipitationUniforms {\n time: f32,\n fallSpeed: f32,\n turbulence: f32,\n seed: f32,\n volumeCenter: vec3\<f32>,\n volumeSize: vec3\<f32>,\n wind: vec2\<f32>,\n};\n\@group(3) @binding(auto) var\<uniform> precipitation: precipitationUniforms;\nfn precipitation\_random(identifier: u32) -> f32 {\n var value = identifier + u32(precipitation.seed) \* 747796405u;\n value = (value ^ (value >> 16u)) \* 2246822519u;\n value = (value ^ (value >> 13u)) \* 3266489917u;\n value = value ^ (value >> 16u);\n return f32(value & 16777215u) / 16777216.0;\n}\nfn precipitation\_getPosition(identifier: u32) -> vec3\<f32> {\n let randomPosition = vec3\<f32>(precipitation\_random(identifier \* 3u), precipitation\_random(identifier \* 3u + 1u), precipitation\_random(identifier \* 3u + 2u));\n let volumeSize = max(precipitation.volumeSize, vec3\<f32>(0.001));\n let minimum = precipitation.volumeCenter - volumeSize \* 0.5;\n let drift = vec3\<f32>(precipitation.wind, -precipitation.fallSpeed) \* precipitation.time;\n let unwrapped = randomPosition \* volumeSize + drift - minimum;\n var position = unwrapped - floor(unwrapped / volumeSize) \* volumeSize + minimum;\n position.x += precipitation.turbulence \* sin(precipitation.time \* 0.9 + randomPosition.z \* 31.0);\n position.y += precipitation.turbulence \* cos(precipitation.time \* 0.7 + randomPosition.x \* 23.0);\n return position;\n}\nfn precipitation\_getFade(position: vec3\<f32>) -> f32 {\n let edge = 0.5 - abs((position - precipitation.volumeCenter) / max(precipitation.volumeSize, vec3\<f32>(0.001)));\n return smoothstep(0.0, 0.08, min(edge.x, min(edge.y, edge.z)));\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.fallSpeed[​](#uniformtypesfallspeed "Direct link to uniformTypes.fallSpeed")

> `readonly` **fallSpeed**: `"f32"` = `'f32'`

#### uniformTypes.seed[​](#uniformtypesseed "Direct link to uniformTypes.seed")

> `readonly` **seed**: `"f32"` = `'f32'`

#### uniformTypes.time[​](#uniformtypestime "Direct link to uniformTypes.time")

> `readonly` **time**: `"f32"` = `'f32'`

#### uniformTypes.turbulence[​](#uniformtypesturbulence "Direct link to uniformTypes.turbulence")

> `readonly` **turbulence**: `"f32"` = `'f32'`

#### uniformTypes.volumeCenter[​](#uniformtypesvolumecenter "Direct link to uniformTypes.volumeCenter")

> `readonly` **volumeCenter**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.volumeSize[​](#uniformtypesvolumesize "Direct link to uniformTypes.volumeSize")

> `readonly` **volumeSize**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.wind[​](#uniformtypeswind "Direct link to uniformTypes.wind")

> `readonly` **wind**: `"vec2<f32>"` = `'vec2<f32>'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "\nlayout(std140) uniform precipitationUniforms {\n float time;\n float fallSpeed;\n float turbulence;\n float seed;\n vec3 volumeCenter;\n vec3 volumeSize;\n vec2 wind;\n} precipitation;\nfloat precipitation\_random(uint identifier) {\n uint value = identifier + uint(precipitation.seed) \* 747796405u;\n value = (value ^ (value >> 16u)) \* 2246822519u;\n value = (value ^ (value >> 13u)) \* 3266489917u;\n value = value ^ (value >> 16u);\n return float(value & 16777215u) / 16777216.0;\n}\nvec3 precipitation\_getPosition(uint identifier) {\n vec3 randomPosition = vec3(precipitation\_random(identifier \* 3u), precipitation\_random(identifier \* 3u + 1u), precipitation\_random(identifier \* 3u + 2u));\n vec3 volumeSize = max(precipitation.volumeSize, vec3(0.001));\n vec3 minimum = precipitation.volumeCenter - volumeSize \* 0.5;\n vec3 drift = vec3(precipitation.wind, -precipitation.fallSpeed) \* precipitation.time;\n vec3 position = mod(randomPosition \* volumeSize + drift - minimum, volumeSize) + minimum;\n position.xy += precipitation.turbulence \* vec2(sin(precipitation.time \* 0.9 + randomPosition.z \* 31.0), cos(precipitation.time \* 0.7 + randomPosition.x \* 23.0));\n return position;\n}\nfloat precipitation\_getFade(vec3 position) {\n vec3 edge = 0.5 - abs((position - precipitation.volumeCenter) / max(precipitation.volumeSize, vec3(0.001)));\n return smoothstep(0.0, 0.08, min(edge.x, min(edge.y, edge.z)));\n}\n"

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`): `Partial`<[`PrecipitationUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PrecipitationUniforms.md)>

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`PrecipitationProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PrecipitationProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`Partial`<[`PrecipitationUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PrecipitationUniforms.md)>
