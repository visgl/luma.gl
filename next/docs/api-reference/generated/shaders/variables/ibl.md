# Variable: ibl

> `const` **ibl**: `object`

Defined in: [modules/lighting/ibl/ibl.ts:32](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/ibl/ibl.ts#L32)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `2`; `name`: `"pbr_diffuseEnvSampler"`; }, { `group`: `2`; `name`: `"pbr_specularEnvSampler"`; }, { `group`: `2`; `name`: `"pbr_brdfLUT"`; }]

### firstBindingSlot[​](#firstbindingslot "Direct link to firstBindingSlot")

> `readonly` **firstBindingSlot**: `32` = `32`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "#ifdef USE\_IBL\nuniform samplerCube pbr\_diffuseEnvSampler;\nuniform samplerCube pbr\_specularEnvSampler;\nuniform sampler2D pbr\_brdfLUT;\n#endif\n" = `iblGLSL`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"ibl"` = `'ibl'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "#ifdef USE\_IBL\n\@group(2) @binding(auto) var pbr\_diffuseEnvSampler: texture\_cube\<f32>;\n\@group(2) @binding(auto) var pbr\_diffuseEnvSamplerSampler: sampler;\n\@group(2) @binding(auto) var pbr\_specularEnvSampler: texture\_cube\<f32>;\n\@group(2) @binding(auto) var pbr\_specularEnvSamplerSampler: sampler;\n\@group(2) @binding(auto) var pbr\_brdfLUT: texture\_2d\<f32>;\n\@group(2) @binding(auto) var pbr\_brdfLUTSampler: sampler;\n#endif\n" = `iblWGSL`

### vs[​](#vs "Direct link to vs")

> `readonly` **vs**: "#ifdef USE\_IBL\nuniform samplerCube pbr\_diffuseEnvSampler;\nuniform samplerCube pbr\_specularEnvSampler;\nuniform sampler2D pbr\_brdfLUT;\n#endif\n" = `iblGLSL`
