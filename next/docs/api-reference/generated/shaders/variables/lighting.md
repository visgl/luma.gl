# Variable: lighting

> `const` **lighting**: `object`

Defined in: [modules/lighting/lights/lighting.ts:156](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lights/lighting.ts#L156)

Portable lighting shader module shared by the Phong, Gouraud, and PBR material modules.

The public JavaScript API accepts `lights: Light[]`, while the uniform buffer packs non-ambient lights into a fixed-size trailing array for portability across WebGL2 and WebGPU.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `2`; `name`: `"lighting"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: [`LightingUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingUniforms.md)

### defines[​](#defines "Direct link to defines")

> `readonly` **defines**: `object` = `{}`

### firstBindingSlot[​](#firstbindingslot "Direct link to firstBindingSlot")

> `readonly` **firstBindingSlot**: `0` = `0`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "precision highp int;\n\n// #if (defined(SHADER\_TYPE\_FRAGMENT) && defined(LIGHTING\_FRAGMENT)) || (defined(SHADER\_TYPE\_VERTEX) && defined(LIGHTING\_VERTEX))\nstruct AmbientLight {\n vec3 color;\n};\n\nstruct PointLight {\n vec3 color;\n vec3 position;\n vec3 attenuation; // 2nd order x:Constant-y:Linear-z<!-- -->:Exponential<!-- -->\n};\n\nstruct SpotLight {\n vec3 color;\n vec3 position;\n vec3 direction;\n vec3 attenuation;\n vec2 coneCos;\n};\n\nstruct DirectionalLight {\n vec3 color;\n vec3 direction;\n};\n\nstruct UniformLight {\n vec3 color;\n vec3 position;\n vec3 direction;\n vec3 attenuation;\n vec2 coneCos;\n};\n\nstruct AreaLightUniform {\n vec3 color; vec3 position; vec3 halfAxisX; vec3 halfAxisY; vec3 normal; int disk;\n};\n\nlayout(std140) uniform lightingUniforms {\n int enabled;\n int directionalLightCount;\n int pointLightCount;\n int spotLightCount;\n vec3 ambientColor;\n UniformLight lights\[5];\n int areaLightCount;\n AreaLightUniform areaLights\[4];\n} lighting;\n\nPointLight lighting\_getPointLight(int index) {\n UniformLight light = lighting.lights\[index];\n return PointLight(light.color, light.position, light.attenuation);\n}\n\nSpotLight lighting\_getSpotLight(int index) {\n UniformLight light = lighting.lights\[lighting.pointLightCount + index];\n return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);\n}\n\nDirectionalLight lighting\_getDirectionalLight(int index) {\n UniformLight light =\n lighting.lights\[lighting.pointLightCount + lighting.spotLightCount + index];\n return DirectionalLight(light.color, light.direction);\n}\n\nfloat getPointLightAttenuation(PointLight pointLight, float distance) {\n return pointLight.attenuation.x\n + pointLight.attenuation.y \* distance\n + pointLight.attenuation.z \* distance \* distance;\n}\n\nfloat getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {\n vec3 light\_direction = normalize(positionWorldspace - spotLight.position);\n float coneFactor = smoothstep(\n spotLight.coneCos.y,\n spotLight.coneCos.x,\n dot(normalize(spotLight.direction), light\_direction)\n );\n float distanceAttenuation = getPointLightAttenuation(\n PointLight(spotLight.color, spotLight.position, spotLight.attenuation),\n distance(spotLight.position, positionWorldspace)\n );\n return distanceAttenuation / max(coneFactor, 0.0001);\n}\n\n// #endif\n" = `lightingUniformsGLSL`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: (`props?`, `_prevUniforms`) => [`LightingUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingUniforms.md)

#### Parameters[​](#parameters "Direct link to Parameters")

##### props?[​](#props "Direct link to props?")

[`LightingProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingProps.md)

##### \_prevUniforms?[​](#_prevuniforms "Direct link to _prevUniforms?")

`Partial`<[`LightingUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingUniforms.md)> = `{}`

#### Returns[​](#returns "Direct link to Returns")

[`LightingUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingUniforms.md)

