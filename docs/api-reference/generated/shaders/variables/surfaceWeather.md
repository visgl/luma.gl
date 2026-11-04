# Variable: surfaceWeather

> `const` **surfaceWeather**: `object`

Defined in: [modules/lighting/surface-weather/surface-weather.ts:57](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/surface-weather/surface-weather.ts#L57)

Material helpers for persistent wetness, puddles and upward-facing snow. Every helper accepts a caller-provided exposure mask, so water and sheltered surfaces can opt out.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: [`SurfaceWeatherUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherUniforms.md) = `DEFAULT_UNIFORMS`

### dependencies[​](#dependencies "Direct link to dependencies")

> `readonly` **dependencies**: \[{ `fs`: "\nfloat valueNoise\_hash(vec2 cell) {\n vec3 value = fract(vec3(cell.x, cell.y, cell.x) \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise(vec2 position) {\n vec2 cell = floor(position);\n vec2 fraction = fract(position);\n vec2 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2(0.0, 1.0)), valueNoise\_hash(cell + vec2(1.0)), blend.x), blend.y);\n}\n\nfloat valueNoise\_hash3(vec3 cell) {\n vec3 value = fract(cell \* 0.1031);\n value += dot(value, value.yzx + 33.33);\n return fract((value.x + value.y) \* value.z);\n}\nfloat valueNoise\_noise3(vec3 position) {\n vec3 cell = floor(position);\n vec3 fraction = fract(position);\n vec3 blend = fraction \* fraction \* (3.0 - 2.0 \* fraction);\n float bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3(1.0, 1.0, 0.0)), blend.x), blend.y);\n float top = mix(mix(valueNoise\_hash3(cell + vec3(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; `name`: `"valueNoise"`; `source`: "\nfn valueNoise\_hash(cell: vec2f) -> f32 {\n var value = fract(vec3f(cell.x, cell.y, cell.x) \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise(position: vec2f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec2f(3.0) - 2.0 \* fraction);\n return mix(mix(valueNoise\_hash(cell), valueNoise\_hash(cell + vec2f(1.0, 0.0)), blend.x),\n mix(valueNoise\_hash(cell + vec2f(0.0, 1.0)), valueNoise\_hash(cell + vec2f(1.0)), blend.x), blend.y);\n}\n\nfn valueNoise\_hash3(cell: vec3f) -> f32 {\n var value = fract(cell \* 0.1031);\n value += vec3f(dot(value, value.yzx + vec3f(33.33)));\n return fract((value.x + value.y) \* value.z);\n}\nfn valueNoise\_noise3(position: vec3f) -> f32 {\n let cell = floor(position);\n let fraction = fract(position);\n let blend = fraction \* fraction \* (vec3f(3.0) - 2.0 \* fraction);\n let bottom = mix(mix(valueNoise\_hash3(cell), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 0.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 0.0)), valueNoise\_hash3(cell + vec3f(1.0, 1.0, 0.0)), blend.x), blend.y);\n let top = mix(mix(valueNoise\_hash3(cell + vec3f(0.0, 0.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0, 0.0, 1.0)), blend.x),\n mix(valueNoise\_hash3(cell + vec3f(0.0, 1.0, 1.0)), valueNoise\_hash3(cell + vec3f(1.0)), blend.x), blend.y);\n return mix(bottom, top, blend.z);\n}\n"; }]

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform surfaceWeatherUniforms {\n float wetness;\n float snow;\n float puddles;\n float scale;\n vec3 snowColor;\n vec3 skyColor;\n} surfaceWeather;\n\nfloat surfaceWeather\_getSnow(vec3 position, vec3 normal, float exposure) {\n if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) return 0.0;\n float slope = smoothstep(0.4, 0.85, normalize(normal).z);\n float variation = valueNoise\_noise(position.xy / max(surfaceWeather.scale, 0.01));\n float coverage = smoothstep(variation \* 0.65, variation \* 0.65 + 0.35, surfaceWeather.snow);\n return coverage \* slope \* clamp(exposure, 0.0, 1.0);\n}\nfloat surfaceWeather\_getWetness(vec3 position, vec3 normal, float exposure) {\n if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return 0.0;\n return clamp(surfaceWeather.wetness, 0.0, 1.0) \* clamp(exposure, 0.0, 1.0) \* (1.0 - surfaceWeather\_getSnow(position, normal, exposure));\n}\nfloat surfaceWeather\_getPuddle(vec3 position, vec3 normal, float exposure) {\n if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) return 0.0;\n float variation = valueNoise\_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2(8.3, 2.7));\n return surfaceWeather\_getWetness(position, normal, exposure) \* clamp(surfaceWeather.puddles, 0.0, 1.0) \*\n smoothstep(0.8, 0.98, normalize(normal).z) \* smoothstep(0.38, 0.7, variation);\n}\nvec3 surfaceWeather\_getAlbedo(vec3 albedo, vec3 position, vec3 normal, float exposure) {\n if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return albedo;\n float wetness = surfaceWeather\_getWetness(position, normal, exposure);\n float snow = surfaceWeather\_getSnow(position, normal, exposure);\n return mix(albedo \* (1.0 - wetness \* 0.38), surfaceWeather.snowColor, snow);\n}\nfloat surfaceWeather\_getRoughness(float roughness, vec3 position, vec3 normal, float exposure) {\n if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) return roughness;\n float wetness = surfaceWeather\_getWetness(position, normal, exposure);\n float puddle = surfaceWeather\_getPuddle(position, normal, exposure);\n float snow = surfaceWeather\_getSnow(position, normal, exposure);\n return mix(mix(roughness, 0.16, max(puddle, wetness \* 0.6)), 0.95, snow);\n}\n// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.\nvec3 surfaceWeather\_getReflection(vec3 position, vec3 normal, vec3 camera, vec3 lightDirection, vec3 lightColor, float exposure) {\n if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) return vec3(0.0);\n vec3 surfaceNormal = normalize(normal);\n vec3 view = normalize(camera - position);\n vec3 halfway = normalize(view + normalize(lightDirection));\n float wetness = surfaceWeather\_getWetness(position, normal, exposure);\n float puddle = surfaceWeather\_getPuddle(position, normal, exposure);\n float facing = max(dot(surfaceNormal, view), 0.0);\n float fresnel = 0.02 + 0.98 \* pow(1.0 - facing, 5.0);\n float highlight = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) \* max(dot(surfaceNormal, normalize(lightDirection)), 0.0);\n return wetness \* (surfaceWeather.skyColor \* fresnel \* (0.15 + puddle \* 0.85) + lightColor \* highlight \* 0.6);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"surfaceWeather"` = `'surfaceWeather'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct surfaceWeatherUniforms {\n wetness: f32,\n snow: f32,\n puddles: f32,\n scale: f32,\n snowColor: vec3f,\n skyColor: vec3f,\n};\n\@group(3) @binding(auto) var\<uniform> surfaceWeather: surfaceWeatherUniforms;\n\nfn surfaceWeather\_getSnow(position: vec3f,\n normal: vec3f,\n exposure: f32) -> f32 {\n if (surfaceWeather.snow <= 0.0 || exposure <= 0.0) { return 0.0; }\n var slope: f32 = smoothstep(0.4, 0.85, normalize(normal).z);\n var variation: f32 = valueNoise\_noise(position.xy / max(surfaceWeather.scale, 0.01));\n var coverage: f32 = smoothstep(variation \* 0.65, variation \* 0.65 + 0.35, surfaceWeather.snow);\n return coverage \* slope \* clamp(exposure, 0.0, 1.0);\n}\nfn surfaceWeather\_getWetness(position: vec3f,\n normal: vec3f,\n exposure: f32) -> f32 {\n if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return 0.0; }\n return clamp(surfaceWeather.wetness, 0.0, 1.0) \* clamp(exposure, 0.0, 1.0) \* (1.0 - surfaceWeather\_getSnow(position, normal, exposure));\n}\nfn surfaceWeather\_getPuddle(position: vec3f,\n normal: vec3f,\n exposure: f32) -> f32 {\n if (surfaceWeather.wetness <= 0.0 || surfaceWeather.puddles <= 0.0 || exposure <= 0.0) { return 0.0; }\n var variation: f32 = valueNoise\_noise(position.xy / max(surfaceWeather.scale, 0.01) + vec2f(8.3, 2.7));\n return surfaceWeather\_getWetness(position, normal, exposure) \* clamp(surfaceWeather.puddles, 0.0, 1.0) \*\n smoothstep(0.8, 0.98, normalize(normal).z) \* smoothstep(0.38, 0.7, variation);\n}\nfn surfaceWeather\_getAlbedo(albedo: vec3f,\n position: vec3f,\n normal: vec3f,\n exposure: f32) -> vec3f {\n if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return albedo; }\n var wetness: f32 = surfaceWeather\_getWetness(position, normal, exposure);\n var snow: f32 = surfaceWeather\_getSnow(position, normal, exposure);\n return mix(albedo \* (1.0 - wetness \* 0.38), surfaceWeather.snowColor, snow);\n}\nfn surfaceWeather\_getRoughness(roughness: f32,\n position: vec3f,\n normal: vec3f,\n exposure: f32) -> f32 {\n if ((surfaceWeather.wetness <= 0.0 && surfaceWeather.snow <= 0.0) || exposure <= 0.0) { return roughness; }\n var wetness: f32 = surfaceWeather\_getWetness(position, normal, exposure);\n var puddle: f32 = surfaceWeather\_getPuddle(position, normal, exposure);\n var snow: f32 = surfaceWeather\_getSnow(position, normal, exposure);\n return mix(mix(roughness, 0.16, max(puddle, wetness \* 0.6)), 0.95, snow);\n}\n// Approximate dielectric highlights and sky tint; callers may use the albedo/roughness helpers with PBR instead.\nfn surfaceWeather\_getReflection(position: vec3f,\n normal: vec3f,\n camera: vec3f,\n lightDirection: vec3f,\n lightColor: vec3f,\n exposure: f32) -> vec3f {\n if (surfaceWeather.wetness <= 0.0 || exposure <= 0.0) { return vec3f(0.0); }\n var surfaceNormal: vec3f = normalize(normal);\n var view: vec3f = normalize(camera - position);\n var halfway: vec3f = normalize(view + normalize(lightDirection));\n var wetness: f32 = surfaceWeather\_getWetness(position, normal, exposure);\n var puddle: f32 = surfaceWeather\_getPuddle(position, normal, exposure);\n var facing: f32 = max(dot(surfaceNormal, view), 0.0);\n var fresnel: f32 = 0.02 + 0.98 \* pow(1.0 - facing, 5.0);\n var highlight: f32 = pow(max(dot(surfaceNormal, halfway), 0.0), mix(36.0, 160.0, puddle)) \* max(dot(surfaceNormal, normalize(lightDirection)), 0.0);\n return wetness \* (surfaceWeather.skyColor \* fresnel \* (0.15 + puddle \* 0.85) + lightColor \* highlight \* 0.6);\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.puddles[​](#uniformtypespuddles "Direct link to uniformTypes.puddles")

> `readonly` **puddles**: `"f32"` = `'f32'`

#### uniformTypes.scale[​](#uniformtypesscale "Direct link to uniformTypes.scale")

> `readonly` **scale**: `"f32"` = `'f32'`

#### uniformTypes.skyColor[​](#uniformtypesskycolor "Direct link to uniformTypes.skyColor")

> `readonly` **skyColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.snow[​](#uniformtypessnow "Direct link to uniformTypes.snow")

> `readonly` **snow**: `"f32"` = `'f32'`

#### uniformTypes.snowColor[​](#uniformtypessnowcolor "Direct link to uniformTypes.snowColor")

> `readonly` **snowColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.wetness[​](#uniformtypeswetness "Direct link to uniformTypes.wetness")

> `readonly` **wetness**: `"f32"` = `'f32'`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`, `previousUniforms?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`Partial`<`Partial`<[`SurfaceWeatherUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherUniforms.md)>> = `{}`

##### previousUniforms?[​](#previousuniforms "Direct link to previousUniforms?")

[`SurfaceWeatherUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/SurfaceWeatherUniforms.md) | `undefined`

#### Returns[​](#returns "Direct link to Returns")

##### puddles[​](#puddles "Direct link to puddles")

> **puddles**: `number`

##### scale[​](#scale "Direct link to scale")

> **scale**: `number`

World-anchored patch size in metres.

##### skyColor[​](#skycolor "Direct link to skyColor")

> **skyColor**: \[`number`, `number`, `number`]

##### snow[​](#snow "Direct link to snow")

> **snow**: `number`

##### snowColor[​](#snowcolor "Direct link to snowColor")

> **snowColor**: \[`number`, `number`, `number`]

##### wetness[​](#wetness "Direct link to wetness")

> **wetness**: `number`
