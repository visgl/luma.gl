# Variable: atmosphere

> `const` **atmosphere**: `object`

Defined in: [modules/lighting/atmosphere/atmosphere.ts:36](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/atmosphere/atmosphere.ts#L36)

Single-scattering Rayleigh/Mie sky and aerial perspective. Distances are metres. Includes a spherical planet's solar occlusion, without multiple scattering or ozone.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: [`AtmosphereUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/AtmosphereUniforms.md) = `DEFAULT_UNIFORMS`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform atmosphereUniforms {\n float enabled;\n vec3 sunDirection;\n float sunIntensity;\n float haze;\n float rayleigh;\n float planetRadius;\n float exposure;\n vec3 groundColor;\n} atmosphere;\nstruct AtmosphereSample {\n vec3 radiance;\n vec3 transmittance;\n};\n\nvec2 atmosphere\_intersectSphere(vec3 origin, vec3 direction, float radius) {\n float projected = dot(origin, direction);\n float discriminant = projected \* projected - (dot(origin.xy, origin.xy) + (origin.z - radius) \* (origin.z + radius));\n if (discriminant < 0.0) return vec2(-1.0);\n float root = sqrt(discriminant);\n return vec2(-projected - root, -projected + root);\n}\nvec2 atmosphere\_getDensity(vec3 position) {\n float height = max(length(position) - atmosphere.planetRadius, 0.0);\n return exp(-vec2(height / 8000.0, height / 1200.0));\n}\nAtmosphereSample atmosphere\_getScattering(vec3 camera, vec3 direction, float distanceLimit) {\n AtmosphereSample result;\n result.radiance = vec3(0.0);\n result.transmittance = vec3(1.0);\n if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) return result;\n vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));\n vec2 shell = atmosphere\_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);\n float start = max(shell.x, 0.0);\n float end = min(shell.y, distanceLimit);\n vec2 ground = atmosphere\_intersectSphere(origin, direction, atmosphere.planetRadius);\n if (ground.x > 0.0) end = min(end, ground.x);\n if (end <= start) return result;\n vec3 sunlight = normalize(atmosphere.sunDirection);\n vec3 rayleigh = vec3(0.0000058, 0.0000135, 0.0000331) \* max(atmosphere.rayleigh, 0.0);\n vec3 mie = vec3(0.000021) \* max(atmosphere.haze, 0.0);\n float cosine = dot(direction, sunlight);\n float rayleighPhase = 0.0596831 \* (1.0 + cosine \* cosine);\n float asymmetry = 0.76;\n float miePhase = (1.0 - asymmetry \* asymmetry) / (12.566371 \* pow(max(1.0 + asymmetry \* asymmetry - 2.0 \* asymmetry \* cosine, 0.001), 1.5));\n float stepLength = (end - start) / 12.0;\n vec2 opticalDepth = vec2(0.0);\n vec3 radiance = vec3(0.0);\n for (int sampleIndex = 0; sampleIndex < 12; sampleIndex++) {\n vec3 position = origin + direction \* (start + (float(sampleIndex) + 0.5) \* stepLength);\n vec2 density = atmosphere\_getDensity(position);\n vec2 centerDepth = opticalDepth + density \* stepLength \* 0.5;\n opticalDepth += density \* stepLength;\n vec2 solarGround = atmosphere\_intersectSphere(position, sunlight, atmosphere.planetRadius);\n if (solarGround.x > 0.0) continue;\n float solarDistance = max(atmosphere\_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);\n float solarStep = solarDistance / 4.0;\n vec2 solarDepth = vec2(0.0);\n for (int solarIndex = 0; solarIndex < 4; solarIndex++) {\n solarDepth += atmosphere\_getDensity(position + sunlight \* ((float(solarIndex) + 0.5) \* solarStep)) \* solarStep;\n }\n vec3 attenuation = exp(-rayleigh \* (centerDepth.x + solarDepth.x) - mie \* (centerDepth.y + solarDepth.y));\n radiance += attenuation \* (rayleigh \* density.x \* rayleighPhase + mie \* density.y \* miePhase) \* stepLength;\n }\n result.radiance = radiance \* max(atmosphere.sunIntensity, 0.0);\n result.transmittance = exp(-rayleigh \* opticalDepth.x - mie \* opticalDepth.y);\n return result;\n}\nvec3 atmosphere\_getSkyColor(vec3 camera, vec3 direction) {\n if (atmosphere.enabled < 0.5) return vec3(0.0);\n AtmosphereSample scatteringSample = atmosphere\_getScattering(camera, normalize(direction), 1000000.0);\n vec3 origin = vec3(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));\n vec3 sunlight = normalize(atmosphere.sunDirection);\n float groundDistance = atmosphere\_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;\n if (groundDistance > 0.0 && sunlight.z > 0.0) {\n // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.\n float elevation = max(sunlight.z, 0.02);\n vec3 extinction = vec3(0.0000058, 0.0000135, 0.0000331) \* max(atmosphere.rayleigh, 0.0) \* 8000.0\n + vec3(0.000021) \* max(atmosphere.haze, 0.0) \* 1200.0;\n scatteringSample.radiance += atmosphere.groundColor \* atmosphere.sunIntensity \* sunlight.z / 3.141593\n \* exp(-extinction / elevation) \* scatteringSample.transmittance;\n }\n return vec3(1.0) - exp(-scatteringSample.radiance \* atmosphere.exposure);\n}\nvec4 atmosphere\_getColor(vec4 color, vec3 position, vec3 camera) {\n vec3 difference = position - camera;\n float distance = length(difference);\n if (distance < 0.001 || atmosphere.enabled < 0.5) return color;\n AtmosphereSample scatteringSample = atmosphere\_getScattering(camera, difference / distance, distance);\n vec3 scattering = vec3(1.0) - exp(-scatteringSample.radiance \* atmosphere.exposure);\n return vec4(color.rgb \* scatteringSample.transmittance + scattering, color.a);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"atmosphere"` = `'atmosphere'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct atmosphereUniforms {\n enabled: f32,\n sunDirection: vec3f,\n sunIntensity: f32,\n haze: f32,\n rayleigh: f32,\n planetRadius: f32,\n exposure: f32,\n groundColor: vec3f,\n};\n\@group(3) @binding(auto) var\<uniform> atmosphere: atmosphereUniforms;\nstruct AtmosphereSample { radiance: vec3f,\n transmittance: vec3f };\n\nfn atmosphere\_intersectSphere(origin: vec3f,\n direction: vec3f,\n radius: f32) -> vec2f {\n var projected: f32 = dot(origin, direction);\n var discriminant: f32 = projected \* projected - (dot(origin.xy, origin.xy) + (origin.z - radius) \* (origin.z + radius));\n if (discriminant < 0.0) { return vec2f(-1.0); }\n var root: f32 = sqrt(discriminant);\n return vec2f(-projected - root, -projected + root);\n}\nfn atmosphere\_getDensity(position: vec3f) -> vec2f {\n var height: f32 = max(length(position) - atmosphere.planetRadius, 0.0);\n return exp(-vec2f(height / 8000.0, height / 1200.0));\n}\nfn atmosphere\_getScattering(camera: vec3f,\n direction: vec3f,\n distanceLimit: f32) -> AtmosphereSample {\n var result: AtmosphereSample;\n result.radiance = vec3f(0.0);\n result.transmittance = vec3f(1.0);\n if (atmosphere.enabled < 0.5 || distanceLimit <= 0.0) { return result; }\n var origin: vec3f = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));\n var shell: vec2f = atmosphere\_intersectSphere(origin, direction, atmosphere.planetRadius + 100000.0);\n var start: f32 = max(shell.x, 0.0);\n var end: f32 = min(shell.y, distanceLimit);\n var ground: vec2f = atmosphere\_intersectSphere(origin, direction, atmosphere.planetRadius);\n if (ground.x > 0.0) { end = min(end, ground.x); }\n if (end <= start) { return result; }\n var sunlight: vec3f = normalize(atmosphere.sunDirection);\n var rayleigh: vec3f = vec3f(0.0000058, 0.0000135, 0.0000331) \* max(atmosphere.rayleigh, 0.0);\n var mie: vec3f = vec3f(0.000021) \* max(atmosphere.haze, 0.0);\n var cosine: f32 = dot(direction, sunlight);\n var rayleighPhase: f32 = 0.0596831 \* (1.0 + cosine \* cosine);\n var asymmetry: f32 = 0.76;\n var miePhase: f32 = (1.0 - asymmetry \* asymmetry) / (12.566371 \* pow(max(1.0 + asymmetry \* asymmetry - 2.0 \* asymmetry \* cosine, 0.001), 1.5));\n var stepLength: f32 = (end - start) / 12.0;\n var opticalDepth: vec2f = vec2f(0.0);\n var radiance: vec3f = vec3f(0.0);\n for (var sampleIndex: i32 = 0; sampleIndex < 12; sampleIndex++) {\n var position: vec3f = origin + direction \* (start + (f32(sampleIndex) + 0.5) \* stepLength);\n var density: vec2f = atmosphere\_getDensity(position);\n var centerDepth: vec2f = opticalDepth + density \* stepLength \* 0.5;\n opticalDepth += density \* stepLength;\n var solarGround: vec2f = atmosphere\_intersectSphere(position, sunlight, atmosphere.planetRadius);\n if (solarGround.x > 0.0) { continue; }\n var solarDistance: f32 = max(atmosphere\_intersectSphere(position, sunlight, atmosphere.planetRadius + 100000.0).y, 0.0);\n var solarStep: f32 = solarDistance / 4.0;\n var solarDepth: vec2f = vec2f(0.0);\n for (var solarIndex: i32 = 0; solarIndex < 4; solarIndex++) {\n solarDepth += atmosphere\_getDensity(position + sunlight \* ((f32(solarIndex) + 0.5) \* solarStep)) \* solarStep;\n }\n var attenuation: vec3f = exp(-rayleigh \* (centerDepth.x + solarDepth.x) - mie \* (centerDepth.y + solarDepth.y));\n radiance += attenuation \* (rayleigh \* density.x \* rayleighPhase + mie \* density.y \* miePhase) \* stepLength;\n }\n result.radiance = radiance \* max(atmosphere.sunIntensity, 0.0);\n result.transmittance = exp(-rayleigh \* opticalDepth.x - mie \* opticalDepth.y);\n return result;\n}\nfn atmosphere\_getSkyColor(camera: vec3f,\n direction: vec3f) -> vec3f {\n if (atmosphere.enabled < 0.5) { return vec3f(0.0); }\n var scatteringSample: AtmosphereSample = atmosphere\_getScattering(camera, normalize(direction), 1000000.0);\n let origin = vec3f(camera.xy, atmosphere.planetRadius + max(camera.z, 1.0));\n let sunlight = normalize(atmosphere.sunDirection);\n let groundDistance = atmosphere\_intersectSphere(origin, normalize(direction), atmosphere.planetRadius).x;\n if (groundDistance > 0.0 && sunlight.z > 0.0) {\n // Approximate direct irradiance at the ground boundary, attenuated on its way to the eye.\n let elevation = max(sunlight.z, 0.02);\n let extinction = vec3f(0.0000058, 0.0000135, 0.0000331) \* max(atmosphere.rayleigh, 0.0) \* 8000.0\n + vec3f(0.000021) \* max(atmosphere.haze, 0.0) \* 1200.0;\n scatteringSample.radiance += atmosphere.groundColor \* atmosphere.sunIntensity \* sunlight.z / 3.141593\n \* exp(-extinction / elevation) \* scatteringSample.transmittance;\n }\n return vec3f(1.0) - exp(-scatteringSample.radiance \* atmosphere.exposure);\n}\nfn atmosphere\_getColor(color: vec4f,\n position: vec3f,\n camera: vec3f) -> vec4f {\n var difference: vec3f = position - camera;\n var distance: f32 = length(difference);\n if (distance < 0.001 || atmosphere.enabled < 0.5) { return color; }\n var scatteringSample: AtmosphereSample = atmosphere\_getScattering(camera, difference / distance, distance);\n var scattering: vec3f = vec3f(1.0) - exp(-scatteringSample.radiance \* atmosphere.exposure);\n return vec4f(color.rgb \* scatteringSample.transmittance + scattering, color.a);\n}\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.enabled[​](#uniformtypesenabled "Direct link to uniformTypes.enabled")

> `readonly` **enabled**: `"f32"` = `'f32'`

#### uniformTypes.exposure[​](#uniformtypesexposure "Direct link to uniformTypes.exposure")

> `readonly` **exposure**: `"f32"` = `'f32'`

#### uniformTypes.groundColor[​](#uniformtypesgroundcolor "Direct link to uniformTypes.groundColor")

> `readonly` **groundColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.haze[​](#uniformtypeshaze "Direct link to uniformTypes.haze")

> `readonly` **haze**: `"f32"` = `'f32'`

#### uniformTypes.planetRadius[​](#uniformtypesplanetradius "Direct link to uniformTypes.planetRadius")

> `readonly` **planetRadius**: `"f32"` = `'f32'`

#### uniformTypes.rayleigh[​](#uniformtypesrayleigh "Direct link to uniformTypes.rayleigh")

> `readonly` **rayleigh**: `"f32"` = `'f32'`

#### uniformTypes.sunDirection[​](#uniformtypessundirection "Direct link to uniformTypes.sunDirection")

> `readonly` **sunDirection**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.sunIntensity[​](#uniformtypessunintensity "Direct link to uniformTypes.sunIntensity")

> `readonly` **sunIntensity**: `"f32"` = `'f32'`

### getUniforms()[​](#getuniforms "Direct link to getUniforms()")

> `readonly` **getUniforms**(`props?`, `previousUniforms?`): `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

`Partial`<`Partial`<[`AtmosphereUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/AtmosphereUniforms.md)>> = `{}`

##### previousUniforms?[​](#previousuniforms "Direct link to previousUniforms?")

[`AtmosphereUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/AtmosphereUniforms.md) | `undefined`

#### Returns[​](#returns "Direct link to Returns")

##### enabled[​](#enabled "Direct link to enabled")

> **enabled**: `number`

##### exposure[​](#exposure "Direct link to exposure")

> **exposure**: `number`

##### groundColor[​](#groundcolor "Direct link to groundColor")

> **groundColor**: \[`number`, `number`, `number`]

Diffuse ground boundary beneath the horizon, in linear RGB.

##### haze[​](#haze "Direct link to haze")

> **haze**: `number`

Aerosol and molecular scattering multipliers.

##### planetRadius[​](#planetradius "Direct link to planetRadius")

> **planetRadius**: `number`

Planet radius in metres. Positions use a local tangent frame, with z = altitude.

##### rayleigh[​](#rayleigh "Direct link to rayleigh")

> **rayleigh**: `number`

##### sunDirection[​](#sundirection "Direct link to sunDirection")

> **sunDirection**: \[`number`, `number`, `number`]

Direction toward the sun in a local east/north/up frame; must be nonzero.

##### sunIntensity[​](#sunintensity "Direct link to sunIntensity")

> **sunIntensity**: `number`