### name[​](#name "Direct link to name")

> `readonly` **name**: `"lighting"` = `'lighting'`

### props[​](#props-1 "Direct link to props")

> `readonly` **props**: [`LightingProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingProps.md)

### source[​](#source "Direct link to source")

> `readonly` **source**: "// #if (defined(SHADER\_TYPE\_FRAGMENT) && defined(LIGHTING\_FRAGMENT)) || (defined(SHADER\_TYPE\_VERTEX) && defined(LIGHTING\_VERTEX))\nconst MAX\_LIGHTS: i32 = 5;\n\nstruct AmbientLight {\n color: vec3\<f32>,\n};\n\nstruct PointLight {\n color: vec3\<f32>,\n position: vec3\<f32>,\n attenuation: vec3\<f32>, // 2nd order x:Constant-y:Linear-z<!-- -->:Exponential<!-- -->\n};\n\nstruct SpotLight {\n color: vec3\<f32>,\n position: vec3\<f32>,\n direction: vec3\<f32>,\n attenuation: vec3\<f32>,\n coneCos: vec2\<f32>,\n};\n\nstruct DirectionalLight {\n color: vec3\<f32>,\n direction: vec3\<f32>,\n};\n\nstruct UniformLight {\n color: vec3\<f32>,\n position: vec3\<f32>,\n direction: vec3\<f32>,\n attenuation: vec3\<f32>,\n coneCos: vec2\<f32>,\n};\n\nstruct AreaLightUniform {\n color: vec3f, position: vec3f, halfAxisX: vec3f, halfAxisY: vec3f, normal: vec3f, disk: i32,\n};\n\nstruct lightingUniforms {\n enabled: i32,\n directionalLightCount: i32,\n pointLightCount: i32,\n spotLightCount: i32,\n ambientColor: vec3\<f32>,\n lights: array\<UniformLight, 5>,\n areaLightCount: i32,\n areaLights: array\<AreaLightUniform, 4>,\n};\n\n\@group(2) @binding(auto) var\<uniform> lighting : lightingUniforms;\n\nfn lighting\_getPointLight(index: i32) -> PointLight {\n let light = lighting.lights\[index];\n return PointLight(light.color, light.position, light.attenuation);\n}\n\nfn lighting\_getSpotLight(index: i32) -> SpotLight {\n let light = lighting.lights\[lighting.pointLightCount + index];\n return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);\n}\n\nfn lighting\_getDirectionalLight(index: i32) -> DirectionalLight {\n let light = lighting.lights\[lighting.pointLightCount + lighting.spotLightCount + index];\n return DirectionalLight(light.color, light.direction);\n}\n\nfn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {\n return pointLight.attenuation.x\n + pointLight.attenuation.y \* distance\n + pointLight.attenuation.z \* distance \* distance;\n}\n\nfn getSpotLightAttenuation(spotLight: SpotLight, positionWorldspace: vec3\<f32>) -> f32 {\n let lightDirection = normalize(positionWorldspace - spotLight.position);\n let coneFactor = smoothstep(\n spotLight.coneCos.y,\n spotLight.coneCos.x,\n dot(normalize(spotLight.direction), lightDirection)\n );\n let distanceAttenuation = getPointLightAttenuation(\n PointLight(spotLight.color, spotLight.position, spotLight.attenuation),\n distance(spotLight.position, positionWorldspace)\n );\n return distanceAttenuation / max(coneFactor, 0.0001);\n}\n" = `lightingUniformsWGSL`

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`LightingUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/LightingUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.ambientColor[​](#uniformtypesambientcolor "Direct link to uniformTypes.ambientColor")

> `readonly` **ambientColor**: `"vec3<f32>"` = `'vec3<f32>'`

#### uniformTypes.areaLightCount[​](#uniformtypesarealightcount "Direct link to uniformTypes.areaLightCount")

> `readonly` **areaLightCount**: `"i32"` = `'i32'`

#### uniformTypes.areaLights[​](#uniformtypesarealights "Direct link to uniformTypes.areaLights")

> `readonly` **areaLights**: readonly \[{ `color`: `"vec3<f32>"`; `disk`: `"i32"`; `halfAxisX`: `"vec3<f32>"`; `halfAxisY`: `"vec3<f32>"`; `normal`: `"vec3<f32>"`; `position`: `"vec3<f32>"`; }, `4`]

#### uniformTypes.directionalLightCount[​](#uniformtypesdirectionallightcount "Direct link to uniformTypes.directionalLightCount")

> `readonly` **directionalLightCount**: `"i32"` = `'i32'`

#### uniformTypes.enabled[​](#uniformtypesenabled "Direct link to uniformTypes.enabled")

> `readonly` **enabled**: `"i32"` = `'i32'`

#### uniformTypes.lights[​](#uniformtypeslights "Direct link to uniformTypes.lights")

> `readonly` **lights**: readonly \[{ `attenuation`: `"vec3<f32>"`; `color`: `"vec3<f32>"`; `coneCos`: `"vec2<f32>"`; `direction`: `"vec3<f32>"`; `position`: `"vec3<f32>"`; }, `5`]

#### uniformTypes.pointLightCount[​](#uniformtypespointlightcount "Direct link to uniformTypes.pointLightCount")

> `readonly` **pointLightCount**: `"i32"` = `'i32'`

#### uniformTypes.spotLightCount[​](#uniformtypesspotlightcount "Direct link to uniformTypes.spotLightCount")

> `readonly` **spotLightCount**: `"i32"` = `'i32'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "precision highp int;\n\n// #if (defined(SHADER\_TYPE\_FRAGMENT) && defined(LIGHTING\_FRAGMENT)) || (defined(SHADER\_TYPE\_VERTEX) && defined(LIGHTING\_VERTEX))\nstruct AmbientLight {\n vec3 color;\n};\n\nstruct PointLight {\n vec3 color;\n vec3 position;\n vec3 attenuation; // 2nd order x:Constant-y:Linear-z<!-- -->:Exponential<!-- -->\n};\n\nstruct SpotLight {\n vec3 color;\n vec3 position;\n vec3 direction;\n vec3 attenuation;\n vec2 coneCos;\n};\n\nstruct DirectionalLight {\n vec3 color;\n vec3 direction;\n};\n\nstruct UniformLight {\n vec3 color;\n vec3 position;\n vec3 direction;\n vec3 attenuation;\n vec2 coneCos;\n};\n\nstruct AreaLightUniform {\n vec3 color; vec3 position; vec3 halfAxisX; vec3 halfAxisY; vec3 normal; int disk;\n};\n\nlayout(std140) uniform lightingUniforms {\n int enabled;\n int directionalLightCount;\n int pointLightCount;\n int spotLightCount;\n vec3 ambientColor;\n UniformLight lights\[5];\n int areaLightCount;\n AreaLightUniform areaLights\[4];\n} lighting;\n\nPointLight lighting\_getPointLight(int index) {\n UniformLight light = lighting.lights\[index];\n return PointLight(light.color, light.position, light.attenuation);\n}\n\nSpotLight lighting\_getSpotLight(int index) {\n UniformLight light = lighting.lights\[lighting.pointLightCount + index];\n return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);\n}\n\nDirectionalLight lighting\_getDirectionalLight(int index) {\n UniformLight light =\n lighting.lights\[lighting.pointLightCount + lighting.spotLightCount + index];\n return DirectionalLight(light.color, light.direction);\n}\n\nfloat getPointLightAttenuation(PointLight pointLight, float distance) {\n return pointLight.attenuation.x\n + pointLight.attenuation.y \* distance\n + pointLight.attenuation.z \* distance \* distance;\n}\n\nfloat getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {\n vec3 light\_direction = normalize(positionWorldspace - spotLight.position);\n float coneFactor = smoothstep(\n spotLight.coneCos.y,\n spotLight.coneCos.x,\n dot(normalize(spotLight.direction), light\_direction)\n );\n float distanceAttenuation = getPointLightAttenuation(\n PointLight(spotLight.color, spotLight.position, spotLight.attenuation),\n distance(spotLight.position, positionWorldspace)\n );\n return distanceAttenuation / max(coneFactor, 0.0001);\n}\n\n// #endif\n" = `lightingUniformsGLSL`
