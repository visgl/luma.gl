# Variable: dirlight

> `const` **dirlight**: `object`

Defined in: [modules/lighting/no-material/dirlight.ts:68](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/no-material/dirlight.ts#L68)

Cheap lighting - single directional light, single dot product, one uniform

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `2`; `name`: `"dirlight"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.lightDirection[​](#defaultuniformslightdirection "Direct link to defaultUniforms.lightDirection")

> `readonly` **lightDirection**: \[`1`, `1`, `2`]

### dependencies[​](#dependencies "Direct link to dependencies")

> `readonly` **dependencies**: \[] = `[]`

### firstBindingSlot[​](#firstbindingslot "Direct link to firstBindingSlot")

> `readonly` **firstBindingSlot**: `16` = `16`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "layout(std140) uniform dirlightUniforms {\n vec3 lightDirection;\n} dirlight;\n\nin vec3 dirlight\_vNormal;\n\n// Returns color attenuated by angle from light source\nvec4 dirlight\_filterColor(vec4 color) {\n float d = abs(dot(dirlight\_vNormal, normalize(dirlight.lightDirection)));\n return vec4(color.rgb \* d, color.a);\n}\n" = `FS_GLSL`

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> **getUniforms**: (`opts`) => `DirlightProps`

#### Parameters[​](#parameters "Direct link to Parameters")

##### opts?[​](#opts "Direct link to opts?")

`DirlightProps` = `dirlight.defaultUniforms`

#### Returns[​](#returns "Direct link to Returns")

`DirlightProps`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"dirlight"` = `'dirlight'`

### props[​](#props "Direct link to props")

> `readonly` **props**: `DirlightProps`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct dirlightUniforms {\n lightDirection: vec3\<f32>,\n};\n\nalias DirlightNormal = vec3\<f32>;\n\nstruct DirlightInputs {\n normal: DirlightNormal,\n};\n\n\@group(2) @binding(auto) var\<uniform> dirlight : dirlightUniforms;\n\n// For vertex\nfn dirlight\_setNormal(normal: vec3\<f32>) -> DirlightNormal {\n return normalize(normal);\n}\n\n// Returns color attenuated by angle from light source\nfn dirlight\_filterColor(color: vec4\<f32>, inputs: DirlightInputs) -> vec4\<f32> {\n // TODO - fix default light direction\n // let lightDirection = dirlight.lightDirection;\n let lightDirection = vec3\<f32>(1, 1, 1);\n let d: f32 = abs(dot(inputs.normal, normalize(lightDirection)));\n return vec4\<f32>(color.rgb \* d, color.a);\n}\n" = `SOURCE_WGSL`

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: `DirlightProps`

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.lightDirection[​](#uniformtypeslightdirection "Direct link to uniformTypes.lightDirection")

> `readonly` **lightDirection**: `"vec3<f32>"` = `'vec3<f32>'`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "out vec3 dirlight\_vNormal;\n\nvoid dirlight\_setNormal(vec3 normal) {\n dirlight\_vNormal = normalize(normal);\n}\n" = `VS_GLSL`
