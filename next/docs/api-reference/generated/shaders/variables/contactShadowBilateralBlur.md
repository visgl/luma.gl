# Variable: contactShadowBilateralBlur

> `const` **contactShadowBilateralBlur**: `object`

Defined in: [modules/lighting/contact-shadow/contact-shadow.ts:184](https://github.com/visgl/luma.gl/blob/master/modules/shaders/src/modules/lighting/contact-shadow/contact-shadow.ts#L184)

## Type Declaration[​](#type-declaration "Direct link to Type Declaration")

### bindingLayout[​](#bindinglayout "Direct link to bindingLayout")

> `readonly` **bindingLayout**: readonly \[{ `group`: `0`; `name`: `"depthTexture"`; }, { `group`: `0`; `name`: `"normalTexture"`; }]

### bindings[​](#bindings "Direct link to bindings")

> `readonly` **bindings**: [`ContactShadowBindings`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactShadowBindings.md)<`unknown`>

### fs[​](#fs "Direct link to fs")

> `readonly` **fs**: "\nlayout(std140) uniform contactShadowBilateralBlurUniforms {\n vec2 direction;\n float radius;\n float depthSigma;\n float normalPower;\n} contactShadowBilateralBlur;\nuniform sampler2D depthTexture;\nuniform sampler2D normalTexture;\nvec4 contactShadowBilateralBlur\_sampleColor(sampler2D sourceTexture,vec2 texSize,vec2 texCoord) {\n vec2 texel=contactShadowBilateralBlur.direction/vec2(textureSize(sourceTexture,0));\n float centerDepth=texture(depthTexture,texCoord).r;\n vec3 centerNormal=normalize(texture(normalTexture,texCoord).xyz\*2.0-1.0);\n float result=texture(sourceTexture,texCoord).r;\n float totalWeight=1.0;\n for(int index=1;index<=6;index++) {\n if(float(index)>contactShadowBilateralBlur.radius)break;\n for(int side=-1;side<=1;side+=2) {\n vec2 sampleUv=clamp(texCoord+texel\*float(index\*side),vec2(0.0),vec2(1.0));\n float sampleDepth=texture(depthTexture,sampleUv).r;\n vec3 sampleNormal=normalize(texture(normalTexture,sampleUv).xyz\*2.0-1.0);\n float depthDelta=abs(sampleDepth-centerDepth);\n float depthWeight=exp(-(depthDelta\*depthDelta)/max(2.0\*contactShadowBilateralBlur.depthSigma\*contactShadowBilateralBlur.depthSigma,0.000001));\n float normalWeight=pow(max(dot(centerNormal,sampleNormal),0.0),contactShadowBilateralBlur.normalPower);\n float spatialWeight=exp(-float(index\*index)/8.0);\n float weight=depthWeight\*normalWeight\*spatialWeight;\n result+=texture(sourceTexture,sampleUv).r\*weight;totalWeight+=weight;\n }\n }\n return vec4(vec3(result/totalWeight),1.0);\n}\n"

### name[​](#name "Direct link to name")

> `readonly` **name**: `"contactShadowBilateralBlur"` = `'contactShadowBilateralBlur'`

### passes[​](#passes "Direct link to passes")

> `readonly` **passes**: \[{ `sampler`: `true`; }]

### props[​](#props "Direct link to props")

> `readonly` **props**: `Partial`<[`ContactBlurUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactBlurUniforms.md)> & [`ContactShadowBindings`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactShadowBindings.md)<`unknown`>

### propTypes[​](#proptypes "Direct link to propTypes")

> `readonly` **propTypes**: `object`

#### propTypes.depthSigma[​](#proptypesdepthsigma "Direct link to propTypes.depthSigma")

> `readonly` **depthSigma**: `object`

#### propTypes.depthSigma.min[​](#proptypesdepthsigmamin "Direct link to propTypes.depthSigma.min")

> `readonly` **min**: `0.0001` = `0.0001`

#### propTypes.depthSigma.softMax[​](#proptypesdepthsigmasoftmax "Direct link to propTypes.depthSigma.softMax")

> `readonly` **softMax**: `0.05` = `0.05`

#### propTypes.depthSigma.value[​](#proptypesdepthsigmavalue "Direct link to propTypes.depthSigma.value")

> `readonly` **value**: `0.006` = `0.006`

#### propTypes.direction[​](#proptypesdirection "Direct link to propTypes.direction")

> `readonly` **direction**: `object`

#### propTypes.direction.private[​](#proptypesdirectionprivate "Direct link to propTypes.direction.private")

> `readonly` **private**: `true` = `true`

#### propTypes.direction.value[​](#proptypesdirectionvalue "Direct link to propTypes.direction.value")

> `readonly` **value**: readonly \[`1`, `0`]

#### propTypes.normalPower[​](#proptypesnormalpower "Direct link to propTypes.normalPower")

> `readonly` **normalPower**: `object`

#### propTypes.normalPower.min[​](#proptypesnormalpowermin "Direct link to propTypes.normalPower.min")

> `readonly` **min**: `1` = `1`

#### propTypes.normalPower.softMax[​](#proptypesnormalpowersoftmax "Direct link to propTypes.normalPower.softMax")

> `readonly` **softMax**: `64` = `64`

#### propTypes.normalPower.value[​](#proptypesnormalpowervalue "Direct link to propTypes.normalPower.value")

> `readonly` **value**: `24` = `24`

#### propTypes.radius[​](#proptypesradius "Direct link to propTypes.radius")

> `readonly` **radius**: `object`

#### propTypes.radius.max[​](#proptypesradiusmax "Direct link to propTypes.radius.max")

> `readonly` **max**: `6` = `6`

#### propTypes.radius.min[​](#proptypesradiusmin "Direct link to propTypes.radius.min")

> `readonly` **min**: `1` = `1`

#### propTypes.radius.value[​](#proptypesradiusvalue "Direct link to propTypes.radius.value")

> `readonly` **value**: `4` = `4`

### source[​](#source "Direct link to source")

> `readonly` **source**: "struct contactShadowBilateralBlurUniforms {\n direction: vec2f,\n radius: f32,\n depthSigma: f32,\n normalPower: f32,\n};\n\@group(0) @binding(auto) var\<uniform> contactShadowBilateralBlur: contactShadowBilateralBlurUniforms;\n\@group(0) @binding(auto) var depthTexture: texture\_depth\_2d;\n\@group(0) @binding(auto) var depthTextureSampler: sampler;\n\@group(0) @binding(auto) var normalTexture: texture\_2d\<f32>;\n\@group(0) @binding(auto) var normalTextureSampler: sampler;\n\nfn contactShadowBilateralBlur\_sampleColor(\n sourceTexture: texture\_2d\<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f\n) -> vec4f {\n let sourceDimensions = vec2f(textureDimensions(sourceTexture));\n let texel = contactShadowBilateralBlur.direction / sourceDimensions;\n let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);\n let centerNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, texCoord, 0.0).xyz \* 2.0 - 1.0);\n var result = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0.0).r;\n var totalWeight = 1.0;\n for (var index: i32 = 1; index <= 6; index++) {\n if (f32(index) > contactShadowBilateralBlur.radius) { break; }\n for (var side: i32 = -1; side <= 1; side += 2) {\n let sampleUv = clamp(texCoord + texel \* f32(index \* side), vec2f(0.0), vec2f(1.0));\n let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);\n let sampleNormal = normalize(textureSampleLevel(normalTexture, normalTextureSampler, sampleUv, 0.0).xyz \* 2.0 - 1.0);\n let depthDelta = abs(sampleDepth - centerDepth);\n let depthWeight = exp(-(depthDelta \* depthDelta) / max(2.0 \* contactShadowBilateralBlur.depthSigma \* contactShadowBilateralBlur.depthSigma, 0.000001));\n let normalWeight = pow(max(dot(centerNormal, sampleNormal), 0.0), contactShadowBilateralBlur.normalPower);\n let spatialWeight = exp(-f32(index \* index) / 8.0);\n let weight = depthWeight \* normalWeight \* spatialWeight;\n result += textureSampleLevel(sourceTexture, sourceTextureSampler, sampleUv, 0.0).r \* weight;\n totalWeight += weight;\n }\n }\n let visibility = result / totalWeight;\n return vec4f(vec3f(visibility), 1.0);\n}"

### uniforms[​](#uniforms "Direct link to uniforms")

> `readonly` **uniforms**: [`ContactBlurUniforms`](https://luma.gl/next/docs/api-reference/generated/shaders/type-aliases/ContactBlurUniforms.md)

### uniformTypes[​](#uniformtypes "Direct link to uniformTypes")

> `readonly` **uniformTypes**: `object`

#### uniformTypes.depthSigma[​](#uniformtypesdepthsigma "Direct link to uniformTypes.depthSigma")

> `readonly` **depthSigma**: `"f32"` = `'f32'`

#### uniformTypes.direction[​](#uniformtypesdirection "Direct link to uniformTypes.direction")

> `readonly` **direction**: `"vec2<f32>"` = `'vec2<f32>'`

#### uniformTypes.normalPower[​](#uniformtypesnormalpower "Direct link to uniformTypes.normalPower")

> `readonly` **normalPower**: `"f32"` = `'f32'`

#### uniformTypes.radius[​](#uniformtypesradius "Direct link to uniformTypes.radius")

> `readonly` **radius**: `"f32"` = `'f32'`
