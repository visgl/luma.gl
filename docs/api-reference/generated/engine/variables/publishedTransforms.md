# Variable: publishedTransforms

> `const` **publishedTransforms**: `object`

Defined in: [modules/engine/src/scenegraph/published-transforms.ts:8](https://github.com/visgl/luma.gl/blob/master/modules/engine/src/scenegraph/published-transforms.ts#L8)

Borrowed rigid transforms, published by a GPU producer before rendering.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"publishedBodyMatrices"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.bodyIndex[​](#defaultuniformsbodyindex "Direct link to defaultUniforms.bodyIndex")

> `readonly` **bodyIndex**: `-1` = `-1`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"publishedTransforms"` = `'publishedTransforms'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct PublishedTransforms {bodyIndex<!-- -->:i32<!-- -->,viewProjection<!-- -->:mat4x4f<!-- -->}\n\@group(0) @binding(auto) var\<uniform> publishedTransforms<!-- -->:PublishedTransforms<!-- -->;\n\@group(0) @binding(auto) var\<storage,read> publishedBodyMatrices<!-- -->:array<!-- -->\<mat4x4f>;\n"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.bodyIndex[​](#uniformtypesbodyindex "Direct link to uniformTypes.bodyIndex")

> `readonly` **bodyIndex**: `"i32"` = `'i32'`

#### uniformTypes.viewProjection[​](#uniformtypesviewprojection "Direct link to uniformTypes.viewProjection")

> `readonly` **viewProjection**: `"mat4x4<f32>"` = `'mat4x4<f32>'`
