# Variable: heightFog

> `const` **heightFog**: `object`

Defined in: [modules/lighting/height-fog/height-fog.ts:26](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/height-fog/height-fog.ts#L26)

Analytic extinction through a height-dependent atmosphere. All distances are metres.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `3`; `name`: `"heightFog"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.baseHeight[​](#defaultuniformsbaseheight "Direct link to defaultUniforms.baseHeight")

> `readonly` **baseHeight**: `0` = `0`

#### defaultUniforms.color[​](#defaultuniformscolor "Direct link to defaultUniforms.color")

> `readonly` **color**: \[`0.65`, `0.72`, `0.78`]

#### defaultUniforms.density[​](#defaultuniformsdensity "Direct link to defaultUniforms.density")

> `readonly` **density**: `0` = `0`

#### defaultUniforms.evolutionSpeed[​](#defaultuniformsevolutionspeed "Direct link to defaultUniforms.evolutionSpeed")

> `readonly` **evolutionSpeed**: `0` = `0`

#### defaultUniforms.heightFalloff[​](#defaultuniformsheightfalloff "Direct link to defaultUniforms.heightFalloff")

> `readonly` **heightFalloff**: `0.01` = `0.01`

#### defaultUniforms.time[​](#defaultuniformstime "Direct link to defaultUniforms.time")

> `readonly` **time**: `0` = `0`

#### defaultUniforms.variation[​](#defaultuniformsvariation "Direct link to defaultUniforms.variation")

> `readonly` **variation**: `0` = `0`

#### defaultUniforms.velocity[​](#defaultuniformsvelocity "Direct link to defaultUniforms.velocity")

> `readonly` **velocity**: \[`0`, `0`, `0`]

#### defaultUniforms.wispScale[​](#defaultuniformswispscale "Direct link to defaultUniforms.wispScale")

> `readonly` **wispScale**: `160` = `160`

### dependencies[​](#dependencies "Direct link to dependencies")

> `readonly` **dependencies**: \[{ `dependencies`: \[{ `fs`: "\nfloat valueNoise\_hash(vec2 cell) {\n vec3 value = fract(vec3(cell.x, cell.y, cell.x) \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise(vec2 position) {\n vec2 cell = floor(position);\n vec2 fraction = fract(position);\n vec2 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2(0.0, 1.0)), valueNoise\_hash(cell + vec2(1.0)), blend.x), blend.y);\n}\n\nfloat valueNoise\_hash3(vec3 cell) {\n vec3 value = fract(cell \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise3(vec3 position) {\n vec3 cell = floor(position);\n vec3 fraction = fract(position);\n vec3 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n float bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x), blend.y);\n float top = mix(mix(valueNoise\_hash3(cell + vec3(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; `name`: `"valueNoise"`; `source`: "\nfn valueNoise\_hash(cell: vec2f) -> f32 {\n var value = fract(vec3f(cell.x, cell.y, cell.x) \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise(position: vec2f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec2f(3.0) - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2f(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2f(0.0, 1.0)), valueNoise\_hash(cell + vec2f(1.0)), blend.x), blend.y);\n}\n\nfn valueNoise\_hash3(cell: vec3f) -> f32 {\n var value = fract(cell \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise3(position: vec3f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec3f(3.0) - 2.0 \* fraction);\n let bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3f(1.0, 1.0, 0.0)), blend.x), blend.y);\n let top = mix(mix(valueNoise\_hash3(cell + vec3f(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; }]; `fs`: "\nfloat heightFog\_getRayTransmittance(float rayLength, float cameraHeight, float fragmentHeight, float density, float baseHeight, float heightFalloff) {\n float startHeight = (cameraHeight - baseHeight) \* max(heightFalloff, 0.0);\n float endHeight = (fragmentHeight - baseHeight) \* max(heightFalloff, 0.0);\n float lowerHeight = min(startHeight, endHeight);\n float upperHeight = max(startHeight, endHeight);\n float averageDensity = 1.0;\n if (upperHeight > 0.0) {\n float heightSpan = upperHeight - lowerHeight;\n if (heightSpan < 0.001) {\n averageDensity = exp(-max((startHeight + endHeight) \* 0.5, 0.0));\n } else if (lowerHeight >= 0.0) {\n averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;\n } else {\n averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;\n }\n }\n return exp(-max(density, 0.0) \* rayLength \* averageDensity);\n}\nfloat heightFog\_hash(vec2 cell) { return valueNoise\_hash(cell); }\nfloat heightFog\_noise(vec2 position) { return valueNoise\_noise(position); }\n// Integrate drifting density along the ray so wisps occupy space rather than coat surfaces.\nfloat heightFog\_getSpatialTransmittance(vec3 camera, vec3 position, vec3 upDirection,\n float density, float baseHeight, float heightFalloff, float variation, float wispScale,\n float time, vec3 velocity, float evolutionSpeed) {\n if (density <= 0.0) return 1.0;\n float rayLength = distance(camera, position);\n if (variation <= 0.0) return heightFog\_getRayTransmittance(rayLength, dot(camera, upDirection),\n dot(position, upDirection), density, baseHeight, heightFalloff);\n vec3 reference = abs(upDirection.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);\n vec3 horizontal = normalize(cross(reference, upDirection));\n vec3 forward = cross(upDirection, horizontal);\n float transmittance = 1.0;\n for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {\n float fraction = float(sampleIndex) / 12.0;\n vec3 start = mix(camera, position, fraction);\n vec3 end = mix(camera, position, fraction + 1.0 / 12.0);\n vec3 samplePosition = (start + end) \* 0.5 - velocity \* time;\n vec2 coordinate = vec2(dot(samplePosition, horizontal), dot(samplePosition, forward)) / max(wispScale, 1.0);\n coordinate.y = coordinate.y \* 1.8 + dot(samplePosition, upDirection) / max(wispScale, 1.0);\n float warp = heightFog\_noise(coordinate \* 0.45 + vec2(8.3, 2.7) + time \* evolutionSpeed \* vec2(1.0, 0.37));\n float broad = heightFog\_noise(coordinate + vec2(warp \* 2.0, warp \* 0.8));\n float detail = heightFog\_noise(mat2(0.8, 0.6, -0.6, 0.8) \* coordinate \* 2.17 + vec2(17.1, 9.2) + broad \* 0.7);\n float modulation = mix(1.0, 1.8 \* smoothstep(0.15, 0.85, broad \* 0.7 + detail \* 0.3), clamp(variation, 0.0, 1.0));\n transmittance \*= heightFog\_getRayTransmittance(rayLength / 12.0, dot(start, upDirection),\n dot(end, upDirection), density \* modulation, baseHeight, heightFalloff);\n }\n return transmittance;\n}\n\n"; `name`: `"heightFogFunctions"`; `source`: "\nfn heightFog\_getRayTransmittance(rayLength: f32, cameraHeight: f32, fragmentHeight: f32, density: f32, baseHeight: f32, heightFalloff: f32) -> f32 {\n let startHeight = (cameraHeight - baseHeight) \* max(heightFalloff, 0.0);\n let endHeight = (fragmentHeight - baseHeight) \* max(heightFalloff, 0.0);\n let lowerHeight = min(startHeight, endHeight);\n let upperHeight = max(startHeight, endHeight);\n var averageDensity = 1.0;\n if (upperHeight > 0.0) {\n let heightSpan = upperHeight - lowerHeight;\n if (heightSpan < 0.001) {\n averageDensity = exp(-max((startHeight + endHeight) \* 0.5, 0.0));\n } else if (lowerHeight >= 0.0) {\n averageDensity = (exp(-lowerHeight) - exp(-upperHeight)) / heightSpan;\n } else {\n averageDensity = (-lowerHeight + 1.0 - exp(-upperHeight)) / heightSpan;\n }\n }\n return exp(-max(density, 0.0) \* rayLength \* averageDensity);\n}\nfn heightFog\_hash(cell: vec2f) -> f32 { return valueNoise\_hash(cell); }\nfn heightFog\_noise(position: vec2f) -> f32 { return valueNoise\_noise(position); }\n// Integrate drifting density along the ray so wisps occupy space rather than coat surfaces.\nfn heightFog\_getSpatialTransmittance(camera: vec3f, position: vec3f, upDirection: vec3f,\n density: f32, baseHeight: f32, heightFalloff: f32, variation: f32, wispScale: f32,\n time: f32, velocity: vec3f, evolutionSpeed: f32) -> f32 {\n if (density <= 0.0) { return 1.0; }\n let rayLength = distance(camera, position);\n if (variation <= 0.0) { return heightFog\_getRayTransmittance(rayLength, dot(camera, upDirection),\n dot(position, upDirection), density, baseHeight, heightFalloff); }\n let reference = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(upDirection.z) < 0.9);\n let horizontal = normalize(cross(reference, upDirection));\n let forward = cross(upDirection, horizontal);\n var transmittance = 1.0;\n for (var sampleIndex = 0; sampleIndex < 12; sampleIndex++) {\n let fraction = f32(sampleIndex) / 12.0;\n let start = mix(camera, position, fraction);\n let end = mix(camera, position, fraction + 1.0 / 12.0);\n let samplePosition = (start + end) \* 0.5 - velocity \* time;\n var coordinate = vec2f(dot(samplePosition, horizontal), dot(samplePosition, forward)) / max(wispScale, 1.0);\n coordinate.y = coordinate.y \* 1.8 + dot(samplePosition, upDirection) / max(wispScale, 1.0);\n let warp = heightFog\_noise(coordinate \* 0.45 + vec2f(8.3, 2.7) + time \* evolutionSpeed \* vec2f(1.0, 0.37));\n let broad = heightFog\_noise(coordinate + vec2f(warp \* 2.0, warp \* 0.8));\n let detail = heightFog\_noise(mat2x2f(vec2f(0.8, 0.6), vec2f(-0.6, 0.8)) \* coordinate \* 2.17 + vec2f(17.1, 9.2) + vec2f(broad \* 0.7));\n let modulation = mix(1.0, 1.8 \* smoothstep(0.15, 0.85, broad \* 0.7 + detail \* 0.3), clamp(variation, 0.0, 1.0));\n transmittance \*= heightFog\_getRayTransmittance(rayLength / 12.0, dot(start, upDirection),\n dot(end, upDirection), density \* modulation, baseHeight, heightFalloff);\n }\n return transmittance;\n}\n\n"; }]

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform heightFogUniforms {\n vec3 color;\n float density;\n float baseHeight;\n float heightFalloff;\n float variation;\n float wispScale;\n vec3 velocity;\n float time;\n float evolutionSpeed;\n} heightFog;\nfloat heightFog\_getTransmittance(vec3 position, vec3 cameraPosition) {\n return heightFog\_getSpatialTransmittance(cameraPosition, position, vec3(0.0, 0.0, 1.0),\n heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);\n}\nvec4 heightFog\_getColor(vec4 color, vec3 position, vec3 cameraPosition) {\n return vec4(mix(heightFog.color, color.rgb, heightFog\_getTransmittance(position, cameraPosition)), color.a);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"heightFog"` = `'heightFog'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct heightFogUniforms {\n color: vec3\<f32>,\n density: f32,\n baseHeight: f32,\n heightFalloff: f32,\n variation: f32,\n wispScale: f32,\n velocity: vec3\<f32>,\n time: f32,\n evolutionSpeed: f32,\n};\n\@group(3) @binding(auto) var\<uniform> heightFog: heightFogUniforms;\nfn heightFog\_getTransmittance(position: vec3\<f32>, cameraPosition: vec3\<f32>) -> f32 {\n return heightFog\_getSpatialTransmittance(cameraPosition, position, vec3\<f32>(0.0, 0.0, 1.0),\n heightFog.density, heightFog.baseHeight, heightFog.heightFalloff, heightFog.variation, heightFog.wispScale, heightFog.time, heightFog.velocity, heightFog.evolutionSpeed);\n}\nfn heightFog\_getColor(color: vec4\<f32>, position: vec3\<f32>, cameraPosition: vec3\<f32>) -> vec4\<f32> {\n return vec4\<f32>(mix(heightFog.color, color.rgb, heightFog\_getTransmittance(position, cameraPosition)), color.a);\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.baseHeight[​](#uniformtypesbaseheight "Direct link to uniformTypes.baseHeight")

> `readonly` **baseHeight**: `"f32"` = `'f32'`

#### uniformTypes.color[​](#uniformtypescolor "Direct link to uniformTypes.color")

> `readonly` **color**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.density[​](#uniformtypesdensity "Direct link to uniformTypes.density")

> `readonly` **density**: `"f32"` = `'f32'`

#### uniformTypes.evolutionSpeed[​](#uniformtypesevolutionspeed "Direct link to uniformTypes.evolutionSpeed")

> `readonly` **evolutionSpeed**: `"f32"` = `'f32'`

#### uniformTypes.heightFalloff[​](#uniformtypesheightfalloff "Direct link to uniformTypes.heightFalloff")

> `readonly` **heightFalloff**: `"f32"` = `'f32'`

#### uniformTypes.time[​](#uniformtypestime "Direct link to uniformTypes.time")

> `readonly` **time**: `"f32"` = `'f32'`

#### uniformTypes.variation[​](#uniformtypesvariation "Direct link to uniformTypes.variation")

> `readonly` **variation**: `"f32"` = `'f32'`

#### uniformTypes.velocity[​](#uniformtypesvelocity "Direct link to uniformTypes.velocity")

> `readonly` **velocity**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.wispScale[​](#uniformtypeswispscale "Direct link to uniformTypes.wispScale")

> `readonly` **wispScale**: `"f32"` = `'f32'`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`): `Partial`<[`HeightFogUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/HeightFogUniforms.md)>

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`HeightFogProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/HeightFogProps.md) = `{}`

#### Returns[​](#returns "Direct link to Returns")

`Partial`<[`HeightFogUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/HeightFogUniforms.md)>
