# Variable: clouds

> `const` **clouds**: `object`

Defined in: [modules/lighting/clouds/clouds.ts:45](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/clouds/clouds.ts#L45)

Sixty-four-sample cloud slab with approximate sunlight scattering. Returns premultiplied RGBA. Positions/directions use a local east/north/up frame, with lengths in metres. Receivers can sample clouds\_getTransmittance to attenuate direct sunlight.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: [`CloudUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/CloudUniforms.md) = `DEFAULT_UNIFORMS`

### dependencies[​](#dependencies "Direct link to dependencies")

> `readonly` **dependencies**: \[{ `fs`: "\nfloat valueNoise\_hash(vec2 cell) {\n vec3 value = fract(vec3(cell.x, cell.y, cell.x) \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise(vec2 position) {\n vec2 cell = floor(position);\n vec2 fraction = fract(position);\n vec2 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2(0.0, 1.0)), valueNoise\_hash(cell + vec2(1.0)), blend.x), blend.y);\n}\n\nfloat valueNoise\_hash3(vec3 cell) {\n vec3 value = fract(cell \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise3(vec3 position) {\n vec3 cell = floor(position);\n vec3 fraction = fract(position);\n vec3 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n float bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x), blend.y);\n float top = mix(mix(valueNoise\_hash3(cell + vec3(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; `name`: `"valueNoise"`; `source`: "\nfn valueNoise\_hash(cell: vec2f) -> f32 {\n var value = fract(vec3f(cell.x, cell.y, cell.x) \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise(position: vec2f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec2f(3.0) - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2f(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2f(0.0, 1.0)), valueNoise\_hash(cell + vec2f(1.0)), blend.x), blend.y);\n}\n\nfn valueNoise\_hash3(cell: vec3f) -> f32 {\n var value = fract(cell \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise3(position: vec3f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec3f(3.0) - 2.0 \* fraction);\n let bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3f(1.0, 1.0, 0.0)), blend.x), blend.y);\n let top = mix(mix(valueNoise\_hash3(cell + vec3f(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; }]

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform cloudsUniforms {\n float cover;\n float altitude;\n float thickness;\n float scale;\n float density;\n float time;\n vec2 velocity;\n vec3 sunDirection;\n vec3 sunColor;\n} clouds;\n// Shared normalized density field for planar slabs and spherical shells.\nfloat clouds\_getDensityAt(vec3 coordinate, float height) {\n float envelope = smoothstep(0.0, 0.2, height) \* (1.0 - smoothstep(0.65, 1.0, height));\n coordinate += vec3(8.7, 3.2, clouds.time \* 0.003);\n float broad = valueNoise\_noise3(coordinate);\n float detail = valueNoise\_noise3(coordinate \* 2.07 + vec3(13.1, 7.3, 2.8));\n float fine = valueNoise\_noise3(coordinate \* 4.23 + vec3(5.4, 11.7, 8.1));\n float threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));\n return envelope \* smoothstep(threshold, threshold + 0.16, broad \* 0.72 + detail \* 0.2 + fine \* 0.08);\n}\n\nfloat clouds\_getDensity(vec3 position) {\n float height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);\n return clouds\_getDensityAt(vec3((position.xy - clouds.velocity \* clouds.time) / max(clouds.scale, 1.0), height \* 0.8), height);\n}\nvec3 clouds\_getLighting(float density, float sunDensity, float daylight, float silver) {\n vec3 ambient = mix(vec3(0.035, 0.05, 0.085), vec3(0.28, 0.34, 0.42), daylight);\n float sunlight = exp(-(density + sunDensity) \* 2.0);\n return ambient + clouds.sunColor \* daylight \* sunlight \* (0.5 + silver \* 0.3);\n}\n\n// Beer-Lambert extinction toward the sun through the same density used for sky rendering.\nfloat clouds\_getTransmittance(vec3 position) {\n if (clouds.cover <= 0.0 || clouds.density <= 0.0) return 1.0;\n vec3 direction = normalize(clouds.sunDirection);\n if (direction.z <= 0.02) return 1.0;\n float start = max((clouds.altitude - position.z) / direction.z, 0.0);\n float end = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);\n if (end <= start) return 1.0;\n float stepLength = (end - start) / 16.0;\n float opticalDepth = 0.0;\n for (int sampleIndex = 0; sampleIndex < 16; sampleIndex++) {\n opticalDepth += clouds\_getDensity(position + direction \* (start + (float(sampleIndex) + 0.5) \* stepLength)) \* stepLength;\n }\n return exp(-opticalDepth \* max(clouds.density, 0.0));\n}\n\nvec4 clouds\_getColor(vec3 camera, vec3 rayDirection) {\n if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) return vec4(0.0);\n float bottom = (clouds.altitude - camera.z) / rayDirection.z;\n float top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;\n float start = max(min(bottom, top), 0.0);\n float end = min(max(bottom, top), 20000.0);\n if (end <= start) return vec4(0.0);\n float jitter = valueNoise\_hash(rayDirection.xy \* 4096.0);\n float stepLength = (end - start) / 64.0;\n vec3 sunDirection = normalize(clouds.sunDirection);\n float daylight = smoothstep(-0.08, 0.18, sunDirection.z);\n float silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);\n vec3 radiance = vec3(0.0);\n float transmittance = 1.0;\n for (int sampleIndex = 0; sampleIndex < 64; sampleIndex++) {\n vec3 position = camera + rayDirection \* (start + (float(sampleIndex) + jitter) \* stepLength);\n float density = clouds\_getDensity(position);\n float sunDensity = clouds\_getDensity(position + sunDirection \* clouds.thickness \* 0.28);\n float alpha = 1.0 - exp(-density \* max(clouds.density, 0.0) \* stepLength);\n vec3 color = clouds\_getLighting(density, sunDensity, daylight, silver);\n radiance += transmittance \* alpha \* color;\n transmittance \*= 1.0 - alpha;\n }\n float distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);\n return vec4(radiance, 1.0 - transmittance) \* distanceFade;\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"clouds"` = `'clouds'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct cloudsUniforms {\n cover: f32,\n altitude: f32,\n thickness: f32,\n scale: f32,\n density: f32,\n time: f32,\n velocity: vec2f,\n sunDirection: vec3f,\n sunColor: vec3f,\n};\n\@group(3) @binding(auto) var\<uniform> clouds: cloudsUniforms;\nfn clouds\_getDensityAt(inputCoordinate: vec3f, height: f32) -> f32 {\n let envelope = smoothstep(0.0, 0.2, height) \* (1.0 - smoothstep(0.65, 1.0, height));\n var coordinate = inputCoordinate;\n coordinate += vec3f(8.7, 3.2, clouds.time \* 0.003);\n let broad = valueNoise\_noise3(coordinate);\n let detail = valueNoise\_noise3(coordinate \* 2.07 + vec3f(13.1, 7.3, 2.8));\n let fine = valueNoise\_noise3(coordinate \* 4.23 + vec3f(5.4, 11.7, 8.1));\n let threshold = mix(0.78, 0.18, clamp(clouds.cover, 0.0, 1.0));\n return envelope \* smoothstep(threshold, threshold + 0.16, broad \* 0.72 + detail \* 0.2 + fine \* 0.08);\n}\n\nfn clouds\_getDensity(position: vec3f) -> f32 {\n let height = (position.z - clouds.altitude) / max(clouds.thickness, 1.0);\n return clouds\_getDensityAt(vec3f((position.xy - clouds.velocity \* clouds.time) / max(clouds.scale, 1.0), height \* 0.8), height);\n}\nfn clouds\_getLighting(density: f32, sunDensity: f32, daylight: f32, silver: f32) -> vec3f {\n let ambient = mix(vec3f(0.035, 0.05, 0.085), vec3f(0.28, 0.34, 0.42), daylight);\n let sunlight = exp(-(density + sunDensity) \* 2.0);\n return ambient + clouds.sunColor \* daylight \* sunlight \* (0.5 + silver \* 0.3);\n}\n\n// Beer-Lambert extinction toward the sun through the same density used for sky rendering.\nfn clouds\_getTransmittance(position: vec3f) -> f32 {\n if (clouds.cover <= 0.0 || clouds.density <= 0.0) { return 1.0; }\n var direction: vec3f = normalize(clouds.sunDirection);\n if (direction.z <= 0.02) { return 1.0; }\n var start: f32 = max((clouds.altitude - position.z) / direction.z, 0.0);\n var end: f32 = min((clouds.altitude + clouds.thickness - position.z) / direction.z, 40000.0);\n if (end <= start) { return 1.0; }\n var stepLength: f32 = (end - start) / 16.0;\n var opticalDepth: f32 = 0.0;\n for (var sampleIndex: i32 = 0; sampleIndex < 16; sampleIndex++) {\n opticalDepth += clouds\_getDensity(position + direction \* (start + (f32(sampleIndex) + 0.5) \* stepLength)) \* stepLength;\n }\n return exp(-opticalDepth \* max(clouds.density, 0.0));\n}\n\nfn clouds\_getColor(camera: vec3f, rayDirection: vec3f) -> vec4f {\n if (clouds.cover <= 0.0 || clouds.density <= 0.0 || abs(rayDirection.z) < 0.0001) { return vec4f(0.0); }\n let bottom = (clouds.altitude - camera.z) / rayDirection.z;\n let top = (clouds.altitude + max(clouds.thickness, 1.0) - camera.z) / rayDirection.z;\n let start = max(min(bottom, top), 0.0);\n let end = min(max(bottom, top), 20000.0);\n if (end <= start) { return vec4f(0.0); }\n let jitter = valueNoise\_hash(rayDirection.xy \* 4096.0);\n let stepLength = (end - start) / 64.0;\n let sunDirection = normalize(clouds.sunDirection);\n let daylight = smoothstep(-0.08, 0.18, sunDirection.z);\n let silver = pow(max(dot(rayDirection, sunDirection), 0.0), 12.0);\n var radiance = vec3f(0.0);\n var transmittance = 1.0;\n for (var sampleIndex = 0; sampleIndex < 64; sampleIndex++) {\n let position = camera + rayDirection \* (start + (f32(sampleIndex) + jitter) \* stepLength);\n let density = clouds\_getDensity(position);\n let sunDensity = clouds\_getDensity(position + sunDirection \* clouds.thickness \* 0.28);\n let alpha = 1.0 - exp(-density \* max(clouds.density, 0.0) \* stepLength);\n let color = clouds\_getLighting(density, sunDensity, daylight, silver);\n radiance += transmittance \* alpha \* color;\n transmittance \*= 1.0 - alpha;\n }\n let distanceFade = 1.0 - smoothstep(10000.0, 20000.0, start);\n return vec4f(radiance, 1.0 - transmittance) \* distanceFade;\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.altitude[​](#uniformtypesaltitude "Direct link to uniformTypes.altitude")

> `readonly` **altitude**: `"f32"` = `'f32'`

#### uniformTypes.cover[​](#uniformtypescover "Direct link to uniformTypes.cover")

> `readonly` **cover**: `"f32"` = `'f32'`

#### uniformTypes.density[​](#uniformtypesdensity "Direct link to uniformTypes.density")

> `readonly` **density**: `"f32"` = `'f32'`

#### uniformTypes.scale[​](#uniformtypesscale "Direct link to uniformTypes.scale")

> `readonly` **scale**: `"f32"` = `'f32'`

#### uniformTypes.sunColor[​](#uniformtypessuncolor "Direct link to uniformTypes.sunColor")

> `readonly` **sunColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.sunDirection[​](#uniformtypessundirection "Direct link to uniformTypes.sunDirection")

> `readonly` **sunDirection**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.thickness[​](#uniformtypesthickness "Direct link to uniformTypes.thickness")

> `readonly` **thickness**: `"f32"` = `'f32'`

#### uniformTypes.time[​](#uniformtypestime "Direct link to uniformTypes.time")

> `readonly` **time**: `"f32"` = `'f32'`

#### uniformTypes.velocity[​](#uniformtypesvelocity "Direct link to uniformTypes.velocity")

> `readonly` **velocity**: `"vec2<f32>"` = `'vec2<f32>'`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`, `previousUniforms?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`Partial`<`Partial`<[`CloudUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/CloudUniforms.md)>> = `{}`

##### previousUniforms?[​](#previousuniforms "Direct link to previousUniforms?")

[`CloudUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/CloudUniforms.md) | `undefined`

#### Returns[​](#returns "Direct link to Returns")

##### altitude[​](#altitude "Direct link to altitude")

> **altitude**: `number`

Bottom and thickness of the cloud slab, in metres above the coordinate origin.

##### cover[​](#cover "Direct link to cover")

> **cover**: `number`

Fractional cloud cover, from clear (0) to overcast (1).

##### density[​](#density "Direct link to density")

> **density**: `number`

Extinction coefficient, in inverse metres.

##### scale[​](#scale "Direct link to scale")

> **scale**: `number`

Horizontal size of cloud formations, in metres.

##### sunColor[​](#suncolor "Direct link to sunColor")

> **sunColor**: \[`number`, `number`, `number`]

Linear sunlight tint.

##### sunDirection[​](#sundirection "Direct link to sunDirection")

> **sunDirection**: \[`number`, `number`, `number`]

Direction toward the sun in east/north/up coordinates; nonzero.

##### thickness[​](#thickness "Direct link to thickness")

> **thickness**: `number`

##### time[​](#time "Direct link to time")

> **time**: `number`

Elapsed seconds; callers own animation.

##### velocity[​](#velocity "Direct link to velocity")

> **velocity**: \[`number`, `number`]

East/north drift velocity in metres per second.
