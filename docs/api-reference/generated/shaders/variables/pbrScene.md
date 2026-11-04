# Variable: pbrScene

> `const` **pbrScene**: `object`

Defined in: [modules/lighting/pbr-material/pbr-scene.ts:80](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/pbr-material/pbr-scene.ts#L80)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `1`; `name`: `"pbrScene"`; }, { `group`: `1`; `name`: `"pbr_transmissionFramebufferSampler"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `Required`<[`PBRSceneUniforms`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PBRSceneUniforms.md)>

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "layout(std140) uniform pbrSceneUniforms {\n float exposure;\n highp int toneMapMode;\n float environmentIntensity;\n float environmentRotation;\n float environmentMipCount;\n highp int outputEncoding;\n vec2 framebufferSize;\n mat4 viewMatrix;\n mat4 projectionMatrix;\n} pbrScene;\n\n#ifdef USE\_TRANSMISSION\_FRAMEBUFFER\nuniform sampler2D pbr\_transmissionFramebufferSampler;\n#endif\n" = `uniformBlock`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> `readonly` **getUniforms**: (`props`) => [`PBRSceneProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PBRSceneProps.md)<`unknown`>

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

[`PBRSceneProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PBRSceneProps.md)

#### Returns[​](#returns "Direct link to Returns")

[`PBRSceneProps`](https://luma.gl/docs/api-reference/generated/shaders/type-aliases/PBRSceneProps.md)<`unknown`>

### name[​](#name "Direct link to name")

> `readonly` **name**: `"pbrScene"` = `'pbrScene'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct pbrSceneUniforms {\n exposure: f32,\n toneMapMode: i32,\n environmentIntensity: f32,\n environmentRotation: f32,\n environmentMipCount: f32,\n outputEncoding: i32,\n framebufferSize: vec2\<f32>,\n viewMatrix: mat4x4\<f32>,\n projectionMatrix: mat4x4\<f32>\n};\n\n\@group(1) @binding(auto) var\<uniform> pbrScene: pbrSceneUniforms;\n\n#ifdef USE\_TRANSMISSION\_FRAMEBUFFER\n\@group(1) @binding(auto) var pbr\_transmissionFramebufferSampler: texture\_2d\<f32>;\n\@group(1) @binding(auto) var pbr\_transmissionFramebufferSamplerSampler: sampler;\n#endif\n" = `wgslUniformBlock`

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.environmentIntensity[​](#uniformtypesenvironmentintensity "Direct link to uniformTypes.environmentIntensity")

> `readonly` **environmentIntensity**: `"f32"` = `'f32'`

#### uniformTypes.environmentMipCount[​](#uniformtypesenvironmentmipcount "Direct link to uniformTypes.environmentMipCount")

> `readonly` **environmentMipCount**: `"f32"` = `'f32'`

#### uniformTypes.environmentRotation[​](#uniformtypesenvironmentrotation "Direct link to uniformTypes.environmentRotation")

> `readonly` **environmentRotation**: `"f32"` = `'f32'`

#### uniformTypes.exposure[​](#uniformtypesexposure "Direct link to uniformTypes.exposure")

> `readonly` **exposure**: `"f32"` = `'f32'`

#### uniformTypes.framebufferSize[​](#uniformtypesframebuffersize "Direct link to uniformTypes.framebufferSize")

> `readonly` **framebufferSize**: `"vec2<f32>"` = `'vec2<f32>'`

#### uniformTypes.outputEncoding[​](#uniformtypesoutputencoding "Direct link to uniformTypes.outputEncoding")

> `readonly` **outputEncoding**: `"i32"` = `'i32'`

#### uniformTypes.projectionMatrix[​](#uniformtypesprojectionmatrix "Direct link to uniformTypes.projectionMatrix")

> `readonly` **projectionMatrix**: `"mat4x4<f32>"` = `'mat4x4<f32>'`

#### uniformTypes.toneMapMode[​](#uniformtypestonemapmode "Direct link to uniformTypes.toneMapMode")

> `readonly` **toneMapMode**: `"i32"` = `'i32'`

#### uniformTypes.viewMatrix[​](#uniformtypesviewmatrix "Direct link to uniformTypes.viewMatrix")

> `readonly` **viewMatrix**: `"mat4x4<f32>"` = `'mat4x4<f32>'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "layout(std140) uniform pbrSceneUniforms {\n float exposure;\n highp int toneMapMode;\n float environmentIntensity;\n float environmentRotation;\n float environmentMipCount;\n highp int outputEncoding;\n vec2 framebufferSize;\n mat4 viewMatrix;\n mat4 projectionMatrix;\n} pbrScene;\n\n#ifdef USE\_TRANSMISSION\_FRAMEBUFFER\nuniform sampler2D pbr\_transmissionFramebufferSampler;\n#endif\n" = `uniformBlock`
