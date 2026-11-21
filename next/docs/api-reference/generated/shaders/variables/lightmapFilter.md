# Variable: lightmapFilter

> `const` **lightmapFilter**: `object`

Defined in: [modules/lighting/lightmap/lightmap-filter.ts:7](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/lightmap/lightmap-filter.ts#L7)

Internal accumulation/copy/dilation shader shared by the engine baker.

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"lightmapFilter"`; }, { `group`: `0`; `name`: `"currentTexture"`; }, { `group`: `0`; `name`: `"previousTexture"`; }, { `group`: `0`; `name`: `"chartTexture"`; }]

### defaultUniforms[​](#defaultuniforms "Direct link to defaultUniforms")

> `readonly` **defaultUniforms**: `object`

#### defaultUniforms.mode[​](#defaultuniformsmode "Direct link to defaultUniforms.mode")

> `readonly` **mode**: `0` = `0`

#### defaultUniforms.weight[​](#defaultuniformsweight "Direct link to defaultUniforms.weight")

> `readonly` **weight**: `1` = `1`

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform lightmapFilterUniforms {\n float weight;\n int mode;\n} lightmapFilter;\nuniform sampler2D currentTexture;\nuniform sampler2D previousTexture;\nuniform sampler2D chartTexture;\nvec4 lightmapFilter\_getColor(ivec2 coordinates) {\n vec4 current = texelFetch(currentTexture, coordinates, 0);\n if (lightmapFilter.mode == 0) {\n return vec4(mix(texelFetch(previousTexture, coordinates, 0).rgb, current.rgb, lightmapFilter.weight), current.a);\n }\n if (lightmapFilter.mode == 2 || current.a > 0.0) {return current;}\n float chart = texelFetch(chartTexture, coordinates, 0).r;\n ivec2 size = textureSize(currentTexture, 0);\n if (chart <= 0.0) return current;\n for (int y = -1; y <= 1; y++) {\n for (int x = -1; x <= 1; x++) {\n ivec2 neighbor = coordinates + ivec2(x,y);\n if (all(greaterThanEqual(neighbor, ivec2(0))) && all(lessThan(neighbor,size))) {\n vec4 candidate = texelFetch(currentTexture, neighbor, 0);\n if (candidate.a == chart) {return candidate;}\n }\n }\n }\n return current;\n}"

### getUniforms[​](#getuniforms "Direct link to getUniforms")

> `readonly` **getUniforms**: (`props`) => `object`

#### Parameters[​](#parameters "Direct link to Parameters")

##### props[​](#props "Direct link to props")

###### mode?[​](#mode "Direct link to mode?")

`number`

###### weight?[​](#weight "Direct link to weight?")

`number`

#### Returns[​](#returns "Direct link to Returns")

`object`

##### mode?[​](#mode-1 "Direct link to mode?")

> `optional` **mode?**: `number`

##### weight?[​](#weight-1 "Direct link to weight?")

> `optional` **weight?**: `number`

### name[​](#name "Direct link to name")

> `readonly` **name**: `"lightmapFilter"` = `'lightmapFilter'`

### source[​](#source "Direct link to source")

> `readonly` **source**: "\nstruct LightmapFilterUniforms {weight: f32, mode: i32};\n\@group(0) @binding(auto) var\<uniform> lightmapFilter: LightmapFilterUniforms;\n\@group(0) @binding(auto) var currentTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var previousTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var chartTexture: texture\_2d\<f32>;\nfn lightmapFilter\_getColor(coordinates: vec2i) -> vec4f {\n let current = textureLoad(currentTexture, coordinates, 0);\n if (lightmapFilter.mode == 0) {\n let previous = textureLoad(previousTexture, coordinates, 0);\n return vec4f(mix(previous.rgb, current.rgb, lightmapFilter.weight), current.a);\n }\n if (lightmapFilter.mode == 2 || current.a > 0.0) {return current;}\n let chart = textureLoad(chartTexture, coordinates, 0).r;\n if (chart <= 0.0) {return current;}\n let size = vec2i(textureDimensions(currentTexture));\n for (var y = -1; y <= 1; y++) {\n for (var x = -1; x <= 1; x++) {\n let neighbor = coordinates + vec2i(x, y);\n if (all(neighbor >= vec2i(0)) && all(neighbor < size)) {\n let candidate = textureLoad(currentTexture, neighbor, 0);\n if (candidate.a == chart) {return candidate;}\n }\n }\n }\n return current;\n}"

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.mode[​](#uniformtypesmode "Direct link to uniformTypes.mode")

> `readonly` **mode**: `"i32"` = `'i32'`

#### uniformTypes.weight[​](#uniformtypesweight "Direct link to uniformTypes.weight")

> `readonly` **weight**: `"f32"` = `'f32'`
