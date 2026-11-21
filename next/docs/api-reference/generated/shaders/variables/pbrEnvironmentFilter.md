# Variable: pbrEnvironmentFilter

> `const` **pbrEnvironmentFilter**: `object`

Defined in: [modules/lighting/prefiltered-environment/prefiltered-environment.ts:52](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/prefiltered-environment/prefiltered-environment.ts#L52)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"pbrEnvironmentFilter"`; }, { `group`: `0`; `name`: `"pbrEnvironmentSource"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.face[​](#defaultuniformsface "Direct link to defaultUniforms.face")

> `readonly` **face**: `0` = `0`

#### defaultUniforms.mode[​](#defaultuniformsmode "Direct link to defaultUniforms.mode")

> `readonly` **mode**: `0` = `0`

#### defaultUniforms.roughness[​](#defaultuniformsroughness "Direct link to defaultUniforms.roughness")

> `readonly` **roughness**: `0` = `0`

#### defaultUniforms.sampleCount[​](#defaultuniformssamplecount "Direct link to defaultUniforms.sampleCount")

> `readonly` **sampleCount**: `64` = `64`

#### defaultUniforms.sourceEncoding[​](#defaultuniformssourceencoding "Direct link to defaultUniforms.sourceEncoding")

> `readonly` **sourceEncoding**: `0` = `0`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "layout(std140) uniform pbrEnvironmentFilterUniforms {\n int face;\n float roughness;\n int mode;\n int sampleCount;\n int sourceEncoding;\n} pbrEnvironmentFilter;\n\nuniform sampler2D pbrEnvironmentSource;\n" = `GLSL_UNIFORMS`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> `readonly` **getUniforms**: (`properties`) => `Partial`<[`PBREnvironmentFilterProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PBREnvironmentFilterProps.md)<`unknown`>>

#### Parameters[​](#parameters "Direct link to Parameters")

##### properties[​](#properties "Direct link to properties")

`Partial`<[`PBREnvironmentFilterProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PBREnvironmentFilterProps.md)>

#### Returns[​](#returns "Direct link to Returns")

`Partial`<[`PBREnvironmentFilterProps`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/PBREnvironmentFilterProps.md)<`unknown`>>

### name[​](#name "Direct link to name")

> `readonly` **name**: `"pbrEnvironmentFilter"` = `'pbrEnvironmentFilter'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct PBREnvironmentFilterUniforms {\n face: i32,\n roughness: f32,\n mode: i32,\n sampleCount: i32,\n sourceEncoding: i32,\n};\n\n\@group(0) @binding(auto) var\<uniform> pbrEnvironmentFilter: PBREnvironmentFilterUniforms;\n#ifdef PBR\_ENVIRONMENT\_CUBE\_SOURCE\n\@group(0) @binding(auto) var pbrEnvironmentSource: texture\_cube\<f32>;\n#else\n\@group(0) @binding(auto) var pbrEnvironmentSource: texture\_2d\<f32>;\n#endif\n\@group(0) @binding(auto) var pbrEnvironmentSourceSampler: sampler;\n" = `WGSL_UNIFORMS`

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.face[​](#uniformtypesface "Direct link to uniformTypes.face")

> `readonly` **face**: `"i32"` = `'i32'`

#### uniformTypes.mode[​](#uniformtypesmode "Direct link to uniformTypes.mode")

> `readonly` **mode**: `"i32"` = `'i32'`

#### uniformTypes.roughness[​](#uniformtypesroughness "Direct link to uniformTypes.roughness")

> `readonly` **roughness**: `"f32"` = `'f32'`

#### uniformTypes.sampleCount[​](#uniformtypessamplecount "Direct link to uniformTypes.sampleCount")

> `readonly` **sampleCount**: `"i32"` = `'i32'`

#### uniformTypes.sourceEncoding[​](#uniformtypessourceencoding "Direct link to uniformTypes.sourceEncoding")

> `readonly` **sourceEncoding**: `"i32"` = `'i32'`
